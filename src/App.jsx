import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { marqueeItems, marqueeItemsAlt, profile } from "./data/content";
import { prefersReducedMotion, setLenis } from "./lib/scroll";
import { isAppReady, onAppReady } from "./lib/ready";
import { greetDevelopers, installMagnetic, installTabTitle } from "./lib/fx";

import Preloader from "./components/Preloader";
import BackToTop from "./components/BackToTop";
import ScrollProgressBar from "./components/ScrollProgressBar";
import Cursor from "./components/Cursor";
import Header from "./components/Header";
import LaptopIntro from "./components/LaptopIntro";
import Hero from "./components/Hero";
import HorizontalScroll from "./components/HorizontalScroll";
import About from "./components/About";
import Stats from "./components/Stats";
import Marquee from "./components/Marquee";
import Services from "./components/Services";
import Projects from "./components/Projects";
import Experience from "./components/Experience";
import Skills from "./components/Skills";
import Contact from "./components/Contact";

gsap.registerPlugin(ScrollTrigger, useGSAP);
// Don't recalculate every trigger when the mobile URL bar shows/hides.
ScrollTrigger.config({ ignoreMobileResize: true });

const App = () => {
  // Smooth scrolling: Lenis drives native scroll, so ScrollTrigger needs no
  // scrollerProxy — just an update on every Lenis scroll + a shared ticker.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.5 });
    setLenis(lenis);

    const raf = (time) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Scroll stays locked until the preloader curtain lifts.
    let unsubscribe = () => {};
    if (!isAppReady()) {
      lenis.stop();
      unsubscribe = onAppReady(() => lenis.start());
    }

    return () => {
      unsubscribe();
      gsap.ticker.remove(raf); // same function reference → actually removed
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // Small global delights: magnetic buttons, tab title, console greeting.
  useEffect(() => {
    const removeMagnetic = installMagnetic();
    const removeTabTitle = installTabTitle();
    greetDevelopers(profile.name);
    return () => {
      removeMagnetic();
      removeTabTitle();
    };
  }, []);

  // Re-measure once fonts & images have settled (affects pin distances).
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready?.then(refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);

  // Global, batched reveal animations. Runs after all children have created
  // their pins, so trigger positions account for pin spacing.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set("[data-reveal]", { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 90%",
        once: true,
        onEnter: (elements) =>
          gsap.to(elements, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.08, overwrite: true }),
      });

      gsap.utils.toArray(".split-heading").forEach((heading) => {
        gsap.from(heading.querySelectorAll(".split-word"), {
          yPercent: 110,
          rotate: 4,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.07,
          scrollTrigger: { trigger: heading, start: "top 88%", once: true },
        });
      });
    });
    return () => mm.revert();
  });

  return (
    <>
      <a className="sr-only" href="#about">
        Skip to content
      </a>
      <Preloader />
      <ScrollProgressBar />
      <Cursor />
      <Header />
      <BackToTop />
      <main>
        <LaptopIntro>
          <Hero />
        </LaptopIntro>
        <HorizontalScroll />
        <About />
        <Stats />
        <div className="tapes">
          <Marquee items={marqueeItems} className="marquee--tape marquee--a" />
          <Marquee items={marqueeItemsAlt} reverse baseSpeed={45} className="marquee--tape marquee--b" />
        </div>
        <Services />
        <Projects />
        <Experience />
        <Skills />
        <Contact />
      </main>
    </>
  );
};

export default App;
