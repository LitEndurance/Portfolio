import SectionShell from "@/components/SectionShell";
import FadeIn from "@/components/FadeIn";
import { sites } from "@/content/sites";

export default function SitesHow() {
  const { howItWorks } = sites;
  return (
    <SectionShell
      id={howItWorks.id}
      badgeIcon={howItWorks.badgeIcon}
      badge={howItWorks.badge}
      title={howItWorks.title}
    >
      {/* A connected timeline: numbered nodes joined by a line, title and
          body side by side from tablet width up, stacked on phones. */}
      <ol className="sites-steps">
        {howItWorks.steps.map((step, i) => (
          <li key={step.title} className="sites-step">
            <FadeIn delay={0.06 * i}>
              <span className="sites-step-node" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
            </FadeIn>
            <FadeIn delay={0.06 * i + 0.04}>
              <div className="sites-step-body">
                <h3 className="card-title" style={{ fontSize: "17px", marginBottom: "6px" }}>
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="card-body" style={{ fontSize: "14.5px", maxWidth: "52ch" }}>
                  {step.body}
                </p>
              </div>
            </FadeIn>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
