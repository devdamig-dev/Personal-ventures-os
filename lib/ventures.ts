export type Venture = {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  mission: string;
  focus: string[];
  status: "active" | "building" | "incubating";
};

export const ventures: Venture[] = [
  {
    slug: "gastropilot",
    name: "GastroPilot",
    shortName: "GP",
    category: "AI SaaS · Gastronomía",
    mission:
      "Convertir WhatsApp en el sistema operativo inteligente de un negocio gastronómico.",
    focus: ["Producto", "IA", "Automatización", "Go-to-market"],
    status: "building",
  },
  {
    slug: "sin-equipaje",
    name: "Sin Equipaje",
    shortName: "SE",
    category: "Travel media · Afiliados",
    mission:
      "Construir un medio de viajes automatizado que combine contenido útil, inspiración y monetización.",
    focus: ["Contenido", "SEO", "Social", "Afiliados"],
    status: "active",
  },
  {
    slug: "nexodg",
    name: "Nexodg",
    shortName: "NX",
    category: "Digital products · Infra",
    mission:
      "Centralizar productos propios, infraestructura WordPress y experimentos digitales personales.",
    focus: ["Web", "Infra", "Automatización", "Producto"],
    status: "active",
  },
];

export function getVenture(slug: string) {
  return ventures.find((venture) => venture.slug === slug) ?? ventures[0];
}
