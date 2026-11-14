import { useEffect, useRef } from "react";
import gsap from "gsap";
import { getLenis, prefersReducedMotion } from "../lib/scroll";
import "../style/Marquee.css";

// Infinite marquee whose speed, direction and skew react to scroll velocity.
// Runs on the shared GSAP ticker and only while on-screen.
export default function Marquee({ items, baseSpeed = 60, reverse = false, className = "" }) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (prefersReducedMotion()) return undefined;

    let half = track.scrollWidth / 2;
    let x = 0;
    let direction = reverse ? 1 : -1;
    let skew = 0;
    const setX = gsap.quickSetter(track, "x", "px");
    const setSkew = gsap.quickSetter(track, "skewX", "deg");

    const tick = (_time, deltaMs) => {
      const dt = Math.min(deltaMs, 64) / 1000;
      const velocity = getLenis()?.velocity ?? 0;
      if (Math.abs(velocity) > 0.5) direction = (velocity > 0 ? -1 : 1) * (reverse ? -1 : 1);

      x += direction * (baseSpeed + Math.abs(velocity) * 22) * dt;
      x = gsap.utils.wrap(-half, 0, x);
      skew += (gsap.utils.clamp(-10, 10, -velocity * 0.6) - skew) * 0.12;

      setX(x);
      setSkew(skew);
    };

    let running = false;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        gsap.ticker.add(tick);
        running = true;
      } else if (!entry.isIntersecting && running) {
        gsap.ticker.remove(tick);
        running = false;
      }
    });
    io.observe(root);

    const ro = new ResizeObserver(() => {
      half = track.scrollWidth / 2;
    });
    ro.observe(track);

    return () => {
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [baseSpeed, reverse]);

  const row = items.map((item) => (
    <span className="marquee__item" key={item}>
      {item}
      <span className="marquee__star" aria-hidden="true">
        ✦
      </span>
    </span>
  ));

  return (
    <div className={`marquee ${className}`} ref={rootRef} aria-label={items.join(", ")}>
      <div className="marquee__track" ref={trackRef} aria-hidden="true">
        <div className="marquee__row">{row}</div>
        <div className="marquee__row">{row}</div>
      </div>
    </div>
  );
}
