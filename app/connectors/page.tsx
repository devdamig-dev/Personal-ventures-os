import { SystemShell } from "@/app/components/system-shell";
import styles from "@/app/components/system-shell.module.css";
import { connectorManifests } from "@/lib/connectors/registry";

export const dynamic = "force-dynamic";

export default function ConnectorsPage() {
  const connectors = connectorManifests();

  return (
    <SystemShell active="connectors" eyebrow="READ-ONLY TOOLS" title="Connectors">
      <section className={styles.hero}>
        <h2>Herramientas externas bajo control</h2>
        <p>
          V0.4 habilita únicamente observaciones de lectura. Los agentes pueden pedir
          evidencia de GitHub, Vercel o Nexodg WP Central, pero no tienen acciones de
          escritura, publicación, deploy, borrado ni cambios de producción.
        </p>
      </section>

      <div className={styles.grid} style={{ marginTop: 14 }}>
        {connectors.map((connector) => (
          <article className={styles.card} key={connector.id}>
            <div className={styles.cardTop}>
              <div>
                <h3>{connector.name}</h3>
                <small>{connector.mode} · {connector.actions.length} actions</small>
              </div>
              <span className={styles.pill}>
                {connector.configured ? "configured" : "not configured"}
              </span>
            </div>

            <p>{connector.description}</p>

            <div className={styles.tags}>
              {connector.actions.map((action) => (
                <span key={action.id}>{action.id}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className={styles.notice}>
        Los conectores se configuran con variables de entorno server-side. Ningún token,
        header o secreto se envía al navegador ni se incorpora al contexto de los agentes.
      </div>
    </SystemShell>
  );
}
