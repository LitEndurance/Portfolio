"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import SectionShell from "@/components/SectionShell";
import FadeIn from "@/components/FadeIn";
import { scrollToId } from "@/components/sites/SitesHero";
import { sites } from "@/content/sites";

export default function SitesAbout() {
  const { about } = sites;

  return (
    <SectionShell
      id={about.id}
      badgeIcon={about.badgeIcon}
      badge={about.badge}
      title={about.title}
    >
      <div className="sites-about-grid">
        <FadeIn delay={0.08}>
          <div className="sites-about-id">
            <span className="sites-monogram" aria-hidden="true">
              <span>WB</span>
            </span>
            <div>
              <p className="sites-about-name">William Barnhart</p>
              <ul className="sites-fact-list">
                {about.facts.map((fact) => (
                  <li key={fact}>
                    <Check size={14} aria-hidden="true" />
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
        <div>
          <FadeIn delay={0.14}>
            <p className="sites-body" style={{ fontSize: "clamp(15.5px, 1.4vw, 17px)" }}>
              {about.body}
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="btn-row flex flex-wrap" style={{ gap: "12px", marginTop: "28px" }}>
              <a
                href={about.cta.href}
                onClick={scrollToId(about.cta.href.slice(1))}
                className="btn btn-primary"
              >
                {about.cta.label}
                <ArrowRight size={17} aria-hidden="true" className="sites-btn-arrow" />
              </a>
              <Link href={about.secondaryCta.href} className="btn btn-ghost">
                {about.secondaryCta.label}
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </SectionShell>
  );
}
