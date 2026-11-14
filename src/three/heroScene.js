import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  NormalBlending,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { createBase, lerp, simplexNoise } from "./base";

// A noise-displaced particle sphere + orbit ring. All motion is computed in the
// vertex shader, so the CPU cost per frame is a handful of uniform updates.

// Dark: glowing additive light. Light: additive light washes out to white on
// a pale page, so particles become deeper "ink" dots with normal blending.
const THEMES = {
  dark: { a: "#6366f1", b: "#5fd6f6", opacity: 1, blending: AdditiveBlending },
  light: { a: "#4338ca", b: "#0891b2", opacity: 0.85, blending: NormalBlending },
};

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform float uPixelRatio;
uniform float uSize;
uniform vec3 uPointer;
uniform float uShock;      // 0 → 1 progress of a click shockwave (1 = idle)
uniform vec3 uShockDir;
attribute float aRandom;
varying float vMix;
varying float vAlpha;
${simplexNoise}
void main() {
  vec3 p = position;
  vec3 dir = normalize(p);
  float n = snoise(p * 1.1 + vec3(uTime * 0.22));
  float n2 = snoise(p * 2.6 - vec3(uTime * 0.12));
  float disp = n * 0.26 + n2 * 0.07;

  // Pointer "pull": particles facing the cursor swell outward.
  float facing = max(dot(dir, normalize(uPointer)), 0.0);
  disp += pow(facing, 6.0) * 0.35;

  // Shockwave: a ring that races across the sphere from the click point.
  float ang = acos(clamp(dot(dir, normalize(uShockDir)), -1.0, 1.0));
  float band = exp(-pow((ang - uShock * 3.6) * 3.2, 2.0));
  disp += band * (1.0 - uShock) * (0.55 + aRandom * 0.6);

  p += dir * disp;
  // Scroll: particles drift apart as the hero leaves the viewport.
  p += dir * uProgress * (1.2 + aRandom * 3.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (0.55 + aRandom * 0.9) / -mv.z;

  vMix = clamp(n * 0.5 + 0.5 + facing * 0.25, 0.0, 1.0);
  vAlpha = (0.45 + aRandom * 0.55) * (1.0 - uProgress * 0.8);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
varying float vMix;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(mix(uColorA, uColorB, vMix), a * vAlpha * uOpacity);
}
`;

function fibonacciSphere(count, radius) {
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const jitter = radius * (0.96 + Math.random() * 0.08);
    positions[i * 3] = Math.cos(theta) * r * jitter;
    positions[i * 3 + 1] = y * jitter;
    positions[i * 3 + 2] = Math.sin(theta) * r * jitter;
    randoms[i] = Math.random();
  }
  return { positions, randoms };
}

function ring(count, inner, outer) {
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = inner + Math.pow(Math.random(), 2) * (outer - inner);
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    randoms[i] = Math.random();
  }
  return { positions, randoms };
}

function makePoints({ positions, randoms }, material) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new BufferAttribute(randoms, 1));
  return new Points(geometry, material);
}

export function createScene(container, { isMobile }) {
  const base = createBase(container, { isMobile, z: 6.2 });
  const { renderer, scene, camera } = base;

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uSize: { value: isMobile ? 34 : 30 },
      uPointer: { value: new Vector3(0, 0, 1) },
      uShock: { value: 1 },
      uShockDir: { value: new Vector3(0, 0, 1) },
      uColorA: { value: new Color(THEMES.dark.a) },
      uColorB: { value: new Color(THEMES.dark.b) },
      uOpacity: { value: 1 },
    },
  });

  const group = new Group();
  const sphere = makePoints(fibonacciSphere(isMobile ? 3500 : 9000, 1.55), material);
  const orbit = makePoints(ring(isMobile ? 900 : 2200, 2.2, 3.4), material);
  orbit.rotation.x = Math.PI * 0.42;
  orbit.rotation.z = -0.25;
  group.add(sphere, orbit);
  scene.add(group);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let progress = 0;
  let targetProgress = 0;
  let clock = 0;
  let shockStart = -10;
  const SHOCK_DURATION = 1.7;

  const resize = (width, height) => {
    base.resize(width, height);
    const aspect = width / height;
    // Desktop: sit on the right of the headline. Mobile: centred, smaller.
    group.position.x = aspect > 1.1 ? Math.min(2.4, aspect * 1.1) : 0;
    group.position.y = aspect > 1.1 ? 0 : 0.6;
    group.scale.setScalar(aspect > 1.1 ? 1 : 0.8);
  };

  const update = (time, dt) => {
    const k = 1 - Math.pow(0.001, dt || 0.016);
    pointer.x = lerp(pointer.x, pointer.tx, k);
    pointer.y = lerp(pointer.y, pointer.ty, k);
    progress = lerp(progress, targetProgress, Math.min(1, k * 2));

    const u = material.uniforms;
    clock = time;
    u.uTime.value = time;
    u.uShock.value = Math.min(1, (time - shockStart) / SHOCK_DURATION);
    u.uProgress.value = progress;
    u.uPointer.value.set(pointer.x * 1.5, pointer.y * 1.5, 1);

    group.rotation.y = time * 0.08 + pointer.x * 0.35;
    group.rotation.x = -pointer.y * 0.25 + progress * 0.6;
    orbit.rotation.y = -time * 0.12;

    renderer.render(scene, camera);
  };

  return {
    resize,
    update,
    setPointer: (x, y) => {
      pointer.tx = x;
      pointer.ty = y;
    },
    setProgress: (p) => {
      targetProgress = p;
    },
    // Fire a shockwave from a screen-space point (NDC, -1..1).
    pulse: (x = 0, y = 0) => {
      shockStart = clock;
      material.uniforms.uShockDir.value.set(x * 1.5, y * 1.5, 1);
    },
    setTheme: (theme) => {
      const t = THEMES[theme] ?? THEMES.dark;
      const u = material.uniforms;
      u.uColorA.value.set(t.a);
      u.uColorB.value.set(t.b);
      u.uOpacity.value = t.opacity;
      if (material.blending !== t.blending) {
        material.blending = t.blending;
        material.needsUpdate = true;
      }
    },
    dispose: base.dispose,
  };
}
