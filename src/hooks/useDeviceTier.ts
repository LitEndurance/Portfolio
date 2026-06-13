"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "low" | "medium" | "high";

export interface DeviceCapabilities {
  tier: DeviceTier;
  supportsWebGL: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  memoryGb: number | null;
  cores: number | null;
  connectionType: string | null;
}

function getConnectionType(): string | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
    };
  };
  return nav.connection?.effectiveType ?? null;
}

function getSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
  };
  return nav.connection?.saveData ?? false;
}

function supportsWebGL(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function computeTier(
  reducedMotion: boolean,
  saveData: boolean,
  memoryGb: number | null,
  cores: number | null,
  connectionType: string | null,
  webgl: boolean
): DeviceTier {
  if (!webgl) return "low";
  if (saveData) return "low";
  if (reducedMotion) return "low";

  const slowConnection = ["slow-2g", "2g"].includes(connectionType ?? "");
  if (slowConnection) return "low";

  // Treat missing memory/core signals conservatively on slow connections.
  const lowMemory = memoryGb !== null && memoryGb < 4;
  const lowCores = cores !== null && cores < 4;

  if (lowMemory || lowCores) return "medium";

  return "high";
}

export function useDeviceTier(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => {
    const reducedMotion =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
    const memoryGb =
      typeof navigator !== "undefined" && "deviceMemory" in navigator
        ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null
        : null;
    const cores =
      typeof navigator !== "undefined" && "hardwareConcurrency" in navigator
        ? navigator.hardwareConcurrency || null
        : null;

    const webgl = supportsWebGL();
    const saveData = getSaveData();
    const connectionType = getConnectionType();

    return {
      tier: computeTier(reducedMotion, saveData, memoryGb, cores, connectionType, webgl),
      supportsWebGL: webgl,
      reducedMotion,
      saveData,
      memoryGb,
      cores,
      connectionType,
    };
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = () => {
      setCapabilities((prev) => {
        const next = {
          ...prev,
          reducedMotion: reducedMotion.matches,
        };
        next.tier = computeTier(
          next.reducedMotion,
          next.saveData,
          next.memoryGb,
          next.cores,
          next.connectionType,
          next.supportsWebGL
        );
        return next;
      });
    };

    reducedMotion.addEventListener("change", handleMotionChange);
    return () => reducedMotion.removeEventListener("change", handleMotionChange);
  }, []);

  return capabilities;
}
