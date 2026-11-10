import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { isFinePointer, prefersReducedMotion } from "../lib/scroll";

// Lightweight follower cursor. Only mounts on hover-capable fine pointers,
// keeps the native cursor (accessibility), and uses gsap.quickTo (no re-renders).
export default function Cursor() {
  const [enabled] = useState(() => isFinePointer() && !prefersReducedMotion());
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const root = rootRef.current;

    const dotX = gsap.quickTo(dotRef.current, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dotRef.current, "y", { duration: 0.12, ease: "power3" });
    const ringX = gsap.quickTo(ringRef.current, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ringRef.current, "y", { duration: 0.45, ease: "power3" });

    const onMove = (event) => {
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
      root.classList.remove("is-hidden");
    };

    const onOver = (event) => {
      const labelled = event.target.closest("[data-cursor]");
      const interactive = event.target.closest("a, button, [role='button']");
      root.classList.toggle("has-label", Boolean(labelled));
      root.classList.toggle("is-hover", Boolean(interactive) && !labelled);
      if (labelled) labelRef.current.textContent = labelled.getAttribute("data-cursor");
    };

    const onLeave = () => root.classList.add("is-hidden");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} className="cursor is-hidden" aria-hidden="true">
      <div ref={dotRef} className="cursor__dot" />
      <div ref={ringRef} className="cursor__ring">
        <span ref={labelRef} className="cursor__label" />
      </div>
    </div>
  );
}
