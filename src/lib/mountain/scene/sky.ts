import * as THREE from "three";

const SKY_TOP = 0x101440;
const SKY_MID = 0x201860;
const SKY_BOTTOM = 0x402860;

export function createSkyGradient(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to create 2D canvas context for sky gradient");
  }

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, `#${new THREE.Color(SKY_TOP).getHexString()}`);
  grad.addColorStop(0.45, `#${new THREE.Color(SKY_MID).getHexString()}`);
  grad.addColorStop(1, `#${new THREE.Color(SKY_BOTTOM).getHexString()}`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
