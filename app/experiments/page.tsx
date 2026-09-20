import { SystemShell } from "@/app/components/system-shell";
import styles from "@/app/components/system-shell.module.css";
import { ventures } from "@/lib/ventures";

export default function ExperimentsPage() {
  return (
    <SystemShell active="experiments" eyebrow="LAB" title="Experiments">
      <section className={styles.hero}>
        <h2>Experimentos por venture</h2>
        <p>
          Este espacio va a registrar hipótesis, métricas, resultados y decisiones antes de
          convertir un experimento en trabajo operativo.
        </p>
      </section>
      <div className={styles.grid} style={{ marginTop: 14 }}>
        {ventures.map((venture) => (
          <article className={styles.card} key={venture.slug}>
            <div className={styles.cardTop}>
              <div>
                <h3>{venture.name}</h3>
                <small>{venture.category}</small>
              </div>
              <span className={styles.pill}>ready</span>
            </div>
            <p>{venture.mission}</p>
            <div className={styles.tags}>
              {venture.focus.map((focus) => <span key={focus}>{focus}</span>)}
            </div>
          </article>
        ))}
      </div>
    </SystemShell>
  );
}
