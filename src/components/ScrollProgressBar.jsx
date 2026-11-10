import { useEffect, useRef } from "react";
import gsap from "gsap";

// Updates a GPU-composited transform directly — no React re-render per scroll
// event and no layout-triggering `width` animation.
const ScrollProgressBar = () => {
  const barRef = useRef(null);

  useEffect(() => {
    const setScale = gsap.quickSetter(barRef.current, "scaleX");
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScale(max > 0 ? Math.min(1, window.scrollY / max) : 0);
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
    <div className="scroll-progress" aria-hidden="true">
      <div ref={barRef} className="scroll-progress__bar" />
    </div>
  );
};

export default ScrollProgressBar;
