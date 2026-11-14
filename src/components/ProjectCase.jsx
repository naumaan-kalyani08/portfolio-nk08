import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { projects } from "../data/content";
import { getLenis, prefersReducedMotion } from "../lib/scroll";
import "../style/ProjectCase.css";

const pad = (n) => String(n).padStart(2, "0");

// Full-screen case study. Opens by Flip-morphing the card image into the hero
// image here; closes by morphing it back into the card (handled by Projects).
export default function ProjectCase({ index, flipState, onClose, onNext }) {
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const busy = useRef(false);
  const firstRender = useRef(true);
  const project = projects[index];
  const next = projects[(index + 1) % projects.length];

  // Open: lock page scroll, morph the image in, then stagger the content.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const reduced = prefersReducedMotion();
    getLenis()?.stop();
    document.documentElement.classList.add("is-locked");

    const ctx = gsap.context(() => {
      gsap.fromTo(".case__backdrop", { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.2 : 0.6, ease: "power2.out" });
      if (reduced) return;
      gsap.from(".case__bar", { y: -20, autoAlpha: 0, duration: 0.7, ease: "power3.out", delay: 0.4 });

      if (flipState.current) {
        Flip.from(flipState.current, { targets: root.querySelector(".case__media"), duration: 1, ease: "expo.inOut" });
        flipState.current = null;
      } else {
        gsap.from(".case__media", { autoAlpha: 0, y: 60, duration: 0.8, ease: "power3.out" });
      }
      gsap.from(".case__anim", { y: 40, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.06, delay: 0.5 });
      gsap.from(".case__title-word", { yPercent: 110, duration: 1, ease: "power4.out", stagger: 0.06, delay: 0.55 });
    }, root);

    root.querySelector(".case__close").focus({ preventScroll: true });

    // Esc works wherever focus is (it can land on <body> during transitions).
    const onEscape = (event) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("keydown", onEscape);
      ctx.revert();
      document.documentElement.classList.remove("is-locked");
      getLenis()?.start();
    };
    // Runs once per open; project switches are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Next project": content cross-fades in without a Flip.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    scrollRef.current.scrollTop = 0;
    busy.current = false;
    rootRef.current.querySelector(".case__close").focus({ preventScroll: true });
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(".case__media img", { scale: 1.25, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.1, ease: "expo.out" });
      gsap.fromTo(".case__anim", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.05 });
      gsap.fromTo(".case__title-word", { yPercent: 110 }, { yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.06 });
    }, root);
    return () => ctx.revert();
  }, [index]);

  const close = () => {
    if (busy.current) return;
    busy.current = true;
    const root = rootRef.current;
    if (prefersReducedMotion()) {
      onClose(null);
      return;
    }
    gsap
      .timeline({ onComplete: () => onClose(Flip.getState(root.querySelector(".case__media"))) })
      .to(root.querySelectorAll(".case__bar, .case__anim, .case__title"), { y: 24, autoAlpha: 0, duration: 0.3, ease: "power2.in", stagger: 0.015 })
      .to(root.querySelector(".case__backdrop"), { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.05);
  };

  const goNext = () => {
    if (busy.current) return;
    busy.current = true;
    const root = rootRef.current;
    gsap
      .timeline({ onComplete: onNext })
      .to(root.querySelectorAll(".case__anim, .case__title-word"), { y: -30, autoAlpha: 0, duration: 0.35, ease: "power2.in", stagger: 0.01 })
      .to(root.querySelector(".case__media img"), { scale: 1.1, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0);
  };

  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  // Simple focus trap.
  const onKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...rootRef.current.querySelectorAll("a[href], button:not([disabled])")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div className="case" ref={rootRef} role="dialog" aria-modal="true" aria-labelledby="case-title" onKeyDown={onKeyDown}>
      <div className="case__backdrop" onClick={close} />

      <div className="case__scroll" ref={scrollRef} data-lenis-prevent>
        <div className="case__bar">
          <span className="case__crumb">
            Selected work <span>— {pad(index + 1)} / {pad(projects.length)}</span>
          </span>
          <button type="button" className="case__close" onClick={close}>
            Close <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="case__media" data-flip-id={project.slug}>
          <img src={project.image} alt={`${project.title} preview`} width="1200" height="1200" decoding="async" />
        </div>

        <div className="case__body">
          <p className="case__eyebrow case__anim">{project.category}</p>
          <h2 id="case-title" className="case__title" aria-label={project.title}>
            {project.title.split(" ").map((word, i) => (
              <span className="case__title-mask" key={`${word}-${i}`} aria-hidden="true">
                <span className="case__title-word">{word}</span>
              </span>
            ))}
          </h2>

          <dl className="case__meta case__anim">
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>{project.tags.join(" · ")}</dd>
            </div>
          </dl>

          <p className="case__lead case__anim">{project.description}</p>

          <ul className="case__highlights case__anim">
            {project.highlights.map((item, i) => (
              <li key={item}>
                <span>{pad(i + 1)}</span>
                {item}
              </li>
            ))}
          </ul>

          <div className="case__actions case__anim">
            <a className="btn btn--primary" href={project.live} target="_blank" rel="noreferrer noopener">
              Visit live site <span className="btn__arrow" aria-hidden="true">→</span>
            </a>
            <a className="btn" href={project.repo} target="_blank" rel="noreferrer noopener">
              Source code
            </a>
          </div>

          <button type="button" className="case__next case__anim" onClick={goNext}>
            <span className="case__next-label">Next project</span>
            <span className="case__next-title">
              {next.title} <span aria-hidden="true">→</span>
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
