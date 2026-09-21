import type { RoutingPlan } from "@/lib/router";

export type PersistenceMode = "supabase" | "disabled";

export type TaskRunStatus =
  | "queued"
  | "planning"
  | "running"
  | "review"
  | "blocked"
  | "done"
  | "failed"
  | "cancelled";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export type StoredTaskRun = {
  id: string;
  venture_id: string;
  title: string;
  objective: string;
  status: TaskRunStatus;
  risk: "low" | "medium" | "high";
  approval_required: boolean;
  requested_by: string | null;
  plan: RoutingPlan | null;
  result: unknown;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StoredApproval = {
  id: string;
  task_run_id: string;
  step_id: string | null;
  action_type: string;
  payload: unknown;
  reason: string | null;
  status: ApprovalStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
};

export type CreateRunInput = {
  ventureSlug: string;
  objective: string;
  title?: string;
  requestedBy?: string;
};

export type CreateRunResult = {
  run: StoredTaskRun;
  plan: RoutingPlan;
  approval: StoredApproval | null;
  persisted: true;
};
