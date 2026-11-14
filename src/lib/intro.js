import { onAppReady } from "./ready";
import { prefersReducedMotion } from "./scroll";

// Shared signals for the "laptop on a desk" intro (LaptopIntro.jsx).
//  - introEnabled(): the intro only runs with motion allowed; otherwise the
//    page opens straight on the hero and the 3D chunk is never fetched.
//  - onHeroReveal(): the hero's entrance waits until its screen wakes up (or
//    the intro is skipped / disabled) instead of playing unseen behind a
//    closed lid. Without the intro it's simply onAppReady().
//  - whenIntroSceneReady(): the preloader counts the scene (chunk + model +
//    shader compile) in its progress, so the first scroll never hitches.

export const introEnabled = () => !prefersReducedMotion();

let revealed = false;
const revealListeners = new Set();

export const onHeroReveal = (callback) => {
  if (!introEnabled()) return onAppReady(callback);
  if (revealed) {
    callback();
    return () => {};
  }
  revealListeners.add(callback);
  return () => revealListeners.delete(callback);
};

export const revealHero = () => {
  if (revealed) return;
  revealed = true;
  // Microtask: if this fires from setAppReady() (inside the preloader's GSAP
  // context), listeners' tweens must not be adopted by — and reverted with — it.
  onAppReady(() =>
    queueMicrotask(() => {
      revealListeners.forEach((callback) => callback());
      revealListeners.clear();
    })
  );
};

// "Dormant": the hero is on the laptop's dark screen (invisible). Its per-frame
// work — particle render, spotlight sweep, role scramble — pauses meanwhile.
let heroDormant = false;
const dormantListeners = new Set();

export const isHeroDormant = () => heroDormant;

export const onHeroDormantChange = (callback) => {
  dormantListeners.add(callback);
  return () => dormantListeners.delete(callback);
};

export const setHeroDormant = (value) => {
  if (value === heroDormant) return;
  heroDormant = value;
  dormantListeners.forEach((callback) => callback(value));
};

let resolveSceneReady = () => {};
const sceneReady = new Promise((resolve) => {
  resolveSceneReady = resolve;
});

export const whenIntroSceneReady = () => sceneReady;
export const markIntroSceneReady = () => resolveSceneReady();
