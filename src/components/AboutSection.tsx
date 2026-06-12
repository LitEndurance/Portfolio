"use client";

import FadeIn from "./FadeIn";

export default function AboutSection() {
  return (
    <section
      className="relative w-full flex items-center justify-center"
      style={{ minHeight: "100dvh", padding: "10vh 5vw" }}
    >
      <div className="section-card">
        <FadeIn>
          <div
            className="level-badge mb-5"
            style={{ fontSize: "11px", letterSpacing: "0.13em" }}
          >
            <span>🏕️</span>
            <span>Base Camp</span>
          </div>
          <h2
            className="mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 3vw, 36px)",
              fontWeight: 600,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "#e8ecf1",
              textWrap: "balance",
            }}
          >
            Building reliable infrastructure for the digital world
          </h2>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div
            className="space-y-5"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(13px, 1vw, 15px)",
              lineHeight: 1.7,
              color: "#d0d5dd",
            }}
          >
            <p>
              Systems Administrator with proven experience managing multi-client hosting
              infrastructure. Operated hosting services for business clients including LLCs and
              development teams with 99%+ uptime.
            </p>
            <p>
              Proficient in Linux and Windows environments with cross-platform OS deployment across
              diverse hardware. Experienced in Docker containerization, automated monitoring, SSH
              hardening, and disaster recovery protocols. Skilled in modern web frameworks including
              Next.js and NestJS for full-stack application development.
            </p>
            <p>
              Extensive experience with AI-assisted development workflows, leveraging LLMs and AI
              coding tools to accelerate development cycles and automate infrastructure tasks.
              Currently providing managed hosting for BoredomHub LLC and PVE District, including
              Pterodactyl panel setups with snapshots, backups, and Proxmox VM administration.
              Previously supported the Cozycord development team with containerized game-server
              orchestration.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
