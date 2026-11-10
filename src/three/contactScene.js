import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Points,
  PointsMaterial,
  TorusGeometry,
  WireframeGeometry,
} from "three";
import { createBase, lerp } from "./base";

// A slowly-breathing wireframe "globe" with orbiting rings and a dust field.
// Uses built-in materials only — very cheap to render.

function dust(count, radius) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = radius * (0.6 + Math.random() * 0.8);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  return geometry;
}

export function createScene(container, { isMobile }) {
  const base = createBase(container, { isMobile, z: 7 });
  const { renderer, scene, camera } = base;

  const group = new Group();

  const globe = new LineSegments(
    new WireframeGeometry(new IcosahedronGeometry(1.8, isMobile ? 2 : 3)),
    new LineBasicMaterial({ color: new Color("#6366f1"), transparent: true, opacity: 0.28, depthWrite: false })
  );

  const vertices = new Points(
    new IcosahedronGeometry(1.8, isMobile ? 2 : 3),
    new PointsMaterial({
      color: new Color("#5fd6f6"),
      size: 0.045,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: AdditiveBlending,
    })
  );

  const ringMaterial = new LineBasicMaterial({ color: new Color("#5fd6f6"), transparent: true, opacity: 0.22, depthWrite: false });
  const ringA = new LineSegments(new WireframeGeometry(new TorusGeometry(2.7, 0.004, 3, 120)), ringMaterial);
  const ringB = new LineSegments(new WireframeGeometry(new TorusGeometry(3.2, 0.004, 3, 120)), ringMaterial);
  ringA.rotation.x = Math.PI * 0.5;
  ringB.rotation.x = Math.PI * 0.35;
  ringB.rotation.y = 0.4;

  const field = new Points(
    dust(isMobile ? 350 : 900, 5),
    new PointsMaterial({ color: new Color("#a3a3ba"), size: 0.02, transparent: true, opacity: 0.6, depthWrite: false })
  );

  group.add(globe, vertices, ringA, ringB);
  scene.add(group, field);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let progress = 0;

  const resize = (width, height) => {
    base.resize(width, height);
    group.scale.setScalar(width / height < 1 ? 0.75 : 1);
  };

  const update = (time, dt) => {
    const k = 1 - Math.pow(0.001, dt || 0.016);
    pointer.x = lerp(pointer.x, pointer.tx, k);
    pointer.y = lerp(pointer.y, pointer.ty, k);

    const breathe = 1 + Math.sin(time * 1.2) * 0.025;
    globe.scale.setScalar(breathe);
    vertices.scale.setScalar(breathe);

    group.rotation.y = time * 0.1 + pointer.x * 0.4 + progress * 1.2;
    group.rotation.x = 0.3 - pointer.y * 0.3;
    ringA.rotation.z = time * 0.15;
    ringB.rotation.z = -time * 0.1;
    field.rotation.y = -time * 0.02;

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
      progress = p;
    },
    dispose: base.dispose,
  };
}
