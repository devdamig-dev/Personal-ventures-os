export type ConnectorId = "github" | "vercel" | "wp-central";

export type ConnectorActionId =
  | "github.repo_summary"
  | "github.file_text"
  | "github.recent_commits"
  | "vercel.project_summary"
  | "vercel.recent_deployments"
  | "wp-central.sites"
  | "wp-central.site_health";

export type ConnectorRequest = {
  connector: ConnectorId;
  action: ConnectorActionId;
  resource: string;
  reason: string;
};

export type ConnectorObservation = {
  connector: ConnectorId;
  action: ConnectorActionId;
  resource: string;
  status: "ok" | "unavailable" | "error" | "blocked";
  summary: string;
  data: unknown;
  fetchedAt: string;
};

export type ConnectorManifest = {
  id: ConnectorId;
  name: string;
  description: string;
  mode: "read-only";
  configured: boolean;
  allowedAgents: string[];
  actions: Array<{
    id: ConnectorActionId;
    description: string;
    resourceFormat: string;
  }>;
};
