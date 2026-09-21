import { fetchJson } from "@/lib/connectors/http";
import type { ConnectorObservation, ConnectorRequest } from "@/lib/connectors/types";

function config() {
  const baseUrl = process.env.PERSONAL_VENTURES_WP_CENTRAL_URL?.trim();
  const token = process.env.PERSONAL_VENTURES_WP_CENTRAL_TOKEN?.trim();

  if (!baseUrl || !token) {
    throw new Error("Nexodg WP Central connector is not configured.");
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    token,
  };
}

function headers() {
  return {
    Authorization: `Bearer ${config().token}`,
    Accept: "application/json",
    "User-Agent": "personal-ventures-os",
  };
}

function observation(
  request: ConnectorRequest,
  summary: string,
  data: unknown
): ConnectorObservation {
  return {
    connector: "wp-central",
    action: request.action,
    resource: request.resource,
    status: "ok",
    summary,
    data,
    fetchedAt: new Date().toISOString(),
  };
}

export async function executeWpCentralRead(
  request: ConnectorRequest
): Promise<ConnectorObservation> {
  const { baseUrl } = config();

  if (request.action === "wp-central.sites") {
    const data = await fetchJson<unknown>({
      url: `${baseUrl}/api/agent-bridge/sites`,
      headers: headers(),
    });

    return observation(
      request,
      "WordPress Central site inventory loaded through the read-only bridge.",
      data
    );
  }

  if (request.action === "wp-central.site_health") {
    const siteId = request.resource.trim();
    if (!siteId || !/^[A-Za-z0-9_-]+$/.test(siteId)) {
      throw new Error("WP Central site health requires a valid site id.");
    }

    const data = await fetchJson<unknown>({
      url: `${baseUrl}/api/agent-bridge/sites/${encodeURIComponent(siteId)}/health`,
      headers: headers(),
    });

    return observation(
      request,
      "WordPress site health loaded through the read-only bridge.",
      data
    );
  }

  throw new Error(`Unsupported WP Central action: ${request.action}`);
}
