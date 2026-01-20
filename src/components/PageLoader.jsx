// PageLoader.jsx
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import "../style/PageLoader.css";
// import { ScrollAlert } from "./ReusableComponents";

const PageLoader = () => {
  const boxesRef = useRef([]);
  const lettersRef = useRef([]);

  useEffect(() => {
    const tl = gsap.timeline();

    // Boxes animation with stagger amount of 0.5 seconds
    tl.to(boxesRef.current, {
      width: 0,
      duration: 1,
      delay: 1,
      stagger: {
        amount: 0.5, // Distribute stagger over 0.5 seconds evenly
      },
      ease: "power4.inOut",
    })
      // Letters animation (starts after boxes animation completes)
      .fromTo(
        lettersRef.current,
        { y: 700, opacity: 0 }, // Starting from below the screen and invisible
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: { amount: 0.4 },
          ease: "power4.inOut",
        }
      );
  }, []);

  return (
    <section id="home">
      <div className="custom-container">
        {[...Array(10)].map((_, index) => (
          <div
            key={index}
            ref={(el) => (boxesRef.current[index] = el)}
            className="boxes"
          ></div>
        ))}
        <div className="wrapper">
          {"Hello!".split("").map((letter, index) => (
            <div
              key={index}
              ref={(el) => (lettersRef.current[index] = el)}
              className="h1"
            >
              {letter}
            </div>
          ))}
          {/* <ScrollAlert additionalStyle="text-reveal-scroll-icon   scroll-icon-spacing custom-fade-in upper-mouse-scroll" /> */}
        </div>
      </div>
    </section>
  );
};

export default PageLoader;
