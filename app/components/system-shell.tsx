import Link from "next/link";
import {
  Bot,
  FlaskConical,
  Layers3,
  ListChecks,
  Link2,
  NotebookText,
  ShieldCheck,
} from "lucide-react";
import { ventures } from "@/lib/ventures";
import styles from "./system-shell.module.css";

const navItems = [
  { href: "/command-center", label: "Command Center", icon: Layers3, key: "command-center" },
  { href: "/agents", label: "Agents", icon: Bot, key: "agents" },
  { href: "/runs", label: "Runs", icon: ListChecks, key: "runs" },
  { href: "/experiments", label: "Experiments", icon: FlaskConical, key: "experiments" },
  { href: "/knowledge", label: "Knowledge", icon: NotebookText, key: "knowledge" },
  { href: "/connectors", label: "Connectors", icon: Link2, key: "connectors" },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck, key: "approvals" },
] as const;

export function SystemShell({
  active,
  eyebrow,
  title,
  children,
}: {
  active: (typeof navItems)[number]["key"];
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/command-center" className={styles.brand}>
          <span>PV</span>
          <div>
            <strong>Personal Ventures</strong>
            <small>Founder OS</small>
          </div>
        </Link>

        <div className={styles.label}>Portfolio</div>
        <div className={styles.portfolio}>
          {ventures.map((venture) => (
            <div key={venture.slug}>
              <strong>{venture.shortName}</strong>
              <span>{venture.name}</span>
            </div>
          ))}
        </div>

        <div className={styles.label}>System</div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={active === item.key ? styles.active : undefined}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.boundary}>
          <ShieldCheck size={16} />
          <div>
            <strong>Personal scope only</strong>
            <span>Avans Agency queda fuera de este sistema.</span>
          </div>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span>{eyebrow}</span>
            <h1>{title}</h1>
          </div>
          <Link href="/command-center">Volver al Command Center</Link>
        </header>
        <div className={styles.content}>{children}</div>
      </section>
    </main>
  );
}
