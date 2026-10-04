"use client";

import FadeIn from "./FadeIn";
import SectionShell from "./SectionShell";
import OptimizedImage from "./OptimizedImage";

const skillCategories = [
  {
    title: "Systems Administration",
    skills: [
      "Linux Server Administration",
      "Windows Server & Desktop Management",
      "SSH Configuration & Management",
      "Server Monitoring & Optimization",
      "Backup & Disaster Recovery",
      "Pterodactyl Panel Administration",
    ],
  },
  {
    title: "Infrastructure & Networking",
    skills: [
      "Network Configuration",
      "Firewall Setup & Security",
      "VPN & WireGuard Configuration",
      "Multi-server Management",
      "Load Balancing",
      "Proxmox VE & Virtualization",
    ],
  },
  {
    title: "Frameworks & Platforms",
    skills: [
      "Next.js Full-Stack Development",
      "NestJS Backend Architecture",
      "Docker Containerization",
      "API Development & REST Endpoints",
      "SQL Databases",
      "Git Version Control",
    ],
  },
  {
    title: "Development & Automation",
    skills: [
      "AI-Assisted Development (LLMs)",
      "OAuth & Authentication",
      "Redis & Caching",
      "Shell Scripting & Automation",
      "Technical Documentation",
    ],
  },
];

const techImages = [
  { src: "/images/1_Next_js_The_Framework_for_the_Modern.png", label: "Next.js" },
  { src: "/images/3_Nest_JS_The_official_logo_Behanc.png", label: "NestJS" },
  { src: "/images/2_The_Dark_Side_Of_AI_What_Enterprises.png", label: "AI Development" },
  { src: "/images/4_What_is_a_Container_Docker.png", label: "Docker" },
];

export default function SkillsGridSection() {
  return (
    <SectionShell
      id="skills"
      badgeIcon="⛏️"
      badge="Gear Wall"
      title="Technical expertise across the stack"
    >
      <FadeIn delay={0.12}>
        <div className="card-grid card-grid-2" style={{ marginBottom: "40px" }}>
          {skillCategories.map((cat) => (
            <div key={cat.title} data-wobble className="content-card">
              <h3
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(13px, 1.2vw, 14px)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#e8ecf1",
                  paddingBottom: "12px",
                  marginBottom: "14px",
                  borderBottom: "1px solid rgba(78, 205, 196, 0.12)",
                }}
              >
                {cat.title}
              </h3>
              <ul className="space-y-2">
                {cat.skills.map((skill, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "clamp(12px, 0.95vw, 13.5px)",
                      lineHeight: 1.45,
                      color: "rgba(78, 205, 196, 0.8)",
                    }}
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.22}>
        <div>
          <p
            className="mb-4"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(78, 205, 196, 0.6)",
            }}
          >
            Technologies
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {techImages.map((img, i) => (
              <div
                key={i}
                data-wobble
                className="relative overflow-hidden group focus-ring aspect-[16/9]"
                style={{
                  border: "1px solid rgba(78, 205, 196, 0.14)",
                  background: "rgba(0, 0, 0, 0.45)",
                  borderRadius: "8px",
                }}
                tabIndex={0}
                aria-label={img.label}
              >
                <OptimizedImage
                  src={img.src}
                  alt={img.label}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
                  style={{ opacity: 0.75 }}
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div
                  className="absolute inset-0 flex items-end p-3"
                  style={{
                    background: "linear-gradient(transparent 40%, rgba(0,0,0,0.8) 100%)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#4ecdc4",
                    }}
                  >
                    {img.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </SectionShell>
  );
}
