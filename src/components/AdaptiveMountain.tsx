"use client";

import dynamic from "next/dynamic";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import Mountain3DFallback from "@/components/Mountain3DFallback";
import type { MountainHandle } from "@/components/Mountain3D";
import type { TrailId } from "@/components/trailTypes";
import { forwardRef } from "react";

const Mountain3DDynamic = dynamic(
  () => import("@/components/Mountain3D"),
  {
    ssr: false,
    loading: () => <Mountain3DFallback />,
  }
);

interface AdaptiveMountainProps {
  /** Which page's hoop route the mountain climbs (see trails.ts). */
  trail?: TrailId;
}

const AdaptiveMountain = forwardRef<MountainHandle, AdaptiveMountainProps>(
  function AdaptiveMountain({ trail = "infrastructure" }, ref) {
    const { tier, supportsWebGL } = useDeviceTier();

    // Always attempt the 3D scene. If WebGL is unavailable, fall back to the
    // static gradient so the page still renders.
    if (!supportsWebGL) {
      return <Mountain3DFallback />;
    }

    return <Mountain3DDynamic ref={ref} quality={tier} trail={trail} />;
  }
);

export default AdaptiveMountain;
