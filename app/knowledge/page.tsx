import { SystemShell } from "@/app/components/system-shell";
import styles from "@/app/components/system-shell.module.css";
import { ventures } from "@/lib/ventures";

export default function KnowledgePage() {
  return (
    <SystemShell active="knowledge" eyebrow="VENTURE MEMORY" title="Knowledge">
      <section className={styles.hero}>
        <h2>Contexto aislado por proyecto</h2>
        <p>
          La futura base de conocimiento se organiza por venture. Un agente no obtiene por
          defecto documentos, decisiones o credenciales de otro proyecto y Avans Agency queda
          completamente fuera de este perímetro.
        </p>
      </section>
      <div className={styles.grid} style={{ marginTop: 14 }}>
        {ventures.map((venture) => (
          <article className={styles.card} key={venture.slug}>
            <div className={styles.cardTop}>
              <div>
                <h3>{venture.name}</h3>
                <small>Knowledge namespace</small>
              </div>
              <span className={styles.pill}>isolated</span>
            </div>
            <p>
              Espacio preparado para decisiones, briefs, documentos, research y artefactos
              exclusivos de {venture.name}.
            </p>
          </article>
        ))}
      </div>
    </SystemShell>
  );
}
