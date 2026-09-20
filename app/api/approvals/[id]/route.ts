import { NextRequest, NextResponse } from "next/server";
import {
  decideApproval,
  PersistenceUnavailableError,
  VentureBoundaryError,
} from "@/lib/operations/repository";
import { ventures } from "@/lib/ventures";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const venture = typeof body?.venture === "string" ? body.venture : "";
    const decision = body?.decision;

    if (!ventures.some((item) => item.slug === venture)) {
      return NextResponse.json({ error: "Venture inválido." }, { status: 400 });
    }

    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json(
        { error: "Decision must be approved or rejected." },
        { status: 400 }
      );
    }

    const approval = await decideApproval({
      approvalId: id,
      ventureSlug: venture,
      decision,
      decidedBy: "founder",
    });

    return NextResponse.json({ approval, persisted: true });
  } catch (error) {
    if (error instanceof PersistenceUnavailableError) {
      return NextResponse.json(
        { error: "Persistence is not active.", code: "PERSISTENCE_DISABLED" },
        { status: 503 }
      );
    }

    if (error instanceof VentureBoundaryError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not decide approval." },
      { status: 500 }
    );
  }
}
