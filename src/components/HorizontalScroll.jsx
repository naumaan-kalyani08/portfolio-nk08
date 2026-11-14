import { Fragment, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { processWords } from "../data/content";
import { prefersReducedMotion } from "../lib/scroll";
import "../style/HorizontalScroll.css";

const pad = (n) => String(n).padStart(2, "0");
const label = processWords.map((w) => w.word).join(" ");

// Kinetic typography strip: pinned, scrolls horizontally, each outlined word
// fills with colour as it crosses the centre, image "pills" spin in between
// words, and the whole line leans with scroll velocity.
export default function HorizontalScroll() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      const skew = track.querySelector(".process__skew");
      const fill = section.querySelector(".process__progress-fill");
      const count = section.querySelector(".process__index");
      const words = gsap.utils.toArray(".process__word", track);
      const pills = gsap.utils.toArray(".process__pill", track);

      if (prefersReducedMotion()) {
        gsap.set(words, { backgroundPosition: "0% 0" });
        return undefined;
      }

      const getAmount = () => track.scrollWidth - window.innerWidth;
      const skewTo = gsap.quickTo(skew, "skewX", { duration: 0.5, ease: "power3" });
      let current = -1;

      const tween = gsap.to(track, {
        x: () => -getAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getAmount()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            fill.style.transform = `scaleX(${self.progress.toFixed(4)})`;
            const index = Math.min(words.length - 1, Math.floor(self.progress * words.length));
            if (index !== current) {
              current = index;
              count.textContent = pad(index + 1);
            }
            skewTo(gsap.utils.clamp(-10, 10, self.getVelocity() / -260));
          },
        },
      });

      const resetSkew = () => skewTo(0);
      ScrollTrigger.addEventListener("scrollEnd", resetSkew);

      // Outline → filled sweep as each word crosses the middle of the screen.
      words.forEach((word) => {
        gsap.fromTo(
          word,
          { backgroundPosition: "100% 0" },
          {
            backgroundPosition: "0% 0",
            ease: "none",
            scrollTrigger: { trigger: word, containerAnimation: tween, start: "left 80%", end: "right 50%", scrub: true },
          }
        );
      });

      // Image pills spin and grow in, with inner parallax.
      pills.forEach((pill) => {
        gsap.fromTo(
          pill,
          { scale: 0.3, rotate: -18 },
          {
            scale: 1,
            rotate: 0,
            ease: "back.out(1.6)",
            scrollTrigger: { trigger: pill, containerAnimation: tween, start: "left 100%", end: "left 55%", scrub: true },
          }
        );
        gsap.fromTo(
          pill.querySelector("img"),
          { xPercent: -14 },
          {
            xPercent: 14,
            ease: "none",
            scrollTrigger: { trigger: pill, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          }
        );
      });

      return () => ScrollTrigger.removeEventListener("scrollEnd", resetSkew);
    },
    { scope: sectionRef }
  );

  return (
    <section className="process" ref={sectionRef} aria-label={label}>
      <div className="process__head">
        <p className="eyebrow">How I work</p>
        <p className="process__count" aria-hidden="true">
          <span className="process__index">01</span> / {pad(processWords.length)}
        </p>
      </div>

      <div className="process__track" ref={trackRef} aria-hidden="true">
        <div className="process__skew">
          {processWords.map((item) => (
            <Fragment key={item.word}>
              <span className="process__word">{item.word}</span>
              {item.image && (
                <span className="process__pill">
                  <img src={item.image} alt="" width="600" height="600" loading="lazy" decoding="async" />
                </span>
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="process__progress" aria-hidden="true">
        <span className="process__progress-fill" />
      </div>
    </section>
  );
}
