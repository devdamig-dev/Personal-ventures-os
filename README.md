# Personal Ventures OS

Founder operating system and multi-agent command center for Damian's owned ventures.

Personal Ventures OS is intentionally separate from Avans Agency OS. It coordinates strategy, product, development, growth, content, research, finance and QA across owned projects without mixing agency clients, agency memory or agency credentials.

## Initial portfolio

- **GastroPilot** — AI operating system for gastronomic businesses.
- **Sin Equipaje** — automated travel content, experiences and affiliate media.
- **Nexodg** — personal/freelance digital products, WordPress infrastructure and experiments.

## Product idea

```
Founder
  ↓
Chief of Staff / Orchestrator
  ↓
Venture context
  ↓
Specialist agents
  ↓
Plan → execution → QA → approval → audit
```

The visual Agents Office is a control surface over real task runs. It is not the orchestration engine itself.

## Core principles

1. **Personal-only scope.** No Avans Agency client data.
2. **Project context first.** Every run belongs to one owned venture.
3. **Human control.** External or sensitive actions require explicit approval.
4. **Auditability.** Every meaningful action becomes an event.
5. **Reusable agent core.** Specialist agents share contracts while preserving venture-specific context.
6. **Safe fallback.** The command center remains usable even when an AI provider is unavailable.

## Stack

- Next.js + TypeScript
- Vercel
- Supabase
- Agent/router layer with provider adapters
- Approval and audit layer

## Status

Foundation / V0.1 in development.

See `docs/ARCHITECTURE.md` for the system design and `supabase/migrations` for the persistence model.


## V0.2 progress

Persistence and approval foundations are implemented behind a dedicated Supabase adapter. While the Personal Ventures Supabase project remains inactive, the app keeps using the deterministic router and reports persistence as disabled instead of pretending runs were saved.

New operational surfaces: `/agents`, `/runs`, `/experiments`, `/knowledge`, `/approvals` and `/api/system/status`.


## V0.3 progress

The system now includes model-backed orchestration behind the deterministic safety router: Chief of Staff planning → selected specialists → QA → Chief of Staff synthesis. If the model provider is not configured, the Command Center can fall back to the local router without pretending that agents ran.

External actions remain disabled by default. The current orchestration layer produces analysis, plans and deliverables only.
