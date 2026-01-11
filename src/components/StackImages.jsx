import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, { useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import "../style/stackImage.css";

gsap.registerPlugin(ScrollTrigger);

const StackImages = ({ triggerRef }) => {
  const containerRef = useRef(null);
  const imageRef = useRef([]);

  const imageSources = [
    "./Images/flat-creativity-concept-illustration.png",
    "./Images/image2.jpg",
    "./Images/image3.jpg",
    "./Images/image4.jpg",
  ];

  useGSAP(
    () => {
      const images = imageRef.current;
      // Use the passed triggerRef as the scroll trigger element
      const triggerElement = triggerRef?.current;
      
      if (!triggerElement) return;

      const startPositions = [
        { x: "-120vw", y: "-50vh" },
        { x: "120vw", y: "-60vh" },
        { x: "-130vw", y: "60vh" },
        { x: "0vw", y: "-120vh" },
      ];

      const finalPositions = [
        { x: "-40%", y: "20%", rotation: 7 },
        { x: "40%", y: "-45%", rotation: -12 },
        { x: "-45%", y: "-35%", rotation: 10 },
        { x: "20%", y: "25%", rotation: -15 },
      ];

      images.forEach((img, i) => {
        gsap.set(img, {
          x: startPositions[i].x,
          y: startPositions[i].y,
          rotation: gsap.utils.random(-60, 60),
          scale: 0.5,
          autoAlpha: 0,
        });
      });

      // NO pin here - animation runs based on parent's scroll trigger
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "top top",
          end: "+=2500",
          scrub: 1,
          // markers: true,
        },
      });

      images.forEach((img, i) => {
        tl.to(
          img,
          {
            x: finalPositions[i].x,
            y: finalPositions[i].y,
            rotation: finalPositions[i].rotation,
            scale: 1,
            autoAlpha: 1,
            ease: "power2.out",
            duration: 1,
          },
          i * 0.3
        );
      });
    },
    { scope: containerRef, dependencies: [triggerRef] }
  );

  return (
    <div className="stack-container" ref={containerRef}>
      <div className="center-point">
        {imageSources.map((src, index) => (
          <div
            className="image-wrapper"
            key={index}
            ref={(el) => (imageRef.current[index] = el)}
          >
            <img src={src} alt={`image-${index}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StackImages;
