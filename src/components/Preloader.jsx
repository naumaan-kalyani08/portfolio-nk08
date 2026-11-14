import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { profile } from "../data/content";
import { isAppReady, setAppReady } from "../lib/ready";
import { introEnabled, whenIntroSceneReady } from "../lib/intro";
import { prefersReducedMotion } from "../lib/scroll";
import "../style/Preloader.css";

const WORDS = ["Think", "Design", "Build", "Ship"];
const MIN_DURATION = 1.4; // s — never flash
const FAILSAFE = 4000; // ms — never get stuck
const CURVE_FLAT = "M0,0 L1000,0 L1000,0 Q500,0 0,0 Z";
const CURVE_BULGE = "M0,0 L1000,0 L1000,0 Q500,160 0,0 Z";

// Each task is capped: a slow font CDN must never hold the site hostage
// (text simply swaps in when the webfont arrives).
const capped = (promise, ms) =>
  Promise.race([Promise.resolve(promise).catch(() => null), new Promise((resolve) => setTimeout(resolve, ms))]);

// Real progress: fonts, window load (images, incl. the hero's Memoji) and —
// when the laptop intro runs — its scene (chunk + model + shader compile).
const loadTasks = () =>
  [
    capped(document.fonts?.ready, 2200),
    capped(
      document.readyState === "complete"
        ? null
        : new Promise((resolve) => window.addEventListener("load", resolve, { once: true })),
      3000
    ),
    introEnabled() && capped(whenIntroSceneReady(), 3500),
  ].filter(Boolean);

export default function Preloader() {
  const [done, setDone] = useState(isAppReady);
  const rootRef = useRef(null);

  // Layout effect: initial animation states are applied before React's first
  // paint, so the hand-off from the static HTML preloader (index.html) is seamless.
  useLayoutEffect(() => {
    if (done) return undefined;
    const root = rootRef.current;
    const q = (selector) => root.querySelector(selector);
    const num = q(".preloader__num");
    const fill = q(".preloader__fill");
    const html = document.documentElement;
    html.classList.add("is-locked");

    const ctx = gsap.context(() => {}, root);
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;

      ctx.add(() => {
        const exit = gsap.timeline({
          onComplete: () => {
            html.classList.remove("is-locked");
            setDone(true);
          },
        });

        if (prefersReducedMotion()) {
          exit.add(setAppReady).to(root, { autoAlpha: 0, duration: 0.4 });
          return;
        }

        exit
          .to(".preloader__mask > *", { yPercent: -110, duration: 0.6, ease: "power3.in", stagger: 0.04 })
          .to(".preloader__bar", { scaleX: 0, transformOrigin: "100% 50%", duration: 0.5, ease: "power3.in" }, "<")
          .add(setAppReady, "-=0.05") // hero intro starts while the curtain lifts
          .to(".preloader__panel", { yPercent: -100, duration: 1.15, ease: "power4.inOut" }, "<")
          .to(".preloader__curve path", { attr: { d: CURVE_BULGE }, duration: 0.55, ease: "power2.in" }, "<")
          .to(".preloader__curve path", { attr: { d: CURVE_FLAT }, duration: 0.6, ease: "power2.out" });
      });
    };

    ctx.add(() => {
      const start = performance.now();
      const progress = { value: 0 };
      let target = 0.12;
      let completed = 0;
      const tasks = loadTasks();

      const render = () => {
        const value = Math.round(progress.value);
        num.textContent = value;
        fill.style.transform = `scaleX(${value / 100})`;
      };

      const advance = () => {
        gsap.to(progress, {
          value: target * 100,
          duration: target >= 1 ? 0.9 : 1.2,
          ease: "power2.out",
          overwrite: true,
          onUpdate: render,
          onComplete: () => {
            if (target < 1) return;
            const elapsed = (performance.now() - start) / 1000;
            gsap.delayedCall(Math.max(0, MIN_DURATION - elapsed), finish);
          },
        });
      };

      tasks.forEach((task) =>
        Promise.resolve(task).finally(() => {
          completed += 1;
          target = Math.max(target, completed / tasks.length);
          advance();
        })
      );
      advance();

      // Cycling word in the centre.
      const words = gsap.utils.toArray(".preloader__word");
      gsap.set(words, { yPercent: 110 });
      const cycle = gsap.timeline({ repeat: -1 });
      words.forEach((word) => {
        cycle
          .to(word, { yPercent: 0, duration: 0.45, ease: "power3.out" })
          .to(word, { yPercent: -110, duration: 0.45, ease: "power3.in" }, "+=0.35");
      });

    });

    const failsafe = window.setTimeout(finish, FAILSAFE);

    return () => {
      window.clearTimeout(failsafe);
      ctx.revert();
      html.classList.remove("is-locked");
    };
  }, [done]);

  if (done) return null;

  return (
    <div className="preloader" ref={rootRef} role="status" aria-live="polite" aria-label="Loading portfolio">
      <div className="preloader__panel">
        <div className="preloader__top">
          <span className="preloader__brand">
            {profile.initials}
            <sup>®</sup>
          </span>
          <span className="preloader__meta">
            {profile.role} — ©{new Date().getFullYear()}
          </span>
        </div>

        <div className="preloader__center" aria-hidden="true">
          <span className="preloader__mask">
            <span className="preloader__words">
              {WORDS.map((word) => (
                <span className="preloader__word" key={word}>
                  {word}
                </span>
              ))}
            </span>
          </span>
        </div>

        <div className="preloader__bottom">
          <span className="preloader__bar" aria-hidden="true">
            <span className="preloader__fill" />
          </span>
          <span className="preloader__mask">
            <span className="preloader__count">
              <span className="preloader__num">0</span>
              <span className="preloader__pct">%</span>
            </span>
          </span>
        </div>

        <svg className="preloader__curve" viewBox="0 0 1000 160" preserveAspectRatio="none" aria-hidden="true">
          <path d={CURVE_FLAT} />
        </svg>
      </div>
    </div>
  );
}
