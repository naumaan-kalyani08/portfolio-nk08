import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { projects, skillGroups, skillLevels } from "../data/content";
import { prefersReducedMotion } from "../lib/scroll";
import RevealHeading from "./RevealHeading";
import "../style/Skills.css";

gsap.registerPlugin(ScrambleTextPlugin);

/*
 * "The periodic table of my stack."
 * Every group is a column, every tool an element tile. Hovering (mouse) previews
 * an element in the inspector; clicking / tapping / focusing pins it. A level
 * filter dims everything but the chosen proficiency.
 */

const pad = (n) => String(n).padStart(2, "0");
const shortYear = (year) => `'${String(year).slice(-2)}`;

// Flatten into elements with an "atomic number" in table order, and resolve
// which projects each one appears in (by project tag).
const ELEMENTS = skillGroups.flatMap((group) => group.items.map((item) => ({ ...item, group })));
ELEMENTS.forEach((el, index) => {
  const tag = (el.tag ?? el.name).toLowerCase();
  el.index = index;
  el.number = index + 1;
  el.usedIn = el.everywhere
    ? ["Every project"]
    : projects.filter((project) => project.tags.some((t) => t.toLowerCase() === tag)).map((project) => project.title);
});

const TOTAL = ELEMENTS.length;
const FIRST_YEAR = Math.min(...ELEMENTS.map((el) => el.since));
const DEFAULT_INDEX = Math.max(0, ELEMENTS.findIndex((el) => el.name === "React"));
// Only offer levels that actually have elements (no empty filters).
const FILTERS = [
  { id: 0, label: "All", count: TOTAL },
  ...[3, 2, 1]
    .map((level) => ({ id: level, label: skillLevels[level], count: ELEMENTS.filter((el) => el.level === level).length }))
    .filter((filter) => filter.count > 0),
];

const LevelDots = ({ level, className }) => (
  <span className={className} aria-hidden="true">
    {[1, 2, 3].map((n) => (
      <i key={n} className={n <= level ? "is-on" : ""} />
    ))}
  </span>
);

export default function Skills() {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const nameRef = useRef(null);
  const detailRef = useRef(null);
  const filterRef = useRef(null);
  const indicatorRef = useRef(null);
  const firstRender = useRef(true);

  const [pinned, setPinned] = useState(DEFAULT_INDEX);
  const [preview, setPreview] = useState(null);
  const [level, setLevel] = useState(0);

  const active = ELEMENTS[preview ?? pinned];

  // Tiles cascade in, column by column, the first time the table is seen.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".el, .ptable__group-head", {
        autoAlpha: 0,
        y: 36,
        rotationX: -40,
        transformOrigin: "50% 0%",
        transformPerspective: 700,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.035,
        clearProps: "transform,opacity,visibility",
        scrollTrigger: { trigger: ".ptable", start: "top 82%", once: true },
      });
      gsap.from(".inspector", {
        autoAlpha: 0,
        x: 40,
        duration: 1.1,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
        scrollTrigger: { trigger: ".ptable", start: "top 82%", once: true },
      });
    },
    { scope: sectionRef }
  );

  // Inspector: scramble the name, flip the element card, ease the details in.
  useEffect(() => {
    const name = nameRef.current;
    if (firstRender.current || prefersReducedMotion()) {
      firstRender.current = false;
      name.textContent = active.name;
      return;
    }
    gsap.to(name, {
      duration: 0.6,
      scrambleText: { text: active.name, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", speed: 1, revealDelay: 0.1 },
      overwrite: true,
    });
    gsap.fromTo(
      cardRef.current,
      { rotationY: -75, scale: 0.92, transformPerspective: 800 },
      { rotationY: 0, scale: 1, duration: 0.7, ease: "back.out(1.6)", overwrite: true }
    );
    gsap.fromTo(
      detailRef.current.children,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.04, overwrite: true }
    );
  }, [active]);

  // Slide the filter indicator under the selected option.
  useLayoutEffect(() => {
    const place = () => {
      const button = filterRef.current?.querySelector(`[data-level="${level}"]`);
      if (!button || !indicatorRef.current) return;
      indicatorRef.current.style.width = `${button.offsetWidth}px`;
      indicatorRef.current.style.transform = `translateX(${button.offsetLeft}px)`;
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready?.then(place);
    return () => window.removeEventListener("resize", place);
  }, [level]);

  // Cursor spotlight inside whichever tile is hovered (one delegated listener).
  const handleTableMove = (event) => {
    const tile = event.target.closest(".el");
    if (!tile) return;
    const rect = tile.getBoundingClientRect();
    tile.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    tile.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  const select = (index) => {
    setPinned(index);
    setPreview(null);
  };

  return (
    <section id="skills" className="section skills" ref={sectionRef}>
      <header className="section-head skills__head">
        <p className="eyebrow" data-reveal>
          05 — Toolkit
        </p>
        <RevealHeading className="section-title" gradientWords={["technologies"]}>
          Skills & technologies
        </RevealHeading>
        <div className="skills__bar" data-reveal>
          <p className="skills__intro">
            The periodic table of my stack — {TOTAL} elements I build with. Hover or tap one to inspect it, or filter
            by how often I reach for it.
          </p>

          <div className="skills__filter" ref={filterRef} role="group" aria-label="Filter by level">
            <span className="skills__filter-indicator" ref={indicatorRef} aria-hidden="true" />
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                data-level={filter.id}
                className={level === filter.id ? "is-active" : ""}
                aria-pressed={level === filter.id}
                onClick={() => setLevel(filter.id)}
              >
                {filter.id > 0 && <LevelDots level={filter.id} className="skills__filter-dots" />}
                {filter.label}
                <span className="skills__filter-count">{filter.count}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="skills__layout">
        <div className="ptable" onPointerMove={handleTableMove} onPointerLeave={() => setPreview(null)}>
          {skillGroups.map((group) => {
            const isActiveGroup = active.group.id === group.id;
            return (
              <div className="ptable__group" key={group.id} style={{ "--g": group.rgb }}>
                <div className={`ptable__group-head ${isActiveGroup ? "is-active" : ""}`} title={group.text}>
                  <span className="ptable__group-dot" aria-hidden="true" />
                  <span className="ptable__group-title">{group.title}</span>
                  <span className="ptable__group-count">{pad(group.items.length)}</span>
                </div>

                {ELEMENTS.filter((el) => el.group === group).map((el) => {
                  const isActive = el === active;
                  const isDim = level !== 0 && el.level !== level;
                  return (
                    <button
                      key={el.name}
                      type="button"
                      className={`el ${isActive ? "is-active" : ""} ${isDim ? "is-dim" : ""}`}
                      aria-pressed={el.index === pinned}
                      aria-label={`${el.name} — ${skillLevels[el.level]}, since ${el.since}`}
                      onPointerEnter={(event) => event.pointerType === "mouse" && setPreview(el.index)}
                      onFocus={() => select(el.index)}
                      onClick={() => select(el.index)}
                    >
                      <span className="el__num">{pad(el.number)}</span>
                      <LevelDots level={el.level} className="el__level" />
                      <span className="el__symbol">{el.symbol}</span>
                      <span className="el__name">{el.name}</span>
                      <span className="el__since">{shortYear(el.since)}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <aside className="inspector" style={{ "--g": active.group.rgb }} aria-label="Selected skill">
          <div className="inspector__head">
            <span className="inspector__kicker">
              <span className="inspector__pulse" aria-hidden="true" /> Inspector
            </span>
            <span className="inspector__count">
              {pad(active.number)} <span>/ {pad(TOTAL)}</span>
            </span>
          </div>

          <div className="inspector__body">
            <div className="inspector__stage">
              <div className="inspector__card" ref={cardRef} aria-hidden="true">
                <span className="el__num">{pad(active.number)}</span>
                <LevelDots level={active.level} className="el__level" />
                <span className="inspector__symbol">{active.symbol}</span>
                <span className="el__name">{active.name}</span>
                <span className="el__since">{shortYear(active.since)}</span>
              </div>
            </div>

            <div className="inspector__intro">
              <span className="inspector__group">
                <i aria-hidden="true" />
                {active.group.title}
              </span>
              <h3 className="inspector__name">
                <span className="sr-only">{active.name}</span>
                <span ref={nameRef} aria-hidden="true" />
              </h3>
            </div>
          </div>

          <div className="inspector__detail" ref={detailRef}>
            <p className="inspector__note">{active.note}</p>
            <dl className="inspector__stats">
              <div>
                <dt>Level</dt>
                <dd>
                  <span className="meter" aria-hidden="true">
                    {[1, 2, 3].map((n) => (
                      <i key={n} className={n <= active.level ? "is-on" : ""} />
                    ))}
                  </span>
                  {skillLevels[active.level]}
                </dd>
              </div>
              <div>
                <dt>Since</dt>
                <dd>{active.since}</dd>
              </div>
              {active.usedIn.length > 0 && (
                <div>
                  <dt>Used in</dt>
                  <dd>{active.usedIn.join(" · ")}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>

      <footer className="skills__foot" data-reveal>
        <ul className="skills__key" aria-label="How to read a tile">
          <li>
            <b>01</b> Order
          </li>
          <li>
            <b className="skills__key-symbol">Re</b> Symbol
          </li>
          <li>
            <LevelDots level={2} className="el__level skills__key-dots" /> Level
          </li>
          <li>
            <b>&apos;24</b> Since
          </li>
        </ul>
        <p className="skills__summary">
          {TOTAL} elements · {skillGroups.length} groups · writing code since {FIRST_YEAR}
        </p>
      </footer>
    </section>
  );
}
