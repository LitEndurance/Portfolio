import { type Zone } from "./zoneTypes";

export interface ZoneConfig {
  zone: Zone;
  icon: string;
  label: string;
  progressStart: number;
  landmark: {
    progress: number;
    angle: number;
    radius: number;
    camY: number;
  };
  cardSide: "left" | "right";
}

// Single source of truth for the six climb zones of the /infrastructure trail
// plus the synthetic city trailhead. (The /websites trail has its own stops in
// websitesZoneConfig.ts; trails.ts combines both for Mountain3D.) Derive
// markers, camera landmarks, progress thresholds, and UI labels from this
// table.
//
// progressStart is tuned so each zone activates when its section top reaches
// the top of the viewport. Re-measure with a desktop viewport (1440 or 1920
// wide) after changing section heights on /infrastructure; values last
// re-tuned after the card/gallery grid cleanup, keeping each zone's original
// offset from its section top. The orb uses these thresholds to arrive at each
// marker hoop exactly when the user scrolls into the matching zone. Hoop
// positions live in hoopRoutes/infrastructure.json.
//
// Camera path: the hoops spiral counter-clockwise (seen from above) around the
// peak (front base -> east wall -> back face -> west shoulder -> summit), so
// the camera makes one full orbit while it climbs. `angle` is the azimuth
// around the mountain center (pi/2 = front, 0 = east, -pi/2 = back, -pi =
// west); values keep decreasing so the camera never swings back the short way
// mid-climb. Each landmark sits just outside its hoop so the hoop stays framed
// and unobstructed, radius shrinks as we ascend, and camY lifts the camera
// over the east peak while the orb crosses the gully behind it.
export const ZONES: ZoneConfig[] = [
  {
    zone: "hero",
    icon: "🏔️",
    label: "Trailhead",
    progressStart: 0,
    // Hero shares the Base Camp hoop at the front/center base; the camera
    // begins to drift right toward the east wall during this section.
    landmark: { progress: 0.08, angle: 1.5, radius: 25, camY: 3.5 },
    cardSide: "left",
  },
  {
    zone: "about",
    icon: "🚩",
    label: "Base Camp",
    progressStart: 0.155,
    landmark: { progress: 0.175, angle: 1.1, radius: 19, camY: 4.5 },
    cardSide: "right",
  },
  {
    zone: "skills",
    icon: "⛏️",
    label: "Gear Wall",
    progressStart: 0.31,
    landmark: { progress: 0.33, angle: 0.45, radius: 15, camY: 7.5 },
    cardSide: "left",
  },
  {
    zone: "projects",
    icon: "🏔️",
    label: "Summit Log",
    progressStart: 0.5,
    landmark: { progress: 0.51, angle: -1.3, radius: 13, camY: 7 },
    cardSide: "right",
  },
  {
    zone: "gallery",
    icon: "📸",
    label: "Trail Markers",
    progressStart: 0.73,
    landmark: { progress: 0.75, angle: -2.65, radius: 11, camY: 6.5 },
    cardSide: "left",
  },
  {
    zone: "contact",
    icon: "📡",
    label: "Summit",
    progressStart: 0.935,
    // Summit close-up from the west shoulder that already begins the slow
    // pull-back toward the trailhead. Keep this wide-ish; the final frame
    // finishes the zoom-out.
    landmark: { progress: 0.96, angle: -3.4, radius: 15, camY: 5 },
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

export const ZONE_LABELS: Record<Zone, string> = ZONES.reduce((acc, z) => {
  acc[z.zone] = z.label;
  return acc;
}, {} as Record<Zone, string>);
