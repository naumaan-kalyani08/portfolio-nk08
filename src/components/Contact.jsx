import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import useThreeScene from "../three/useThreeScene";
import { profile, socials } from "../data/content";
import { isFinePointer, prefersReducedMotion, scrollToTarget } from "../lib/scroll";
import RevealHeading from "./RevealHeading";
import "../style/Contact.css";

const loadContactScene = () => import("../three/contactScene.js");

function MagneticButton({ href, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!isFinePointer() || prefersReducedMotion()) return undefined;

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });

    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      xTo((event.clientX - (rect.left + rect.width / 2)) * 0.35);
      yTo((event.clientY - (rect.top + rect.height / 2)) * 0.35);
    };
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)", overwrite: "auto" });
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <a ref={ref} className="magnetic" href={href}>
      <span className="magnetic__label">{children}</span>
    </a>
  );
}

const getTime = () =>
  new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());

export default function Contact() {
  const canvasRef = useRef(null);
  const toastRef = useRef(null);
  const [time, setTime] = useState(getTime);
  const [toast, setToast] = useState("");

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setToast("Email copied to clipboard ✓");
    } catch {
      setToast(profile.email);
    }
    const el = toastRef.current;
    gsap.killTweensOf(el);
    gsap
      .timeline()
      .fromTo(el, { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(1.8)" })
      .to(el, { yPercent: 120, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, "+=1.8");
  };

  useThreeScene(canvasRef, loadContactScene, { progressStart: "top bottom", progressEnd: "bottom top" });

  useEffect(() => {
    const id = window.setInterval(() => setTime(getTime()), 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="contact" className="contact">
      <div className="contact__canvas" ref={canvasRef} />

      <div className="contact__inner">
        <p className="eyebrow" data-reveal>
          06 — Contact
        </p>
        <RevealHeading className="contact__title" gradientWords={["together."]}>
          Let&apos;s build something great together.
        </RevealHeading>

        <div className="contact__cta" data-reveal>
          <MagneticButton href={`mailto:${profile.email}`}>Say hello ↗</MagneticButton>
          <button type="button" className="contact__copy" onClick={copyEmail} data-magnetic="0.2">
            <span className="contact__copy-icon" aria-hidden="true">
              ⧉
            </span>
            Copy email
          </button>
        </div>

        <div className="contact__grid">
          <div className="contact__col" data-reveal>
            <span className="contact__label">Email</span>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </div>
          <div className="contact__col" data-reveal>
            <span className="contact__label">Socials</span>
            <div className="contact__links">
              {socials.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer noopener">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="contact__col" data-reveal>
            <span className="contact__label">Local time</span>
            <span>
              {profile.city} · {time}
            </span>
          </div>
        </div>
      </div>

      <div className="toast" ref={toastRef} role="status" aria-live="polite">
        {toast}
      </div>

      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="site-footer__built">Built with React, GSAP & Three.js</span>
        <button type="button" className="site-footer__top" onClick={() => scrollToTarget("#home", { duration: 2 })}>
          Back to top ↑
        </button>
      </footer>
    </section>
  );
}
