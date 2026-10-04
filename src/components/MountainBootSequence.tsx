"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";

export interface BootCopy {
  /** Lines revealed one at a time; the last one gets the blinking cursor. */
  lines: readonly string[];
  /** Accessible name of the overlay dialog. */
  ariaLabel: string;
  /** Footer status while lines are still appearing. */
  bootingStatus: string;
  /** Footer status when the lines are done but the mountain is still loading. */
  awaitingStatus: string;
  /** Footer status once everything is ready (shown during the fade-out). */
  readyStatus: string;
  skipLabel: string;
  /** Optional heading above the lines (e.g. the site owner's name). */
  title?: string;
  /** Optional one-line description under the title. */
  subtitle?: string;
  /** Show a thin progress bar that fills as the lines appear. */
  showProgress?: boolean;
}

interface MountainBootSequenceProps {
  bootStage: "loading" | "booting" | "ready";
  onSkip?: () => void;
  onFinished?: () => void;
  autoSkip?: boolean;
  /** Page-specific wording; defaults to the infrastructure trail's SummitOS boot. */
  copy?: BootCopy;
}

const BOOT_LINES = [
  "🏔️  SummitOS v2.0",
  "Mounting /dev/mountain...  OK",
  "Calibrating summit telemetry...  OK",
  "Loading crampons...  OK",
  "Establishing ridge trail...  OK",
  "Summit link established. Happy climbing.",
];

export const SUMMIT_OS_BOOT_COPY: BootCopy = {
  lines: BOOT_LINES,
  ariaLabel: "SummitOS boot sequence",
  bootingStatus: "Booting SummitOS...",
  awaitingStatus: "Awaiting mountain load...",
  readyStatus: "Summit link established",
  skipLabel: "Skip boot",
};

const LINE_INTERVAL = 500; // ms — brisk but readable
const POST_LINE_PAUSE = 250; // ms after last line before fade
const MAX_BOOT_MS = 6000; // hard ceiling so the site always becomes interactive

export default function MountainBootSequence({
  bootStage,
  onSkip,
  onFinished,
  autoSkip = false,
  copy = SUMMIT_OS_BOOT_COPY,
}: MountainBootSequenceProps) {
  const lines = copy.lines;
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
      setVisibleCount(lines.length);
      return;
    }
    if (exited || skipped) return;

    if (visibleCount < lines.length) {
      const timer = setTimeout(() => {
        setVisibleCount((c) => Math.min(c + 1, lines.length));
      }, LINE_INTERVAL);
      return () => clearTimeout(timer);
    }
  }, [bootStage, visibleCount, exited, skipped, prefersReducedMotion, lines.length]);

  // Fade out only after the boot sequence has played AND the mountain is ready.
  useEffect(() => {
    if (exited || skipped) return;
    if (visibleCount < lines.length) return;
    if (!mountainReady) return;

    const timer = setTimeout(() => setExited(true), POST_LINE_PAUSE);
    return () => clearTimeout(timer);
  }, [visibleCount, mountainReady, exited, skipped, lines.length]);

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
    setVisibleCount(lines.length);
    setExited(true);
    onSkip?.();
  }, [exited, onSkip, lines.length]);

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
  const bootFinished = visibleCount >= lines.length;

  if (exited || skipped) return null;

  return (
    <div
      data-boot-overlay=""
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
      aria-label={copy.ariaLabel}
      aria-modal="true"
    >
      {/* The overlay is part of the prerendered HTML; without JavaScript it
          could never be dismissed, so hide it and leave the page readable. */}
      <noscript>
        <style>{"[data-boot-overlay]{display:none!important}"}</style>
      </noscript>
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
        {copy.title ? (
          <div
            className="mb-4 pb-4"
            style={{ borderBottom: "1px solid rgba(78, 205, 196, 0.16)" }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#4ecdc4",
              }}
            >
              {copy.title}
            </p>
            {copy.subtitle ? (
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#e8ecf1",
                  marginTop: "4px",
                }}
              >
                {copy.subtitle}
              </p>
            ) : null}
          </div>
        ) : null}
        <div
          className="font-mono text-sm leading-7"
          style={{ color: "#4ecdc4" }}
        >
          {lines.map((line, i) => (
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
              {i === lines.length - 1 && i < visibleCount && (
                <span className="mountain-boot-cursor ml-1" />
              )}
            </div>
          ))}
        </div>

        {copy.showProgress ? (
          <div
            aria-hidden="true"
            className="mt-5"
            style={{
              height: "3px",
              borderRadius: "3px",
              background: "rgba(78, 205, 196, 0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round((visibleCount / lines.length) * 100)}%`,
                background: "linear-gradient(90deg, #2d7d8a, #4ecdc4)",
                borderRadius: "3px",
                transition: prefersReducedMotion ? "none" : "width 400ms ease",
              }}
            />
          </div>
        ) : null}
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
              ? copy.awaitingStatus
              : isReady && bootFinished
                ? copy.readyStatus
                : copy.bootingStatus}
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
            {copy.skipLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
