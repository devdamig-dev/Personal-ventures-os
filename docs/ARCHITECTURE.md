# Personal Ventures OS — Architecture

## Product boundary

Personal Ventures OS is the operating system for owned ventures. It is not a workspace inside Avans Agency OS.

The system starts with three ventures:

- GastroPilot
- Sin Equipaje
- Nexodg

Future owned ventures can be added without changing the agency system.

## Mental model

```
Founder
  ↓
Chief of Staff
  ↓
Venture Context Boundary
  ↓
Specialist Agent Graph
  ↓
Task Runs
  ↓
QA / Approval
  ↓
Execution
  ↓
Artifacts + Audit + Learning
```

## Agent layer

Every agent definition should eventually include:

- purpose;
- allowed data scopes;
- allowed tools;
- action policy;
- approval rules;
- model/provider;
- budget and timeout;
- output contract;
- fallback behavior;
- versioned instructions.

The Chief of Staff is the only default orchestrator. Specialist agents do not freely pull context from other ventures.

## Data layer

Core objects:

- `ventures`
- `agent_definitions`
- `task_runs`
- `task_steps`
- `approval_requests`
- `artifacts`
- `audit_events`

Every operational row carries `venture_id` wherever applicable.

## Guardrails

External side effects are separate from planning. A plan can be generated without permission to execute it.

Examples that should require approval by default:

- publishing;
- sending messages;
- payments;
- destructive actions;
- production changes;
- material budget changes.

## Isolation from Avans

Do not reuse:

- Avans database;
- Avans auth tenant;
- Avans service-role keys;
- Avans project memory;
- Avans client records;
- Avans connector credentials by default.

Shared code patterns are fine. Shared tenant data is not.

## Delivery stages

### V0.1 — Control surface
- portfolio selector;
- Founder Command Center;
- deterministic router;
- agent catalog;
- approval awareness;
- foundation schema.

### V0.2 — Persistence — implemented in code, activation pending dedicated Supabase
- task runs and task-step skeletons;
- venture-scoped run history;
- approvals with explicit human decisions;
- audit events;
- Supabase server adapter;
- explicit disabled-mode fallback;
- telemetry-ready schema for provider/model/token/cost data.

### V0.3 — Real orchestration — implemented in code
- OpenAI Responses API provider adapter;
- structured Chief of Staff planning;
- parallel specialist runs;
- QA review;
- Chief of Staff final synthesis;
- provider timeouts and output caps;
- token telemetry;
- persistence hooks when the dedicated Supabase project is active;
- no external side effects.

### V0.4 — Connectors — read-only foundation implemented
- connector registry and per-agent permissions;
- GitHub read adapter;
- Vercel read adapter;
- Nexodg WP Central read-only bridge contract;
- connector observations injected into specialist work, QA and synthesis;
- runtime connector status;
- no external write actions.

Planned later additions:
- Drive;
- Gmail;
- social/content systems;
- venture-specific integrations.

### V0.5 — Execution
- human-approved external actions;
- scheduled jobs;
- reusable workflows;
- learning from accepted/rejected outputs.
