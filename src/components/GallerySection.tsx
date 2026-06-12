"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import FadeIn from "./FadeIn";
import SectionShell from "./SectionShell";
import { useScrollLock } from "@/hooks/useScrollLock";

const screenshots = [
  {
    src: "/screenshots/caeranthil-dashboard.png",
    caption: "Caeranthil — Event Management Platform",
    description:
      "Full-stack event hosting platform built with Next.js and NestJS featuring real-time dashboards, user management, verification systems, and automated event orchestration.",
  },
  {
    src: "/screenshots/deepwoken-panel.png",
    caption: "DeepwokenTrader — Proxmox & Pterodactyl Infrastructure (In Development)",
    description:
      "Personal work-in-progress project built on Proxmox and Pterodactyl, hosting interconnected services including Redis cache, bot dashboard, webscraper, and API endpoints.",
  },
  {
    src: "/screenshots/proxmox-datacenter.png",
    caption: "Proxmox VE — Enterprise Virtualization Cluster",
    description:
      "Full Proxmox VE datacenter management with LXC containers, QEMU VMs, storage pools, and resource monitoring across multiple nodes with 5+ days uptime.",
  },
];

const extraImages = [
  { src: "/images/5_Documentation_NestJS_A_progressive.png", caption: "NestJS Architecture" },
  { src: "/images/6_What_is_Docker_Docker_Docs.png", caption: "Docker Ecosystem" },
  { src: "/images/8_An_Overview_of_the_Next_js_Framework.png", caption: "Next.js Framework" },
  { src: "/images/10_What_Is_NestJS_And_What_Is_It_Used.png", caption: "NestJS Backend" },
];

export default function GallerySection() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useScrollLock(lightbox !== null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <SectionShell
      id="gallery"
      badgeIcon="📸"
      badge="Trail Markers"
      title="Screenshots of deployed systems"
    >
      <div className="space-y-8 mb-10">
        {screenshots.map((shot, i) => (
          <FadeIn key={shot.src} delay={0.1 * (i + 1)}>
            <div
              className="group cursor-pointer focus-ring"
              data-wobble
              onClick={() => setLightbox(shot.src)}
              tabIndex={0}
              role="button"
              aria-label={`Expand ${shot.caption}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setLightbox(shot.src);
                }
              }}
            >
              <div
                className="relative overflow-hidden mb-3"
                style={{ border: "1px solid rgba(78, 205, 196, 0.12)", borderRadius: "4px" }}
              >
                <img
                  src={shot.src}
                  alt={shot.caption}
                  className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-[1.02] group-hover:opacity-100"
                  style={{ opacity: 0.9 }}
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  style={{ background: "rgba(0, 0, 0, 0.4)" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#4ecdc4",
                      border: "1px solid rgba(78, 205, 196, 0.5)",
                      padding: "6px 12px",
                      borderRadius: "2px",
                    }}
                  >
                    Expand
                  </span>
                </div>
              </div>
              <p
                className="uppercase mb-1"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "rgba(78, 205, 196, 0.45)",
                  letterSpacing: "0.05em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3
                className="mb-1"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(15px, 1.3vw, 18px)",
                  fontWeight: 300,
                  color: "#e8ecf1",
                  lineHeight: 1.3,
                  letterSpacing: "0.02em",
                }}
              >
                {shot.caption}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(12px, 0.95vw, 14px)",
                  lineHeight: 1.6,
                  color: "rgba(78, 205, 196, 0.6)",
                }}
              >
                {shot.description}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.35}>
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
            Tech Stack Visuals
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {extraImages.map((img, i) => (
              <div
                key={i}
                data-wobble
                className="relative overflow-hidden group cursor-pointer focus-ring"
                style={{
                  border: "1px solid rgba(78, 205, 196, 0.1)",
                  background: "rgba(0, 0, 0, 0.45)",
                  borderRadius: "4px",
                }}
                onClick={() => setLightbox(img.src)}
                tabIndex={0}
                role="button"
                aria-label={`Expand ${img.caption}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightbox(img.src);
                  }
                }}
              >
                <img
                  src={img.src}
                  alt={img.caption}
                  className="w-full h-auto object-cover transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
                  style={{ opacity: 0.75, maxHeight: "90px" }}
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 flex items-end p-2.5"
                  style={{
                    background: "linear-gradient(transparent 40%, rgba(0,0,0,0.8) 100%)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#4ecdc4",
                    }}
                  >
                    {img.caption}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {lightbox &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: "rgba(0, 0, 0, 0.92)" }}
            onClick={() => setLightbox(null)}
          >
            <img
              src={lightbox}
              alt="Expanded screenshot"
              className="max-w-[90vw] max-h-[85dvh] object-contain"
              style={{ border: "1px solid rgba(78, 205, 196, 0.15)" }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              aria-label="Close"
              className="absolute top-6 right-6 bg-transparent border-none cursor-pointer focus-ring transition-opacity duration-300 hover:opacity-70"
              style={{
                color: "rgba(78, 205, 196, 0.8)",
                padding: "4px",
              }}
              onClick={() => setLightbox(null)}
            >
              <X size={24} />
            </button>
          </div>,
          document.body
        )}
    </SectionShell>
  );
}
