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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {skillCategories.map((cat) => (
            <div
              key={cat.title}
              data-wobble
              className="p-5 transition-colors duration-300 hover:bg-[rgba(78,205,196,0.06)]"
              style={{ 
                border: "1px solid rgba(78, 205, 196, 0.1)",
                background: "rgba(10, 14, 26, 0.32)",
                borderRadius: "4px",
              }}
            >
              <div
                className="mb-3"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(13px, 1.2vw, 15px)",
                  fontWeight: 300,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#d0d5dd",
                }}
              >
                {cat.title}
              </div>
              <ul className="space-y-1.5">
                {cat.skills.map((skill, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "clamp(12px, 0.95vw, 14px)",
                      color: "rgba(78, 205, 196, 0.75)",
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {techImages.map((img, i) => (
              <div
                key={i}
                data-wobble
                className="relative overflow-hidden group focus-ring"
                style={{
                  border: "1px solid rgba(78, 205, 196, 0.1)",
                  background: "rgba(0, 0, 0, 0.45)",
                  borderRadius: "4px",
                }}
                tabIndex={0}
                aria-label={img.label}
              >
                <OptimizedImage
                  src={img.src}
                  alt={img.label}
                  className="w-full h-auto object-cover transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
                  style={{ opacity: 0.75, maxHeight: "80px" }}
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
