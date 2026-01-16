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
import Header from "./components/Header";

gsap.registerPlugin(ScrollTrigger);

const App = () => {
  useEffect(() => {
    const lenis = new Lenis({
      smooth: true,
      lerp: 0.1,            // Interpolation factor (0.1 = 10% per frame, faster response)
      touchMultiplier: 2,   // Increases touch scroll sensitivity for mobile
      wheelMultiplier: 1,   // Standard mouse wheel sensitivity
    });

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0); // Disable lag smoothing for buttery animations
    lenis.on("scroll", ScrollTrigger.update);
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

    gsap.delayedCall(0.5, () => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(lenis.raf); // Remove from GSAP ticker
      lenis.destroy();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <>
      <ScrollProgressBar/>
      <Header/>
      <PageLoader />
      <HorizontalScroll />
      <TextRevealOnScroll />
      <ScrollAnimation  />
      <TechStack />
    </>
  );
};

export default App;
