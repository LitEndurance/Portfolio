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

interface WebGLInfo {
  supported: boolean;
  software: boolean;
}

function getWebGLInfo(): WebGLInfo {
  if (typeof window === "undefined") return { supported: true, software: false };
  try {
    if (!window.WebGLRenderingContext) return { supported: false, software: false };
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return { supported: false, software: false };

    // Detect CPU rasterizers (SwiftShader, llvmpipe, etc). A machine without
    // hardware acceleration reports one of these, and driving the full scene
    // through them needs the low quality profile to stay smooth.
    let software = false;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const rendererName = String(
        gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? ""
      );
      software =
        /swiftshader|llvmpipe|softpipe|software|basic render/i.test(rendererName);
    }

    // Release the probe context so it doesn't count against the browser's
    // WebGL context limit once the real renderer boots.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { supported: true, software };
  } catch {
    return { supported: false, software: false };
  }
}

// The probe result is hardware-fixed, so cache it: re-probing would mean
// creating (and losing) another WebGL context on every reduced-motion change.
let cachedWebGLInfo: WebGLInfo | null = null;
function getCachedWebGLInfo(): WebGLInfo {
  if (!cachedWebGLInfo) cachedWebGLInfo = getWebGLInfo();
  return cachedWebGLInfo;
}

function computeTier(
  reducedMotion: boolean,
  saveData: boolean,
  memoryGb: number | null,
  cores: number | null,
  connectionType: string | null,
  webgl: boolean,
  softwareRenderer: boolean
): DeviceTier {
  if (!webgl) return "low";
  if (softwareRenderer) return "low";
  if (saveData) return "low";
  if (reducedMotion) return "low";

  const lowConnection = ["slow-2g", "2g", "3g"].includes(connectionType ?? "");
  if (lowConnection) return "low";

  // Missing hardware signals is common on privacy-focused browsers; default
  // to medium so fast machines don't get locked into low quality.
  if (memoryGb === null && cores === null) return "medium";

  const lowMemory = memoryGb !== null && memoryGb < 4;
  const lowCores = cores !== null && cores < 4;
  const mediumMemory = memoryGb !== null && memoryGb < 8;

  if (lowMemory || lowCores) return "low";
  if (mediumMemory) return "medium";

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

    const webglInfo = getCachedWebGLInfo();
    const saveData = getSaveData();
    const connectionType = getConnectionType();

    return {
      tier: computeTier(reducedMotion, saveData, memoryGb, cores, connectionType, webglInfo.supported, webglInfo.software),
      supportsWebGL: webglInfo.supported,
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
        const next: DeviceCapabilities = {
          ...prev,
          reducedMotion: reducedMotion.matches,
        };
        next.tier = computeTier(
          next.reducedMotion,
          next.saveData,
          next.memoryGb,
          next.cores,
          next.connectionType,
          next.supportsWebGL,
          getCachedWebGLInfo().software
        );
        return next;
      });
    };

    reducedMotion.addEventListener("change", handleMotionChange);
    return () => reducedMotion.removeEventListener("change", handleMotionChange);
  }, []);

  return capabilities;
}
