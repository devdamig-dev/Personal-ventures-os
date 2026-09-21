import type {
  ModelProviderStatus,
  ProviderRole,
  ProviderUsage,
  StructuredProviderRequest,
  StructuredProviderResult,
} from "@/lib/providers/types";

type ResponsesApiPayload = {
  id?: string;
  model?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

export class ModelProviderUnavailableError extends Error {
  constructor() {
    super(
      "Model-backed orchestration is not configured. Set OPENAI_API_KEY and PERSONAL_VENTURES_AGENT_MODEL."
    );
    this.name = "ModelProviderUnavailableError";
  }
}

export class ModelProviderRequestError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ModelProviderRequestError";
    this.status = status;
    this.code = code;
  }
}

function cleanEnv(value: string | undefined) {
  const clean = value?.trim();
  return clean ? clean : null;
}

export function getModelProviderStatus(): ModelProviderStatus {
  const hasKey = Boolean(cleanEnv(process.env.OPENAI_API_KEY));
  const baseModel = cleanEnv(process.env.PERSONAL_VENTURES_AGENT_MODEL);

  if (!hasKey || !baseModel) {
    return {
      configured: false,
      provider: "disabled",
      baseModel,
      orchestratorModel: null,
      specialistModel: null,
      qaModel: null,
    };
  }

  return {
    configured: true,
    provider: "openai",
    baseModel,
    orchestratorModel:
      cleanEnv(process.env.PERSONAL_VENTURES_ORCHESTRATOR_MODEL) ?? baseModel,
    specialistModel:
      cleanEnv(process.env.PERSONAL_VENTURES_SPECIALIST_MODEL) ?? baseModel,
    qaModel: cleanEnv(process.env.PERSONAL_VENTURES_QA_MODEL) ?? baseModel,
  };
}

function resolveModel(role: ProviderRole) {
  const status = getModelProviderStatus();
  if (!status.configured) throw new ModelProviderUnavailableError();

  if (role === "orchestrator") return status.orchestratorModel!;
  if (role === "qa") return status.qaModel!;
  return status.specialistModel!;
}

function extractOutputText(payload: ResponsesApiPayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const texts =
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && typeof item.text === "string")
      .map((item) => item.text!.trim())
      .filter(Boolean) ?? [];

  if (texts.length) return texts.join("\n");

  const refusal =
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => typeof item.refusal === "string")?.refusal ?? null;

  if (refusal) {
    throw new ModelProviderRequestError(
      `The model refused the request: ${refusal}`,
      422,
      "MODEL_REFUSAL"
    );
  }

  throw new ModelProviderRequestError(
    "The model returned no structured text output.",
    502,
    "EMPTY_MODEL_OUTPUT"
  );
}

function usageFrom(payload: ResponsesApiPayload): ProviderUsage {
  const inputTokens = payload.usage?.input_tokens ?? 0;
  const outputTokens = payload.usage?.output_tokens ?? 0;

  return {
    inputTokens,
    outputTokens,
    totalTokens: payload.usage?.total_tokens ?? inputTokens + outputTokens,
    estimatedCostUsd: 0,
  };
}

function safeParse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]) as T;
      } catch {
        // Continue to the explicit error below.
      }
    }

    throw new ModelProviderRequestError(
      "The model output was not valid JSON.",
      502,
      "INVALID_STRUCTURED_OUTPUT"
    );
  }
}

function maxOutputTokens(requested?: number) {
  const configured = Number(process.env.PERSONAL_VENTURES_MAX_OUTPUT_TOKENS ?? "1600");
  const base = Number.isFinite(configured) ? configured : 1600;
  const value = requested ?? base;
  return Math.max(400, Math.min(value, 4000));
}

export async function runStructuredResponse<T>(
  request: StructuredProviderRequest
): Promise<StructuredProviderResult<T>> {
  const apiKey = cleanEnv(process.env.OPENAI_API_KEY);
  if (!apiKey) throw new ModelProviderUnavailableError();

  const model = resolveModel(request.role);
  const controller = new AbortController();
  const timeoutMs = Math.max(
    10_000,
    Math.min(Number(process.env.PERSONAL_VENTURES_MODEL_TIMEOUT_MS ?? "45000"), 90_000)
  );
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        instructions: request.instructions,
        input: request.input,
        max_output_tokens: maxOutputTokens(request.maxOutputTokens),
        text: {
          format: {
            type: "json_schema",
            name: request.schemaName,
            strict: true,
            schema: request.schema,
          },
        },
      }),
    });

    const payload = (await response.json()) as ResponsesApiPayload;

    if (!response.ok) {
      const message =
        payload.error?.message ||
        `OpenAI Responses API failed with HTTP ${response.status}.`;

      throw new ModelProviderRequestError(
        message,
        response.status,
        payload.error?.code ?? payload.error?.type ?? null
      );
    }

    const outputText = extractOutputText(payload);

    return {
      data: safeParse<T>(outputText),
      provider: "openai",
      model: payload.model ?? model,
      responseId: payload.id ?? null,
      usage: usageFrom(payload),
    };
  } catch (error) {
    if (error instanceof ModelProviderRequestError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new ModelProviderRequestError(
        "The model request timed out.",
        504,
        "MODEL_TIMEOUT"
      );
    }

    throw new ModelProviderRequestError(
      error instanceof Error ? error.message : "Unknown model provider error.",
      502,
      "MODEL_PROVIDER_ERROR"
    );
  } finally {
    clearTimeout(timeout);
  }
}
