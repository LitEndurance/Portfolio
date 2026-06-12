"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, Volume2, VolumeX } from "lucide-react";
import { useClimb } from "@/components/ClimbContext";

const navItems = [
  { id: "about", label: "Base Camp" },
  { id: "skills", label: "Gear" },
  { id: "projects", label: "Summits" },
  { id: "gallery", label: "Photos" },
  { id: "contact", label: "Contact" },
];

function VolumePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { soundEnabled, toggleSound, soundVolume, setSoundVolume } = useClimb();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const percent = Math.round(soundVolume * 100);

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 flex flex-col gap-2"
      style={{
        width: "180px",
        padding: "12px",
        background: "rgba(6, 10, 20, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(78, 205, 196, 0.18)",
        borderRadius: "8px",
        zIndex: 10,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "rgba(78, 205, 196, 0.8)",
          }}
        >
          Audio
        </span>
        <button
          onClick={() => toggleSound()}
          aria-label={soundEnabled ? "Mute" : "Unmute"}
          className="bg-transparent border-none cursor-pointer transition-opacity duration-300 hover:opacity-70"
          style={{ color: "rgba(78, 205, 196, 0.8)", padding: "2px" }}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10) / 100;
            setSoundVolume(v);
            if (!soundEnabled && v > 0) toggleSound();
          }}
          className="w-full cursor-pointer"
          style={{ accentColor: "#4ecdc4" }}
          aria-label="Volume"
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "rgba(78, 205, 196, 0.7)",
            minWidth: "26px",
            textAlign: "right",
          }}
        >
          {percent}%
        </span>
      </div>

      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: "rgba(78, 205, 196, 0.45)",
          lineHeight: 1.4,
        }}
      >
        {soundEnabled ? "Wind & UI sounds" : "Muted"}
      </span>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const { soundEnabled, soundVolume } = useClimb();

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[3] flex items-center justify-between"
      style={{ padding: "20px 5vw" }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#4ecdc4",
        }}
      >
        WILLIAM BARNHART
      </span>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="bg-transparent border-none cursor-pointer transition-opacity duration-300 hover:opacity-70"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(78, 205, 196, 0.7)",
            }}
          >
            {item.label}
          </button>
        ))}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVolumeOpen((v) => !v);
            }}
            aria-label="Audio settings"
            aria-haspopup="true"
            aria-expanded={volumeOpen}
            className="bg-transparent border-none cursor-pointer transition-opacity duration-300 hover:opacity-70"
            style={{ color: "rgba(78, 205, 196, 0.7)", padding: "4px" }}
            title={soundEnabled ? `Volume: ${Math.round(soundVolume * 100)}%` : "Muted"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <VolumePanel open={volumeOpen} onClose={() => setVolumeOpen(false)} />
        </div>
      </nav>

      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden bg-transparent border-none cursor-pointer transition-opacity duration-300 hover:opacity-70"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        style={{ color: "#4ecdc4", padding: "4px" }}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[2] flex flex-col items-center justify-center gap-8"
          style={{
            top: 0,
            background: "rgba(6, 10, 20, 0.96)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={() => setMobileOpen(false)}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="bg-transparent border-none cursor-pointer transition-opacity duration-300 hover:opacity-70"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(78, 205, 196, 0.9)",
              }}
            >
              {item.label}
            </button>
          ))}
          <div className="flex flex-col items-center gap-3 mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVolumeOpen((v) => !v);
              }}
              aria-label="Audio settings"
              className="bg-transparent border-none cursor-pointer transition-opacity duration-300 hover:opacity-70"
              style={{ color: "rgba(78, 205, 196, 0.7)", padding: "4px" }}
            >
              {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
            <VolumePanel open={volumeOpen} onClose={() => setVolumeOpen(false)} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "rgba(78, 205, 196, 0.5)",
              }}
            >
              {soundEnabled ? `${Math.round(soundVolume * 100)}%` : "Muted"}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
