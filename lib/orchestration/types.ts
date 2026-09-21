import type { RoutingPlan } from "@/lib/router";
import type { ProviderUsage } from "@/lib/providers/types";

export type ChiefPlan = {
  objective: string;
  successCriteria: string[];
  subtasks: Array<{
    agentId: string;
    title: string;
    objective: string;
    expectedOutput: string;
  }>;
  coordinationNotes: string[];
};

export type SpecialistOutput = {
  summary: string;
  findings: string[];
  deliverables: string[];
  risks: string[];
  nextActions: string[];
  confidence: number;
};

export type QaOutput = {
  verdict: "pass" | "needs_revision";
  summary: string;
  issues: string[];
  requiredChanges: string[];
  confidence: number;
};

export type FinalSynthesis = {
  executiveSummary: string;
  decisions: string[];
  deliverables: string[];
  nextActions: string[];
  approvalNotes: string[];
};

export type AgentTrace = {
  agentId: string;
  agentName: string;
  phase: "planning" | "specialist" | "qa" | "synthesis";
  status: "done";
  model: string;
  responseId: string | null;
  startedAt: string;
  completedAt: string;
  output: ChiefPlan | SpecialistOutput | QaOutput | FinalSynthesis;
  usage: ProviderUsage;
};

export type OrchestrationResult = {
  mode: "model-backed";
  venture: string;
  objective: string;
  routingPlan: RoutingPlan;
  chiefPlan: ChiefPlan;
  specialistOutputs: Array<{
    agentId: string;
    agentName: string;
    output: SpecialistOutput;
  }>;
  qa: QaOutput;
  final: FinalSynthesis;
  traces: AgentTrace[];
  usage: ProviderUsage;
  status: "completed" | "awaiting_approval" | "needs_revision";
  approvalRequired: boolean;
  externalActionsExecuted: false;
  persisted: boolean;
  runId: string | null;
};
