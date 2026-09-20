import { NextResponse } from "next/server";
import { getPersistenceMode } from "@/lib/operations/repository";

export async function GET() {
  const persistence = getPersistenceMode();
  const modelProvider =
    process.env.OPENAI_API_KEY && process.env.PERSONAL_VENTURES_AGENT_MODEL
      ? "configured"
      : "disabled";

  return NextResponse.json({
    app: "personal-ventures-os",
    stage: "v0.2",
    persistence,
    modelProvider,
    execution: "approval-gated",
    externalActions: "disabled-by-default",
    boundaries: {
      agencyData: "excluded",
      ventureContext: "isolated-per-run",
    },
  });
}
