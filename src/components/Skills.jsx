import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { skillGroups } from "../data/content";
import { prefersReducedMotion } from "../lib/scroll";
import RevealHeading from "./RevealHeading";
import "../style/Skills.css";

// Stacking cards. Stacking itself is pure CSS `position: sticky` (zero JS
// layout work). GSAP only scrubs a scale + dimming overlay on cards that are
// being covered. Previously 11 cards were each GSAP-pinned until the end of
// the page and the cleanup killed *every* ScrollTrigger on the site.
export default function Skills() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const wraps = gsap.utils.toArray(".skill-card-wrap");

      wraps.forEach((wrap, index) => {
        const next = wraps[index + 1];
        if (!next) return;
        const card = wrap.querySelector(".skill-card");
        const shade = wrap.querySelector(".skill-card__shade");

        const tl = gsap.timeline({
          scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
        });
        tl.to(card, { scale: 0.9 - (wraps.length - index) * 0.01, rotationX: 6, ease: "none" }, 0).to(
          shade,
          { opacity: 0.55, ease: "none" },
          0
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="skills" className="section skills" ref={sectionRef}>
      <header className="section-head">
        <p className="eyebrow" data-reveal>
          05 — Toolkit
        </p>
        <RevealHeading className="section-title" gradientWords={["technologies"]}>
          Skills & technologies
        </RevealHeading>
      </header>

      <div className="skills__stack">
        {skillGroups.map((group, index) => (
          <div className="skill-card-wrap" key={group.title} style={{ "--i": index }}>
            <article className="skill-card" style={{ "--card": group.color }}>
              <div className="skill-card__top">
                <span className="skill-card__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="skill-card__count">{group.items.length} tools</span>
              </div>
              <h3 className="skill-card__title">{group.title}</h3>
              <p className="skill-card__text">{group.text}</p>
              <ul className="skill-card__chips">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <span className="skill-card__shade" aria-hidden="true" />
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
