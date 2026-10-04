import { Rocket, Store, type LucideIcon } from "lucide-react";
import SectionShell from "@/components/SectionShell";
import FadeIn from "@/components/FadeIn";
import { sites } from "@/content/sites";

const ICONS: Record<string, LucideIcon> = { local: Store, growing: Rocket };

export default function SitesWho() {
  const { whoItsFor } = sites;
  return (
    <SectionShell
      id={whoItsFor.id}
      badgeIcon={whoItsFor.badgeIcon}
      badge={whoItsFor.badge}
      title={whoItsFor.title}
    >
      <div className="sites-grid sites-grid-2">
        {whoItsFor.columns.map((col, i) => {
          const Icon = ICONS[col.icon] ?? Store;
          return (
            <FadeIn key={col.heading} delay={0.1 * i} className="h-full">
              <div className="sites-card">
                <span className="sites-icon" aria-hidden="true" style={{ marginBottom: "18px" }}>
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <h3 className="card-title" style={{ fontSize: "18px", marginBottom: "10px" }}>
                  {col.heading}
                </h3>
                <p className="card-body" style={{ fontSize: "14.5px" }}>
                  {col.body}
                </p>
              </div>
            </FadeIn>
          );
        })}
      </div>
      <FadeIn delay={0.25}>
        <div className="sites-closing">
          <p
            style={{
              fontFamily: "var(--font-accent)",
              fontStyle: "italic",
              fontSize: "clamp(19px, 2vw, 24px)",
              lineHeight: 1.35,
              color: "#e8ecf1",
              textAlign: "center",
              textWrap: "balance",
              maxWidth: "34ch",
            }}
          >
            {whoItsFor.closing}
          </p>
        </div>
      </FadeIn>
    </SectionShell>
  );
}
