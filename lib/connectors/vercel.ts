import { fetchJson } from "@/lib/connectors/http";
import type { ConnectorObservation, ConnectorRequest } from "@/lib/connectors/types";

function config() {
  const token = process.env.PERSONAL_VENTURES_VERCEL_TOKEN?.trim();
  if (!token) throw new Error("Vercel connector is not configured.");

  return {
    token,
    teamId: process.env.PERSONAL_VENTURES_VERCEL_TEAM_ID?.trim() || null,
  };
}

function projectName(resource: string) {
  const value = resource.trim();
  if (!/^[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error("Vercel resource must be a project name.");
  }
  return value;
}

function apiUrl(path: string) {
  const { teamId } = config();
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);
  return url.toString();
}

function authHeaders() {
  return {
    Authorization: `Bearer ${config().token}`,
    "Content-Type": "application/json",
  };
}

function observation(
  request: ConnectorRequest,
  summary: string,
  data: unknown
): ConnectorObservation {
  return {
    connector: "vercel",
    action: request.action,
    resource: request.resource,
    status: "ok",
    summary,
    data,
    fetchedAt: new Date().toISOString(),
  };
}

export async function executeVercelRead(
  request: ConnectorRequest
): Promise<ConnectorObservation> {
  const name = projectName(request.resource);

  if (request.action === "vercel.project_summary") {
    const project = await fetchJson<Record<string, unknown>>({
      url: apiUrl(`/v9/projects/${encodeURIComponent(name)}`),
      headers: authHeaders(),
    });

    return observation(request, "Vercel project metadata loaded.", {
      id: project.id,
      name: project.name,
      framework: project.framework,
      updatedAt: project.updatedAt,
      createdAt: project.createdAt,
      link: project.link,
      targets: project.targets,
    });
  }

  if (request.action === "vercel.recent_deployments") {
    const project = await fetchJson<{ id?: string }>({
      url: apiUrl(`/v9/projects/${encodeURIComponent(name)}`),
      headers: authHeaders(),
    });

    if (!project.id) throw new Error("Vercel project id was not returned.");

    const url = new URL(apiUrl("/v6/deployments"));
    url.searchParams.set("projectId", project.id);
    url.searchParams.set("limit", "10");

    const deployments = await fetchJson<{
      deployments?: Array<Record<string, unknown>>;
    }>({
      url: url.toString(),
      headers: authHeaders(),
    });

    return observation(
      request,
      "Recent Vercel deployments loaded.",
      (deployments.deployments ?? []).slice(0, 10).map((deployment) => ({
        uid: deployment.uid,
        name: deployment.name,
        url: deployment.url,
        state: deployment.state,
        target: deployment.target,
        created: deployment.created,
        ready: deployment.ready,
      }))
    );
  }

  throw new Error(`Unsupported Vercel action: ${request.action}`);
}
