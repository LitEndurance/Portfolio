import {
  Check,
  Clock,
  CreditCard,
  FileText,
  KeyRound,
  LifeBuoy,
  RefreshCw,
  ClipboardList,
  Tag,
  type LucideIcon,
} from "lucide-react";
import SectionShell from "@/components/SectionShell";
import FadeIn from "@/components/FadeIn";
import { sites } from "@/content/sites";

const ICONS: Record<string, LucideIcon> = {
  payment: CreditCard,
  revisions: RefreshCw,
  changes: ClipboardList,
  ownership: KeyRound,
};

function CardHeading({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center" style={{ gap: "14px", marginBottom: "16px" }}>
      <span className="sites-icon" aria-hidden="true">
        <Icon size={19} strokeWidth={1.75} />
      </span>
      <h3 className="card-title" style={{ fontSize: "18px" }}>
        {title}
      </h3>
    </div>
  );
}

/** "How I work": prices and contract terms in plain English. */
export default function SitesTerms() {
  const { terms } = sites;
  return (
    <SectionShell
      id={terms.id}
      badgeIcon={terms.badgeIcon}
      badge={terms.badge}
      title={terms.title}
    >
      <FadeIn delay={0.08}>
        <p className="sites-lede" style={{ marginBottom: "28px" }}>
          {terms.intro}
        </p>
      </FadeIn>

      {/* Pricing: four price tiles */}
      <FadeIn delay={0.12}>
        <div className="sites-card">
          <CardHeading icon={Tag} title={terms.pricing.title} />
          <ul className="sites-price-grid">
            {terms.pricing.items.map((item) => (
              <li key={item.name} className="sites-price">
                <span className="sites-price-name">{item.name}</span>
                <span className="sites-price-detail">{item.detail}</span>
                <span className="sites-price-value">{item.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>

      {/* Payment, revisions, changes, ownership */}
      <div className="sites-grid sites-grid-2" style={{ marginTop: "16px" }}>
        {terms.cards.map((card, i) => (
          <FadeIn key={card.title} delay={0.06 * i} className="h-full">
            <div className="sites-card">
              <CardHeading icon={ICONS[card.icon] ?? FileText} title={card.title} />
              <ul className="sites-points">
                {card.points.map((point) => (
                  <li key={point}>
                    <Check size={14} aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Care plans */}
      <FadeIn delay={0.1}>
        <div className="sites-card" style={{ marginTop: "16px" }}>
          <CardHeading icon={LifeBuoy} title={terms.carePlans.title} />
          <p className="card-body" style={{ fontSize: "14.5px", marginTop: "-4px", marginBottom: "18px" }}>
            {terms.carePlans.intro}
          </p>
          <div className="sites-grid sites-grid-2">
            {terms.carePlans.plans.map((plan, i) => (
              <div key={plan.name} className={`sites-plan${i === 1 ? " sites-plan-accent" : ""}`}>
                <p className="eyebrow">{plan.name}</p>
                <p className="sites-plan-price">
                  {plan.price}
                  <span>{plan.period}</span>
                </p>
                <ul className="sites-points" style={{ marginTop: "14px" }}>
                  {plan.features.map((f) => (
                    <li key={f}>
                      <Check size={14} aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Timeline + written agreement */}
      <FadeIn delay={0.12}>
        <div className="sites-terms-foot">
          <p className="sites-terms-line">
            <Clock size={16} aria-hidden="true" />
            <span>
              <strong>{terms.timeline.title}.</strong> {terms.timeline.text}
            </span>
          </p>
          <p className="sites-terms-line">
            <FileText size={16} aria-hidden="true" />
            <span>
              <strong>{terms.agreement}</strong>
            </span>
          </p>
          <p className="sites-terms-business">{terms.business}</p>
        </div>
      </FadeIn>
    </SectionShell>
  );
}
