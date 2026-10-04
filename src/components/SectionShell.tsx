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
  /** Optional highlighted tail of the title (styled by the page's own CSS
   *  via the `sites-accent` class). */
  titleAccent?: string;
  children: ReactNode;
  className?: string;
  /** Render the title as the page's h1 with a larger display size. */
  headingLevel?: "h1" | "h2";
}

export default function SectionShell({
  id,
  badge,
  badgeIcon,
  title,
  titleAccent,
  children,
  className = "",
  headingLevel = "h2",
}: SectionShellProps) {
  const Heading = headingLevel;
  const isPageTitle = headingLevel === "h1";
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
            className="level-badge section-badge mb-5"
            style={{ fontSize: "11px", letterSpacing: "0.13em" }}
          >
            <span>{badgeIcon}</span>
            <span>{badge}</span>
          </div>
          <Heading
            className="section-title mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: isPageTitle ? "clamp(30px, 4.4vw, 52px)" : "clamp(24px, 3vw, 36px)",
              fontWeight: 600,
              lineHeight: isPageTitle ? 1.06 : 1.12,
              letterSpacing: "-0.02em",
              color: "#e8ecf1",
              textWrap: "balance",
            }}
          >
            {title}
            {titleAccent ? (
              <>
                {" "}
                <span className="sites-accent">{titleAccent}</span>
              </>
            ) : null}
          </Heading>
        </FadeIn>
        {children}
      </div>
    </section>
  );
}
