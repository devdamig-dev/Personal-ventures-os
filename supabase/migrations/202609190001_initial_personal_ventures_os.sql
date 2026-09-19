create extension if not exists pgcrypto;

create table if not exists public.ventures (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text,
  mission text,
  status text not null default 'active' check (status in ('active','building','incubating','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_definitions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  role text not null,
  department text not null,
  purpose text not null,
  autonomy_level integer not null default 0 check (autonomy_level between 0 and 100),
  capabilities jsonb not null default '[]'::jsonb,
  allowed_tools jsonb not null default '[]'::jsonb,
  requires_approval_for jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_runs (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures(id) on delete cascade,
  title text not null,
  objective text not null,
  status text not null default 'queued' check (status in ('queued','planning','running','review','blocked','done','failed','cancelled')),
  risk text not null default 'low' check (risk in ('low','medium','high')),
  approval_required boolean not null default false,
  requested_by text,
  plan jsonb,
  result jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_steps (
  id uuid primary key default gen_random_uuid(),
  task_run_id uuid not null references public.task_runs(id) on delete cascade,
  agent_key text not null,
  position integer not null,
  title text not null,
  status text not null default 'queued' check (status in ('queued','running','review','blocked','done','failed','skipped')),
  input jsonb,
  output jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  task_run_id uuid not null references public.task_runs(id) on delete cascade,
  step_id uuid references public.task_steps(id) on delete set null,
  action_type text not null,
  payload jsonb,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired','cancelled')),
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  task_run_id uuid not null references public.task_runs(id) on delete cascade,
  venture_id uuid not null references public.ventures(id) on delete cascade,
  type text not null,
  title text not null,
  uri text,
  content jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid references public.ventures(id) on delete set null,
  task_run_id uuid references public.task_runs(id) on delete set null,
  actor_type text not null,
  actor_key text,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists task_runs_venture_created_idx
  on public.task_runs (venture_id, created_at desc);

create index if not exists task_steps_run_position_idx
  on public.task_steps (task_run_id, position);

create index if not exists approvals_status_created_idx
  on public.approval_requests (status, created_at desc);

create index if not exists audit_venture_created_idx
  on public.audit_events (venture_id, created_at desc);

insert into public.ventures (slug, name, category, mission, status)
values
  ('gastropilot', 'GastroPilot', 'AI SaaS · Gastronomía', 'Sistema operativo inteligente para negocios gastronómicos.', 'building'),
  ('sin-equipaje', 'Sin Equipaje', 'Travel media · Afiliados', 'Medio de viajes automatizado, útil y monetizable.', 'active'),
  ('nexodg', 'Nexodg', 'Digital products · Infra', 'Productos propios, infraestructura y experimentos digitales.', 'active')
on conflict (slug) do update
set name = excluded.name,
    category = excluded.category,
    mission = excluded.mission,
    status = excluded.status,
    updated_at = now();

insert into public.agent_definitions (key, name, role, department, purpose, autonomy_level, capabilities, requires_approval_for)
values
  ('chief-of-staff', 'Chief of Staff', 'Orchestrator', 'Founder Office', 'Coordina objetivos, subtareas y especialistas.', 55, '["planning","routing","prioritization","synthesis"]', '["external_action"]'),
  ('product', 'Product Agent', 'Product & Strategy', 'Product', 'Convierte objetivos en decisiones y roadmap.', 58, '["product","roadmap","discovery","metrics"]', '["production_change"]'),
  ('engineering', 'Engineering Agent', 'Development', 'Engineering', 'Desarrollo, arquitectura, integraciones y automatización.', 52, '["development","integrations","automation","architecture"]', '["production_change","destructive_action"]'),
  ('growth', 'Growth Agent', 'Acquisition & Revenue', 'Growth', 'Adquisición, funnels, revenue y experimentos.', 61, '["growth","ads","funnels","conversion"]', '["budget_change","publish"]'),
  ('content', 'Content Agent', 'Content & Brand', 'Content', 'Contenido, copy, SEO y social.', 67, '["content","copy","seo","social"]', '["publish"]'),
  ('research', 'Research Agent', 'Research & Intelligence', 'Intelligence', 'Mercado, competencia, tendencias y evidencia.', 72, '["research","competitive-intelligence","summaries"]', '[]'),
  ('finance', 'Finance Agent', 'Finance & Unit Economics', 'Finance', 'Costos, ingresos, escenarios y unit economics.', 35, '["finance","costs","forecasting","unit-economics"]', '["payment","budget_change"]'),
  ('qa', 'QA Agent', 'Review & Guardrails', 'QA', 'Revisa calidad, riesgo y consistencia.', 48, '["qa","review","risk","validation"]', '[]')
on conflict (key) do update
set name = excluded.name,
    role = excluded.role,
    department = excluded.department,
    purpose = excluded.purpose,
    autonomy_level = excluded.autonomy_level,
    capabilities = excluded.capabilities,
    requires_approval_for = excluded.requires_approval_for,
    updated_at = now();

alter table public.ventures enable row level security;
alter table public.agent_definitions enable row level security;
alter table public.task_runs enable row level security;
alter table public.task_steps enable row level security;
alter table public.approval_requests enable row level security;
alter table public.artifacts enable row level security;
alter table public.audit_events enable row level security;

-- No anon/authenticated policies yet by design.
-- Server-side access should use a dedicated service role until auth scopes are defined.
