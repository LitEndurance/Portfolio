/**
 * GPU-driven particle shaders for the mountain scene.
 *
 * Snow and stars live in a single BufferGeometry and are distinguished by the
 * `aType` attribute (0 = snow, 1 = star). All motion is computed on the GPU so
 * the JavaScript side only uploads a time uniform each frame.
 */

const PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSnowBottom;
  uniform float uSnowTop;
  uniform float uGlobalOpacity;

  attribute float aType;
  attribute float aSeed;
  attribute vec3 aVelocity;
  attribute float aPhase;
  attribute vec3 aColor;
  attribute float aSize;

  varying vec3 vColor;
  varying float vAlpha;

  // 1D hash helper used for per-particle variation.
  float hash1(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
  }

  void main() {
    vColor = aColor;

    float isStar = step(0.5, aType);
    float isSnow = 1.0 - isStar;

    vec3 pos = position;

    // ── Snow animation ─────────────────────────────────────────
    // Layered wind: a global low-frequency breeze plus per-particle drift.
    float t = uTime + aSeed * 100.0;
    float heightNorm = (pos.y - uSnowBottom) / max(1.0, uSnowTop - uSnowBottom);

    // Gentle horizontal wind with two frequency layers.
    float windX = sin(t * 0.35 + aPhase) * 0.12 + sin(t * 0.92 + aSeed * 3.0) * 0.04;
    float windZ = cos(t * 0.28 + aPhase * 0.7) * 0.08 + cos(t * 1.1 + aSeed * 2.0) * 0.03;

    // Per-particle meander.
    float driftX = sin(t * 0.5 + aSeed * 10.0) * 0.05;
    float driftZ = cos(t * 0.4 + aSeed * 8.0) * 0.05;

    // Falling motion driven by velocity attribute plus a gravity bias.
    float fall = aVelocity.y * uTime + (0.02 + hash1(aSeed) * 0.03) * uTime;

    // Compute wrapped height with a soft fade band near the bottom seam.
    float snowHeight = pos.y - fall;
    float range = max(1.0, uSnowTop - uSnowBottom);
    float wrappedY = uSnowBottom + mod(snowHeight - uSnowBottom, range);

    // Fade particles briefly as they cross the reset seam.
    float cycle = mod(snowHeight - uSnowBottom, range);
    float seamFade = smoothstep(0.0, range * 0.08, cycle) * (1.0 - smoothstep(range * 0.92, range, cycle));

    pos.x = pos.x + (windX + driftX) * heightNorm;
    pos.z = pos.z + (windZ + driftZ) * heightNorm;
    pos.y = mix(pos.y, wrappedY, isSnow);

    // ── Star animation ─────────────────────────────────────────
    // Very slow independent drift to avoid a static dome.
    float starT = uTime * 0.03 + aSeed * 50.0;
    float starDriftX = sin(starT + aPhase) * 0.15;
    float starDriftY = cos(starT * 0.7 + aSeed * 6.0) * 0.08;
    float starDriftZ = sin(starT * 0.5 + aSeed * 4.0) * 0.12;

    pos.x = mix(pos.x, pos.x + starDriftX, isStar);
    pos.y = mix(pos.y, pos.y + starDriftY, isStar);
    pos.z = mix(pos.z, pos.z + starDriftZ, isStar);

    // ── Alpha computation ──────────────────────────────────────
    // Multi-frequency twinkle for stars; gentle shimmer for snow.
    float starTwinkle =
      0.5
      + 0.25 * sin(uTime * 1.4 + aPhase)
      + 0.15 * sin(uTime * 2.7 + aSeed * 20.0)
      + 0.10 * sin(uTime * 4.3 + aSeed * 35.0);

    float snowShimmer = 0.75 + 0.15 * sin(uTime * 0.8 + aPhase);

    float baseAlpha = mix(snowShimmer * seamFade, starTwinkle, isStar);
    vAlpha = clamp(baseAlpha * uGlobalOpacity, 0.0, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Distance attenuation keeps particles readable at all camera distances.
    float attenuation = 300.0 / -mvPosition.z;
    gl_PointSize = max(1.0, aSize * attenuation);
  }
`;

const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTexture;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // UV centered around the particle point.
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);

    // Soft circular particle with a tiny highlight in the center.
    float alpha = smoothstep(0.5, 0.2, dist);
    alpha *= 0.85 + 0.15 * smoothstep(0.15, 0.0, dist);

    vec4 tex = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(vColor, vAlpha * alpha * tex.a);

    if (gl_FragColor.a < 0.01) discard;
  }
`;

export { PARTICLE_VERTEX_SHADER, PARTICLE_FRAGMENT_SHADER };
