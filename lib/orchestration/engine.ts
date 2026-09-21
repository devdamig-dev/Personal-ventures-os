import { agentDefinitions } from "@/lib/agents";
import {
  completeTaskRun,
  createTaskRun,
  failTaskRun,
  getPersistenceMode,
  markTaskRunRunning,
  recordTaskStepExecution,
} from "@/lib/operations/repository";
import type {
  AgentTrace,
  ChiefPlan,
  FinalSynthesis,
  OrchestrationResult,
  QaOutput,
  SpecialistOutput,
} from "@/lib/orchestration/types";
import {
  chiefPlanSchema,
  finalSynthesisSchema,
  qaOutputSchema,
  specialistOutputSchema,
} from "@/lib/orchestration/schemas";
import {
  chiefPlanningInstructions,
  qaInstructions,
  specialistInstructions,
  synthesisInstructions,
} from "@/lib/orchestration/prompts";
import {
  getModelProviderStatus,
  runStructuredResponse,
} from "@/lib/providers/openai-responses";
import type { ProviderUsage } from "@/lib/providers/types";
import { buildRoutingPlan } from "@/lib/router";
import { getVenture } from "@/lib/ventures";

function now() {
  return new Date().toISOString();
}

function aggregateUsage(traces: AgentTrace[]): ProviderUsage {
  return traces.reduce<ProviderUsage>(
    (total, trace) => ({
      inputTokens: total.inputTokens + trace.usage.inputTokens,
      outputTokens: total.outputTokens + trace.usage.outputTokens,
      totalTokens: total.totalTokens + trace.usage.totalTokens,
      estimatedCostUsd:
        total.estimatedCostUsd + trace.usage.estimatedCostUsd,
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    }
  );
}

function maxSpecialists() {
  const configured = Number(process.env.PERSONAL_VENTURES_MAX_SPECIALISTS ?? "6");
  return Number.isFinite(configured)
    ? Math.max(1, Math.min(Math.floor(configured), 6))
    : 6;
}

function taskForAgent(
  chiefPlan: ChiefPlan,
  agentId: string,
  founderObjective: string
) {
  const assigned = chiefPlan.subtasks.find((subtask) => subtask.agentId === agentId);

  return (
    assigned ?? {
      agentId,
      title: "Specialist contribution",
      objective: founderObjective,
      expectedOutput:
        "A concrete specialist contribution that advances the founder objective.",
    }
  );
}

export async function orchestrateTask(input: {
  task: string;
  ventureSlug: string;
  persist?: boolean;
}): Promise<OrchestrationResult> {
  const founderObjective = input.task.trim();
  if (!founderObjective) throw new Error("The founder objective is required.");

  const venture = getVenture(input.ventureSlug);
  if (venture.slug !== input.ventureSlug) {
    throw new Error("Invalid venture.");
  }

  const providerStatus = getModelProviderStatus();
  if (!providerStatus.configured) {
    const { ModelProviderUnavailableError } = await import(
      "@/lib/providers/openai-responses"
    );
    throw new ModelProviderUnavailableError();
  }

  const routingPlan = buildRoutingPlan(founderObjective, venture.slug);
  const selectedNames = new Set(routingPlan.agents);
  const specialists = agentDefinitions
    .filter(
      (agent) =>
        agent.id !== "chief-of-staff" &&
        agent.id !== "qa" &&
        selectedNames.has(agent.name)
    )
    .slice(0, maxSpecialists());

  const traces: AgentTrace[] = [];
  const persistenceEnabled =
    input.persist !== false && getPersistenceMode() === "supabase";

  let runId: string | null = null;

  if (persistenceEnabled) {
    const stored = await createTaskRun({
      ventureSlug: venture.slug,
      objective: founderObjective,
      requestedBy: "founder",
    });

    runId = stored.run.id;

    await markTaskRunRunning({
      runId,
      ventureSlug: venture.slug,
      provider: "openai",
      model: providerStatus.orchestratorModel!,
    });
  }

  try {
    const planningStarted = now();
    const chiefPlanning = await runStructuredResponse<ChiefPlan>({
      role: "orchestrator",
      schemaName: "personal_ventures_chief_plan",
      schema: chiefPlanSchema(specialists.map((agent) => agent.id)),
      instructions: chiefPlanningInstructions(venture, specialists),
      input: JSON.stringify({
        founderObjective,
        routingPlan: {
          risk: routingPlan.risk,
          approvalRequired: routingPlan.approvalRequired,
          agents: routingPlan.agents,
        },
      }),
      maxOutputTokens: 1500,
    });

    const allowedIds = new Set(specialists.map((agent) => agent.id));
    const chiefPlan: ChiefPlan = {
      ...chiefPlanning.data,
      subtasks: chiefPlanning.data.subtasks.filter((subtask) =>
        allowedIds.has(subtask.agentId)
      ),
    };

    const planningTrace: AgentTrace = {
      agentId: "chief-of-staff",
      agentName: "Chief of Staff",
      phase: "planning",
      status: "done",
      model: chiefPlanning.model,
      responseId: chiefPlanning.responseId,
      startedAt: planningStarted,
      completedAt: now(),
      output: chiefPlan,
      usage: chiefPlanning.usage,
    };
    traces.push(planningTrace);

    const specialistRuns = await Promise.all(
      specialists.map(async (agent) => {
        const subtask = taskForAgent(chiefPlan, agent.id, founderObjective);
        const startedAt = now();

        const response = await runStructuredResponse<SpecialistOutput>({
          role: "specialist",
          schemaName: `personal_ventures_${agent.id.replace(/[^a-z0-9_-]/gi, "_")}_output`,
          schema: specialistOutputSchema,
          instructions: specialistInstructions(venture, agent),
          input: JSON.stringify({
            founderObjective,
            chiefPlan,
            assignment: subtask,
            guardrails: {
              approvalRequired: routingPlan.approvalRequired,
              externalActionsAvailable: false,
            },
          }),
          maxOutputTokens: 1600,
        });

        const trace: AgentTrace = {
          agentId: agent.id,
          agentName: agent.name,
          phase: "specialist",
          status: "done",
          model: response.model,
          responseId: response.responseId,
          startedAt,
          completedAt: now(),
          output: response.data,
          usage: response.usage,
        };

        return {
          trace,
          output: {
            agentId: agent.id,
            agentName: agent.name,
            output: response.data,
          },
        };
      })
    );

    specialistRuns.forEach(({ trace }) => traces.push(trace));

    const specialistOutputs = specialistRuns.map(({ output }) => output);

    const qaStarted = now();
    const qaResponse = await runStructuredResponse<QaOutput>({
      role: "qa",
      schemaName: "personal_ventures_qa_review",
      schema: qaOutputSchema,
      instructions: qaInstructions(venture),
      input: JSON.stringify({
        founderObjective,
        routingPlan,
        chiefPlan,
        specialistOutputs,
      }),
      maxOutputTokens: 1100,
    });

    const qaTrace: AgentTrace = {
      agentId: "qa",
      agentName: "QA Agent",
      phase: "qa",
      status: "done",
      model: qaResponse.model,
      responseId: qaResponse.responseId,
      startedAt: qaStarted,
      completedAt: now(),
      output: qaResponse.data,
      usage: qaResponse.usage,
    };
    traces.push(qaTrace);

    const synthesisStarted = now();
    const synthesisResponse = await runStructuredResponse<FinalSynthesis>({
      role: "orchestrator",
      schemaName: "personal_ventures_final_synthesis",
      schema: finalSynthesisSchema,
      instructions: synthesisInstructions(venture),
      input: JSON.stringify({
        founderObjective,
        routingPlan,
        chiefPlan,
        specialistOutputs,
        qa: qaResponse.data,
        approvalRequired: routingPlan.approvalRequired,
        externalActionsExecuted: false,
      }),
      maxOutputTokens: 1500,
    });

    const synthesisTrace: AgentTrace = {
      agentId: "chief-of-staff",
      agentName: "Chief of Staff",
      phase: "synthesis",
      status: "done",
      model: synthesisResponse.model,
      responseId: synthesisResponse.responseId,
      startedAt: synthesisStarted,
      completedAt: now(),
      output: synthesisResponse.data,
      usage: synthesisResponse.usage,
    };
    traces.push(synthesisTrace);

    const usage = aggregateUsage(traces);
    const status: OrchestrationResult["status"] =
      qaResponse.data.verdict === "needs_revision"
        ? "needs_revision"
        : routingPlan.approvalRequired
          ? "awaiting_approval"
          : "completed";

    const result: OrchestrationResult = {
      mode: "model-backed",
      venture: venture.slug,
      objective: founderObjective,
      routingPlan,
      chiefPlan,
      specialistOutputs,
      qa: qaResponse.data,
      final: synthesisResponse.data,
      traces,
      usage,
      status,
      approvalRequired: routingPlan.approvalRequired,
      externalActionsExecuted: false,
      persisted: persistenceEnabled,
      runId,
    };

    if (persistenceEnabled && runId) {
      const chiefUsage: ProviderUsage = {
        inputTokens:
          planningTrace.usage.inputTokens + synthesisTrace.usage.inputTokens,
        outputTokens:
          planningTrace.usage.outputTokens + synthesisTrace.usage.outputTokens,
        totalTokens:
          planningTrace.usage.totalTokens + synthesisTrace.usage.totalTokens,
        estimatedCostUsd:
          planningTrace.usage.estimatedCostUsd +
          synthesisTrace.usage.estimatedCostUsd,
      };

      await recordTaskStepExecution({
        runId,
        ventureSlug: venture.slug,
        agentKey: "chief-of-staff",
        output: {
          planning: chiefPlan,
          synthesis: synthesisResponse.data,
        },
        provider: "openai",
        model: synthesisResponse.model,
        inputTokens: chiefUsage.inputTokens,
        outputTokens: chiefUsage.outputTokens,
        estimatedCostUsd: chiefUsage.estimatedCostUsd,
      });

      for (const specialist of specialistRuns) {
        await recordTaskStepExecution({
          runId,
          ventureSlug: venture.slug,
          agentKey: specialist.trace.agentId,
          output: specialist.trace.output,
          provider: "openai",
          model: specialist.trace.model,
          inputTokens: specialist.trace.usage.inputTokens,
          outputTokens: specialist.trace.usage.outputTokens,
          estimatedCostUsd: specialist.trace.usage.estimatedCostUsd,
        });
      }

      await recordTaskStepExecution({
        runId,
        ventureSlug: venture.slug,
        agentKey: "qa",
        output: qaResponse.data,
        provider: "openai",
        model: qaResponse.model,
        inputTokens: qaResponse.usage.inputTokens,
        outputTokens: qaResponse.usage.outputTokens,
        estimatedCostUsd: qaResponse.usage.estimatedCostUsd,
      });

      await completeTaskRun({
        runId,
        ventureSlug: venture.slug,
        status: status === "completed" ? "done" : "review",
        result,
        provider: "openai",
        model: synthesisResponse.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCostUsd: usage.estimatedCostUsd,
      });
    }

    return result;
  } catch (error) {
    if (persistenceEnabled && runId) {
      try {
        await failTaskRun({
          runId,
          ventureSlug: venture.slug,
          errorMessage:
            error instanceof Error ? error.message : "Unknown orchestration error.",
        });
      } catch (persistenceError) {
        console.error("failed_to_persist_orchestration_failure", persistenceError);
      }
    }

    throw error;
  }
}
