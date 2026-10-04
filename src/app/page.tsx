import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "William Barnhart — Web Development & Systems Administration",
  description:
    "Two trails up the same mountain: fast websites for local businesses, or infrastructure and systems administration for the teams hiring.",
};

const trails = [
  {
    href: "/websites",
    icon: "🥾",
    audience: "For business owners",
    title: "I need a website that pulls its weight",
    description:
      "Fast sites, rebuilds, speed fixes, and integrations for local businesses, showrooms, and startups — plus someone who answers after launch.",
    cta: "Take the web dev trail",
  },
  {
    href: "/infrastructure",
    icon: "⛏️",
    audience: "For recruiters & hiring managers",
    title: "I'm hiring for infrastructure or engineering",
    description:
      "Systems administration, Linux, Docker, networking, and full-stack development — the full expedition portfolio.",
    cta: "Climb the mountain",
  },
];

export default function TrailSelectPage() {
  return (
    <main
      className="flex flex-col items-center justify-center"
      style={{ minHeight: "100dvh", padding: "clamp(24px, 5vw, 64px) 5vw" }}
    >
      <div style={{ maxWidth: "960px", width: "100%" }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: "rgba(78, 205, 196, 0.6)",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          William Barnhart
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#e8ecf1",
            textAlign: "center",
            textWrap: "balance",
            marginBottom: "12px",
          }}
        >
          Two trails up the same mountain.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-accent)",
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "rgba(208, 213, 221, 0.7)",
            textAlign: "center",
            marginBottom: "clamp(32px, 5vh, 56px)",
          }}
        >
          Pick the one that sounds like you.
        </p>

        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: "clamp(16px, 2.5vw, 28px)" }}
        >
          {trails.map((trail) => (
            <Link
              key={trail.href}
              href={trail.href}
              className="project-card trail-card focus-ring"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                padding: "clamp(24px, 4vw, 40px)",
                borderRadius: "8px",
                textDecoration: "none",
                background: "rgba(6, 10, 20, 0.85)",
                border: "1px solid rgba(78, 205, 196, 0.12)",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
              }}
            >
              <span
                className="level-badge"
                style={{ fontSize: "11px", letterSpacing: "0.13em", alignSelf: "flex-start" }}
              >
                <span>{trail.icon}</span>
                <span>{trail.audience}</span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "clamp(19px, 2.2vw, 26px)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                  color: "#e8ecf1",
                  textWrap: "balance",
                }}
              >
                {trail.title}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "rgba(208, 213, 221, 0.85)",
                }}
              >
                {trail.description}
              </span>
              <span
                className="inline-flex items-center"
                style={{
                  gap: "8px",
                  marginTop: "auto",
                  paddingTop: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#4ecdc4",
                }}
              >
                {trail.cta}
                <span aria-hidden="true">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
