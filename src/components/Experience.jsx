import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experience } from "../data/content";
import { prefersReducedMotion } from "../lib/scroll";
import RevealHeading from "./RevealHeading";
import "../style/Experience.css";

// Scroll-drawn timeline. The line is a scaleY transform and the travelling
// dot a translateY — no per-frame SVG path measuring, fully responsive and
// readable on mobile (the previous SVG text scaled down to ~8px on phones).
export default function Experience() {
  const sectionRef = useRef(null);
  const timelineRef = useRef(null);

  useGSAP(
    () => {
      const timeline = timelineRef.current;
      const items = gsap.utils.toArray(".timeline__item");

      if (prefersReducedMotion()) {
        gsap.set(".timeline__progress", { scaleY: 1 });
        items.forEach((item) => item.classList.add("is-active"));
        return;
      }

      const scrollConfig = {
        trigger: timeline,
        start: "top 60%",
        end: "bottom 60%",
        scrub: 0.6,
        invalidateOnRefresh: true,
      };

      gsap.fromTo(".timeline__progress", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: scrollConfig });
      gsap.fromTo(
        ".timeline__dot",
        { y: 0 },
        { y: () => timeline.offsetHeight, ease: "none", scrollTrigger: { ...scrollConfig } }
      );

      items.forEach((item) => {
        const card = item.querySelector(".timeline__card");
        const fromRight = item.classList.contains("is-right");

        ScrollTrigger.create({
          trigger: item,
          start: "top 60%",
          toggleClass: { targets: item, className: "is-active" },
        });

        gsap.from(card, {
          autoAlpha: 0,
          x: window.innerWidth > 900 ? (fromRight ? 60 : -60) : 30,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: item, start: "top 75%", toggleActions: "play none none reverse" },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="experience" className="section experience" ref={sectionRef}>
      <header className="section-head">
        <p className="eyebrow" data-reveal>
          04 — Journey
        </p>
        <RevealHeading className="section-title" gradientWords={["milestones"]}>
          Experience & milestones
        </RevealHeading>
      </header>

      <div className="timeline" ref={timelineRef}>
        <div className="timeline__track" aria-hidden="true">
          <div className="timeline__progress" />
          <div className="timeline__dot" />
        </div>

        <ol className="timeline__list">
          {experience.map((item, index) => (
            <li className={`timeline__item ${index % 2 ? "is-right" : "is-left"}`} key={`${item.year}-${item.title}`}>
              <span className="timeline__node" aria-hidden="true" />
              <div className="timeline__card">
                <span className="timeline__year text-gradient">{item.year}</span>
                <h3 className="timeline__title">{item.title}</h3>
                <p className="timeline__place">{item.place}</p>
                <p className="timeline__text">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
