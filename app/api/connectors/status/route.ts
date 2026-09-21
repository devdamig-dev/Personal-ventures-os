import { NextResponse } from "next/server";
import { connectorStatus } from "@/lib/connectors/registry";

export async function GET() {
  return NextResponse.json({
    stage: "v0.4",
    mode: "read-only",
    externalWriteActions: false,
    connectors: connectorStatus(),
  });
}
