"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export default function AnimatedHeading({ text, className = "", as: Tag = "h2" }: AnimatedHeadingProps) {
  const containerRef = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      container.querySelectorAll(".word-top").forEach((el) => {
        (el as HTMLElement).style.top = "0";
      });
      return;
    }

    const wordEls = container.querySelectorAll(".word-wrap");
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top 85%",
        once: true,
      },
    });

    wordEls.forEach((wordEl, i) => {
      const top = wordEl.querySelector(".word-top");
      const bottom = wordEl.querySelector(".word-bottom");

      if (top && bottom) {
        tl.to(top, { yPercent: 0, duration: 1.5, ease: "power3.inOut" }, i * 0.1);
        tl.to(bottom, { yPercent: -100, duration: 1.5, ease: "power3.inOut" }, i * 0.1);
      }
    });

    return () => { tl.kill(); };
  }, []);

  return (
    <Tag
      ref={containerRef as React.RefObject<HTMLHeadingElement>}
      className={className}
      style={{
        fontSize: Tag === "h1" ? "clamp(48px, 8vw, 120px)" : "clamp(18px, 2.2vw, 32px)",
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        color: "#e8ecf1",
      }}
    >
      {words.map((word, i) => {
        const isItalic = word.startsWith("*") && word.endsWith("*");
        const cleanWord = isItalic ? word.slice(1, -1) : word;

        return (
          <span
            key={i}
            className="word-wrap inline-block overflow-hidden align-top"
            style={{ height: "1.1em", lineHeight: 1.1, marginRight: "0.3em" }}
          >
            <span
              className="word-top block relative"
              style={{
                top: "100%",
                fontFamily: isItalic ? "var(--font-accent)" : "var(--font-display)",
                fontStyle: isItalic ? "italic" : "normal",
                fontWeight: isItalic ? 400 : 600,
              }}
            >
              {cleanWord}
            </span>
            <span
              className="word-bottom block"
              style={{
                fontFamily: isItalic ? "var(--font-accent)" : "var(--font-display)",
                fontStyle: isItalic ? "italic" : "normal",
                fontWeight: isItalic ? 400 : 600,
              }}
            >
              {cleanWord}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
