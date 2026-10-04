"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Header from "@/components/Header";
import { type MountainHandle } from "@/components/Mountain3D";
import AdaptiveMountain from "@/components/AdaptiveMountain";
import MountainBootSequence from "@/components/MountainBootSequence";
import dynamic from "next/dynamic";
const SummitTerminal = dynamic(() => import("@/components/SummitTerminal"), {
  ssr: false,
});
import ClimbStatusBar from "@/components/ClimbStatusBar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SkillsGridSection from "@/components/SkillsGridSection";
import ProjectsSection from "@/components/ProjectsSection";
import GallerySection from "@/components/GallerySection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { soundEngine } from "@/lib/soundEngine";
import { lenisInstance } from "@/lib/lenisInstance";
import SoundEvents from "@/components/SoundEvents";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { ClimbProvider, useClimb } from "@/components/ClimbContext";

gsap.registerPlugin(ScrollTrigger);

// Keep the app and Mountain3D ScrollTrigger in sync with Lenis.
// Initialized only after the boot overlay is dismissed so the body is
// scrollable when Lenis measures the page.
function LenisScrollSync() {
  const { bootStage } = useClimb();
  const { tier } = useDeviceTier();

  useEffect(() => {
    if (bootStage !== "ready") return;

    // On low-end devices, native scroll is smoother and lighter than Lenis +
    // GSAP ticker + Three.js RAF all competing for the main thread.
    if (tier === "low") {
      ScrollTrigger.defaults({ markers: false });
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(2, -10 * t),
      orientation: "vertical",
      smoothWheel: true,
    });
    lenis.on("scroll", (e: { velocity: number }) => {
      ScrollTrigger.update();
      soundEngine.setScrollVelocity(Math.abs(e.velocity));
    });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Re-calculate ScrollTrigger ranges now that the page is fully
    // interactive and scrollable.
    ScrollTrigger.refresh();

    lenisInstance.current = lenis;

    return () => {
      // Leaving the page (e.g. "All trails" back to /) must not leave the
      // ticker driving a destroyed Lenis, or stack another one on re-entry.
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenisInstance.current = null;
      lenis.destroy();
    };
  }, [bootStage, tier]);

  return null;
}

function BootLockedContent({
  mountainRef,
}: {
  mountainRef: React.RefObject<MountainHandle | null>;
}) {
  const { bootStage, setBootStage, soundEnabled, soundVolume } = useClimb();
  const { tier, reducedMotion } = useDeviceTier();
  const [bootFinished, setBootFinished] = useState(false);
  const isBooting = bootStage !== "ready";
  const autoSkipBoot = tier === "low" || reducedMotion;

  // Flag low-tier devices so CSS can swap out GPU-expensive effects
  // (e.g. backdrop-filter blur) for cheap solid alternatives.
  useEffect(() => {
    document.body.classList.toggle("low-tier", tier === "low");
    return () => document.body.classList.remove("low-tier");
  }, [tier]);

  // Start the ambient audio fade-in once the boot overlay has fully finished.
  // The audio graph is already initialized, so this just resumes the context
  // (if the browser allows) and ramps the master/wind gains up smoothly.
  useEffect(() => {
    if (!bootFinished) return;
    if (!soundEnabled) return;
    soundEngine.fadeIn(soundVolume);
  }, [bootFinished, soundEnabled, soundVolume]);

  // Lock body scroll while the boot sequence is running so the user can't
  // scroll past the overlay or interact with page content underneath it.
  useEffect(() => {
    if (isBooting) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isBooting]);

  return (
    <>
      <MountainBootSequence
        bootStage={bootStage}
        onSkip={() => setBootStage("ready")}
        onFinished={() => setBootFinished(true)}
        autoSkip={autoSkipBoot}
      />
      {/* Fixed UI is hidden until boot completes so nothing peeks above or
          receives focus/screen-reader attention while the overlay is up. */}
      {bootStage === "ready" && (
        <>
          <Header />
          <SummitTerminal mountainRef={mountainRef} />
          <ClimbStatusBar />
        </>
      )}
    </>
  );
}

export default function Home() {
  const mountainRef = useRef<MountainHandle>(null);

  // The sound engine is a module singleton that outlives this page on
  // client-side navigation, so silence it when leaving the trail; the boot
  // fade-in starts it again on the next visit.
  useEffect(() => () => soundEngine.stop(), []);

  return (
    <ClimbProvider>
      {/* Preload the mountain geometry so the 3D scene initializes sooner.
          Lives on this page only, not the root layout, so other routes don't
          download 9.6 MB of geometry they never use. */}
      <link rel="preload" href="/mountain.bin.gz" as="fetch" crossOrigin="anonymous" />
      <SoundEvents />
      <LenisScrollSync />
      <main className="pb-8">
        <AdaptiveMountain ref={mountainRef} trail="infrastructure" />
        {/* Boot overlay + fixed header/terminal/status bar. All fixed
            position, so sitting first only puts the header (and its
            "All trails" link) first in keyboard order. */}
        <BootLockedContent mountainRef={mountainRef} />
        <div id="hero" className="relative z-[2]"><HeroSection /></div>
        <div className="relative z-[2]">
          <div id="about"><AboutSection /></div>
          <div id="skills"><SkillsGridSection /></div>
          <div id="projects"><ProjectsSection /></div>
          <div id="gallery"><GallerySection /></div>
          <div id="contact"><ContactSection /></div>
          <Footer />
        </div>
      </main>
    </ClimbProvider>
  );
}
