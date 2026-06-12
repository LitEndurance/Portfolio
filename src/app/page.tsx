"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Header from "@/components/Header";
import Mountain3D, { type MountainHandle } from "@/components/Mountain3D";
import MountainBootSequence from "@/components/MountainBootSequence";
import SummitTerminal from "@/components/SummitTerminal";
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
import { ClimbProvider, useClimb } from "@/components/ClimbContext";

gsap.registerPlugin(ScrollTrigger);

// Keep the app and Mountain3D ScrollTrigger in sync with Lenis.
// Initialized only after the boot overlay is dismissed so the body is
// scrollable when Lenis measures the page.
function LenisScrollSync() {
  const { bootStage } = useClimb();

  useEffect(() => {
    if (bootStage !== "ready") return;

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
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Re-calculate ScrollTrigger ranges now that the page is fully
    // interactive and scrollable.
    ScrollTrigger.refresh();

    lenisInstance.current = lenis;

    return () => {
      lenisInstance.current = null;
      lenis.destroy();
    };
  }, [bootStage]);

  return null;
}

function BootLockedContent({
  mountainRef,
}: {
  mountainRef: React.RefObject<MountainHandle | null>;
}) {
  const { bootStage, setBootStage } = useClimb();
  const isBooting = bootStage !== "ready";

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

  return (
    <ClimbProvider>
      <SoundEvents />
      <LenisScrollSync />
      <main className="pb-8">
        <Mountain3D ref={mountainRef} />
        <div id="hero" className="relative z-[2]"><HeroSection /></div>
        <div className="relative z-[2]">
          <div id="about"><AboutSection /></div>
          <div id="skills"><SkillsGridSection /></div>
          <div id="projects"><ProjectsSection /></div>
          <div id="gallery"><GallerySection /></div>
          <div id="contact"><ContactSection /></div>
          <Footer />
        </div>
        <BootLockedContent mountainRef={mountainRef} />
      </main>
    </ClimbProvider>
  );
}
