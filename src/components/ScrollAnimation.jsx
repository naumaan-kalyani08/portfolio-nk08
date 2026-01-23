import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import MotionPathPlugin from "gsap/MotionPathPlugin";
import DrawSVGPlugin from "gsap/DrawSVGPlugin";
// import Lenis from "lenis";

import "../style/scrollAnimation.css";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin);

export default function ScrollAnimation() {
  const timelineSvgRef = useRef(null);

  useLayoutEffect(() => {
    // Detect mobile for performance optimizations
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) 
      || window.innerWidth < 768;

    // Configure GSAP for better mobile performance
    if (isMobile) {
      ScrollTrigger.config({
        limitCallbacks: true, // Reduces callback frequency
        ignoreMobileResize: true, // Prevents resize thrashing
      });
    }

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        return arguments.length
          ? window.scrollTo(0, value)
          : window.pageYOffset;
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

    // lenis.on("scroll", ScrollTrigger.update);
    ScrollTrigger.refresh();

    // 🔑 PREVENT SVG FLASH
    gsap.set(".timeline-path", { drawSVG: "0%" });
    gsap.set(".timeline-ball, .timeline-text", { autoAlpha: 0 });

    gsap.defaults({ ease: "none" });

    // PULSES
    const pulses = gsap
      .timeline({
        defaults: {
          scale: 2,
          autoAlpha: 1,
          transformOrigin: "center",
          ease: "elastic(2.5, 1)",
        },
      })
      .to(".ball02, .text01", {}, 0.70)
      .to(".ball03, .text02", {}, 1.25)
      .to(".ball04, .text03", {}, 1.92)
      .to(".ball05, .text04", {}, 2.48)
      .to(".ball06, .text05", {}, 2.95)
      .to(".ball07, .text06", {}, 3.20)
      .to(".ball08, .text07", {}, 3.42)

    // Wait for timeline SVG to enter viewport before creating ScrollTrigger
    const timelineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Timeline is in view, create the ScrollTrigger
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: "#timeline-svg",
                  start: "top center",
                  end: "bottom center",
                  // Mobile: use integer scrub for better perf (less smooth but faster)
                  // Desktop: use true for smoother animation
                  scrub: isMobile ? 1 : true,
                  fastScrollEnd: true, // Helps with fast scrolling
                },
              })
              .to(".ball01", { autoAlpha: 1, duration: 0.05 })
              .to(".timeline-path", { drawSVG: "100%", duration: 4 }, 0)
      .to(
        ".ball01",
        {
          motionPath: {
            path: ".timeline-path",
            align: ".timeline-path",
            alignOrigin: [0.5, 0.5],
          },
          duration: 4,
        },
        0
      )
      .add(pulses, 0.1);

            // Stop observing after timeline is created
            timelineObserver.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (timelineSvgRef.current) {
      timelineObserver.observe(timelineSvgRef.current);
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      // lenis.destroy();
      timelineObserver.disconnect();
    };
  }, []);

  return (
    <section className="timeline-wrapper">
      <h1 className="timeline-heading">
        Scroll to see a timeline animation
      </h1>

      <svg
        ref={timelineSvgRef}
        id="timeline-svg"
        viewBox="0 0 600 2160"
        className="timeline-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path className="timeline-line" d="M10 360 600 360" />
        <path className="timeline-line" d="M10 720 600 720" />
        <path className="timeline-line" d="M10 1080 600 1080" />
        <path className="timeline-line" d="M10 1440 600 1440" />
        <path className="timeline-line" d="M10 1610 600 1610" />
        <path className="timeline-line" d="M10 1800 600 1800" />
        <path className="timeline-line" d="M10 2160 600 2160" />

        <text className="timeline-text text01" x="30" y="342">2002</text>
        <text className="timeline-text text02" x="30" y="702">2018</text>
        <text className="timeline-text text03" x="30" y="1062">2020</text>
        <text className="timeline-text text04" x="30" y="1422">2023</text>
        <text className="timeline-text text05" x="30" y="1800">2024</text>
        <text className="timeline-text text06" x="30" y="1600">2024</text>
        <text className="timeline-text text07" x="30" y="2160">2025</text>

        <path
          className="timeline-path"
          d="
            M -5,0
            Q 450 414 300 810
            T 130 1350
            Q 100 1530 300 1800
            T 150 2160
          "
        />

        <circle className="timeline-ball ball01" r="20" cx="50" cy="180" />
        <circle className="timeline-ball ball02" r="20" cx="278" cy="362" />
        <circle className="timeline-ball ball03" r="20" cx="327" cy="722" />
        <circle className="timeline-ball ball04" r="20" cx="203" cy="1082" />
        <circle className="timeline-ball ball05" r="20" cx="147" cy="1442" />
        <circle className="timeline-ball ball06" r="20" cx="147" cy="1800" />
        <circle className="timeline-ball ball07" r="20" cx="147" cy="2160" />
      </svg>
    </section>
  );
}
