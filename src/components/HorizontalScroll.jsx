import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "../style/HorizontalScroll.css";

const words = ["Welcome", "To", "My", "Portfolio"];

const HorizontalScroll = () => {
  const wrapperRef = useRef(null);
  const racesRef = useRef(null);

  useGSAP(
    () => {
      const races = racesRef.current;
      const getScrollAmount = () => races.scrollWidth - window.innerWidth;

      // ONE scrubbed tween. (Previously a new gsap.to() was created on every
      // onUpdate, piling up hundreds of tweens and causing jank.)
      const track = gsap.to(races, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top 30%",
          end: () => `+=${getScrollAmount() + 500}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // Each word scales/brightens as it passes through the viewport,
      // driven by the horizontal tween via containerAnimation.
      gsap.utils.toArray(".races h2", races).forEach((word) => {
        gsap.fromTo(
          word,
          { opacity: 0.15, scale: 0.85, rotate: -4 },
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            ease: "none",
            scrollTrigger: {
              trigger: word,
              containerAnimation: track,
              start: "left 95%",
              end: "left 45%",
              scrub: true,
            },
          }
        );
      });
    },
    { scope: wrapperRef }
  );

  return (
    <div ref={wrapperRef} className="racesWrapper" aria-label="Welcome to my portfolio">
      <div ref={racesRef} className="races" aria-hidden="true">
        {words.map((word) => (
          <h2 key={word}>{word}</h2>
        ))}
        <div className="races__spacer" />
      </div>
    </div>
  );
};

export default HorizontalScroll;
