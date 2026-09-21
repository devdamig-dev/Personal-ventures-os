alter table public.task_runs
  add column if not exists execution_mode text not null default 'planning'
    check (execution_mode in ('planning','simulation','live')),
  add column if not exists provider text,
  add column if not exists model text,
  add column if not exists input_tokens bigint not null default 0,
  add column if not exists output_tokens bigint not null default 0,
  add column if not exists estimated_cost_usd numeric(12,6) not null default 0;

alter table public.task_steps
  add column if not exists attempt_count integer not null default 0,
  add column if not exists provider text,
  add column if not exists model text,
  add column if not exists input_tokens bigint not null default 0,
  add column if not exists output_tokens bigint not null default 0,
  add column if not exists estimated_cost_usd numeric(12,6) not null default 0;

create index if not exists task_runs_status_created_idx
  on public.task_runs (status, created_at desc);

create index if not exists approvals_task_run_idx
  on public.approval_requests (task_run_id, created_at desc);

comment on column public.task_runs.execution_mode is
  'planning never performs external side effects; simulation may exercise internal flows; live requires explicit approval gates.';
