import  { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../style/HorizontalScroll.css";
gsap.registerPlugin(ScrollTrigger);

const HorizontalScroll = () => {
  const racesRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const races = racesRef.current;

    function getScrollAmount() {
      // Calculate the total scrollable width of the races element minus the viewport width
      return races.scrollWidth - window.innerWidth;
    }

    const additionalSpace = 500;
    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top 30%",
      // end: () => `+=${getScrollAmount()}`, // Dynamically calculate the end to reach the end of .races
      end: () => `+=${getScrollAmount() + additionalSpace}`,
      pin: true,
      scrub: 2, // Allow smooth scrolling
      invalidateOnRefresh: true, // Recalculate on refresh (resize)
      markers: false, // Show markers for debugging

      // Animation to move the races element as per scroll
      onUpdate: (self) => {
        // Update the x position of .races based on scroll progress
        gsap.to(races, {
          x: -getScrollAmount() * self.progress, // Move races based on scroll progress
          ease: "none",
        });
      },
    });

    // Recalculate the scroll amount on window resize
    window.addEventListener("resize", ScrollTrigger.refresh);

    // Cleanup function to avoid memory leaks
    return () => {
      scrollTriggerInstance.kill();
      window.removeEventListener("resize", ScrollTrigger.refresh);
    };
  }, []);

  return (
    <>
      {/* <div className="space-50vh "></div> */}
      <div ref={wrapperRef} className="racesWrapper">
        {" "}
        {/* ScrollTrigger trigger */}
        <div ref={racesRef} className="races">
          {" "}
          {/* This will be animated to the left */}
          {/* Welcome to my portfolio—a showcase of my skills, expertise, and projects. */}
          <h2> Welcome</h2>
          <h2>To </h2>
          <h2> My</h2>
          <h2>Portfolio </h2>
          <div style={{ minWidth: "110vw" }}></div> {/* trailing space */}
          {/* <h2>Japan</h2> */}
        </div>
      </div>

      {/* Marker to indicate horizontal scroll completion */}
      <div id="horizontal-scroll-end"></div>

      {/* Spacing to ensure timeline doesn't start during horizontal scroll */}
      {/* <div style={{ height: "100vh" }}></div> */}

      {/* <ScrollAlert additionalStyle="text-reveal-scroll-icon mb-2 "/> */}
      <div className="py-4"></div>
      {/* <div className="space-100vh lightBG"></div> */}
    </>
  );
};

export default HorizontalScroll;
