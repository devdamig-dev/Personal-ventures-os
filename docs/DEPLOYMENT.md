# Deployment

## Intended Vercel project

Project name: `personal-ventures-os`

Repository: `devdamig-dev/Personal-ventures-os`

Framework: Next.js

Production branch: `main`

## Environment variables

Configure these only in the dedicated Personal Ventures OS deployment:

```
NEXT_PUBLIC_APP_NAME=Personal Ventures OS
NEXT_PUBLIC_APP_URL=<production-url>
NEXT_PUBLIC_SUPABASE_URL=<dedicated-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dedicated-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dedicated-service-role-key>
OPENAI_API_KEY=<optional-server-key>
PERSONAL_VENTURES_AGENT_MODEL=<optional-model>
```

Never copy Avans Agency OS service-role keys, client secrets or tenant credentials into this project.

## Database

The initial schema is in:

`supabase/migrations/202609190001_initial_personal_ventures_os.sql`

It creates the portfolio, agent catalog, runs, steps, approvals, artifacts and audit events, with RLS enabled and no public policies by default.
