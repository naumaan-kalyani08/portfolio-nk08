import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { stats } from "../data/content";
import "../style/Stats.css";

export default function Stats() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      gsap.utils.toArray(".stat__value").forEach((el) => {
        const target = Number(el.dataset.value);
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(counter.value);
          },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section className="stats" ref={sectionRef} aria-label="Highlights">
      <ul className="stats__grid">
        {stats.map((stat) => (
          <li className="stat" key={stat.label} data-reveal>
            <span className="stat__number">
              <span className="stat__value" data-value={stat.value}>
                {stat.value}
              </span>
              <span className="stat__suffix text-gradient">{stat.suffix}</span>
            </span>
            <span className="stat__label">{stat.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
