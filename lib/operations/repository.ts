import { agentDefinitions } from "@/lib/agents";
import { buildRoutingPlan } from "@/lib/router";
import { getServiceSupabase } from "@/lib/supabase/server";
import { getVenture } from "@/lib/ventures";
import type {
  ApprovalStatus,
  CreateRunInput,
  CreateRunResult,
  PersistenceMode,
  StoredApproval,
  StoredTaskRun,
  TaskRunStatus,
} from "@/lib/operations/types";

export class PersistenceUnavailableError extends Error {
  constructor() {
    super("Personal Ventures persistence is not configured.");
    this.name = "PersistenceUnavailableError";
  }
}

export class VentureBoundaryError extends Error {
  constructor() {
    super("The requested record does not belong to the selected venture.");
    this.name = "VentureBoundaryError";
  }
}

export function getPersistenceMode(): PersistenceMode {
  return getServiceSupabase() ? "supabase" : "disabled";
}

function requireSupabase() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new PersistenceUnavailableError();
  return supabase;
}

async function getVentureRow(ventureSlug: string) {
  const supabase = requireSupabase();
  const venture = getVenture(ventureSlug);

  const { data, error } = await supabase
    .from("ventures")
    .select("id, slug, name")
    .eq("slug", venture.slug)
    .single();

  if (error || !data) {
    throw new Error(`Venture "${venture.slug}" is not available in persistence.`);
  }

  return data as { id: string; slug: string; name: string };
}

async function writeAuditEvent(input: {
  ventureId: string;
  taskRunId?: string | null;
  actorType: string;
  actorKey?: string | null;
  eventType: string;
  payload?: unknown;
}) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("audit_events").insert({
    venture_id: input.ventureId,
    task_run_id: input.taskRunId ?? null,
    actor_type: input.actorType,
    actor_key: input.actorKey ?? null,
    event_type: input.eventType,
    payload: input.payload ?? null,
  });

  if (error) {
    console.error("audit_event_write_failed", {
      eventType: input.eventType,
      message: error.message,
    });
  }
}

export async function createTaskRun(input: CreateRunInput): Promise<CreateRunResult> {
  const supabase = requireSupabase();
  const venture = await getVentureRow(input.ventureSlug);
  const objective = input.objective.trim();

  if (!objective) {
    throw new Error("The run objective is required.");
  }

  const plan = buildRoutingPlan(objective, input.ventureSlug);
  const title = input.title?.trim() || objective.slice(0, 96);

  const { data: runData, error: runError } = await supabase
    .from("task_runs")
    .insert({
      venture_id: venture.id,
      title,
      objective,
      status: "planning",
      risk: plan.risk,
      approval_required: plan.approvalRequired,
      requested_by: input.requestedBy ?? "founder",
      plan,
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (runError || !runData) {
    throw new Error(runError?.message || "Could not create task run.");
  }

  const run = runData as StoredTaskRun;

  const stepRows = plan.agents.map((agentName, index) => {
    const definition = agentDefinitions.find((agent) => agent.name === agentName);

    return {
      task_run_id: run.id,
      agent_key: definition?.id ?? "unknown",
      position: index + 1,
      title:
        index === 0
          ? "Interpret and coordinate the objective"
          : `${agentName} contribution`,
      status: "queued",
      input: {
        objective,
        venture: input.ventureSlug,
        routingMode: plan.mode,
      },
    };
  });

  const { error: stepsError } = await supabase.from("task_steps").insert(stepRows);

  if (stepsError) {
    await supabase
      .from("task_runs")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", run.id);
    throw new Error(stepsError.message);
  }

  let approval: StoredApproval | null = null;

  if (plan.approvalRequired) {
    const { data: approvalData, error: approvalError } = await supabase
      .from("approval_requests")
      .insert({
        task_run_id: run.id,
        action_type: "external_sensitive_action",
        payload: {
          objective,
          risk: plan.risk,
          agents: plan.agents,
        },
        reason:
          "The routing policy detected an action that must remain blocked until human approval.",
        status: "pending",
      })
      .select("*")
      .single();

    if (approvalError || !approvalData) {
      throw new Error(approvalError?.message || "Could not create approval request.");
    }

    approval = approvalData as StoredApproval;
  }

  await writeAuditEvent({
    ventureId: venture.id,
    taskRunId: run.id,
    actorType: "system",
    actorKey: "chief-of-staff",
    eventType: "task_run.created",
    payload: {
      title,
      approvalRequired: plan.approvalRequired,
      risk: plan.risk,
      agents: plan.agents,
    },
  });

  return { run, plan, approval, persisted: true };
}

export async function listTaskRuns(
  ventureSlug: string,
  limit = 25
): Promise<StoredTaskRun[]> {
  const supabase = requireSupabase();
  const venture = await getVentureRow(ventureSlug);

  const safeLimit = Math.max(1, Math.min(limit, 100));
  const { data, error } = await supabase
    .from("task_runs")
    .select("*")
    .eq("venture_id", venture.id)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(error.message);
  return (data ?? []) as StoredTaskRun[];
}

export async function listApprovals(
  ventureSlug: string,
  status: ApprovalStatus | "all" = "pending",
  limit = 50
): Promise<StoredApproval[]> {
  const supabase = requireSupabase();
  const venture = await getVentureRow(ventureSlug);
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const { data: runs, error: runsError } = await supabase
    .from("task_runs")
    .select("id")
    .eq("venture_id", venture.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (runsError) throw new Error(runsError.message);

  const runIds = (runs ?? []).map((run: { id: string }) => run.id);
  if (!runIds.length) return [];

  let query = supabase
    .from("approval_requests")
    .select("*")
    .in("task_run_id", runIds)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as StoredApproval[];
}

export async function decideApproval(input: {
  approvalId: string;
  ventureSlug: string;
  decision: "approved" | "rejected";
  decidedBy?: string;
}) {
  const supabase = requireSupabase();
  const venture = await getVentureRow(input.ventureSlug);

  const { data: approvalData, error: approvalError } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", input.approvalId)
    .single();

  if (approvalError || !approvalData) {
    throw new Error(approvalError?.message || "Approval request not found.");
  }

  const approval = approvalData as StoredApproval;

  const { data: runData, error: runError } = await supabase
    .from("task_runs")
    .select("id, venture_id, status")
    .eq("id", approval.task_run_id)
    .single();

  if (runError || !runData) {
    throw new Error(runError?.message || "Task run not found.");
  }

  if ((runData as { venture_id: string }).venture_id !== venture.id) {
    throw new VentureBoundaryError();
  }

  if (approval.status !== "pending") {
    return approval;
  }

  const decidedAt = new Date().toISOString();
  const { data: updatedData, error: updateError } = await supabase
    .from("approval_requests")
    .update({
      status: input.decision,
      decided_by: input.decidedBy ?? "founder",
      decided_at: decidedAt,
    })
    .eq("id", input.approvalId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (updateError || !updatedData) {
    throw new Error(updateError?.message || "Could not update approval request.");
  }

  const nextRunStatus = input.decision === "approved" ? "queued" : "blocked";
  await supabase
    .from("task_runs")
    .update({
      status: nextRunStatus,
      updated_at: decidedAt,
    })
    .eq("id", approval.task_run_id);

  await writeAuditEvent({
    ventureId: venture.id,
    taskRunId: approval.task_run_id,
    actorType: "human",
    actorKey: input.decidedBy ?? "founder",
    eventType: `approval.${input.decision}`,
    payload: {
      approvalId: input.approvalId,
      actionType: approval.action_type,
    },
  });

  return updatedData as StoredApproval;
}


async function assertRunBelongsToVenture(runId: string, ventureSlug: string) {
  const supabase = requireSupabase();
  const venture = await getVentureRow(ventureSlug);

  const { data, error } = await supabase
    .from("task_runs")
    .select("id, venture_id")
    .eq("id", runId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Task run not found.");
  }

  if ((data as { venture_id: string }).venture_id !== venture.id) {
    throw new VentureBoundaryError();
  }

  return venture;
}

export async function markTaskRunRunning(input: {
  runId: string;
  ventureSlug: string;
  provider: string;
  model: string;
}) {
  const supabase = requireSupabase();
  await assertRunBelongsToVenture(input.runId, input.ventureSlug);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("task_runs")
    .update({
      status: "running",
      execution_mode: "planning",
      provider: input.provider,
      model: input.model,
      started_at: now,
      updated_at: now,
    })
    .eq("id", input.runId);

  if (error) throw new Error(error.message);
}

export async function recordTaskStepExecution(input: {
  runId: string;
  ventureSlug: string;
  agentKey: string;
  output: unknown;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd?: number;
}) {
  const supabase = requireSupabase();
  await assertRunBelongsToVenture(input.runId, input.ventureSlug);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("task_steps")
    .update({
      status: "done",
      output: input.output,
      provider: input.provider,
      model: input.model,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      estimated_cost_usd: input.estimatedCostUsd ?? 0,
      attempt_count: 1,
      started_at: now,
      completed_at: now,
    })
    .eq("task_run_id", input.runId)
    .eq("agent_key", input.agentKey);

  if (error) throw new Error(error.message);
}

export async function completeTaskRun(input: {
  runId: string;
  ventureSlug: string;
  status: Extract<TaskRunStatus, "review" | "done">;
  result: unknown;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd?: number;
}) {
  const supabase = requireSupabase();
  const venture = await assertRunBelongsToVenture(input.runId, input.ventureSlug);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("task_runs")
    .update({
      status: input.status,
      result: input.result,
      provider: input.provider,
      model: input.model,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      estimated_cost_usd: input.estimatedCostUsd ?? 0,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", input.runId);

  if (error) throw new Error(error.message);

  await writeAuditEvent({
    ventureId: venture.id,
    taskRunId: input.runId,
    actorType: "system",
    actorKey: "chief-of-staff",
    eventType: "task_run.model_orchestration_completed",
    payload: {
      status: input.status,
      provider: input.provider,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      externalActionsExecuted: false,
    },
  });
}

export async function failTaskRun(input: {
  runId: string;
  ventureSlug: string;
  errorMessage: string;
}) {
  const supabase = requireSupabase();
  const venture = await assertRunBelongsToVenture(input.runId, input.ventureSlug);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("task_runs")
    .update({
      status: "failed",
      result: {
        error: input.errorMessage,
        externalActionsExecuted: false,
      },
      completed_at: now,
      updated_at: now,
    })
    .eq("id", input.runId);

  if (error) throw new Error(error.message);

  await writeAuditEvent({
    ventureId: venture.id,
    taskRunId: input.runId,
    actorType: "system",
    actorKey: "chief-of-staff",
    eventType: "task_run.model_orchestration_failed",
    payload: {
      error: input.errorMessage,
      externalActionsExecuted: false,
    },
  });
}
