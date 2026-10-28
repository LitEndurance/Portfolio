"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarCheck, ChevronDown } from "lucide-react";
import SectionShell from "@/components/SectionShell";
import FadeIn from "@/components/FadeIn";
import OptimizedImage from "@/components/OptimizedImage";
import { sites } from "@/content/sites";

interface Reading {
  value: number;
  display: string;
}

/** Before/after bars, grown in once the card scrolls into view. */
function CompareBars({ before, after }: { before: Reading; after: Reading }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"pending" | "shown">("pending");
  const max = Math.max(before.value, after.value);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setState("shown");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const row = (label: string, r: Reading, isAfter: boolean) => (
    <div className="sites-bar-row">
      <span>{label}</span>
      <span className="sites-bar-track">
        <span
          className={`sites-bar-fill block${isAfter ? " sites-bar-fill-after" : ""}`}
          style={{ width: `${(r.value / max) * 100}%` }}
        />
      </span>
      <b>{r.display}</b>
    </div>
  );

  return (
    <div ref={ref} className="sites-bars" data-bars={state}>
      {row("Before", before, false)}
      {row("After", after, true)}
    </div>
  );
}

export default function SitesCaseStudy() {
  const { caseStudy: cs } = sites;
  return (
    <SectionShell
      id={cs.id}
      badgeIcon={cs.badgeIcon}
      badge={cs.badge}
      title={cs.title}
    >
      {/* Client line */}
      <FadeIn delay={0.1}>
        <div
          className="flex flex-wrap items-center justify-between"
          style={{
            gap: "14px 20px",
            paddingBottom: "22px",
            marginBottom: "24px",
            borderBottom: "1px solid rgba(78, 205, 196, 0.12)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p className="eyebrow" style={{ marginBottom: "6px" }}>
              {cs.eyebrow}
            </p>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "clamp(21px, 2.2vw, 26px)",
                letterSpacing: "-0.015em",
                color: "#e8ecf1",
                lineHeight: 1.2,
              }}
            >
              {cs.business}
            </h3>
          </div>
          <div className="flex flex-wrap items-center" style={{ gap: "8px" }}>
            <span className="sites-chip sites-chip-gold">
              <CalendarCheck size={13} aria-hidden="true" />
              {cs.launched}
            </span>
            <a
              href={cs.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sites-chip focus-ring"
              style={{ textDecoration: "none", color: "#4ecdc4" }}
            >
              {cs.urlLabel}
              <ArrowUpRight size={13} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
      </FadeIn>

      {/* Problem → what I did */}
      <FadeIn delay={0.16}>
        <div className="sites-split">
          <div className="sites-split-panel">
            <p className="eyebrow" style={{ marginBottom: "8px", color: "rgba(208, 213, 221, 0.6)" }}>
              The problem
            </p>
            <p className="sites-body">{cs.problem}</p>
          </div>
          <div className="sites-split-panel sites-split-panel-after">
            <p className="eyebrow" style={{ marginBottom: "8px" }}>
              What I did
            </p>
            <p className="sites-body">{cs.solution}</p>
          </div>
        </div>
      </FadeIn>

      {/* Results */}
      <FadeIn delay={0.2}>
        <p className="sites-subheading">{cs.resultsLabel}</p>
      </FadeIn>
      <div className="sites-grid sites-grid-2">
        {cs.outcomes.map((o, i) => (
          <FadeIn key={o.label} delay={0.06 * i} className="h-full">
            <div className="sites-card">
              <p className="sites-stat-value">{o.value}</p>
              <p className="card-title" style={{ fontSize: "15.5px", marginTop: "10px" }}>
                {o.label}
              </p>
              <CompareBars before={o.before} after={o.after} />
              <p className="card-body" style={{ fontSize: "13px", marginTop: "14px" }}>
                {o.detail}
              </p>
            </div>
          </FadeIn>
        ))}
        <FadeIn delay={0.18} className="h-full">
          <div className="sites-card">
            <p className="sites-stat-value">{cs.scores.value}</p>
            <p className="card-title" style={{ fontSize: "15.5px", marginTop: "10px" }}>
              {cs.scores.label}
            </p>
            <div className="sites-scores">
              {cs.scores.items.map((s) => (
                <div key={s.label} className="sites-score">
                  <span
                    className="sites-score-ring"
                    style={{ "--p": s.value } as React.CSSProperties}
                    aria-hidden="true"
                  >
                    <span>{s.value}</span>
                  </span>
                  <span>
                    <span className="sr-only">{s.value} </span>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="card-body" style={{ fontSize: "13px", marginTop: "14px" }}>
              {cs.scores.detail}
            </p>
          </div>
        </FadeIn>
      </div>

      {/* Screenshots in browser frames */}
      <FadeIn delay={0.1}>
        <div className="sites-grid sites-grid-2" style={{ marginTop: "28px" }}>
          {cs.screenshots.map((shot) => (
            <figure key={shot.src} style={{ margin: 0 }}>
              <div className="sites-browser">
                <div className="sites-browser-bar" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <span className="sites-browser-url">{cs.urlLabel}</span>
                </div>
                <OptimizedImage
                  src={shot.src}
                  alt={shot.alt}
                  className="w-full h-auto"
                  style={{ display: "block" }}
                  sizes="(max-width: 640px) 92vw, 440px"
                />
              </div>
              <figcaption
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.04em",
                  color: "rgba(78, 205, 196, 0.7)",
                  marginTop: "10px",
                }}
              >
                {shot.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.14}>
        <details className="sites-details">
          <summary className="focus-ring">
            {cs.underTheHood.label}
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <p className="card-body" style={{ fontSize: "13.5px", padding: "0 18px 18px", maxWidth: "70ch" }}>
            {cs.underTheHood.body}
          </p>
        </details>
        <p className="sites-footnote">
          <strong>{cs.footnoteLabel}</strong>
          {cs.footnote}
        </p>
      </FadeIn>

      {/* Also built */}
      <FadeIn delay={0.1}>
        <p className="sites-subheading">{cs.alsoBuiltLabel}</p>
      </FadeIn>
      <div className="sites-grid sites-grid-2">
        {cs.alsoBuilt.map((item, i) => (
          <FadeIn key={item.name} delay={0.08 * i} className="h-full">
            <div className="sites-card">
              {item.screenshot && (
                <div className="sites-browser" style={{ marginBottom: "18px", boxShadow: "none" }}>
                  {"urlLabel" in item && item.urlLabel && (
                    <div className="sites-browser-bar" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <span className="sites-browser-url">{item.urlLabel}</span>
                    </div>
                  )}
                  <OptimizedImage
                    src={item.screenshot.src}
                    alt={item.screenshot.alt}
                    className="w-full h-auto"
                    style={{ display: "block" }}
                    sizes="(max-width: 640px) 92vw, 400px"
                  />
                </div>
              )}
              {!item.screenshot && "flow" in item && (
                <div className="sites-flow" style={{ marginBottom: "18px" }}>
                  <ol aria-label="Data flow">
                    {item.flow.map((step, k) => (
                      <li key={step}>
                        <span>{step}</span>
                        {k < item.flow.length - 1 && (
                          <ArrowRight size={15} aria-hidden="true" className="sites-flow-arrow" />
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="flex flex-wrap items-center" style={{ gap: "8px", marginBottom: "8px" }}>
                <p className="eyebrow" style={{ marginBottom: 0 }}>
                  {item.tag}
                </p>
                {"period" in item && item.period && (
                  <span className="sites-chip sites-chip-gold" style={{ fontSize: "11px" }}>
                    <CalendarCheck size={13} aria-hidden="true" />
                    {item.period}
                  </span>
                )}
                {"url" in item && item.url && "urlLabel" in item && item.urlLabel && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sites-chip focus-ring"
                    style={{ textDecoration: "none", color: "#4ecdc4", fontSize: "11px" }}
                  >
                    {item.urlLabel}
                    <ArrowUpRight size={13} aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </div>
              <h4 className="card-title" style={{ fontSize: "17px", marginBottom: "8px" }}>
                {item.name}
              </h4>
              <p className="card-body" style={{ fontSize: "13.5px" }}>
                {item.description}
              </p>
              {"scores" in item && item.scores && (
                <div style={{ marginTop: "18px" }}>
                  <p className="sites-stat-value" style={{ fontSize: "clamp(22px, 2.5vw, 28px)" }}>
                    {item.scores.value}
                  </p>
                  <p className="card-title" style={{ fontSize: "14px", marginTop: "8px" }}>
                    {item.scores.label}
                  </p>
                  <div className="sites-scores" style={{ marginTop: "12px" }}>
                    {item.scores.items.map((s) => (
                      <div key={s.label} className="sites-score">
                        <span
                          className="sites-score-ring"
                          style={{ "--p": s.value } as React.CSSProperties}
                          aria-hidden="true"
                        >
                          <span>{s.value}</span>
                        </span>
                        <span>
                          <span className="sr-only">{s.value} </span>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="card-body" style={{ fontSize: "12.5px", marginTop: "12px" }}>
                    {item.scores.detail}
                  </p>
                </div>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </SectionShell>
  );
}
