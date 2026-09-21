export type ProviderRole = "orchestrator" | "specialist" | "qa";

export type ProviderUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
};

export type StructuredProviderResult<T> = {
  data: T;
  provider: "openai";
  model: string;
  responseId: string | null;
  usage: ProviderUsage;
};

export type StructuredProviderRequest = {
  role: ProviderRole;
  schemaName: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: string;
  maxOutputTokens?: number;
};

export type ModelProviderStatus = {
  configured: boolean;
  provider: "openai" | "disabled";
  baseModel: string | null;
  orchestratorModel: string | null;
  specialistModel: string | null;
  qaModel: string | null;
};
