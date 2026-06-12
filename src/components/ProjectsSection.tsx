"use client";

import { useClimb } from "./ClimbContext";
import FadeIn from "./FadeIn";
import SectionShell from "./SectionShell";

const projects = [
  {
    number: "01",
    title: "HEROESMC.NET INFRASTRUCTURE",
    description:
      "Scalable Minecraft hosting platform with automated backups, containerized server orchestration via Pterodactyl, and 99%+ uptime monitoring. Multi-node deployment with WireGuard VPN mesh and Cloudflare DDoS protection. (ARCHIVED)",
    tags: ["Pterodactyl", "Docker", "WireGuard", "Cloudflare", "Bash"],
    status: "ARCHIVED",
  },
  {
    number: "02",
    title: "BOREDOMHUB LLC",
    description:
      "Pterodactyl panel setup with snapshots and backups for BoredomHub LLC, including Linux server administration and containerized game-server orchestration.",
    tags: ["Pterodactyl", "Linux", "Docker", "Snapshots", "Backups"],
    status: "LIVE",
  },
  {
    number: "03",
    title: "COZYCORD SERVICES",
    description:
      "Pterodactyl panel setup with snapshots and backups for the Cozycord development team, delivering containerized game-server environments and reliable orchestration.",
    tags: ["Pterodactyl", "Linux", "Docker", "Snapshots", "Backups"],
    status: "PAST",
  },
  {
    number: "04",
    title: "PVE DISTRICT",
    description:
      "Built on a Proxmox VM with Docker containers for secure, scalable application hosting and cross-platform authentication.",
    tags: ["Proxmox", "Docker", "Caddy", "OAuth", "Roblox", "Discord"],
    status: "LIVE",
  },
];

export default function ProjectsSection() {
  const { inspectProject } = useClimb();

  const handleInspect = (project: (typeof projects)[number]) => {
    inspectProject({
      title: project.title,
      status: project.status,
      tags: project.tags,
      description: project.description,
    });
    const terminal = document.querySelector("[data-terminal-root]");
    if (terminal) {
      terminal.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <SectionShell
      id="projects"
      badgeIcon="🏔️"
      badge="Summit Log"
      title="Key infrastructure deployments"
    >
      <div className="space-y-8">
        {projects.map((p, idx) => (
          <FadeIn key={p.number} delay={0.1 * (idx + 1)}>
            <div
              style={{
                borderBottom: "1px solid rgba(78, 205, 196, 0.08)",
                paddingBottom: "24px",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "rgba(78, 205, 196, 0.45)",
                  }}
                >
                  {p.number}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: p.status === "LIVE" ? "#4ecdc4" : "rgba(212, 168, 67, 0.85)",
                    border: `1px solid ${p.status === "LIVE" ? "rgba(78, 205, 196, 0.3)" : "rgba(212, 168, 67, 0.3)"}`,
                    borderRadius: "2px",
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{
                      background: p.status === "LIVE" ? "#4ecdc4" : "#d4a843",
                      opacity: p.status === "LIVE" ? 1 : 0.7,
                    }}
                  />
                  {p.status}
                </span>
              </div>
              <h3
                className="uppercase transition-colors duration-300 cursor-pointer focus-ring inline-block"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(16px, 1.8vw, 22px)",
                  fontWeight: 300,
                  letterSpacing: "0.02em",
                  color: "#e8ecf1",
                  marginBottom: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#4ecdc4";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#e8ecf1";
                }}
                onClick={() => handleInspect(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleInspect(p);
                  }
                }}
                aria-label={`Inspect ${p.title}`}
              >
                {p.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(12px, 0.95vw, 14px)",
                  lineHeight: 1.65,
                  color: "rgba(78, 205, 196, 0.7)",
                  marginBottom: "12px",
                }}
              >
                {p.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {p.tags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "rgba(212, 168, 67, 0.85)",
                    }}
                  >
                    {tag}
                    {i < p.tags.length - 1 && (
                      <span className="ml-1.5" style={{ color: "rgba(212, 168, 67, 0.3)" }}>
                        &middot;
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </SectionShell>
  );
}
