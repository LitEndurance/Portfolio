"use client";

import { useClimb } from "@/components/ClimbContext";
import { ZONES, ZONE_LABELS } from "@/components/zoneConfig";
import { type Zone } from "@/components/zoneTypes";

const ZONE_ICONS: Record<Zone, string> = ZONES.reduce((acc, z) => {
  acc[z.zone] = z.icon;
  return acc;
}, {} as Record<Zone, string>);

export default function ClimbStatusBar() {
  const { currentZone, altitude, checkpoints, triggerReaction } = useClimb();

  const zone = currentZone ?? null;
  const label = zone ? ZONE_LABELS[zone] : "Booting...";
  const icon = zone ? ZONE_ICONS[zone] : "⛰️";

  return (
    <div
      className="status-bar-slide-in fixed left-0 right-0 bottom-0 z-[45] flex items-center justify-between px-3 sm:px-4"
      style={{
        height: "28px",
        background: "rgba(6, 10, 20, 0.88)",
        borderTop: "1px solid rgba(78, 205, 196, 0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        fontFamily: "var(--font-mono)",
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <span
          className="flex items-center gap-1.5 truncate"
          style={{
            fontSize: "11px",
            color: "#4ecdc4",
            letterSpacing: "0.04em",
          }}
          title={label}
        >
          <span aria-hidden="true">{icon}</span>
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{zone ? zone.charAt(0).toUpperCase() + zone.slice(1) : "—"}</span>
        </span>

        <span
          style={{
            fontSize: "10px",
            color: "rgba(78, 205, 196, 0.55)",
            letterSpacing: "0.04em",
          }}
        >
          ALT {altitude.toLocaleString()}m
        </span>

        <span
          style={{
            fontSize: "10px",
            color: checkpoints.size === 6 ? "#4ecdc4" : "rgba(212, 168, 67, 0.8)",
            letterSpacing: "0.04em",
          }}
        >
          CP {checkpoints.size}/6
        </span>
      </div>

      <button
        type="button"
        onClick={() => triggerReaction("toggle-terminal")}
        className="focus-ring flex items-center gap-1.5"
        style={{
          fontSize: "10px",
          color: "rgba(78, 205, 196, 0.7)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 6px",
          borderRadius: "3px",
        }}
        aria-label="Toggle Summit Terminal"
      >
        <span aria-hidden="true">⌨️</span>
        <span className="hidden sm:inline">Terminal</span>
      </button>
    </div>
  );
}
