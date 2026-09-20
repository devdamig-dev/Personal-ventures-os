"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Code2,
  Compass,
  FlaskConical,
  Gauge,
  Globe2,
  Layers3,
  ListChecks,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  NotebookText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { agentDefinitions } from "@/lib/agents";
import { ventures } from "@/lib/ventures";
import styles from "./command-center.module.css";

type Plan = {
  summary: string;
  department: string;
  agents: string[];
  steps: string[];
  approvalRequired: boolean;
  risk: "low" | "medium" | "high";
  venture: string;
  mode: "local-router";
};

type TaskFeedItem = {
  id: string;
  title: string;
  agent: string;
  status: "working" | "review" | "done";
  when: string;
};

const agentIcon = {
  "chief-of-staff": BrainCircuit,
  product: Target,
  engineering: Code2,
  growth: Gauge,
  content: MessageSquareText,
  research: Search,
  finance: CircleDollarSign,
  qa: ShieldCheck,
} as const;

const ventureAccent: Record<string, string> = {
  gastropilot: "lime",
  "sin-equipaje": "aqua",
  nexodg: "violet",
};

const initialTasks: TaskFeedItem[] = [
  {
    id: "PV-018",
    title: "Arquitectura Founder Command Center",
    agent: "Chief of Staff",
    status: "working",
    when: "Ahora",
  },
  {
    id: "PV-017",
    title: "QA de contenido automatizado",
    agent: "QA Agent",
    status: "review",
    when: "12 min",
  },
  {
    id: "PV-016",
    title: "Mapa de integraciones",
    agent: "Engineering Agent",
    status: "done",
    when: "31 min",
  },
];

export function CommandCenter() {
  const [ventureSlug, setVentureSlug] = useState(ventures[0].slug);
  const [task, setTask] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [mobileOpen, setMobileOpen] = useState(false);

  const venture = useMemo(
    () => ventures.find((item) => item.slug === ventureSlug) ?? ventures[0],
    [ventureSlug]
  );

  async function delegate(event: React.FormEvent) {
    event.preventDefault();
    const clean = task.trim();
    if (!clean || loading) return;

    setLoading(true);
    setPlan(null);

    try {
      const response = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: clean, venture: ventureSlug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Routing failed");

      setPlan(data.plan);
      setTasks((current) => [
        {
          id: "PV-" + String(19 + current.length).padStart(3, "0"),
          title: clean,
          agent: data.plan.agents.slice(0, 2).join(" + "),
          status: "working",
          when: "Ahora",
        },
        ...current.slice(0, 4),
      ]);
      setTask("");
    } catch {
      setPlan({
        summary:
          "La tarea quedó retenida. El sistema no ejecutará ninguna acción externa hasta recuperar el router.",
        department: venture.name,
        agents: ["Chief of Staff", "QA Agent"],
        steps: [
          "Verificar el estado del router.",
          "Mantener la tarea en cola.",
          "Reintentar sin acciones externas.",
        ],
        approvalRequired: true,
        risk: "medium",
        venture: venture.slug,
        mode: "local-router",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.shell}>
      <aside className={[styles.sidebar, mobileOpen ? styles.sidebarOpen : ""].join(" ")}>
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>PV</div>
          <div>
            <strong>Personal Ventures</strong>
            <span>Founder OS</span>
          </div>
          <button
            className={styles.mobileClose}
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar navegación"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.navLabel}>Portfolio</div>
        <div className={styles.ventureList}>
          {ventures.map((item) => (
            <button
              key={item.slug}
              type="button"
              className={[
                styles.ventureButton,
                ventureSlug === item.slug ? styles.ventureActive : "",
              ].join(" ")}
              onClick={() => {
                setVentureSlug(item.slug);
                setPlan(null);
                setMobileOpen(false);
              }}
            >
              <span
                className={[
                  styles.ventureGlyph,
                  styles[ventureAccent[item.slug]],
                ].join(" ")}
              >
                {item.shortName}
              </span>
              <span className={styles.ventureCopy}>
                <strong>{item.name}</strong>
                <small>{item.category}</small>
              </span>
              <ArrowUpRight size={14} />
            </button>
          ))}
        </div>

        <div className={styles.navLabel}>System</div>
        <nav className={styles.systemNav}>
          <Link className={styles.navActive} href="/command-center">
            <Layers3 size={16} /> Command Center
          </Link>
          <Link href="/agents">
            <Bot size={16} /> Agents
          </Link>
          <Link href="/runs">
            <ListChecks size={16} /> Runs
          </Link>
          <Link href="/experiments">
            <FlaskConical size={16} /> Experiments
          </Link>
          <Link href="/knowledge">
            <NotebookText size={16} /> Knowledge
          </Link>
          <Link href="/approvals">
            <ShieldCheck size={16} /> Approvals
          </Link>
        </nav>

        <div className={styles.scopeCard}>
          <ShieldCheck size={16} />
          <div>
            <strong>Personal scope only</strong>
            <span>Sin datos ni credenciales de Avans Agency.</span>
          </div>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.mobileMenu}
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir navegación"
          >
            <Menu size={20} />
          </button>
          <div>
            <span className={styles.kicker}>FOUNDER COMMAND CENTER</span>
            <h1>{venture.name}</h1>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.systemStatus}>
              <i /> Foundation online
            </span>
            <button type="button" className={styles.iconButton}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <span className={styles.kicker}>{venture.category}</span>
              <h2>{venture.mission}</h2>
              <p>
                El Chief of Staff mantiene el contexto aislado de este venture,
                distribuye trabajo entre especialistas y eleva decisiones
                sensibles a aprobación.
              </p>
              <div className={styles.focusRow}>
                {venture.focus.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className={styles.heroMetric}>
              <span>Venture health</span>
              <strong>Building</strong>
              <small>Base operativa V0.1</small>
            </div>
          </section>

          <section className={styles.delegateCard}>
            <div className={styles.delegateHead}>
              <div>
                <span className={styles.kicker}>DELEGATE</span>
                <h3>¿Qué querés mover hoy?</h3>
              </div>
              <span className={styles.guardrailBadge}>
                <ShieldCheck size={14} /> Guardrails activos
              </span>
            </div>
            <form onSubmit={delegate} className={styles.delegateForm}>
              <Sparkles size={19} />
              <input
                value={task}
                onChange={(event) => setTask(event.target.value)}
                placeholder={"Ej: Definí la próxima prioridad de " + venture.name + " y armá el plan de ejecución"}
                aria-label="Nueva tarea"
              />
              <button type="submit" disabled={!task.trim() || loading}>
                {loading ? <Activity size={16} className={styles.spin} /> : <Send size={16} />}
                {loading ? "Routing" : "Delegar"}
              </button>
            </form>
            <p className={styles.delegateHint}>
              El router actual planifica y clasifica. Todavía no ejecuta acciones externas.
            </p>
          </section>

          <section className={styles.grid}>
            <div className={styles.officePanel}>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.kicker}>AGENTS OFFICE</span>
                  <h3>Equipo del Founder</h3>
                </div>
                <span className={styles.counter}>{agentDefinitions.length} agentes configurados</span>
              </div>

              <div className={styles.orchestrator}>
                <div className={styles.orchestratorIcon}>
                  <BrainCircuit size={23} />
                </div>
                <div>
                  <span>ORCHESTRATOR</span>
                  <strong>Chief of Staff</strong>
                  <small>prioriza · enruta · consolida · escala</small>
                </div>
                <div className={styles.pulseWrap}>
                  <i className={styles.pulse} />
                  ready
                </div>
              </div>

              <div className={styles.agentGrid}>
                {agentDefinitions
                  .filter((agent) => agent.id !== "chief-of-staff")
                  .map((agent) => {
                    const Icon = agentIcon[agent.id as keyof typeof agentIcon] ?? Bot;
                    return (
                      <article key={agent.id} className={styles.agentCard}>
                        <div className={styles.agentTop}>
                          <span className={styles.agentIcon}><Icon size={17} /></span>
                          <span className={styles.autonomy}>{agent.autonomy}%</span>
                        </div>
                        <strong>{agent.name}</strong>
                        <span>{agent.role}</span>
                        <p>{agent.purpose}</p>
                        <div className={styles.capabilities}>
                          {agent.capabilities.slice(0, 2).map((item) => (
                            <small key={item}>{item}</small>
                          ))}
                        </div>
                      </article>
                    );
                  })}
              </div>
            </div>

            <aside className={styles.activityPanel}>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.kicker}>RUNS</span>
                  <h3>Actividad</h3>
                </div>
                <Activity size={17} />
              </div>

              <div className={styles.taskList}>
                {tasks.map((item) => (
                  <div key={item.id} className={styles.taskItem}>
                    <span
                      className={[
                        styles.taskState,
                        item.status === "done"
                          ? styles.done
                          : item.status === "review"
                            ? styles.review
                            : styles.working,
                      ].join(" ")}
                    >
                      {item.status === "done" ? (
                        <CheckCircle2 size={13} />
                      ) : item.status === "review" ? (
                        <ShieldCheck size={13} />
                      ) : (
                        <Zap size={13} />
                      )}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.agent}</span>
                    </div>
                    <small>{item.when}</small>
                  </div>
                ))}
              </div>

              <div className={styles.approvalCard}>
                <div className={styles.approvalIcon}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Approval layer preparada</strong>
                  <span>
                    Publicaciones, pagos, cambios destructivos y producción se
                    frenarán antes de ejecutar.
                  </span>
                </div>
              </div>

              <div className={styles.boundaryCard}>
                <Globe2 size={17} />
                <div>
                  <strong>Context boundary</strong>
                  <span>{venture.name} only</span>
                </div>
                <ChevronDown size={15} />
              </div>
            </aside>
          </section>

          {plan && (
            <section className={styles.plan}>
              <div className={styles.planTop}>
                <div>
                  <span className={styles.kicker}>ROUTING RESULT · LOCAL ROUTER</span>
                  <h3>{plan.department}</h3>
                  <p>{plan.summary}</p>
                </div>
                <span className={[styles.risk, styles["risk" + plan.risk]].join(" ")}>
                  riesgo {plan.risk}
                </span>
              </div>

              <div className={styles.planGrid}>
                <div>
                  <span className={styles.planLabel}>Agentes asignados</span>
                  <div className={styles.agentChips}>
                    {plan.agents.map((agent) => (
                      <span key={agent}><Bot size={13} /> {agent}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className={styles.planLabel}>Plan</span>
                  <ol>
                    {plan.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                </div>
              </div>

              <div className={styles.planFooter}>
                {plan.approvalRequired ? <ShieldCheck size={18} /> : <CheckCircle2 size={18} />}
                <div>
                  <strong>
                    {plan.approvalRequired
                      ? "Requiere aprobación antes de cualquier side effect."
                      : "Puede continuar dentro de guardrails."}
                  </strong>
                  <span>
                    El sistema actual devuelve planificación; la capa de ejecución real se habilita en una etapa posterior.
                  </span>
                </div>
              </div>
            </section>
          )}

          <section className={styles.portfolioStrip}>
            <div>
              <Compass size={17} />
              <span>Portfolio</span>
            </div>
            {ventures.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => {
                  setVentureSlug(item.slug);
                  setPlan(null);
                }}
                className={ventureSlug === item.slug ? styles.portfolioActive : ""}
              >
                <strong>{item.name}</strong>
                <small>{item.status}</small>
              </button>
            ))}
            <button type="button" className={styles.futureVenture}>
              <BriefcaseBusiness size={15} />
              Future venture
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}
