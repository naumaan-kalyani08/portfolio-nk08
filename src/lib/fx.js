import gsap from "gsap";
import { isFinePointer, prefersReducedMotion } from "./scroll";

// Small, framework-agnostic "delight" helpers installed once from App.

// Elements with [data-magnetic] (optionally ="0.4" for strength) drift toward
// the cursor and spring back on leave. Fine pointers only.
export function installMagnetic(root = document) {
  if (!isFinePointer() || prefersReducedMotion()) return () => {};

  const cleanups = [...root.querySelectorAll("[data-magnetic]")].map((el) => {
    const strength = Number(el.getAttribute("data-magnetic")) || 0.3;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });

    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  });

  return () => cleanups.forEach((fn) => fn());
}

// Swap the tab title when the visitor switches away.
export function installTabTitle(awayTitle = "👋 Come back soon!") {
  const original = document.title;
  const onVisibility = () => {
    document.title = document.hidden ? awayTitle : original;
  };
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    document.title = original;
  };
}

// A friendly hello for fellow developers who open the console.
let greeted = false;
export function greetDevelopers(name) {
  if (greeted) return;
  greeted = true;
  console.log(
    `%c Hey there, curious developer 👋 %c\nBuilt by ${name} with React, GSAP & Three.js.\nLike what you see? Let's talk.`,
    "background:linear-gradient(90deg,#6366f1,#5fd6f6);color:#fff;padding:6px 10px;border-radius:6px;font-weight:700",
    "color:#a3a3ba"
  );
}
