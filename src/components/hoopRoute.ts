import infrastructureRoute from "./hoopRoutes/infrastructure.json";
import websitesRoute from "./hoopRoutes/websites.json";

export interface HoopRoutePoint {
  x: number;
  y: number;
  z: number;
  /** Trail stop (section id) whose marker hoop sits on this point; via points have none. */
  hoop?: string;
  label?: string;
}

export interface HoopRoute {
  points: readonly HoopRoutePoint[];
  /** Index of each hoop in `points`, in climb order. */
  hoopIndices: readonly number[];
  /**
   * Catmull-Rom parameter (0..1) of each hoop. CatmullRomCurve3.getPoint maps
   * t uniformly over control points, so a hoop at index i sits exactly at
   * i / (n - 1) and the orb passes through it precisely.
   */
  hoopCurveT: readonly number[];
}

function buildRoute(points: readonly HoopRoutePoint[]): HoopRoute {
  const hoopIndices = points.flatMap((p, i) => (p.hoop ? [i] : []));
  return {
    points,
    hoopIndices,
    hoopCurveT: hoopIndices.map((i) => i / (points.length - 1)),
  };
}

// Each page climbs its own route: the marker hoops and the orb that climbs
// through them follow these points. Data lives in hoopRoutes/*.json so
// scripts/test-orb-path.cjs can validate the exact same points against the
// mountain heightmap.
export const INFRASTRUCTURE_ROUTE = buildRoute(
  infrastructureRoute.points as HoopRoutePoint[]
);
export const WEBSITES_ROUTE = buildRoute(websitesRoute.points as HoopRoutePoint[]);

/**
 * Route point for a trail stop. Stops without a hoop of their own share the
 * hoop of the closest earlier stop (the infrastructure hero zone shares Base
 * Camp at the trailhead), falling back to the first route point.
 */
export function hoopPointForStop(
  route: HoopRoute,
  stopIds: readonly string[],
  stopId: string
): HoopRoutePoint {
  for (let i = stopIds.indexOf(stopId); i >= 0; i--) {
    const hoop = route.points.find((p) => p.hoop === stopIds[i]);
    if (hoop) return hoop;
  }
  return route.points[0];
}
