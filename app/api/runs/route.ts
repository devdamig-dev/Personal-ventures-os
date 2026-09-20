import { NextRequest, NextResponse } from "next/server";
import {
  createTaskRun,
  listTaskRuns,
  PersistenceUnavailableError,
} from "@/lib/operations/repository";
import { ventures } from "@/lib/ventures";

function validVenture(slug: string) {
  return ventures.some((venture) => venture.slug === slug);
}

function unavailableResponse() {
  return NextResponse.json(
    {
      error: "Persistence is not active for Personal Ventures OS.",
      code: "PERSISTENCE_DISABLED",
      action:
        "Keep using the local router. Run persistence will activate when the dedicated Supabase project is configured.",
    },
    { status: 503 }
  );
}

export async function GET(request: NextRequest) {
  const venture = request.nextUrl.searchParams.get("venture") ?? "";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "25");

  if (!validVenture(venture)) {
    return NextResponse.json({ error: "Venture inválido." }, { status: 400 });
  }

  try {
    const runs = await listTaskRuns(venture, Number.isFinite(limit) ? limit : 25);
    return NextResponse.json({ runs, persisted: true });
  } catch (error) {
    if (error instanceof PersistenceUnavailableError) return unavailableResponse();
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not list runs." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const venture = typeof body?.venture === "string" ? body.venture : "";
    const objective = typeof body?.objective === "string" ? body.objective.trim() : "";
    const title = typeof body?.title === "string" ? body.title.trim() : undefined;

    if (!validVenture(venture)) {
      return NextResponse.json({ error: "Venture inválido." }, { status: 400 });
    }

    if (!objective) {
      return NextResponse.json({ error: "El objetivo es obligatorio." }, { status: 400 });
    }

    const result = await createTaskRun({
      ventureSlug: venture,
      objective,
      title,
      requestedBy: "founder",
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PersistenceUnavailableError) return unavailableResponse();
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create run." },
      { status: 500 }
    );
  }
}
