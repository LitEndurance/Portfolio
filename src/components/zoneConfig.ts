import { type Zone } from "./zoneTypes";

export interface ZoneConfig {
  zone: Zone;
  icon: string;
  label: string;
  progressStart: number;
  trailT: number;
  landmark: {
    progress: number;
    angle: number;
    radius: number;
    camY: number;
  };
  cardSide: "left" | "right";
}

// Single source of truth for the six climb zones plus the synthetic city
// trailhead. Derive markers, camera landmarks, progress thresholds, and UI
// labels from this table.
//
// progressStart is tuned so each zone activates when its section top reaches
// the top of the viewport. The orb uses these thresholds to arrive at each
// marker exactly when the user scrolls into the matching zone.
//
// Camera path: the climb starts at the front/center city marker, swings up
// the left ridge, then arcs back to the right for the summit reveal. Radius
// shrinks as we ascend so the camera zooms in on each location, while camY
// rises only slightly so it never drifts high above the mountain.
export const ZONES: ZoneConfig[] = [
  {
    zone: "hero",
    icon: "🏔️",
    label: "Trailhead",
    progressStart: 0,
    trailT: 0.06,
    // Hero shares the city marker position at the front/center base; the
    // camera begins to swing left toward the gear wall during this section.
    landmark: { progress: 0.08, angle: 1.65, radius: 25, camY: 3.5 },
    cardSide: "left",
  },
  {
    zone: "about",
    icon: "🚩",
    label: "Base Camp",
    progressStart: 0.14,
    trailT: 0.18,
    landmark: { progress: 0.16, angle: 2.4, radius: 19, camY: 4.5 },
    cardSide: "right",
  },
  {
    zone: "skills",
    icon: "⛏️",
    label: "Gear Wall",
    progressStart: 0.28,
    trailT: 0.36,
    landmark: { progress: 0.30, angle: 2.7, radius: 15, camY: 5.5 },
    cardSide: "left",
  },
  {
    zone: "projects",
    icon: "🏔️",
    label: "Summit Log",
    progressStart: 0.44,
    trailT: 0.55,
    landmark: { progress: 0.46, angle: 0.5, radius: 12, camY: 6.5 },
    cardSide: "right",
  },
  {
    zone: "gallery",
    icon: "📸",
    label: "Trail Markers",
    progressStart: 0.63,
    trailT: 0.74,
    landmark: { progress: 0.65, angle: 0.1, radius: 10, camY: 7.5 },
    cardSide: "left",
  },
  {
    zone: "contact",
    icon: "📡",
    label: "Summit",
    progressStart: 0.94,
    trailT: 0.9,
    // Summit close-up that already begins the slow pull-back toward the
    // trailhead. Keep this wide-ish; the final frame finishes the zoom-out.
    landmark: { progress: 0.96, angle: 0.1, radius: 14, camY: 8 },
    cardSide: "left",
  },
];

export const ALL_ZONES: Zone[] = ZONES.map((z) => z.zone);

export function progressToZone(progress: number): Zone {
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (progress >= ZONES[i].progressStart) return ZONES[i].zone;
  }
  return ZONES[0].zone;
}

export function zoneTrailT(zone: Zone): number {
  return ZONES.find((z) => z.zone === zone)?.trailT ?? 0;
}

export const ZONE_LABELS: Record<Zone, string> = ZONES.reduce((acc, z) => {
  acc[z.zone] = z.label;
  return acc;
}, {} as Record<Zone, string>);
