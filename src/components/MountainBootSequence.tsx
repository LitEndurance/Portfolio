"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";

interface MountainBootSequenceProps {
  bootStage: "loading" | "booting" | "ready";
  onSkip?: () => void;
  onFinished?: () => void;
  autoSkip?: boolean;
}

const BOOT_LINES = [
  "🏔️  SummitOS v2.0",
  "Mounting /dev/mountain...  OK",
  "Calibrating summit telemetry...  OK",
  "Loading crampons...  OK",
  "Establishing ridge trail...  OK",
  "Summit link established. Happy climbing.",
];

const LINE_INTERVAL = 500; // ms — brisk but readable
const POST_LINE_PAUSE = 250; // ms after last line before fade
const MAX_BOOT_MS = 6000; // hard ceiling so the site always becomes interactive

export default function MountainBootSequence({
  bootStage,
  onSkip,
  onFinished,
  autoSkip = false,
}: MountainBootSequenceProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [exited, setExited] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mountainReady, setMountainReady] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    setPrefersReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // Track when the mountain has finished loading.
  useEffect(() => {
    if (bootStage === "ready") {
      setMountainReady(true);
    }
  }, [bootStage]);

  // Reveal boot lines one at a time.
  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleCount(BOOT_LINES.length);
      return;
    }
    if (exited || skipped) return;

    if (visibleCount < BOOT_LINES.length) {
      const timer = setTimeout(() => {
        setVisibleCount((c) => Math.min(c + 1, BOOT_LINES.length));
      }, LINE_INTERVAL);
      return () => clearTimeout(timer);
    }
  }, [bootStage, visibleCount, exited, skipped, prefersReducedMotion]);

  // Fade out only after the boot sequence has played AND the mountain is ready.
  useEffect(() => {
    if (exited || skipped) return;
    if (visibleCount < BOOT_LINES.length) return;
    if (!mountainReady) return;

    const timer = setTimeout(() => setExited(true), POST_LINE_PAUSE);
    return () => clearTimeout(timer);
  }, [visibleCount, mountainReady, exited, skipped]);

  // Notify the parent exactly once when the boot overlay has finished.
  useEffect(() => {
    if (exited && !finishedRef.current) {
      finishedRef.current = true;
      onFinished?.();
    }
  }, [exited, onFinished]);

  // Allow user to skip the boot sequence with a key press or the skip button.
  const skip = useCallback(() => {
    if (exited) return;
    setSkipped(true);
    setVisibleCount(BOOT_LINES.length);
    setExited(true);
    onSkip?.();
  }, [exited, onSkip]);

  useEffect(() => {
    if (exited) return;
    const onKeyDown = () => skip();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [skip, exited]);

  // Auto-skip on low-end devices so they reach content faster.
  useEffect(() => {
    if (!autoSkip || exited || skipped) return;
    skip();
  }, [autoSkip, exited, skipped, skip]);

  // Hard ceiling: no matter what happens with the mountain load, the boot
  // overlay must dismiss so the page becomes interactive.
  useEffect(() => {
    if (exited || skipped) return;
    const timer = setTimeout(() => {
      skip();
    }, MAX_BOOT_MS);
    return () => clearTimeout(timer);
  }, [exited, skipped, skip]);

  const isReady = bootStage === "ready";
  const bootFinished = visibleCount >= BOOT_LINES.length;

  if (exited || skipped) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9999,
        opacity: isReady && bootFinished ? 0 : 1,
        transform:
          isReady && bootFinished
            ? prefersReducedMotion
              ? "none"
              : "scale(0.96)"
            : "scale(1)",
        transition: prefersReducedMotion
          ? "opacity 500ms ease"
          : "opacity 600ms ease, transform 600ms ease",
        background: "#080c14",
        pointerEvents: "auto",
      }}
      role="dialog"
      aria-label="SummitOS boot sequence"
      aria-modal="true"
    >
      <div
        className="rounded-lg px-8 py-6 max-w-md w-[90vw]"
        style={{
          background: "rgba(13, 17, 23, 0.78)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(78, 205, 196, 0.35)",
          boxShadow:
            "0 0 40px rgba(78, 205, 196, 0.1), inset 0 0 20px rgba(78, 205, 196, 0.04)",
        }}
      >
        <div
          className="font-mono text-sm leading-7"
          style={{ color: "#4ecdc4" }}
        >
          {BOOT_LINES.map((line, i) => (
            <div
              key={i}
              className="flex items-start"
              style={{
                opacity: i < visibleCount ? 1 : 0,
                transform:
                  i < visibleCount ? "translateY(0)" : "translateY(6px)",
                transition: prefersReducedMotion
                  ? "none"
                  : "opacity 350ms ease, transform 350ms ease",
              }}
            >
              <span
                className="select-none mr-3"
                style={{ color: "rgba(78, 205, 196, 0.45)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{line}</span>
              {i === BOOT_LINES.length - 1 && i < visibleCount && (
                <span className="mountain-boot-cursor ml-1" />
              )}
            </div>
          ))}
        </div>

        <div
          className="mt-5 flex items-center justify-between"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            color: "rgba(78, 205, 196, 0.45)",
          }}
        >
          <span>
            {bootFinished && !mountainReady
              ? "Awaiting mountain load..."
              : isReady && bootFinished
                ? "Summit link established"
                : "Booting SummitOS..."}
          </span>
          <button
            type="button"
            onClick={skip}
            className="focus-ring"
            style={{
              padding: "4px 10px",
              background: "rgba(78, 205, 196, 0.10)",
              border: "1px solid rgba(78, 205, 196, 0.35)",
              borderRadius: "4px",
              color: "#4ecdc4",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            Skip boot
          </button>
        </div>
      </div>
    </div>
  );
}
