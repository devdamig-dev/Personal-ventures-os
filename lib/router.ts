import { agentDefinitions, sensitivePatterns } from "@/lib/agents";
import { getVenture } from "@/lib/ventures";

export type RoutingPlan = {
  summary: string;
  department: string;
  agents: string[];
  steps: string[];
  approvalRequired: boolean;
  risk: "low" | "medium" | "high";
  venture: string;
  mode: "local-router";
};

function includesAny(input: string, words: string[]) {
  return words.some((word) => input.includes(word));
}

export function buildRoutingPlan(task: string, ventureSlug: string): RoutingPlan {
  const venture = getVenture(ventureSlug);
  const normalized = task.toLowerCase();

  const selected = new Set<string>(["chief-of-staff"]);

  if (includesAny(normalized, ["web", "wordpress", "código", "codigo", "api", "automat", "deploy", "vercel", "supabase", "bug"])) {
    selected.add("engineering");
  }
  if (includesAny(normalized, ["contenido", "post", "reel", "copy", "seo", "nota", "blog", "instagram", "redes"])) {
    selected.add("content");
  }
  if (includesAny(normalized, ["ads", "anuncio", "campaña", "campana", "lead", "conversion", "venta", "monetiz"])) {
    selected.add("growth");
  }
  if (includesAny(normalized, ["mercado", "compet", "investig", "benchmark", "tendencia", "buscar"])) {
    selected.add("research");
  }
  if (includesAny(normalized, ["costo", "precio", "margen", "ingreso", "gasto", "presupuesto", "finanza"])) {
    selected.add("finance");
  }
  if (includesAny(normalized, ["producto", "roadmap", "feature", "mvp", "prioridad", "estrategia"])) {
    selected.add("product");
  }

  selected.add("qa");

  const agents = [...selected]
    .map((id) => agentDefinitions.find((agent) => agent.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const approvalRequired = sensitivePatterns.test(task);
  const risk: RoutingPlan["risk"] = approvalRequired
    ? includesAny(normalized, ["pagar", "pay", "borrar", "delete", "eliminar", "producción", "produccion"])
      ? "high"
      : "medium"
    : "low";

  return {
    summary: `Objetivo enrutado dentro de ${venture.name}. El Chief of Staff coordina ${agents.length - 1} especialistas y mantiene el contexto aislado del resto del portfolio.`,
    department: venture.name,
    agents,
    steps: [
      "Interpretar el objetivo y definir el resultado esperado.",
      "Cargar únicamente el contexto del venture seleccionado.",
      "Asignar subtareas a los especialistas necesarios.",
      "Consolidar resultados y pasar revisión de QA.",
      approvalRequired
        ? "Retener cualquier acción externa sensible hasta aprobación humana."
        : "Devolver un resultado listo para revisión o siguiente ejecución.",
    ],
    approvalRequired,
    risk,
    venture: venture.slug,
    mode: "local-router",
  };
}
