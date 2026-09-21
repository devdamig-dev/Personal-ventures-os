import { NextResponse } from "next/server";
import { connectorRuntimeSummary } from "@/lib/connectors/execute";
import { getPersistenceMode } from "@/lib/operations/repository";
import { getModelProviderStatus } from "@/lib/providers/openai-responses";

export async function GET() {
  const persistence = getPersistenceMode();
  const modelProvider = getModelProviderStatus();

  return NextResponse.json({
    app: "personal-ventures-os",
    stage: "v0.4",
    persistence,
    modelProvider: {
      configured: modelProvider.configured,
      provider: modelProvider.provider,
      baseModel: modelProvider.baseModel,
      orchestratorModel: modelProvider.orchestratorModel,
      specialistModel: modelProvider.specialistModel,
      qaModel: modelProvider.qaModel,
    },
    orchestration: modelProvider.configured ? "model-backed" : "local-router-fallback",
    connectors: connectorRuntimeSummary(),
    connectorMode: "read-only",
    execution: "approval-gated",
    externalActions: "disabled-by-default",
    boundaries: {
      agencyData: "excluded",
      ventureContext: "isolated-per-run",
    },
  });
}
