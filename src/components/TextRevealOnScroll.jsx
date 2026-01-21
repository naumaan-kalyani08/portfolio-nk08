import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "../style/textRevealOnScroll.css";
import "../style/stackImage.css";

gsap.registerPlugin(ScrollTrigger);

export default function TextRevealOnScroll() {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const imageRefs = useRef([]);

  const imageSources = [
    "./Images/flat-creativity-concept-illustration.png",
    "./Images/image2.jpg",
    "./Images/image3.jpg",
    "./Images/image4.jpg",
  ];

  useEffect(() => {
    const section = sectionRef.current;
    const textElement = textRef.current;
    const images = imageRefs.current;

    if (!section || !textElement) return;

    const splitTextToChars = (el) => {
      const nodes = [...el.childNodes];
      el.innerHTML = "";

      nodes.forEach((node) => {
        if (node.nodeName === "BR") {
          el.appendChild(document.createElement("br"));
          return;
        }

        if (node.nodeType === 3) {
          node.textContent.split("").forEach((char) => {
            const span = document.createElement("span");
            span.className = "char";
            span.textContent = char === " " ? "\u00A0" : char;
            el.appendChild(span);
          });
        }

        if (node.nodeType === 1) {
          const wrapper = document.createElement("span");
          wrapper.className = node.className;

          node.textContent.split("").forEach((char) => {
            const span = document.createElement("span");
            span.className = node.classList.contains("span")
              ? "char char--highlight"
              : "char";
            span.textContent = char === " " ? "\u00A0" : char;
            wrapper.appendChild(span);
          });

          el.appendChild(wrapper);
        }
      });
    };

    splitTextToChars(textElement);

    const chars = textElement.querySelectorAll(".char");
    const highlighted = textElement.querySelectorAll(".char--highlight");

    // Image positions
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

    // Set initial image positions
    images.forEach((img, i) => {
      if (img) {
        gsap.set(img, {
          x: startPositions[i].x,
          y: startPositions[i].y,
          rotation: gsap.utils.random(-60, 60),
          scale: 0.5,
          autoAlpha: 0,
        });
      }
    });

    const ctx = gsap.context(() => {
      // Create ONE master timeline with ONE scroll trigger that pins everything
      const masterTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=2500",
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          // markers: true,
        },
      });

      // Add text reveal animation to the timeline
      masterTimeline.to(
        chars,
        {
          opacity: 1,
          stagger: 0.015,
          duration: 0.5,
        },
        0 // Start at beginning
      );

      // Add highlighted text color animation
      masterTimeline.to(
        highlighted,
        {
          color: "#ff0000",
          stagger: 0.015,
          duration: 0.5,
        },
        0.1 // Slightly delayed
      );

      // Add image animations to the same timeline
      images.forEach((img, i) => {
        if (img) {
          masterTimeline.to(
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
            i * 2// Stagger each image
          );
        }
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="text-section" ref={sectionRef}>
      <div className="text-container">
        {/* Left side - Text */}
        <div className="text-wrapper left w-50">
          <p ref={textRef} className="fade-text">
            Welcome to our interactive experience <br />
            Discover the <span className="span">power</span> of web animations <br />
            Scroll down to see the <span className="span">magic</span> unfold <br />
            Watch as the <span className="span">colors</span> transform before you <br />
            Let the <span className="span">creativity</span> flow through each scroll <br />
            Experience the <span className="span">beauty</span> of modern web design
          </p>
        </div>

        {/* Right side - Stack Images */}
        <div className="right w-50">
          <div className="stack-container">
            <div className="center-point">
              {imageSources.map((src, index) => (
                <div
                  className="image-wrapper"
                  key={index}
                  ref={(el) => (imageRefs.current[index] = el)}
                >
                  <img src={src} alt={`image-${index}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
