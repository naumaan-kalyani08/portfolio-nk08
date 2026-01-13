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
    const lenis = new Lenis({
      smooth: true,
      lerp: 0.08, // scroll smoothness
    });

    // Lenis RAF
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        return arguments.length
          ? lenis.scrollTo(value)
          : lenis.scroll.instance.scroll.y;
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

    return () => {
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
