export function chiefPlanSchema(
  allowedAgentIds: string[],
  allowedConnectorActions: string[]
) {
  const agentEnum = allowedAgentIds.length ? allowedAgentIds : ["chief-of-staff"];
  const actionEnum = allowedConnectorActions.length
    ? allowedConnectorActions
    : ["github.repo_summary"];

  return {
    type: "object",
    additionalProperties: false,
    required: ["objective", "successCriteria", "subtasks", "coordinationNotes"],
    properties: {
      objective: { type: "string" },
      successCriteria: {
        type: "array",
        items: { type: "string" },
        maxItems: 8,
      },
      subtasks: {
        type: "array",
        maxItems: allowedAgentIds.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "agentId",
            "title",
            "objective",
            "expectedOutput",
            "toolRequests",
          ],
          properties: {
            agentId: { type: "string", enum: agentEnum },
            title: { type: "string" },
            objective: { type: "string" },
            expectedOutput: { type: "string" },
            toolRequests: {
              type: "array",
              maxItems: 3,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["action", "resource", "reason"],
                properties: {
                  action: { type: "string", enum: actionEnum },
                  resource: { type: "string" },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
      },
      coordinationNotes: {
        type: "array",
        items: { type: "string" },
        maxItems: 8,
      },
    },
  } as Record<string, unknown>;
}

export const specialistOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "findings",
    "deliverables",
    "risks",
    "nextActions",
    "confidence",
  ],
  properties: {
    summary: { type: "string" },
    findings: { type: "array", items: { type: "string" }, maxItems: 10 },
    deliverables: { type: "array", items: { type: "string" }, maxItems: 10 },
    risks: { type: "array", items: { type: "string" }, maxItems: 8 },
    nextActions: { type: "array", items: { type: "string" }, maxItems: 8 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
} as Record<string, unknown>;

export const qaOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "summary", "issues", "requiredChanges", "confidence"],
  properties: {
    verdict: { type: "string", enum: ["pass", "needs_revision"] },
    summary: { type: "string" },
    issues: { type: "array", items: { type: "string" }, maxItems: 10 },
    requiredChanges: { type: "array", items: { type: "string" }, maxItems: 10 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
} as Record<string, unknown>;

export const finalSynthesisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "executiveSummary",
    "decisions",
    "deliverables",
    "nextActions",
    "approvalNotes",
  ],
  properties: {
    executiveSummary: { type: "string" },
    decisions: { type: "array", items: { type: "string" }, maxItems: 10 },
    deliverables: { type: "array", items: { type: "string" }, maxItems: 12 },
    nextActions: { type: "array", items: { type: "string" }, maxItems: 10 },
    approvalNotes: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
} as Record<string, unknown>;
