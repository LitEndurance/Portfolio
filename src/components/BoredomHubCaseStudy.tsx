"use client";

import FadeIn from "./FadeIn";

const LIGHTHOUSE_DESKTOP = [
  { label: "Performance", score: 72 },
  { label: "Accessibility", score: 96 },
  { label: "Best practices", score: 96 },
  { label: "SEO", score: 100 },
];

const HIGHLIGHTS = [
  {
    value: "400+",
    label: "commits since launch",
    detail: "Actively maintained, Aug 2026 – present",
  },
  {
    value: "Live",
    label: "server status & tickets",
    detail: "Restart countdown, Discord-synced support queue",
  },
  {
    value: "Staff",
    label: "Calagopus panel control",
    detail: "Console, backups, moderation, filtered audit log",
  },
  {
    value: "Rust",
    label: "API + Discord bot",
    detail: "Axum, SeaORM, PostgreSQL, Docker",
  },
];

const mono = { fontFamily: "var(--font-mono)" } as const;

function LighthouseBars() {
  return (
    <div>
      <p
        style={{
          ...mono,
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(232, 236, 241, 0.55)",
          marginBottom: "10px",
        }}
      >
        Lighthouse, desktop (Oct 28, 2026)
      </p>
      <div className="space-y-3">
        {LIGHTHOUSE_DESKTOP.map(({ label, score }) => (
          <div key={label} className="flex items-center gap-3">
            <span
              className="shrink-0"
              style={{ ...mono, fontSize: "11px", color: "rgba(232, 236, 241, 0.65)", width: "104px" }}
            >
              {label}
            </span>
            <div
              className="flex-1 h-1.5"
              style={{ background: "rgba(78, 205, 196, 0.1)", borderRadius: "2px" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${score}%`,
                  borderRadius: "2px",
                  background:
                    score === 100
                      ? "#4ecdc4"
                      : "linear-gradient(90deg, #d4a843, #4ecdc4)",
                }}
              />
            </div>
            <span
              style={{ ...mono, fontSize: "11px", color: "#4ecdc4", width: "28px", textAlign: "right" }}
            >
              {score}
            </span>
          </div>
        ))}
      </div>
      <p style={{ ...mono, fontSize: "10px", lineHeight: 1.5, color: "rgba(78, 205, 196, 0.55)", marginTop: "10px" }}>
        Mobile: 67 performance · 96 accessibility · 96 best practices · 100 SEO
      </p>
    </div>
  );
}

export default function BoredomHubCaseStudy() {
  return (
    <FadeIn delay={0.12}>
      <div
        style={{
          border: "1px solid rgba(78, 205, 196, 0.16)",
          background: "rgba(78, 205, 196, 0.03)",
          borderRadius: "8px",
          padding: "clamp(16px, 3vw, 32px)",
          marginBottom: "24px",
        }}
      >
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span
            className="inline-flex items-center px-2 py-0.5"
            style={{
              ...mono,
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(212, 168, 67, 0.85)",
              border: "1px solid rgba(212, 168, 67, 0.3)",
              borderRadius: "2px",
            }}
          >
            Featured deployment
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5"
            style={{
              ...mono,
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#4ecdc4",
              border: "1px solid rgba(78, 205, 196, 0.3)",
              borderRadius: "2px",
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#4ecdc4" }} />
            Live
          </span>
          <a
            href="https://boredomhub.net"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring"
            style={{ ...mono, fontSize: "11px", color: "rgba(78, 205, 196, 0.7)" }}
          >
            boredomhub.net ↗
          </a>
        </div>

        <h3
          style={{
            ...mono,
            fontSize: "clamp(18px, 2vw, 26px)",
            fontWeight: 300,
            letterSpacing: "0.02em",
            color: "#e8ecf1",
            marginBottom: "10px",
          }}
        >
          BOREDOMHUB.NET — GAME SERVER COMMUNITY PLATFORM
        </h3>
        <p
          style={{
            ...mono,
            fontSize: "clamp(12px, 0.95vw, 14px)",
            lineHeight: 1.65,
            color: "rgba(78, 205, 196, 0.7)",
            marginBottom: "20px",
          }}
        >
          Full-stack community site for a game-server network: React + Vite + TypeScript
          front ends, Rust API on Axum with SeaORM, a Rust Discord bot, PostgreSQL, and
          Docker. The public site handles Discord login, live game-server status (including
          restart countdown and notices), support tickets synced with the bot, community
          suggestions and votes, plus events and leaderboards. Staff use a dashboard for
          Calagopus panel control (live console, start/stop/restart, automated setup for
          vote-winning servers), player-file backups with settings and downloads,
          moderation, and a filterable audit log.
        </p>

        <div className="card-grid min-[480px]:grid-cols-2" style={{ marginBottom: "28px" }}>
          {HIGHLIGHTS.map(({ value, label, detail }) => (
            <div key={label} className="content-card" style={{ padding: "16px 18px" }}>
              <p
                style={{
                  ...mono,
                  fontSize: "clamp(20px, 2.2vw, 28px)",
                  fontWeight: 600,
                  color: "#d4a843",
                  lineHeight: 1.1,
                }}
              >
                {value}
              </p>
              <p
                style={{
                  ...mono,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(232, 236, 241, 0.8)",
                  marginTop: "8px",
                }}
              >
                {label}
              </p>
              <p style={{ ...mono, fontSize: "11px", lineHeight: 1.5, color: "rgba(78, 205, 196, 0.6)", marginTop: "4px" }}>
                {detail}
              </p>
            </div>
          ))}
        </div>

        <LighthouseBars />

        <p style={{ ...mono, fontSize: "10px", lineHeight: 1.6, color: "rgba(232, 236, 241, 0.45)", marginTop: "16px" }}>
          Lighthouse via PageSpeed Insights, https://boredomhub.net, Oct 28, 2026 (mobile and desktop).
        </p>
      </div>
    </FadeIn>
  );
}
