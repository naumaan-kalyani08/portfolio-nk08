import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import useThreeScene from "../three/useThreeScene";
import { profile } from "../data/content";
import { isSmallScreen, prefersReducedMotion, scrollToTarget } from "../lib/scroll";
import "../style/Hero.css";

const titleLines = ["Creative", "Developer"];
const loadHeroScene = () => import("../three/heroScene.js");

export default function Hero() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);

  useThreeScene(canvasRef, loadHeroScene, {
    onReady: () =>
      gsap.to(canvasRef.current, { autoAlpha: isSmallScreen() ? 0.7 : 1, duration: 1.6, ease: "power2.out" }),
  });

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(".hero__boxes", { display: "none" });
        return;
      }

      // Intro: shutters wipe away (scaleX is GPU-friendly, unlike width), then
      // the headline rises through its masks and the details fade in.
      const intro = gsap.timeline({ delay: 0.25 });
      intro
        .to(".hero__box", {
          scaleX: 0,
          duration: 1,
          ease: "power4.inOut",
          stagger: { amount: 0.5, from: "start" },
        })
        .set(".hero__boxes", { display: "none" })
        .from(".hero__char", { yPercent: 115, duration: 1, ease: "power4.out", stagger: 0.035 }, "-=0.6")
        .from(".hero__fade", { autoAlpha: 0, y: 24, duration: 0.9, ease: "power3.out", stagger: 0.08 }, "-=0.7");

      // Scroll-out: content drifts up and fades while the 3D scene scatters.
      gsap.to(".hero__content", {
        yPercent: -18,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="home" className="hero" ref={sectionRef}>
      <div className="hero__canvas" ref={canvasRef} />
      <div className="hero__glow" aria-hidden="true" />

      <div className="hero__content">
        <p className="hero__eyebrow hero__fade">
          {profile.available && <span className="hero__status" aria-hidden="true" />}
          Hi, I&apos;m {profile.name}
        </p>

        <h1 className="hero__title" aria-label={titleLines.join(" ")}>
          {titleLines.map((line, lineIndex) => (
            <span className="hero__line" key={line} aria-hidden="true">
              {line.split("").map((char, index) => (
                <span
                  className={`hero__char ${lineIndex === 1 ? "hero__char--outline" : ""}`}
                  key={`${char}-${index}`}
                >
                  {char}
                </span>
              ))}
            </span>
          ))}
        </h1>

        <p className="hero__tagline hero__fade">{profile.tagline}</p>

        <div className="hero__actions hero__fade">
          <a
            className="btn btn--primary"
            href="#work"
            onClick={(event) => {
              event.preventDefault();
              scrollToTarget("#work");
            }}
          >
            View my work <span className="btn__arrow" aria-hidden="true">→</span>
          </a>
          <a
            className="btn"
            href="#contact"
            onClick={(event) => {
              event.preventDefault();
              scrollToTarget("#contact");
            }}
          >
            Get in touch
          </a>
        </div>
      </div>

      <div className="hero__boxes" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="hero__box" />
        ))}
      </div>
    </section>
  );
}
