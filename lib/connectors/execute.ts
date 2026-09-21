import { executeGitHubRead } from "@/lib/connectors/github";
import {
  assertConnectorRequestAllowed,
  connectorManifests,
} from "@/lib/connectors/registry";
import type {
  ConnectorObservation,
  ConnectorRequest,
} from "@/lib/connectors/types";
import { executeVercelRead } from "@/lib/connectors/vercel";
import { executeWpCentralRead } from "@/lib/connectors/wp-central";

function unavailable(
  request: ConnectorRequest,
  message: string
): ConnectorObservation {
  return {
    connector: request.connector,
    action: request.action,
    resource: request.resource,
    status: "unavailable",
    summary: message,
    data: null,
    fetchedAt: new Date().toISOString(),
  };
}

function failed(
  request: ConnectorRequest,
  error: unknown
): ConnectorObservation {
  return {
    connector: request.connector,
    action: request.action,
    resource: request.resource,
    status: "error",
    summary:
      error instanceof Error ? error.message : "Unknown connector execution error.",
    data: null,
    fetchedAt: new Date().toISOString(),
  };
}

export async function executeReadOnlyConnector(input: {
  request: ConnectorRequest;
  agentId: string;
  ventureSlug: string;
}): Promise<ConnectorObservation> {
  try {
    const manifest = assertConnectorRequestAllowed(input);

    if (!manifest.configured) {
      return unavailable(
        input.request,
        `${manifest.name} is not configured in the Personal Ventures runtime.`
      );
    }

    if (input.request.connector === "github") {
      return await executeGitHubRead(input.request);
    }

    if (input.request.connector === "vercel") {
      return await executeVercelRead(input.request);
    }

    return await executeWpCentralRead(input.request);
  } catch (error) {
    return failed(input.request, error);
  }
}

export async function executeReadOnlyConnectors(input: {
  requests: ConnectorRequest[];
  agentId: string;
  ventureSlug: string;
}) {
  const unique = input.requests
    .filter(
      (request, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.connector === request.connector &&
            candidate.action === request.action &&
            candidate.resource === request.resource
        ) === index
    )
    .slice(0, 3);

  return Promise.all(
    unique.map((request) =>
      executeReadOnlyConnector({
        request,
        agentId: input.agentId,
        ventureSlug: input.ventureSlug,
      })
    )
  );
}

export function connectorRuntimeSummary() {
  return connectorManifests().map((manifest) => ({
    id: manifest.id,
    configured: manifest.configured,
    mode: manifest.mode,
    actionCount: manifest.actions.length,
  }));
}
