import { agentDefinitions } from "@/lib/agents";
import { SystemShell } from "@/app/components/system-shell";
import styles from "@/app/components/system-shell.module.css";

export default function AgentsPage() {
  return (
    <SystemShell active="agents" eyebrow="AGENT REGISTRY" title="Agents">
      <section className={styles.hero}>
        <h2>Equipo especialista del Founder</h2>
        <p>
          Los agentes están definidos como capacidades operativas versionables. El Chief of
          Staff es el único orquestador por defecto y cada ejecución debe mantener el límite
          de contexto del venture seleccionado.
        </p>
      </section>

      <div className={styles.grid} style={{ marginTop: 14 }}>
        {agentDefinitions.map((agent) => (
          <article className={styles.card} key={agent.id}>
            <div className={styles.cardTop}>
              <div>
                <h3>{agent.name}</h3>
                <small>{agent.role} · {agent.department}</small>
              </div>
              <span className={styles.pill}>{agent.autonomy}% autonomy</span>
            </div>
            <p>{agent.purpose}</p>
            <div className={styles.tags}>
              {agent.capabilities.map((capability) => (
                <span key={capability}>{capability}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </SystemShell>
  );
}
