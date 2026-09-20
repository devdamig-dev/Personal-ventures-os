import Link from "next/link";
import { SystemShell } from "@/app/components/system-shell";
import styles from "@/app/components/system-shell.module.css";
import {
  getPersistenceMode,
  listApprovals,
} from "@/lib/operations/repository";
import type { StoredApproval } from "@/lib/operations/types";
import { getVenture, ventures } from "@/lib/ventures";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage({
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

  let approvals: StoredApproval[] = [];
  let error: string | null = null;

  if (persistence === "supabase") {
    try {
      approvals = await listApprovals(selectedSlug, "pending", 50);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "No se pudieron cargar aprobaciones.";
    }
  }

  return (
    <SystemShell active="approvals" eyebrow="HUMAN CONTROL" title="Approvals">
      <section className={styles.hero}>
        <h2>Approval queue · {venture.name}</h2>
        <p>
          Publicaciones, envíos, pagos, cambios de producción, acciones destructivas y
          movimientos sensibles permanecen bloqueados hasta una decisión humana explícita.
        </p>
      </section>

      <div className={styles.toolbar}>
        {ventures.map((item) => (
          <Link
            key={item.slug}
            href={"/approvals?venture=" + item.slug}
            className={item.slug === selectedSlug ? styles.selected : undefined}
          >
            {item.name}
          </Link>
        ))}
        <span className={styles.pill}>Persistence: {persistence}</span>
      </div>

      {persistence === "disabled" ? (
        <div className={styles.notice}>
          La cola persistente está preparada pero permanece desactivada mientras el proyecto
          Supabase de Personal Ventures OS no esté activo. Ninguna acción externa se ejecuta
          por este motivo.
        </div>
      ) : error ? (
        <div className={styles.notice}>{error}</div>
      ) : approvals.length ? (
        <div className={styles.list}>
          {approvals.map((approval) => (
            <article className={styles.row} key={approval.id}>
              <div>
                <strong>{approval.action_type}</strong>
                <p>{approval.reason || "Requiere revisión humana."}</p>
                <p>{new Date(approval.created_at).toLocaleString("es-AR")}</p>
              </div>
              <span className={styles.status}>{approval.status}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.notice}>No hay aprobaciones pendientes para este venture.</div>
      )}
    </SystemShell>
  );
}
