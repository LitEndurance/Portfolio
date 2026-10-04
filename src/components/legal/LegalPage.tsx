import Link from "next/link";
import type { ReactNode } from "react";
import BackToTrails from "@/components/BackToTrails";
import "./legal.css";

export const LEGAL = {
  operator: "William Barnhart",
  location: "Spokane Valley, Washington",
  email: "willbarnh@gmail.com",
  site: "litendurance.dev",
} as const;

type LegalPath = "/privacy" | "/terms";

const NAV: { href: LegalPath; label: string }[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/**
 * Shared shell for the static legal pages (/privacy, /terms): a light
 * header with the "All trails" link, one readable card, and a footer. No
 * mountain, boot screen, or client-side JavaScript of its own.
 */
export default function LegalPage({
  path,
  title,
  effective,
  lede,
  toc,
  children,
}: {
  path: LegalPath;
  title: string;
  effective: string;
  lede: ReactNode;
  /** Optional "On this page" list: [anchor id, label]. */
  toc?: [string, string][];
  children: ReactNode;
}) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-inner">
          <div className="legal-brand">
            <BackToTrails />
            <Link href="/" className="legal-name focus-ring">
              William Barnhart
            </Link>
          </div>
          <nav aria-label="Legal" className="legal-nav">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring"
                aria-current={item.href === path ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="legal-main">
        <article className="legal-card">
          <p className="level-badge" style={{ fontSize: "11px", letterSpacing: "0.13em" }}>
            <span aria-hidden="true">📜</span>
            <span>Legal</span>
          </p>
          <h1 className="legal-title">{title}</h1>
          <p className="legal-meta">Effective {effective}</p>
          <div className="legal-lede">{lede}</div>
          {toc && (
            <nav aria-label="On this page" className="legal-toc">
              <p className="legal-toc-title">On this page</p>
              <ol>
                {toc.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="focus-ring">
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {children}
        </article>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <p className="legal-footer-copy">
            &copy; {new Date().getFullYear()} {LEGAL.operator} · {LEGAL.location}
          </p>
          <nav aria-label="Footer" className="legal-nav">
            <Link href="/" className="focus-ring">
              All trails
            </Link>
            <Link href="/websites" className="focus-ring">
              Websites
            </Link>
            <Link href="/infrastructure" className="focus-ring">
              Infrastructure
            </Link>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring"
                aria-current={item.href === path ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** A numbered section with an anchor id (matches the toc entries). */
export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="legal-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}

/** External link (opens in a new tab). */
export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="legal-link" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function Mail() {
  return (
    <a href={`mailto:${LEGAL.email}`} className="legal-link">
      {LEGAL.email}
    </a>
  );
}
