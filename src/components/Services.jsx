import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { services } from "../data/content";
import { isFinePointer, prefersReducedMotion } from "../lib/scroll";
import RevealHeading from "./RevealHeading";
import "../style/Services.css";

// Hover list with a floating image preview that trails the cursor, swaps
// image per row and tilts with horizontal velocity. All transform-only.
export default function Services() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      if (!isFinePointer() || prefersReducedMotion()) return undefined;
      const wrap = sectionRef.current.querySelector(".services__wrap");
      const list = wrap.querySelector(".services__list");
      const preview = wrap.querySelector(".services__preview");
      const images = gsap.utils.toArray(".services__preview-img", preview);
      const rows = gsap.utils.toArray(".service", list);

      const xTo = gsap.quickTo(preview, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(preview, "y", { duration: 0.6, ease: "power3" });
      const rotTo = gsap.quickTo(preview, "rotation", { duration: 0.8, ease: "power3" });
      gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });

      let lastX = 0;
      let active = -1;

      const show = (index) => {
        if (index === active) return;
        const previous = active;
        active = index;
        images.forEach((img, i) => {
          if (i === index) {
            gsap.fromTo(
              img,
              { clipPath: previous < index ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)" },
              { clipPath: "inset(0% 0 0% 0)", zIndex: 2, duration: 0.6, ease: "expo.out", overwrite: true }
            );
          } else {
            gsap.set(img, { zIndex: 1 });
          }
        });
      };

      const onMove = (event) => {
        const rect = wrap.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        xTo(x);
        yTo(y);
        rotTo(gsap.utils.clamp(-14, 14, (event.clientX - lastX) * 0.6));
        lastX = event.clientX;
      };
      const onEnter = () => gsap.to(preview, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      const onLeave = () => {
        gsap.to(preview, { scale: 0, autoAlpha: 0, duration: 0.4, ease: "power3.in", overwrite: "auto" });
        active = -1;
      };

      const rowHandlers = rows.map((row, i) => {
        const handler = () => show(i);
        row.addEventListener("pointerenter", handler);
        return () => row.removeEventListener("pointerenter", handler);
      });

      list.addEventListener("pointermove", onMove);
      list.addEventListener("pointerenter", onEnter);
      list.addEventListener("pointerleave", onLeave);

      return () => {
        rowHandlers.forEach((fn) => fn());
        list.removeEventListener("pointermove", onMove);
        list.removeEventListener("pointerenter", onEnter);
        list.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: sectionRef }
  );

  return (
    <section id="services" className="section services" ref={sectionRef}>
      <header className="section-head">
        <p className="eyebrow" data-reveal>
          02 — What I do
        </p>
        <RevealHeading className="section-title" gradientWords={["life."]}>
          Ideas brought to life.
        </RevealHeading>
      </header>

      <div className="services__wrap">
        <ol className="services__list">
          {services.map((service, index) => (
            <li className="service" key={service.title} data-reveal>
              <span className="service__index">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="service__title">{service.title}</h3>
              <div className="service__swap">
                <p className="service__text">{service.text}</p>
                <ul className="service__tags" aria-label={`${service.title} tools`}>
                  {service.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
              <span className="service__arrow" aria-hidden="true">
                ↗
              </span>
            </li>
          ))}
        </ol>

        <div className="services__preview" aria-hidden="true">
            {services.map((service) => (
              <img
                className="services__preview-img"
                key={service.image}
                src={service.image}
                alt=""
                width="600"
                height="600"
                loading="lazy"
                decoding="async"
              />
            ))}
        </div>
      </div>
    </section>
  );
}
