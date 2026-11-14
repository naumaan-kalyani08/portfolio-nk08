import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { aboutImages, aboutText } from "../data/content";
import { isFinePointer, isSmallScreen, prefersReducedMotion } from "../lib/scroll";
import "../style/About.css";
import "../style/stackImage.css";

// Words are split at render time (no innerHTML rewriting) and revealed per
// *word* rather than per character — ~5x fewer animated nodes.
const renderWords = () =>
  aboutText.flatMap((segment, segIndex) =>
    segment.text.split(/(\s+)/).map((part, partIndex) => {
      if (!part) return null;
      if (/^\s+$/.test(part)) return " ";
      return (
        <span key={`${segIndex}-${partIndex}`} className={`word ${segment.hl ? "word--hl" : ""}`}>
          {part}
        </span>
      );
    })
  );

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

export default function About() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      const words = gsap.utils.toArray(".word");
      const highlighted = gsap.utils.toArray(".word--hl");
      const images = gsap.utils.toArray(".image-wrapper");

      if (prefersReducedMotion()) {
        gsap.set(words, { opacity: 1 });
        gsap.set(highlighted, { "--hl": 1 });
        images.forEach((img, i) => gsap.set(img, { ...finalPositions[i], autoAlpha: 1 }));
        return;
      }

      images.forEach((img, i) => {
        gsap.set(img, { ...startPositions[i], rotation: gsap.utils.random(-60, 60), scale: 0.5, autoAlpha: 0 });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * (isSmallScreen() ? 2 : 2.6)}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(words, { opacity: 1, stagger: 0.1, duration: 0.6, ease: "none" }, 0)
        // --hl drives a CSS color-mix, so the highlight follows the active theme.
        .to(highlighted, { "--hl": 1, stagger: 0.1, duration: 0.6, ease: "none" }, 0.2);

      images.forEach((img, i) => {
        tl.to(img, { ...finalPositions[i], scale: 1, autoAlpha: 1, ease: "power2.out", duration: 1.4 }, i * 1.1);
      });

      // Throwable polaroids (desktop). Dragging moves an inner layer, so it
      // never fights the scroll-scrubbed outer transform. The drag plugins are
      // lazy-loaded so touch devices never download them.
      if (!isFinePointer()) return undefined;
      const hint = sectionRef.current.querySelector(".about__hint");
      const cards = gsap.utils.toArray(".image-drag");
      let zIndex = 10;
      let draggables = [];
      let cancelled = false;

      Promise.all([import("gsap/Draggable"), import("gsap/InertiaPlugin")]).then(([{ Draggable }, { InertiaPlugin }]) => {
        if (cancelled) return;
        gsap.registerPlugin(Draggable, InertiaPlugin);
        draggables = cards.map((card) =>
        Draggable.create(card, {
          type: "x,y",
          inertia: true,
          edgeResistance: 0.75,
          onPress() {
            // Bounds are applied on press, not at creation: at load time the
            // polaroids are parked off-screen (waiting to fly in), and creation-
            // time bounds would shove them far away.
            this.applyBounds(sectionRef.current);
            zIndex += 1;
            card.parentElement.style.zIndex = zIndex;
            gsap.to(card, { scale: 1.06, rotate: gsap.utils.random(-6, 6), duration: 0.35, ease: "power3.out" });
            gsap.to(hint, { autoAlpha: 0, duration: 0.4 });
          },
          onRelease() {
            gsap.to(card, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
          },
        })[0]
        );
      });

      return () => {
        cancelled = true;
        draggables.forEach((d) => d.kill());
      };
    },
    { scope: sectionRef }
  );

  return (
    <section id="about" className="text-section" ref={sectionRef}>
      <div className="text-container">
        <div className="text-wrapper left w-50">
          <p className="eyebrow about__eyebrow">01 — About me</p>
          <p className="fade-text">{renderWords()}</p>
        </div>

        <div className="right w-50">
          <div className="stack-container">
            <div className="center-point">
              {aboutImages.map((image) => (
                <div className="image-wrapper" key={image.src}>
                  <div className="image-drag" data-cursor="Drag">
                    <img
                      src={image.src}
                      alt={image.alt}
                      width="300"
                      height="300"
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="about__hint" aria-hidden="true">
              ↖ Drag &amp; throw the photos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
