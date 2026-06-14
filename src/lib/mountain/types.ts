import type * as THREE from "three";
import type { Zone } from "@/components/zoneTypes";

export interface MountainData {
  geometry: THREE.BufferGeometry;
  pathPoints: THREE.Vector3[];
  highestX: number;
  highestY: number;
  highestZ: number;
}

export interface MountainHandle {
  triggerReaction: (type: string, payload?: unknown) => void;
}

export interface Marker {
  group: THREE.Group;
  ring: THREE.Mesh;
  portal: THREE.Sprite;
  sprite: THREE.Sprite;
  hoverRing: THREE.Sprite;
  zone: Zone;
  basePosition: THREE.Vector3;
  t: number;
  hovered: boolean;
}

export interface ParticleBounds {
  centerX: number;
  centerZ: number;
  baseY: number;
  topY: number;
  xRange: number;
  zRange: number;
}

export interface Disposable {
  dispose: () => void;
}
