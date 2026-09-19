import { NextResponse } from "next/server";
import { buildRoutingPlan } from "@/lib/router";
import { ventures } from "@/lib/ventures";

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

    const plan = buildRoutingPlan(task, venture);
    return NextResponse.json({ plan, mode: plan.mode });
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la delegación." },
      { status: 500 }
    );
  }
}
