"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

export default function FadeIn({ children, delay = 0, y = 40, className = "" }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      return;
    }

    gsap.set(el, { opacity: 0, y });

    const tween = gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        // "top 85%", but capped just below the maximum scroll so blocks near
        // the very bottom of the page (e.g. contact details) still reveal
        // when the visitor reaches the end. Only the upper end is capped:
        // GSAP's clamp() also raises negative starts to 0, which left blocks
        // already in view at scroll 0 (the hero) hidden until the first
        // scroll. No cap while the page can't scroll (boot overlay lock).
        start: () => {
          const natural =
            el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.85;
          const max = ScrollTrigger.maxScroll(window);
          return max > 0 ? Math.min(natural, max - 1) : natural;
        },
        once: true,
      },
    });

    return () => { tween.kill(); };
  }, [delay, y]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
