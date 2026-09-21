import Link from "next/link";
import { SystemShell } from "@/app/components/system-shell";
import styles from "@/app/components/system-shell.module.css";
import {
  getPersistenceMode,
  listTaskRuns,
} from "@/lib/operations/repository";
import type { StoredTaskRun } from "@/lib/operations/types";
import { getVenture, ventures } from "@/lib/ventures";

export const dynamic = "force-dynamic";

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ venture?: string }>;
}) {
  const params = await searchParams;
  const selectedSlug = ventures.some((venture) => venture.slug === params.venture)
    ? params.venture!
    : ventures[0].slug;
  const venture = getVenture(selectedSlug);
  const persistence = getPersistenceMode();

  let runs: StoredTaskRun[] = [];
  let error: string | null = null;

  if (persistence === "supabase") {
    try {
      runs = await listTaskRuns(selectedSlug, 50);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "No se pudo cargar el historial.";
    }
  }

  return (
    <SystemShell active="runs" eyebrow="OPERATIONS" title="Runs">
      <section className={styles.hero}>
        <h2>Historial operativo · {venture.name}</h2>
        <p>
          Cada run pertenece a un único venture y conserva objetivo, plan, riesgo,
          aprobación, pasos y auditoría. Esta capa ya está preparada para Supabase,
          pero no simula persistencia cuando la base dedicada está apagada.
        </p>
      </section>

      <div className={styles.toolbar}>
        {ventures.map((item) => (
          <Link
            key={item.slug}
            href={"/runs?venture=" + item.slug}
            className={item.slug === selectedSlug ? styles.selected : undefined}
          >
            {item.name}
          </Link>
        ))}
        <span className={styles.pill}>Persistence: {persistence}</span>
      </div>

      {persistence === "disabled" ? (
        <div className={styles.notice}>
          Persistencia desactivada por ahora. El router local sigue funcionando y el
          historial real empezará a guardarse cuando activemos el Supabase exclusivo de
          Personal Ventures OS.
        </div>
      ) : error ? (
        <div className={styles.notice}>{error}</div>
      ) : runs.length ? (
        <div className={styles.list}>
          {runs.map((run) => (
            <article className={styles.row} key={run.id}>
              <div>
                <strong>{run.title}</strong>
                <p>{run.objective}</p>
                <p>{new Date(run.created_at).toLocaleString("es-AR")} · riesgo {run.risk}</p>
              </div>
              <span className={styles.status}>{run.status}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.notice}>Todavía no hay runs guardados para este venture.</div>
      )}
    </SystemShell>
  );
}
