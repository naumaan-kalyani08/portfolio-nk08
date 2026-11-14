// Tiny shared store for the Lenis instance so any component can scroll
// smoothly or read velocity without prop drilling or React re-renders.
let lenisInstance = null;

export const setLenis = (lenis) => {
  lenisInstance = lenis;
};

export const getLenis = () => lenisInstance;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export const isSmallScreen = () => typeof window !== "undefined" && window.innerWidth < 768;

// Named scroll positions that override an element's own offset. The laptop
// intro registers "#home" → the end of its pin, so every "go home" control
// (logo, menu, back-to-top) lands on the hero rather than the closed laptop.
const anchors = new Map();

export const registerScrollAnchor = (selector, getY) => {
  anchors.set(selector, getY);
  return () => {
    if (anchors.get(selector) === getY) anchors.delete(selector);
  };
};

export const scrollToTarget = (target, options = {}) => {
  if (typeof target === "string" && anchors.has(target)) {
    const y = anchors.get(target)();
    if (lenisInstance) {
      lenisInstance.scrollTo(y, { duration: 1.4, force: true, ...options });
    } else {
      window.scrollTo({ top: y, behavior: options.immediate || prefersReducedMotion() ? "auto" : "smooth" });
    }
    return;
  }

  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  if (lenisInstance) {
    // `force` lets us scroll even while Lenis is stopped (e.g. menu closing).
    lenisInstance.scrollTo(el, { duration: 1.4, force: true, ...options });
  } else {
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
};
