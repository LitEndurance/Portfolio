"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";

export default function ScrollIndicator() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, delay: 1.5, ease: "power2.out" }
    );

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setVisible(false);
        gsap.to(el, {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            if (el) el.style.display = "none";
          },
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-[3vh] right-[5vw] flex flex-col items-center gap-2 z-10"
      style={{ opacity: 0 }}
    >
      <span
        className="scroll-pulse"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "rgba(127, 181, 201, 0.5)",
        }}
      >
        SCROLL
      </span>
      <ChevronDown
        size={20}
        className="scroll-pulse"
        style={{ color: "rgba(127, 181, 201, 0.5)" }}
        strokeWidth={1.5}
      />
    </div>
  );
}
