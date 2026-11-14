import { useRef } from "react";
import gsap from "gsap";
import { navItems, socials } from "../data/content";
import { isFinePointer, prefersReducedMotion, scrollToTarget } from "../lib/scroll";
import "../style/Dock.css";

/* A macOS-style dock: glass shelf, app icons that magnify around the cursor,
   tooltips, a "running" dot and the bounce on launch. Section links scroll;
   socials open in a new tab. */

const GLYPHS = {
  home: <text x="30" y="38.5" textAnchor="middle" fontSize="23" fontWeight="800" fill="#fff" stroke="none" fontFamily="Space Grotesk, sans-serif">nk</text>,
  about: (
    <>
      <circle cx="30" cy="24" r="6.5" />
      <path d="M17.5 43c1.8-7 7-10.5 12.5-10.5S40.7 36 42.5 43" />
    </>
  ),
  work: (
    <>
      <rect x="15" y="22" width="30" height="21" rx="3.5" />
      <path d="M24.5 22v-3.2a2.3 2.3 0 0 1 2.3-2.3h6.4a2.3 2.3 0 0 1 2.3 2.3V22M15 31h30" />
    </>
  ),
  experience: (
    <>
      <path d="M19 41c0-9 22-6 22-17" />
      <circle cx="19" cy="42" r="3.4" fill="#fff" />
      <circle cx="41" cy="19.5" r="3.4" fill="#fff" />
    </>
  ),
  skills: <path d="M30 15.5 43 23v14l-13 7.5L17 37V23zM30 30l13-7M30 30v14.5M30 30l-13-7" />,
  contact: (
    <>
      <rect x="15" y="20" width="30" height="21" rx="3.5" />
      <path d="m16 22 14 10 14-10" />
    </>
  ),
  github: <path d="M24 23 17 30l7 7M36 23l7 7-7 7M33 19l-6 22" />,
  linkedin: (
    <>
      <path d="M21 27v14M21 20.5v.5M28 41V27M28 33c0-4 2.5-6 5.5-6s5.5 2 5.5 6v8" />
    </>
  ),
  dribbble: (
    <>
      <circle cx="30" cy="30" r="13" />
      <path d="M20 20c6 4 13 13 15 22M17.5 32c8-2 16-1 24 3M24 17.5c4 4 13 7 18.5 5" />
    </>
  ),
};

const GRADIENTS = {
  home: ["#6366f1", "#22d3ee"],
  about: ["#f59e0b", "#ef4444"],
  work: ["#38bdf8", "#2563eb"],
  experience: ["#a78bfa", "#7c3aed"],
  skills: ["#34d399", "#059669"],
  contact: ["#fb7185", "#e11d48"],
  github: ["#3f3f46", "#09090b"],
  linkedin: ["#3b82f6", "#1d4ed8"],
  dribbble: ["#f472b6", "#db2777"],
};

const keyFor = (href, label) => (href.startsWith("#") ? href.slice(1) : label.toLowerCase());

const APPS = navItems.map((item) => ({ ...item, key: keyFor(item.href, item.label) }));
const SOCIALS = socials.map((item) => ({ ...item, key: item.label.toLowerCase(), external: true }));

function AppIcon({ id }) {
  const [from, to] = GRADIENTS[id] || ["#64748b", "#334155"];
  return (
    <svg className="dock__icon" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`dock-g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={`dock-s-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="56" height="56" rx="13.5" fill={`url(#dock-g-${id})`} />
      <rect x="2" y="2" width="56" height="56" rx="13.5" fill={`url(#dock-s-${id})`} />
      <g fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {GLYPHS[id] || GLYPHS.home}
      </g>
    </svg>
  );
}

export default function Dock() {
  const listRef = useRef(null);
  const centers = useRef([]);

  const items = () => Array.from(listRef.current?.querySelectorAll(".dock__item") || []);

  // Magnification: icons near the cursor grow (and push their neighbours),
  // like the real dock. Centres are measured unmagnified on enter.
  const onEnter = () => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    listRef.current.classList.add("is-hover");
    centers.current = items().map((el) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  };
  const onMove = (event) => {
    if (!listRef.current.classList.contains("is-hover")) return;
    items().forEach((el, i) => {
      const d = Math.abs(event.clientX - centers.current[i]);
      const k = Math.max(0, 1 - d / 150);
      el.style.setProperty("--s", (1 + 0.62 * Math.sin((k * Math.PI) / 2) ** 2).toFixed(3));
    });
  };
  const onLeave = () => {
    listRef.current.classList.remove("is-hover");
    items().forEach((el) => el.style.setProperty("--s", "1"));
  };

  const bounce = (el) => {
    if (prefersReducedMotion()) return;
    const icon = el.querySelector(".dock__lift");
    gsap
      .timeline({ overwrite: true })
      .to(icon, { y: -22, duration: 0.24, ease: "power2.out" })
      .to(icon, { y: 0, duration: 0.24, ease: "power2.in" })
      .to(icon, { y: -10, duration: 0.18, ease: "power2.out" })
      .to(icon, { y: 0, duration: 0.18, ease: "power2.in" });
  };

  const launch = (app) => (event) => {
    bounce(event.currentTarget);
    if (app.external) return;
    event.preventDefault();
    gsap.delayedCall(prefersReducedMotion() ? 0 : 0.3, () => scrollToTarget(app.href));
  };

  const renderItem = (app) => (
    <li key={app.key} className={`dock__item${app.external ? " dock__item--social" : ""}`}>
      <a
        className="dock__link"
        href={app.href}
        onClick={launch(app)}
        aria-label={app.label}
        {...(app.external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        <span className="dock__tip" aria-hidden="true">
          {app.label}
        </span>
        <span className="dock__lift">
          <AppIcon id={app.key} />
        </span>
      </a>
      {app.key === "home" && <span className="dock__running" aria-hidden="true" />}
    </li>
  );

  return (
    <nav className="dock" aria-label="Quick navigation">
      <ul className="dock__shelf" ref={listRef} onPointerEnter={onEnter} onPointerMove={onMove} onPointerLeave={onLeave}>
        {APPS.map(renderItem)}
        {SOCIALS.length > 0 && <li className="dock__divider" aria-hidden="true" />}
        {SOCIALS.map(renderItem)}
      </ul>
    </nav>
  );
}
