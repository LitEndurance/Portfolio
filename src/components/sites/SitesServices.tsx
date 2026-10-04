"use client";

import { ArrowRight, Gauge, MonitorSmartphone, Plug, ShieldCheck, type LucideIcon } from "lucide-react";
import SectionShell from "@/components/SectionShell";
import FadeIn from "@/components/FadeIn";
import { scrollToId } from "@/components/sites/SitesHero";
import { sites } from "@/content/sites";

interface ServiceItem {
  name: string;
  icon: string;
  price: string;
  turnaround?: string;
  description: string;
}

const ICONS: Record<string, LucideIcon> = {
  audit: Gauge,
  site: MonitorSmartphone,
  integrations: Plug,
  hosting: ShieldCheck,
};

export default function SitesServices() {
  const { services } = sites;
  const items: readonly ServiceItem[] = services.items;

  return (
    <SectionShell
      id={services.id}
      badgeIcon={services.badgeIcon}
      badge={services.badge}
      title={services.title}
    >
      <div className="sites-grid sites-grid-2">
        {items.map((item, i) => {
          const Icon = ICONS[item.icon] ?? Gauge;
          return (
            <FadeIn key={item.name} delay={0.08 * i} className="h-full">
              <article className="sites-card sites-card-interactive">
                <span className="sites-card-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="sites-icon" aria-hidden="true" style={{ marginBottom: "18px" }}>
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <h3 className="card-title" style={{ fontSize: "18px" }}>
                  {item.name}
                </h3>
                <p style={{ margin: "10px 0 14px" }}>
                  <span className="sites-chip sites-chip-gold" style={{ minHeight: "26px", fontSize: "11px" }}>
                    {item.price}
                    {item.turnaround ? ` · ${item.turnaround}` : null}
                  </span>
                </p>
                <p className="card-body" style={{ fontSize: "14.5px" }}>
                  {item.description}
                </p>
              </article>
            </FadeIn>
          );
        })}
      </div>

      <FadeIn delay={0.2}>
        <div className="sites-cta-band">
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 600,
              lineHeight: 1.45,
              color: "#e8ecf1",
              maxWidth: "40ch",
            }}
          >
            {services.cta.text}
          </p>
          <div className="btn-row flex flex-wrap shrink-0" style={{ gap: "10px" }}>
            <a
              href={services.cta.termsHref}
              onClick={scrollToId(services.cta.termsHref.slice(1))}
              className="btn btn-ghost"
            >
              {services.cta.termsLabel}
            </a>
            <a
              href={services.cta.href}
              onClick={scrollToId(services.cta.href.slice(1))}
              className="btn btn-primary"
            >
              {services.cta.label}
              <ArrowRight size={17} aria-hidden="true" className="sites-btn-arrow" />
            </a>
          </div>
        </div>
      </FadeIn>
    </SectionShell>
  );
}
