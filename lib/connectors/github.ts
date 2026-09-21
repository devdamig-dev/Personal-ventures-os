import { fetchJson } from "@/lib/connectors/http";
import type { ConnectorObservation, ConnectorRequest } from "@/lib/connectors/types";

function token() {
  const value = process.env.PERSONAL_VENTURES_GITHUB_TOKEN?.trim();
  if (!value) throw new Error("GitHub connector is not configured.");
  return value;
}

function headers() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token()}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "personal-ventures-os",
  };
}

function normalizeRepo(resource: string) {
  const repo = resource.trim().split(":")[0];
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error("GitHub resource must use owner/repository.");
  }
  return repo;
}

function observation(
  request: ConnectorRequest,
  summary: string,
  data: unknown
): ConnectorObservation {
  return {
    connector: "github",
    action: request.action,
    resource: request.resource,
    status: "ok",
    summary,
    data,
    fetchedAt: new Date().toISOString(),
  };
}

export async function executeGitHubRead(
  request: ConnectorRequest
): Promise<ConnectorObservation> {
  const repo = normalizeRepo(request.resource);

  if (request.action === "github.repo_summary") {
    const data = await fetchJson<Record<string, unknown>>({
      url: `https://api.github.com/repos/${repo}`,
      headers: headers(),
    });

    return observation(request, "Repository metadata loaded.", {
      full_name: data.full_name,
      description: data.description,
      private: data.private,
      default_branch: data.default_branch,
      language: data.language,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
      open_issues_count: data.open_issues_count,
    });
  }

  if (request.action === "github.file_text") {
    const separator = request.resource.indexOf(":");
    const path = separator >= 0 ? request.resource.slice(separator + 1).trim() : "";
    if (!path || path.includes("..")) {
      throw new Error(
        "GitHub file resource must use owner/repository:path/to/file."
      );
    }

    const data = await fetchJson<{
      content?: string;
      encoding?: string;
      path?: string;
      sha?: string;
      size?: number;
    }>({
      url: `https://api.github.com/repos/${repo}/contents/${path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      headers: headers(),
    });

    if (data.encoding !== "base64" || typeof data.content !== "string") {
      throw new Error("GitHub file is not readable as UTF-8 text.");
    }

    const text = Buffer.from(data.content.replace(/\n/g, ""), "base64")
      .toString("utf8")
      .slice(0, 24_000);

    return observation(request, "Repository text file loaded.", {
      path: data.path,
      sha: data.sha,
      size: data.size,
      text,
      truncated: text.length >= 24_000,
    });
  }

  if (request.action === "github.recent_commits") {
    const data = await fetchJson<Array<Record<string, unknown>>>({
      url: `https://api.github.com/repos/${repo}/commits?per_page=10`,
      headers: headers(),
    });

    return observation(
      request,
      "Recent repository commits loaded.",
      data.slice(0, 10).map((item) => {
        const commit = (item.commit ?? {}) as Record<string, unknown>;
        const author = (commit.author ?? {}) as Record<string, unknown>;
        return {
          sha: item.sha,
          message: commit.message,
          author: author.name,
          date: author.date,
        };
      })
    );
  }

  throw new Error(`Unsupported GitHub action: ${request.action}`);
}
