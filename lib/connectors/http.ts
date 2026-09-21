export class ConnectorHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ConnectorHttpError";
    this.status = status;
  }
}

export async function fetchJson<T>(input: {
  url: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.max(5_000, Math.min(input.timeoutMs ?? 15_000, 30_000))
  );

  try {
    const response = await fetch(input.url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: input.headers,
    });

    const text = await response.text();
    let data: unknown = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      throw new ConnectorHttpError(
        typeof data === "object" && data && "message" in data
          ? String((data as { message?: unknown }).message ?? response.statusText)
          : `Connector request failed with HTTP ${response.status}.`,
        response.status
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ConnectorHttpError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ConnectorHttpError("Connector request timed out.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
