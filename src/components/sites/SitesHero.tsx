"use client";

import Link from "next/link";
import { ArrowRight, Check, MapPin, TrendingUp } from "lucide-react";
import BackToTrails from "@/components/BackToTrails";
import SectionShell from "@/components/SectionShell";
import FadeIn from "@/components/FadeIn";
import { sites } from "@/content/sites";

// 20px padding above and below the 32px "All trails" pill.
const TOP_BAR_HEIGHT = 72;

export const scrollToId = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

export default function SitesHero() {
  const { hero, crossLink, header } = sites;

  return (
    <>
      {/* Top bar, fixed so "All trails" stays reachable at any scroll depth
          (position: sticky can't work here: html and body both set
          overflow-x: hidden, which makes body the sticky container). The
          spacer keeps the bar's height in the page flow, so section
          positions and the mountain's stop timings stay put. The fade
          matches the fixed header on /infrastructure. */}
      <div aria-hidden="true" style={{ height: `${TOP_BAR_HEIGHT}px` }} />
      <div
        className="fixed top-0 left-0 right-0 z-[5]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(6, 10, 20, 0.92) 0%, rgba(6, 10, 20, 0.7) 55%, rgba(6, 10, 20, 0) 100%)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: "20px 5vw",
            maxWidth: "1400px",
            margin: "0 auto",
            gap: "14px",
            minHeight: `${TOP_BAR_HEIGHT}px`,
          }}
        >
          <div className="flex items-center" style={{ gap: "14px", minWidth: 0 }}>
            <BackToTrails />
            <span
              className="hidden sm:inline truncate"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#4ecdc4",
              }}
            >
              WILLIAM BARNHART
            </span>
          </div>
          <div className="flex items-center" style={{ gap: "18px" }}>
            <Link
              href={crossLink.href}
              className="focus-ring inline-flex items-center min-h-[32px] transition-opacity duration-300 hover:opacity-70 text-right whitespace-nowrap"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(78, 205, 196, 0.75)",
                textDecoration: "none",
              }}
            >
              <span className="hidden md:inline">{crossLink.label}</span>
              <span className="md:hidden">{crossLink.shortLabel}</span>{" "}
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <a
              href={header.cta.href}
              onClick={scrollToId(header.cta.href.slice(1))}
              className="sites-topbar-cta hidden sm:inline-flex"
            >
              {header.cta.label}
            </a>
          </div>
        </div>
      </div>

      <SectionShell
        id="hero"
        badgeIcon={hero.badgeIcon}
        badge={hero.badge}
        title={hero.headline}
        titleAccent={hero.headlineAccent}
        headingLevel="h1"
      >
        <div className="sites-hero-grid">
          <div>
            <FadeIn delay={0.12}>
              <p className="sites-lede" style={{ marginBottom: "32px" }}>
                {hero.sub}
              </p>
            </FadeIn>
            <FadeIn delay={0.22}>
              <div className="btn-row flex flex-wrap" style={{ gap: "12px" }}>
                <a
                  href={hero.primaryCta.href}
                  onClick={scrollToId(hero.primaryCta.href.slice(1))}
                  className="btn btn-primary"
                >
                  {hero.primaryCta.label}
                  <ArrowRight size={17} aria-hidden="true" className="sites-btn-arrow" />
                </a>
                <a
                  href={hero.secondaryCta.href}
                  onClick={scrollToId(hero.secondaryCta.href.slice(1))}
                  className="btn btn-ghost"
                >
                  {hero.secondaryCta.label}
                </a>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <ul className="sites-proof">
                {hero.proof.map((point, i) => (
                  <li key={point} className="sites-chip">
                    {i === 0 ? (
                      <MapPin size={13} aria-hidden="true" />
                    ) : (
                      <Check size={13} aria-hidden="true" />
                    )}
                    {point}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>

          <FadeIn delay={0.34}>
            <a
              href={hero.secondaryCta.href}
              onClick={scrollToId(hero.secondaryCta.href.slice(1))}
              className="sites-highlight focus-ring"
              aria-label={`${hero.highlight.value} ${hero.highlight.label}: ${hero.highlight.detail}. ${hero.secondaryCta.label}`}
            >
              <span className="flex items-center justify-between" style={{ marginBottom: "18px" }}>
                <span className="eyebrow">{hero.highlight.client}</span>
                <TrendingUp size={18} aria-hidden="true" style={{ color: "#4ecdc4" }} />
              </span>
              <span className="sites-stat-value block" style={{ fontSize: "clamp(44px, 5vw, 56px)" }}>
                {hero.highlight.value}
              </span>
              <span className="card-title block" style={{ marginTop: "10px" }}>
                {hero.highlight.label}
              </span>
              <span className="card-body block" style={{ fontSize: "13.5px", marginTop: "4px" }}>
                {hero.highlight.detail}
              </span>
              <span
                className="inline-flex items-center"
                style={{
                  gap: "6px",
                  marginTop: "18px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#4ecdc4",
                }}
              >
                {hero.secondaryCta.label}
                <ArrowRight size={13} aria-hidden="true" />
              </span>
            </a>
          </FadeIn>
        </div>
      </SectionShell>
    </>
  );
}
