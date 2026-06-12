"use client";

import FadeIn from "./FadeIn";
import SectionShell from "./SectionShell";

export default function ContactSection() {
  return (
    <SectionShell
      id="contact"
      badgeIcon="🏁"
      badge="Summit"
      title="Let's build something together"
    >
      <FadeIn delay={0.12}>
        <p
          className="mb-6"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(13px, 1vw, 15px)",
            lineHeight: 1.7,
            color: "#d0d5dd",
          }}
        >
          Open to infrastructure, systems administration, and full-stack opportunities. If you
          need reliable hosting, automation, or a technical partner for your next climb, send a
          transmission.
        </p>
      </FadeIn>

      <FadeIn delay={0.22}>
        <a
          href="mailto:willbarnh@gmail.com"
          className="inline-block transition-colors duration-300 focus-ring"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(20px, 2.4vw, 32px)",
            fontWeight: 600,
            color: "#e8ecf1",
            textDecoration: "none",
            lineHeight: 1.1,
            overflowWrap: "break-word",
            borderRadius: "2px",
            padding: "2px 0",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#4ecdc4";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#e8ecf1";
          }}
        >
          willbarnh@gmail.com
        </a>
      </FadeIn>

      <FadeIn delay={0.32}>
        <p
          className="mt-4"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(13px, 1vw, 15px)",
            color: "rgba(78, 205, 196, 0.7)",
          }}
        >
          Discord: lit_endurance
        </p>
      </FadeIn>
    </SectionShell>
  );
}
