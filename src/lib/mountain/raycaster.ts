import * as THREE from "three";
import type { Marker, Disposable } from "@/lib/mountain/types";

export class MarkerRaycaster implements Disposable {
  private readonly raycaster: THREE.Raycaster;
  private readonly camera: THREE.Camera;
  private readonly markers: Marker[];
  private readonly pointer: THREE.Vector2;
  private hoveredMarker: Marker | null = null;

  constructor(camera: THREE.Camera, markers: Marker[]) {
    this.raycaster = new THREE.Raycaster();
    this.camera = camera;
    this.markers = markers;
    this.pointer = new THREE.Vector2(-999, -999);
    this.hoveredMarker = null;
  }

  updatePointer(clientX: number, clientY: number, width: number, height: number): void {
    this.pointer.x = (clientX / width) * 2 - 1;
    this.pointer.y = -(clientY / height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    if (this.markers.length === 0) {
      this.hoveredMarker = null;
      return;
    }

    const hitSprites = this.markers.map((marker) => marker.sprite);
    const intersects = this.raycaster.intersectObjects(hitSprites);

    if (intersects.length > 0 && intersects[0].object) {
      const hit = intersects[0].object as THREE.Sprite;
      this.hoveredMarker = this.markers.find((marker) => marker.sprite === hit) ?? null;
    } else {
      this.hoveredMarker = null;
    }
  }

  getHoveredMarker(): Marker | null {
    return this.hoveredMarker;
  }

  dispose(): void {
    this.hoveredMarker = null;
    this.pointer.set(-999, -999);
  }
}
