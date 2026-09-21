import type {
  ConnectorActionId,
  ConnectorId,
  ConnectorManifest,
  ConnectorRequest,
} from "@/lib/connectors/types";

const ALL_PERSONAL_VENTURES = new Set(["gastropilot", "sin-equipaje", "nexodg"]);

export function connectorManifests(): ConnectorManifest[] {
  return [
    {
      id: "github",
      name: "GitHub",
      description:
        "Read repository metadata, text files and recent commits for Personal Ventures work.",
      mode: "read-only",
      configured: Boolean(process.env.PERSONAL_VENTURES_GITHUB_TOKEN?.trim()),
      allowedAgents: ["chief-of-staff", "product", "engineering", "research", "qa"],
      actions: [
        {
          id: "github.repo_summary",
          description: "Repository metadata and default branch.",
          resourceFormat: "owner/repository",
        },
        {
          id: "github.file_text",
          description: "Read one UTF-8 text file from the default branch.",
          resourceFormat: "owner/repository:path/to/file",
        },
        {
          id: "github.recent_commits",
          description: "Read recent commit metadata.",
          resourceFormat: "owner/repository",
        },
      ],
    },
    {
      id: "vercel",
      name: "Vercel",
      description:
        "Read project configuration and recent deployment status for Personal Ventures projects.",
      mode: "read-only",
      configured: Boolean(process.env.PERSONAL_VENTURES_VERCEL_TOKEN?.trim()),
      allowedAgents: ["chief-of-staff", "product", "engineering", "qa"],
      actions: [
        {
          id: "vercel.project_summary",
          description: "Read one Vercel project summary.",
          resourceFormat: "project-name",
        },
        {
          id: "vercel.recent_deployments",
          description: "Read recent deployments for one project.",
          resourceFormat: "project-name",
        },
      ],
    },
    {
      id: "wp-central",
      name: "Nexodg WP Central",
      description:
        "Read site inventory and site health through the Personal Ventures agent bridge contract.",
      mode: "read-only",
      configured: Boolean(
        process.env.PERSONAL_VENTURES_WP_CENTRAL_URL?.trim() &&
          process.env.PERSONAL_VENTURES_WP_CENTRAL_TOKEN?.trim()
      ),
      allowedAgents: ["chief-of-staff", "product", "engineering", "research", "qa"],
      actions: [
        {
          id: "wp-central.sites",
          description: "Read connected WordPress site inventory.",
          resourceFormat: "all",
        },
        {
          id: "wp-central.site_health",
          description: "Read one connected site's health snapshot.",
          resourceFormat: "site-id",
        },
      ],
    },
  ];
}

export function connectorStatus() {
  return connectorManifests().map((connector) => ({
    id: connector.id,
    name: connector.name,
    configured: connector.configured,
    mode: connector.mode,
    actions: connector.actions.map((action) => action.id),
  }));
}

export function allowedConnectorActionsForAgent(agentId: string) {
  return connectorManifests()
    .filter((connector) => connector.allowedAgents.includes(agentId))
    .flatMap((connector) => connector.actions.map((action) => action.id));
}

export function assertConnectorRequestAllowed(input: {
  request: ConnectorRequest;
  agentId: string;
  ventureSlug: string;
}) {
  if (!ALL_PERSONAL_VENTURES.has(input.ventureSlug)) {
    throw new Error("Connector execution is restricted to Personal Ventures.");
  }

  const manifest = connectorManifests().find(
    (connector) => connector.id === input.request.connector
  );

  if (!manifest) throw new Error("Unknown connector.");

  if (manifest.mode !== "read-only") {
    throw new Error("Only read-only connectors are enabled in V0.4.");
  }

  if (!manifest.allowedAgents.includes(input.agentId)) {
    throw new Error(
      `Agent "${input.agentId}" is not allowed to use connector "${manifest.id}".`
    );
  }

  const action = manifest.actions.find(
    (candidate) => candidate.id === input.request.action
  );

  if (!action) {
    throw new Error(
      `Action "${input.request.action}" is not registered for connector "${manifest.id}".`
    );
  }

  return manifest;
}

export function connectorForAction(action: ConnectorActionId): ConnectorId {
  if (action.startsWith("github.")) return "github";
  if (action.startsWith("vercel.")) return "vercel";
  return "wp-central";
}
