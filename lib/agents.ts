export type AgentDefinition = {
  id: string;
  name: string;
  role: string;
  purpose: string;
  department: string;
  autonomy: number;
  capabilities: string[];
};

export const agentDefinitions: AgentDefinition[] = [
  {
    id: "chief-of-staff",
    name: "Chief of Staff",
    role: "Orchestrator",
    purpose: "Descompone objetivos, asigna especialistas, controla dependencias y sintetiza resultados.",
    department: "Founder Office",
    autonomy: 55,
    capabilities: ["planning", "routing", "prioritization", "synthesis"],
  },
  {
    id: "product",
    name: "Product Agent",
    role: "Product & Strategy",
    purpose: "Convierte objetivos de negocio en producto, roadmap, experimentos y decisiones.",
    department: "Product",
    autonomy: 58,
    capabilities: ["product", "roadmap", "discovery", "metrics"],
  },
  {
    id: "engineering",
    name: "Engineering Agent",
    role: "Development",
    purpose: "Diseña y ejecuta trabajo técnico, integraciones, automatizaciones y QA técnico.",
    department: "Engineering",
    autonomy: 52,
    capabilities: ["development", "integrations", "automation", "architecture"],
  },
  {
    id: "growth",
    name: "Growth Agent",
    role: "Acquisition & Revenue",
    purpose: "Diseña adquisición, funnels, experimentos de crecimiento y monetización.",
    department: "Growth",
    autonomy: 61,
    capabilities: ["growth", "ads", "funnels", "conversion"],
  },
  {
    id: "content",
    name: "Content Agent",
    role: "Content & Brand",
    purpose: "Planifica y produce contenido alineado a cada marca y canal.",
    department: "Content",
    autonomy: 67,
    capabilities: ["content", "copy", "seo", "social"],
  },
  {
    id: "research",
    name: "Research Agent",
    role: "Research & Intelligence",
    purpose: "Investiga mercados, competidores, tendencias y evidencia para apoyar decisiones.",
    department: "Intelligence",
    autonomy: 72,
    capabilities: ["research", "competitive-intelligence", "summaries"],
  },
  {
    id: "finance",
    name: "Finance Agent",
    role: "Finance & Unit Economics",
    purpose: "Ordena costos, ingresos, escenarios y métricas económicas de cada venture.",
    department: "Finance",
    autonomy: 35,
    capabilities: ["finance", "costs", "forecasting", "unit-economics"],
  },
  {
    id: "qa",
    name: "QA Agent",
    role: "Review & Guardrails",
    purpose: "Revisa entregables, riesgos, consistencia y condiciones de aprobación.",
    department: "QA",
    autonomy: 48,
    capabilities: ["qa", "review", "risk", "validation"],
  },
];

export const sensitivePatterns =
  /(publicar|publish|enviar|send|pagar|pay|borrar|delete|eliminar|presupuesto|budget|inversi[oó]n|comprar|purchase|producci[oó]n)/i;
