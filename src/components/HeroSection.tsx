"use client";

import { useMemo, useRef, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { Terminal } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollIndicator from "./ScrollIndicator";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { throttleRaf } from "@/lib/throttleRaf";

gsap.registerPlugin(ScrollTrigger);

interface SnowParticle {
  left: number;
  top: number;
  duration: number;
  delay: number;
  drift: number;
  size: number;
  opacity: number;
  blur: number;
}

interface SnowFlake extends SnowParticle {
  streak: boolean;
  glow: number;
}

function generateSnow(count: number): SnowFlake[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const left = (Math.sin(n * 1.731) * 0.5 + 0.5) * 90 + 3;
    const top = -2 - (Math.cos(n * 2.437) * 0.5 + 0.5) * 14;
    const duration = 0.85 + (Math.sin(n * 0.913) * 0.5 + 0.5) * 1.1;
    const delay = (Math.cos(n * 1.217) * 0.5 + 0.5) * duration;
    const drift = Math.round(Math.sin(n * 3.091) * 30);
    const size = 2.5 + (n % 5);
    const opacity = 0.75 + (n % 5) / 12;
    const blur = n % 5 === 0 ? 0.8 : 0;
    const streak = n % 7 === 0;
    const glow = 1.0 + (n % 6) / 10;
    return { left, top, duration, delay, drift, size, opacity, blur, streak, glow };
  });
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { tier, reducedMotion } = useDeviceTier();

  const applyTilt = useCallback((rotateX: number, rotateY: number) => {
    const body = bodyRef.current;
    if (!body) return;
    body.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, []);

  const throttledApplyTilt = useMemo(
    () => throttleRaf(applyTilt),
    [applyTilt]
  );

  useEffect(() => {
    return () => {
      throttledApplyTilt.cancel();
    };
  }, [throttledApplyTilt]);

  // 3-D tilt on mouse move (applied to the panel body so it doesn't fight
  // with GSAP scroll transforms on the outer shell).
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tier === "low" || reducedMotion) return;
    const body = bodyRef.current;
    if (!body) return;
    const rect = body.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -2.5;
    const rotateY = ((x - cx) / cx) * 2.5;
    throttledApplyTilt(rotateX, rotateY);
  };

  const handleMouseLeave = () => {
    throttledApplyTilt.cancel();
    const body = bodyRef.current;
    if (!body) return;
    body.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
  };

  // Scroll-driven "terminal recede" feel as the hero is scrolled past.
  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    if (!section || !panel) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tween = gsap.fromTo(
      panel,
      { y: 0, opacity: 1 },
      {
        y: -28,
        opacity: 0.45,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      }
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full overflow-hidden flex items-end"
      style={{
        minHeight: "100dvh",
        paddingBottom: "12vh",
      }}
    >
      <div className="w-full" style={{ padding: "0 5vw" }}>
        <div
          ref={panelRef}
          className="hero-panel max-w-3xl relative flex flex-col"
          style={{
            borderRadius: "10px",
            background: "rgba(6, 10, 20, 0.78)",
            backdropFilter: "blur(16px) saturate(1.15)",
            WebkitBackdropFilter: "blur(16px) saturate(1.15)",
            border: "1px solid rgba(78, 205, 196, 0.18)",
            boxShadow:
              "0 32px 80px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255,255,255,0.03)",
            overflow: "hidden",
          }}
        >
          {/* Panel body receives mouse-tilt independently of scroll transforms. */}
          <div
            ref={bodyRef}
            className="relative flex flex-col"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: "perspective(800px) rotateX(0deg) rotateY(0deg)",
              transition: "transform 0.2s ease-out, box-shadow 0.3s ease",
              transformOrigin: "center center",
            }}
          >
          {/* Frosted cyan rim-light pulse */}
          <div
            className="hero-rim-pulse pointer-events-none absolute inset-0 rounded-[10px]"
            style={{
              padding: "1px",
              background:
                "linear-gradient(135deg, rgba(78,205,196,0.28), rgba(78,205,196,0), rgba(78,205,196,0.15), rgba(78,205,196,0))",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              opacity: 0.45,
              animation: "heroRimPulse 4s ease-in-out infinite",
            }}
          />

          {/* Subtle snow particles */}
          <SnowParticles />

          {/* Terminal title bar */}
          <div
            className="relative flex items-center justify-between select-none shrink-0"
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(78, 205, 196, 0.12)",
              background: "rgba(78, 205, 196, 0.05)",
              zIndex: 1,
            }}
          >
            <div className="flex items-center gap-2">
              {/* Window controls */}
              <div className="flex gap-1.5 mr-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#e85555" }}
                  title="Close"
                />
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#d4a843" }}
                  title="Maximize"
                />
                <span
                  className="w-3 h-3 rounded-full flex items-center justify-center"
                  style={{ background: "#4ecdc4" }}
                  title="Active"
                >
                  <span
                    className="block rounded-full"
                    style={{
                      width: "4px",
                      height: "4px",
                      background: "#0a0e1a",
                      animation: "pulse 2s ease-in-out infinite",
                    }}
                  />
                </span>
              </div>

              <Terminal size={14} style={{ color: "#4ecdc4", opacity: 0.8 }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "#4ecdc4",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                SummitOS
              </span>
              <span
                className="hidden sm:inline"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "rgba(78,205,196,0.35)",
                  letterSpacing: "0.08em",
                  marginLeft: "4px",
                }}
              >
                — login
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "rgba(78,205,196,0.45)",
                  letterSpacing: "0.06em",
                }}
              >
                ONLINE
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#4ecdc4",
                  boxShadow: "0 0 6px rgba(78,205,196,0.6)",
                }}
              />
            </div>
          </div>

          {/* Terminal body */}
          <div
            className="relative"
            style={{
              padding: "clamp(32px, 5vw, 56px)",
            }}
          >
            {/* Prompt lines */}
            <div
              className="mb-6"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(12px, 1.1vw, 14px)",
                lineHeight: 1.7,
                color: "rgba(232, 232, 232, 0.75)",
              }}
            >
              <div className="flex flex-wrap gap-x-2">
                <span style={{ color: "#4ecdc4" }}>wbarnhart</span>
                <span style={{ color: "rgba(232,232,232,0.55)" }}>@</span>
                <span style={{ color: "#d4a843" }}>summit-os</span>
                <span style={{ color: "rgba(232,232,232,0.55)" }}>:~$ </span>
                <span>whoami</span>
              </div>
              <div className="pl-0" style={{ color: "rgba(232,232,232,0.55)" }}>
                William Barnhart
              </div>
              <div className="flex flex-wrap gap-x-2 mt-1">
                <span style={{ color: "#4ecdc4" }}>wbarnhart</span>
                <span style={{ color: "rgba(232,232,232,0.55)" }}>@</span>
                <span style={{ color: "#d4a843" }}>summit-os</span>
                <span style={{ color: "rgba(232,232,232,0.55)" }}>:~$ </span>
                <span>uptime</span>
              </div>
              <div className="pl-0" style={{ color: "rgba(232,232,232,0.55)" }}>
                08:00:00 up 365 days, 13:37, 1 user, load average: 0.02, 0.05, 0.01
              </div>
            </div>

            {/* Main output */}
            <h1
              className="relative"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(42px, 7vw, 86px)",
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#f6f9fc",
                textWrap: "balance",
              }}
            >
              William Barnhart
            </h1>
            <p
              className="uppercase mt-5 relative"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(13px, 1.2vw, 17px)",
                fontWeight: 400,
                letterSpacing: "0.08em",
                color: "#4ecdc4",
              }}
            >
              Systems Administrator &amp; Infrastructure Engineer
            </p>
            <p
              className="uppercase mt-3 relative"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "0.1em",
                color: "rgba(232, 232, 232, 0.55)",
              }}
            >
              Linux &middot; Docker &middot; Next.js &middot; NestJS &middot; AI Dev &middot; Networking
            </p>

            {/* Active prompt */}
            <div
              className="mt-8 flex items-center gap-2"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(12px, 1.1vw, 14px)",
              }}
            >
              <span style={{ color: "#4ecdc4" }}>wbarnhart</span>
              <span style={{ color: "rgba(232,232,232,0.55)" }}>@</span>
              <span style={{ color: "#d4a843" }}>summit-os</span>
              <span style={{ color: "rgba(232,232,232,0.55)" }}>:~$ </span>
              <span className="mountain-boot-cursor" />
            </div>
          </div>
          </div>
        </div>
      </div>
      <ScrollIndicator />
    </section>
  );
}

function SnowParticles() {
  const particles = useMemo(() => generateSnow(32), []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
      {particles.map((p, i) => (
        <span
          key={i}
          className="hero-snow absolute"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.streak ? `${Math.max(1, p.size * 0.6)}px` : `${p.size}px`,
            height: p.streak ? `${p.size * 3}px` : `${p.size}px`,
            borderRadius: p.streak ? "2px" : "9999px",
            background: p.streak
              ? "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0))"
              : "rgba(255, 255, 255, 0.98)",
            opacity: p.opacity * 0.65,
            filter: `blur(${p.blur}px)`,
            boxShadow: `0 0 ${p.glow}px rgba(255, 255, 255, ${p.glow * 0.25})`,
            willChange: "transform, opacity",
            animation: `heroSnowFall ${p.duration}s linear ${p.delay}s infinite`,
            "--snow-drift": `${p.drift}px`,
            "--snow-opacity": p.opacity,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
