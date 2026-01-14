import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import ScrollAnimation from "./components/ScrollAnimation";
import PageLoader from "./components/PageLoader";
import HorizontalScroll from "./components/HorizontalScroll";
import TextRevealOnScroll from "./components/TextRevealOnScroll";
import ScrollProgressBar from "./components/ScrollProgressBar";
import TechStack from "./components/TechStack";

gsap.registerPlugin(ScrollTrigger);

const App = () => {
  useEffect(() => {
    // ═══════════════════════════════════════════════════════════════════
    // LENIS SMOOTH SCROLL INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    const lenis = new Lenis({
      smooth: true,
      lerp: 0.1,            // Interpolation factor (0.1 = 10% per frame, faster response)
      touchMultiplier: 2,   // Increases touch scroll sensitivity for mobile
      wheelMultiplier: 1,   // Standard mouse wheel sensitivity
    });

    // ═══════════════════════════════════════════════════════════════════
    // GSAP TICKER INTEGRATION (Replaces manual requestAnimationFrame)
    // ═══════════════════════════════════════════════════════════════════
    // Using GSAP's ticker instead of separate RAF loop:
    // - Single unified animation loop (better performance)
    // - Automatic sync with all GSAP animations
    // - time * 1000 converts GSAP's seconds to Lenis's milliseconds
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0); // Disable lag smoothing for buttery animations

    // ═══════════════════════════════════════════════════════════════════
    // SCROLLTRIGGER <-> LENIS SYNC
    // ═══════════════════════════════════════════════════════════════════
    lenis.on("scroll", ScrollTrigger.update);

    // ScrollerProxy tells GSAP to use Lenis scroll values instead of native scroll
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        return arguments.length
          ? lenis.scrollTo(value, { immediate: true }) // SET: instant jump
          : lenis.animatedScroll;                      // GET: smooth interpolated value
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    ScrollTrigger.addEventListener("refresh", () => lenis.resize());
    ScrollTrigger.refresh();

    // ═══════════════════════════════════════════════════════════════════
    // DELAYED REFRESH (Catches async ScrollTriggers from IntersectionObserver)
    // ═══════════════════════════════════════════════════════════════════
    gsap.delayedCall(0.5, () => ScrollTrigger.refresh());

    // ═══════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════
    return () => {
      gsap.ticker.remove(lenis.raf); // Remove from GSAP ticker
      lenis.destroy();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <>
      <ScrollProgressBar/>
      <PageLoader />
      <HorizontalScroll />
      <TextRevealOnScroll />
      <ScrollAnimation  />
      <TechStack />
    </>
  );
};

export default App;
