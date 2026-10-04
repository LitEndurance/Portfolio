import { ZONES } from "./zoneConfig";
import { WEBSITES_STOPS } from "./websitesZoneConfig";
import {
  INFRASTRUCTURE_ROUTE,
  WEBSITES_ROUTE,
  hoopPointForStop,
  type HoopRoute,
  type HoopRoutePoint,
} from "./hoopRoute";
import type { CameraLandmark, CheckpointEffect, TrailId, TrailStop } from "./trailTypes";
import type { Zone } from "./zoneTypes";

export type { TrailId, TrailStop } from "./trailTypes";

export interface TrailConfig {
  id: TrailId;
  /** Page sections in scroll order. */
  stops: readonly TrailStop[];
  route: HoopRoute;
  /** Mid pull-back pose between the last stop and the fixed final frame. */
  pullBack: CameraLandmark;
  /**
   * Whether entering a stop updates the summit-climb game (ClimbContext zones
   * and checkpoints, persisted to localStorage). Only the infrastructure page
   * runs that game; /websites must not write its section ids into it.
   */
  tracksClimb: boolean;
}

const INFRA_EFFECTS: Record<Zone, CheckpointEffect> = {
  hero: "flicker", // warm flicker as the orb leaves the Base Camp lights
  about: "none",
  skills: "rockfall", // loose rockfall from the gear wall
  projects: "aurora", // icy flare + aurora ripple
  gallery: "none",
  contact: "summit",
};

export const TRAILS: Record<TrailId, TrailConfig> = {
  infrastructure: {
    id: "infrastructure",
    stops: ZONES.map((z) => ({
      id: z.zone,
      icon: z.icon,
      label: z.label,
      progressStart: z.progressStart,
      landmark: z.landmark,
      effect: INFRA_EFFECTS[z.zone],
    })),
    route: INFRASTRUCTURE_ROUTE,
    // Keep orbiting west past the summit before easing back to the front.
    pullBack: { progress: 0.975, angle: -4.0, radius: 18, camY: 7 },
    tracksClimb: true,
  },
  websites: {
    id: "websites",
    stops: WEBSITES_STOPS,
    route: WEBSITES_ROUTE,
    // Stay in front of the mountain; just back away from the summit.
    pullBack: { progress: 0.98, angle: 1.68, radius: 18, camY: 6 },
    tracksClimb: false,
  },
};

/** Index of the stop active at a scroll progress (0..1). */
export function stopIndexAt(trail: TrailConfig, progress: number): number {
  for (let i = trail.stops.length - 1; i >= 0; i--) {
    if (progress >= trail.stops[i].progressStart) return i;
  }
  return 0;
}

/** Route point for a stop on this trail (stops without a hoop share the previous one). */
export function trailHoopPoint(trail: TrailConfig, stopId: string): HoopRoutePoint {
  return hoopPointForStop(
    trail.route,
    trail.stops.map((s) => s.id),
    stopId
  );
}

/**
 * Scroll progress at which the orb reaches each route hoop, in climb order:
 * the first hoop is the trailhead (progress 0); every later hoop is reached
 * when its stop begins.
 */
export function orbThresholds(trail: TrailConfig): number[] {
  return trail.route.hoopIndices.map((pointIndex, k) => {
    if (k === 0) return 0;
    const stop = trail.stops.find((s) => s.id === trail.route.points[pointIndex].hoop);
    if (!stop) throw new Error(`Hoop ${trail.route.points[pointIndex].hoop} has no stop on the ${trail.id} trail`);
    return stop.progressStart;
  });
}
