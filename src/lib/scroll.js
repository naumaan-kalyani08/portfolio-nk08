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

export const scrollToTarget = (target, options = {}) => {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  if (lenisInstance) {
    // `force` lets us scroll even while Lenis is stopped (e.g. menu closing).
    lenisInstance.scrollTo(el, { duration: 1.4, force: true, ...options });
  } else {
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
};
