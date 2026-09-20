import { NextRequest, NextResponse } from "next/server";
import {
  listApprovals,
  PersistenceUnavailableError,
} from "@/lib/operations/repository";
import type { ApprovalStatus } from "@/lib/operations/types";
import { ventures } from "@/lib/ventures";

const approvalStatuses: ApprovalStatus[] = [
  "pending",
  "approved",
  "rejected",
  "expired",
  "cancelled",
];

export async function GET(request: NextRequest) {
  const venture = request.nextUrl.searchParams.get("venture") ?? "";
  const rawStatus = request.nextUrl.searchParams.get("status") ?? "pending";
  const status =
    rawStatus === "all" || approvalStatuses.includes(rawStatus as ApprovalStatus)
      ? (rawStatus as ApprovalStatus | "all")
      : "pending";

  if (!ventures.some((item) => item.slug === venture)) {
    return NextResponse.json({ error: "Venture inválido." }, { status: 400 });
  }

  try {
    const approvals = await listApprovals(venture, status);
    return NextResponse.json({ approvals, persisted: true });
  } catch (error) {
    if (error instanceof PersistenceUnavailableError) {
      return NextResponse.json(
        {
          approvals: [],
          persisted: false,
          code: "PERSISTENCE_DISABLED",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not list approvals." },
      { status: 500 }
    );
  }
}
