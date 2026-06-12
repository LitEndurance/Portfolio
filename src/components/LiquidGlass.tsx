"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";

interface LiquidGlassProps {
  children: ReactNode;
  className?: string;
}

export default function LiquidGlass({ children, className = "" }: LiquidGlassProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.transform = "scaleY(1)";
      el.style.opacity = "1";
      return;
    }

    gsap.set(el, { scaleY: 0, opacity: 0 });

    const tween = gsap.to(el, {
      scaleY: 1,
      opacity: 1,
      duration: 1.2,
      delay: 0.5,
      ease: "power3.out",
      transformOrigin: "bottom center",
    });

    return () => { tween.kill(); };
  }, []);

  return (
    <div
      ref={panelRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "rgba(6, 10, 20, 0.55)",
        backgroundImage: "radial-gradient(ellipse at center, rgba(127,181,201,0.03) 0%, transparent 70%)",
        transform: "scaleY(0)",
        opacity: 0,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ border: "1px solid rgba(127, 181, 201, 0.06)" }}
      />
      {children}
    </div>
  );
}
