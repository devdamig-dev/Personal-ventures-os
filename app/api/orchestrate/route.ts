import { NextResponse } from "next/server";
import { orchestrateTask } from "@/lib/orchestration/engine";
import {
  ModelProviderRequestError,
  ModelProviderUnavailableError,
} from "@/lib/providers/openai-responses";
import { buildRoutingPlan } from "@/lib/router";
import { ventures } from "@/lib/ventures";

export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const task = typeof body?.task === "string" ? body.task.trim() : "";
    const venture = typeof body?.venture === "string" ? body.venture : "";

    if (!task) {
      return NextResponse.json({ error: "La tarea es obligatoria." }, { status: 400 });
    }

    if (!ventures.some((item) => item.slug === venture)) {
      return NextResponse.json({ error: "Venture inválido." }, { status: 400 });
    }

    try {
      const orchestration = await orchestrateTask({
        task,
        ventureSlug: venture,
        persist: true,
      });

      return NextResponse.json({
        mode: "model-backed",
        plan: orchestration.routingPlan,
        orchestration,
      });
    } catch (error) {
      const fallbackPlan = buildRoutingPlan(task, venture);

      if (error instanceof ModelProviderUnavailableError) {
        return NextResponse.json({
          mode: "local-router",
          plan: fallbackPlan,
          orchestration: null,
          warning:
            "Los agentes de modelo todavía no tienen provider configurado. Se devolvió el plan local sin ejecutar acciones externas.",
        });
      }

      if (error instanceof ModelProviderRequestError) {
        return NextResponse.json(
          {
            error: "La ejecución con agentes no pudo completarse.",
            code: error.code,
            mode: "local-router",
            plan: fallbackPlan,
            orchestration: null,
            warning:
              "El plan local quedó disponible como fallback. No se ejecutó ninguna acción externa.",
          },
          { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
        );
      }

      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo procesar la orquestación.",
      },
      { status: 500 }
    );
  }
}
