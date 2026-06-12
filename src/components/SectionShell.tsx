"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FadeIn from "./FadeIn";

gsap.registerPlugin(ScrollTrigger);

interface SectionShellProps {
  id: string;
  badge: string;
  badgeIcon: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function SectionShell({
  id,
  badge,
  badgeIcon,
  title,
  children,
  className = "",
}: SectionShellProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(card, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(card, { opacity: 0, y: 80 });

    const tween = gsap.fromTo(
      card,
      { opacity: 0, y: 80 },
      {
        opacity: 1,
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          start: "top 75%",
          end: "top 35%",
          scrub: 0.8,
        },
      }
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <section
      id={id}
      className={`relative w-full flex items-center justify-center ${className}`}
      style={{ minHeight: "100dvh", padding: "10vh 5vw" }}
    >
      <div ref={cardRef} className="section-card">
        <FadeIn>
          <div
            className="level-badge mb-5"
            style={{ fontSize: "11px", letterSpacing: "0.13em" }}
          >
            <span>{badgeIcon}</span>
            <span>{badge}</span>
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
            {title}
          </h2>
        </FadeIn>
        {children}
      </div>
    </section>
  );
}
