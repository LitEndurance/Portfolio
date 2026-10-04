"use client";

import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MountainBootSequence, { type BootCopy } from "@/components/MountainBootSequence";
import { useClimb } from "@/components/ClimbContext";
import { useDeviceTier } from "@/hooks/useDeviceTier";

// Same boot overlay as the infrastructure trail, worded for the websites
// page. The lines only describe what the page is doing while the mountain
// loads (no claims), and keep the same count so the timing matches.
const SITES_BOOT_COPY: BootCopy = {
  lines: [
    "🥾  Trailhead: Websites",
    "Loading the mountain...  OK",
    "Marking the switchbacks...  OK",
    "Placing section markers...  OK",
    "Unpacking the case study...  OK",
    "Trail ready. Enjoy the climb.",
  ],
  ariaLabel: "Websites trail loading screen",
  bootingStatus: "Loading trail...",
  awaitingStatus: "Awaiting mountain load...",
  readyStatus: "Trail ready",
  skipLabel: "Skip intro",
  title: "William Barnhart",
  subtitle: "Websites for local businesses",
  showProgress: true,
};

/**
 * Boot / initialization screen for /websites. Mirrors the infrastructure
 * page's BootLockedContent: plays on every visit (there is no once-per-session
 * memory on either page), any key or the skip button dismisses it, it
 * auto-skips on low-tier devices and with reduced motion, it never stays up
 * longer than 6 s, and page scroll is locked while it is showing. The
 * websites page has no terminal, status bar, or ambient audio, so there is
 * nothing else to reveal afterwards.
 */
export default function SitesBootScreen() {
  const { bootStage, setBootStage } = useClimb();
  const { tier, reducedMotion } = useDeviceTier();
  const [overlayDone, setOverlayDone] = useState(false);
  const autoSkipBoot = tier === "low" || reducedMotion;

  // Flag low-tier devices so CSS can swap out GPU-expensive effects
  // (e.g. backdrop-filter blur) for cheap solid alternatives.
  useEffect(() => {
    document.body.classList.toggle("low-tier", tier === "low");
    return () => document.body.classList.remove("low-tier");
  }, [tier]);

  // Lock body scroll while the boot overlay is up so the user can't scroll
  // past it or interact with page content underneath it. Keyed to the
  // overlay itself rather than the mountain load, so a skipped or auto-skipped
  // intro never leaves the page locked while the mountain is still loading.
  useEffect(() => {
    if (!overlayDone) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [overlayDone]);

  // Re-measure the mountain's scroll range once the page is scrollable again
  // (the scrollbar reappearing can reflow the sections).
  useEffect(() => {
    if (overlayDone || bootStage === "ready") ScrollTrigger.refresh();
  }, [overlayDone, bootStage]);

  return (
    <MountainBootSequence
      bootStage={bootStage}
      onSkip={() => setBootStage("ready")}
      onFinished={() => setOverlayDone(true)}
      autoSkip={autoSkipBoot}
      copy={SITES_BOOT_COPY}
    />
  );
}
