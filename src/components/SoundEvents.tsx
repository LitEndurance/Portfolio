"use client";

import { useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { throttleRaf } from "@/lib/throttleRaf";

const WOBBLE_SELECTOR = "[data-wobble]";
const BTN_SELECTOR = "button, [role='button'], a, input[type='submit'], input[type='button']";

function isButtonLike(el: HTMLElement): boolean {
  return (
    el.matches(BTN_SELECTOR) ||
    el.closest(BTN_SELECTOR) !== null
  );
}

function applyWobble(card: HTMLElement, rotateX: number, rotateY: number) {
  card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
}

const throttledApplyWobble = throttleRaf(applyWobble);

function handleWobbleLeave(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement;
  card.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)";
}

export default function SoundEvents() {
  const { tier, reducedMotion } = useDeviceTier();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const wobbleEnabled = tier !== "low" && !reducedMotion;
    let lastHoverEl: HTMLElement | null = null;

    const onMouseMove = (e: MouseEvent) => {
      if (!wobbleEnabled) return;
      const target = e.target as HTMLElement;
      const card = target.closest(WOBBLE_SELECTOR) as HTMLElement | null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -4;
      const rotateY = ((x - cx) / cx) * 4;
      throttledApplyWobble(card, rotateX, rotateY);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (target.closest(WOBBLE_SELECTOR)) {
        const card = target.closest(WOBBLE_SELECTOR) as HTMLElement;
        if (card && card !== lastHoverEl) {
          lastHoverEl = card;
          soundEngine.cardHover();
        }
        return;
      }

      if (isButtonLike(target)) {
        const btn = (target.closest(BTN_SELECTOR) || target) as HTMLElement;
        if (btn && btn !== lastHoverEl) {
          lastHoverEl = btn;
          soundEngine.hover();
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (isButtonLike(target) || target.closest(WOBBLE_SELECTOR)) {
        soundEngine.click();
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const related = e.relatedTarget as HTMLElement | null;
      if (target && target === lastHoverEl) {
        // Only reset when actually leaving the element, not when moving to a child
        if (!related || !target.contains(related)) {
          lastHoverEl = null;
        }
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("click", onClick);
    document.addEventListener("mouseout", onMouseOut);

    // Attach leave listeners only when wobble is enabled so the transform
    // reset doesn't run (and conflict) on low-tier/reduced-motion devices.
    const cards: HTMLElement[] = [];
    if (wobbleEnabled) {
      document.querySelectorAll(WOBBLE_SELECTOR).forEach((card) => {
        const el = card as HTMLElement;
        el.style.transition = "transform 0.15s ease-out";
        el.addEventListener("mouseleave", handleWobbleLeave);
        cards.push(el);
      });
    }

    return () => {
      throttledApplyWobble.cancel();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("click", onClick);
      document.removeEventListener("mouseout", onMouseOut);
      cards.forEach((card) => {
        card.removeEventListener("mouseleave", handleWobbleLeave);
      });
    };
  }, [tier, reducedMotion]);

  return null;
}
