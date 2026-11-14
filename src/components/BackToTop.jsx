import { useEffect, useRef } from "react";
import { scrollToTarget } from "../lib/scroll";

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Floating "back to top" button whose ring fills with page progress.
export default function BackToTop() {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    const ring = button.querySelector(".totop__progress");
    let visible = false;
    let lastOffset = -1;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      const offset = Math.round(CIRCUMFERENCE * (1 - progress) * 10) / 10;
      if (offset !== lastOffset) {
        lastOffset = offset;
        ring.style.strokeDashoffset = offset;
      }
      const shouldShow = window.scrollY > window.innerHeight * 0.8;
      if (shouldShow !== visible) {
        visible = shouldShow;
        button.classList.toggle("is-visible", visible);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      className="totop"
      aria-label="Back to top"
      data-magnetic="0.3"
      onClick={() => scrollToTarget("#home", { duration: 2 })}
    >
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle className="totop__track" cx="26" cy="26" r={RADIUS} />
        <circle
          className="totop__progress"
          cx="26"
          cy="26"
          r={RADIUS}
          style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE }}
        />
      </svg>
      <span className="totop__arrow" aria-hidden="true">
        ↑
      </span>
    </button>
  );
}
