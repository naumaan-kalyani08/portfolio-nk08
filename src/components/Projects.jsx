import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { projects } from "../data/content";
import { isFinePointer, prefersReducedMotion } from "../lib/scroll";
import RevealHeading from "./RevealHeading";
import "../style/Projects.css";

export default function Projects() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.utils.toArray(".project").forEach((card) => {
        const media = card.querySelector(".project__media");
        const img = card.querySelector(".project__img");

        // Clip-path wipe reveal as the card enters.
        gsap.fromTo(
          media,
          { clipPath: "inset(18% 8% 18% 8% round 24px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 20px)",
            ease: "power2.out",
            scrollTrigger: { trigger: card, start: "top 92%", end: "top 45%", scrub: 0.6 },
          }
        );

        // Inner image parallax.
        gsap.fromTo(
          img,
          { yPercent: -8, scale: 1.18 },
          {
            yPercent: 8,
            scale: 1.08,
            ease: "none",
            scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });

      // 3D tilt on hover — desktop / fine pointers only.
      if (!isFinePointer()) return;
      const cleanups = gsap.utils.toArray(".project__link").map((link) => {
        const rotX = gsap.quickTo(link, "rotationX", { duration: 0.6, ease: "power3" });
        const rotY = gsap.quickTo(link, "rotationY", { duration: 0.6, ease: "power3" });
        gsap.set(link, { transformPerspective: 900 });

        const onMove = (event) => {
          const rect = link.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          rotY(px * 8);
          rotX(-py * 8);
        };
        const onLeave = () => {
          rotX(0);
          rotY(0);
        };

        link.addEventListener("pointermove", onMove);
        link.addEventListener("pointerleave", onLeave);
        return () => {
          link.removeEventListener("pointermove", onMove);
          link.removeEventListener("pointerleave", onLeave);
        };
      });

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: sectionRef }
  );

  return (
    <section id="work" className="section projects" ref={sectionRef}>
      <header className="section-head">
        <p className="eyebrow" data-reveal>
          03 — Selected work
        </p>
        <RevealHeading className="section-title" gradientWords={["projects"]}>
          Featured projects
        </RevealHeading>
      </header>

      <div className="projects__grid">
        {projects.map((project, index) => (
          <article className="project" key={project.title}>
            <a className="project__link" href={project.href} data-cursor="View">
              <div className="project__media">
                <img
                  className="project__img"
                  src={project.image}
                  alt={`${project.title} preview`}
                  width="1200"
                  height="1200"
                  loading="lazy"
                  decoding="async"
                />
                <span className="project__num">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="project__info">
                <div>
                  <h3 className="project__title">{project.title}</h3>
                  <p className="project__category">{project.category}</p>
                </div>
                <span className="project__year">{project.year}</span>
              </div>
              <ul className="project__tags" aria-label="Technologies">
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
