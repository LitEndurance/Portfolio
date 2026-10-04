/** The two pages that climb the shared mountain, each on its own route. */
export type TrailId = "infrastructure" | "websites";

/** Ambient scene reaction played as the orb enters a stop. */
export type CheckpointEffect = "flicker" | "rockfall" | "aurora" | "summit" | "none";

export interface CameraLandmark {
  /** Scroll progress (0..1) at which the camera reaches this pose. */
  progress: number;
  /** Azimuth around the mountain center (pi/2 = front, 0 = east, -pi/2 = back). */
  angle: number;
  /** Horizontal distance from the mountain center. */
  radius: number;
  /** Camera height above the look-at target. */
  camY: number;
}

/** One page section along a trail: its zone threshold, label, and camera pose. */
export interface TrailStop {
  /** Section element id on the page (also the hoop tag in the route JSON). */
  id: string;
  icon: string;
  label: string;
  /** Scroll progress at which this stop becomes active (and the orb reaches its hoop). */
  progressStart: number;
  landmark: CameraLandmark;
  effect: CheckpointEffect;
}
