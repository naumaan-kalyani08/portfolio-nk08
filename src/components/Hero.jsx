import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { heroRoles, profile } from "../data/content";
import { isHeroDormant, onHeroDormantChange, onHeroReveal } from "../lib/intro";
import { isFinePointer, isSmallScreen, prefersReducedMotion, scrollToTarget } from "../lib/scroll";
import "../style/Hero.css";

gsap.registerPlugin(ScrambleTextPlugin);

/* ---------- Memoji poses ----------
   Every PNG in src/assets/memoji/ becomes a pose named after its file
   (idea.png → "idea"). Drop in wave.png, laugh.png, … and they're picked up
   automatically; "wave" becomes the greeting pose when it exists. */
const memojiFiles = import.meta.glob("../assets/memoji/*.png", { eager: true, import: "default" });
const POSES = Object.fromEntries(
  Object.entries(memojiFiles).map(([path, url]) => [path.split("/").pop().replace(/\.png$/, ""), url])
);
const DEFAULT_POSE = ["wave", "thumbs", "smile"].find((name) => POSES[name]) || Object.keys(POSES)[0];
const START_POSE = POSES.laptop ? "laptop" : DEFAULT_POSE; // peeks over a MacBook — fits the laptop intro
const poseOr = (name) => (POSES[name] ? name : DEFAULT_POSE);
const GREETING = "Hi there! 👋";
// Clicking the memoji cycles through these.
const POKES = [
  ["peace", "Peace ✌️"],
  ["hi", "Hello again!"],
  ["thumbs", "You found me!"],
  ["smile", "Hehe, that tickles!"],
  ["wave", GREETING],
].filter(([name]) => POSES[name]);

// Floating windows around the main one. `depth` is their resting translateZ.
const PANES = [
  { id: "work", href: "#work", kicker: "Selected work", title: "Case studies", arrow: "→", pose: "laptop", say: "Here’s what I’ve been building.", depth: 150 },
  { id: "stack", href: "#skills", kicker: "Stack", title: "React · Laravel · GSAP · three.js", pose: "idea", say: "I nerd out on these.", depth: 90 },
  { id: "about", href: "#about", kicker: "About", title: "Who’s behind the code", arrow: "→", pose: "smile", say: "That’s me!", depth: 120 },
  { id: "contact", href: "#contact", kicker: "Say hi", title: "Start a project", arrow: "↗", pose: "call", say: "Call me, maybe? 🤙", depth: 170 },
];

// Words stay whole (line breaks only between them); glyphs animate on their own.
const Chars = ({ text }) =>
  text.split(" ").map((word, w) => (
    <span className="hero__word" key={`${word}-${w}`}>
      {word.split("").map((char, i) => (
        <span className="hero__char" key={`${char}-${i}`}>
          {char}
        </span>
      ))}
    </span>
  ));

export default function Hero() {
  const sectionRef = useRef(null);
  const api = useRef({ setPose: () => {}, wave: () => {} });

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();
      const fine = isFinePointer() && !isSmallScreen();
      const section = sectionRef.current;
      const room = section.querySelector(".hero__room");
      const world = section.querySelector(".hero__world");
      const panes = gsap.utils.toArray(".hero__pane", section);
      const sidePanes = panes.filter((p) => !p.classList.contains("hero__pane--main"));
      const avatar = section.querySelector(".hero__avatar");
      const body = section.querySelector(".hero__avatar-body");
      const bubble = section.querySelector(".hero__bubble");
      const bubbleText = section.querySelector(".hero__bubble-text");
      const rotator = section.querySelector(".hero__rotator");
      const cleanups = [];

      sidePanes.forEach((pane) => gsap.set(pane, { z: +pane.dataset.depth || 0 }));

      /* ---------- Memoji: poses + greeting ---------- */
      let current = reduced ? DEFAULT_POSE : START_POSE;
      const poseEl = (name) => section.querySelector(`.hero__memoji[data-pose="${name}"]`);
      const hand = section.querySelector(".hero__memoji-hand");
      gsap.set(section.querySelectorAll(".hero__memoji"), { autoAlpha: 0 });
      gsap.set(poseEl(current), { autoAlpha: 1 });
      if (current !== DEFAULT_POSE) bubbleText.textContent = "Oh, hi! 👀";

      const say = (text) => {
        if (bubbleText.textContent === text) return;
        bubbleText.textContent = text;
        if (!reduced) gsap.fromTo(bubble, { scale: 0.7, rotate: -6 }, { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2.4)", overwrite: true });
      };

      const setPose = (requested, text) => {
        const name = poseOr(requested);
        say(text);
        if (name === current) return false;
        const prev = poseEl(current);
        const next = poseEl(name);
        current = name;
        if (reduced) {
          gsap.set(prev, { autoAlpha: 0 });
          gsap.set(next, { autoAlpha: 1 });
          return true;
        }
        gsap.to(prev, { autoAlpha: 0, scale: 0.86, y: 10, duration: 0.22, ease: "power2.in", overwrite: true });
        gsap.fromTo(
          next,
          { autoAlpha: 0, scale: 0.7, y: 18, rotate: -8 },
          { autoAlpha: 1, scale: 1, y: 0, rotate: 0, duration: 0.7, delay: 0.12, ease: "back.out(2)", overwrite: true }
        );
        return true;
      };

      // A real wave: the hand of wave.png is its own layer, swung from the
      // wrist. (Without wave.png, the whole memoji does a hello wiggle.)
      const wave = () => {
        if (reduced) return;
        if (!hand) {
          gsap
            .timeline({ overwrite: true })
            .to(body, { rotate: -11, y: -6, duration: 0.18, ease: "power2.out" })
            .to(body, { rotate: 9, duration: 0.2, ease: "sine.inOut" })
            .to(body, { rotate: -7, duration: 0.2, ease: "sine.inOut" })
            .to(body, { rotate: 5, duration: 0.2, ease: "sine.inOut" })
            .to(body, { rotate: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.45)" });
          return;
        }
        const switched = setPose("wave", GREETING);
        const swing = { duration: 0.2, ease: "sine.inOut" };
        gsap
          .timeline({ delay: switched ? 0.35 : 0 })
          .to(hand, { rotate: -18, duration: 0.24, ease: "sine.out", overwrite: true })
          .to(hand, { rotate: 14, ...swing })
          .to(hand, { rotate: -16, ...swing })
          .to(hand, { rotate: 12, ...swing })
          .to(hand, { rotate: -10, ...swing })
          .to(hand, { rotate: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" })
          .to(body, { y: -5, duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: 3 }, 0);
      };
      api.current = { setPose, wave };

      /* ---------- Entrance (when the laptop screen wakes / preloader lifts) ---------- */
      // Peeks over a MacBook first, then pops up and waves.
      const intro = gsap.timeline({ paused: true });
      if (!reduced) {
        gsap.set(panes, { autoAlpha: 0 });
        gsap.set(avatar, { autoAlpha: 0, y: 70, scale: 0.4, rotate: -14 });
        gsap.set(bubble, { autoAlpha: 0, scale: 0.4 });
        intro
          .fromTo(".hero__pane--main", { autoAlpha: 0, z: -700 }, { autoAlpha: 1, z: 0, duration: 1.3, ease: "expo.out" }, 0)
          .fromTo(
            sidePanes,
            { autoAlpha: 0, z: -1100 },
            { autoAlpha: 1, z: (i, el) => +el.dataset.depth || 0, duration: 1.6, ease: "expo.out", stagger: 0.09 },
            0.25
          )
          .to(avatar, { autoAlpha: 1, y: 0, scale: 1, rotate: 0, duration: 1.1, ease: "back.out(1.7)" }, 0.45)
          .from(".hero__name .hero__char", { yPercent: 110, duration: 1, ease: "power4.out", stagger: 0.025 }, 0.55)
          .from(".hero__fade", { autoAlpha: 0, y: 18, duration: 0.8, ease: "power3.out", stagger: 0.07 }, 0.75)
          .to(bubble, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(2.6)" }, 1.2)
          .add(wave, current === DEFAULT_POSE ? 1.25 : 2.6);
      }
      const offReveal = onHeroReveal(() => intro.play());

      /* ---------- Ambient loops: role scramble + a wave every so often ---------- */
      let rotation = null;
      let idleWave = null;
      if (!reduced) {
        rotation = gsap.timeline({ repeat: -1, delay: 3 });
        heroRoles.forEach((_, i) => {
          rotation.to(
            rotator,
            { duration: 1, scrambleText: { text: heroRoles[(i + 1) % heroRoles.length], chars: "lowerCase", speed: 0.6, revealDelay: 0.25 }, ease: "none" },
            "+=2.2"
          );
        });
        idleWave = gsap
          .timeline({ repeat: -1, delay: 9 })
          .add(() => {
            if (!hoveringPane) wave();
          })
          .to({}, { duration: 10 });
      }

      /* ---------- Spatial tilt: the room follows the pointer (idle sway otherwise) ---------- */
      const tilt = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };
      let pointerActive = false;
      let hoveringPane = false;
      const avatarX = fine && !reduced ? gsap.quickTo(avatar, "rotationY", { duration: 0.8, ease: "power3" }) : null;
      const avatarY = fine && !reduced ? gsap.quickTo(avatar, "rotationX", { duration: 0.8, ease: "power3" }) : null;

      const tick = (time) => {
        if (!pointerActive) {
          target.x = Math.sin(time / 2.4) * 0.45;
          target.y = Math.cos(time / 3.1) * 0.3;
        }
        tilt.x += (target.x - tilt.x) * 0.06;
        tilt.y += (target.y - tilt.y) * 0.06;
        world.style.transform = `rotateY(${(tilt.x * 9).toFixed(3)}deg) rotateX(${(-tilt.y * 6).toFixed(3)}deg)`;
      };
      let ticking = false;
      const tiltOn = !reduced && !isSmallScreen();

      if (fine && !reduced) {
        const onMove = (event) => {
          const r = section.getBoundingClientRect();
          target.x = ((event.clientX - r.left) / r.width - 0.5) * 2;
          target.y = ((event.clientY - r.top) / r.height - 0.5) * 2;
          pointerActive = true;
          // Memoji turns its head toward the cursor.
          const a = avatar.getBoundingClientRect();
          avatarX(gsap.utils.clamp(-28, 28, (event.clientX - (a.left + a.width / 2)) / 18));
          avatarY(gsap.utils.clamp(-18, 18, -(event.clientY - (a.top + a.height / 2)) / 22));
        };
        const onLeave = () => {
          pointerActive = false;
          avatarX(0);
          avatarY(0);
        };
        section.addEventListener("pointermove", onMove, { passive: true });
        section.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          section.removeEventListener("pointermove", onMove);
          section.removeEventListener("pointerleave", onLeave);
        });
      }

      // Windows change the memoji's pose + line.
      sidePanes.forEach((pane) => {
        const enter = () => {
          hoveringPane = true;
          setPose(pane.dataset.pose, pane.dataset.say);
        };
        const leave = () => {
          hoveringPane = false;
          setPose(DEFAULT_POSE, GREETING);
        };
        pane.addEventListener("pointerenter", enter);
        pane.addEventListener("pointerleave", leave);
        pane.addEventListener("focus", enter);
        pane.addEventListener("blur", leave);
        cleanups.push(() => {
          pane.removeEventListener("pointerenter", enter);
          pane.removeEventListener("pointerleave", leave);
          pane.removeEventListener("focus", enter);
          pane.removeEventListener("blur", leave);
        });
      });

      /* ---------- Pause everything off-screen or on the laptop's dark screen ---------- */
      let inView = true;
      let dormant = isHeroDormant();
      const sync = () => {
        const live = inView && !dormant;
        if (live) {
          rotation?.resume();
          idleWave?.resume();
        } else {
          rotation?.pause();
          idleWave?.pause();
        }
        if (tiltOn && live !== ticking) {
          ticking = live;
          if (live) gsap.ticker.add(tick);
          else gsap.ticker.remove(tick);
        }
      };
      const io = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        sync();
      });
      io.observe(section);
      const offDormant = onHeroDormantChange((value) => {
        dormant = value;
        sync();
      });
      sync();

      /* ---------- Scroll-out: the room drifts toward you and dissolves ---------- */
      if (!reduced) {
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: true,
              pinnedContainer: section.closest(".intro") || undefined,
            },
          })
          .to(room, { scale: 1.18, yPercent: -6, autoAlpha: 0 }, 0);
      }

      return () => {
        offReveal();
        offDormant();
        io.disconnect();
        if (ticking) gsap.ticker.remove(tick);
        cleanups.forEach((fn) => fn());
        api.current = { setPose: () => {}, wave: () => {} };
      };
    },
    { scope: sectionRef }
  );

  const goTo = (target) => (event) => {
    event.preventDefault();
    scrollToTarget(target);
  };

  // Click the memoji → it cycles through its poses (and waves on "wave").
  const pokes = useRef(-1);
  const pokeAvatar = () => {
    if (!POKES.length) return;
    pokes.current = (pokes.current + 1) % POKES.length;
    const [name, line] = POKES[pokes.current];
    if (name === "wave") api.current.wave();
    else api.current.setPose(name, line);
  };

  return (
    <section id="home" className="hero" ref={sectionRef}>
      <div className="hero__backdrop" aria-hidden="true">
        <span className="hero__blob hero__blob--a" />
        <span className="hero__blob hero__blob--b" />
        <span className="hero__blob hero__blob--c" />
        <span className="hero__grid" />
      </div>

      <div className="hero__room">
        <div className="hero__world">
          <div className="hero__pane hero__pane--main">
            <button
              type="button"
              className="hero__avatar"
              onClick={pokeAvatar}
              aria-label={`${profile.name}'s Memoji — click to say hi`}
            >
              <span className="hero__avatar-body">
                {Object.entries(POSES).map(([name, url]) => {
                  const img = (extra = "") => (
                    <img
                      className={`hero__memoji-img${extra}`}
                      src={url}
                      alt=""
                      width="512"
                      height="512"
                      decoding="async"
                      draggable="false"
                    />
                  );
                  return (
                    <span key={name} className="hero__memoji" data-pose={name}>
                      {name === "wave" ? (
                        <>
                          {img(" hero__memoji-base")}
                          {img(" hero__memoji-hand")}
                        </>
                      ) : (
                        img()
                      )}
                    </span>
                  );
                })}
              </span>
              <span className="hero__avatar-shadow" aria-hidden="true" />
            </button>
            <span className="hero__bubble" aria-live="polite">
              <span className="hero__bubble-text">{GREETING}</span>
            </span>

            <p className="hero__hello hero__fade">
              {profile.available && <span className="hero__status" aria-hidden="true" />}
              {profile.available ? "Available for new work" : "Hello, I’m"}
            </p>
            <h1 className="hero__name" aria-label={profile.name}>
              <span aria-hidden="true">
                <Chars text={profile.name} />
              </span>
            </h1>
            <p className="hero__role hero__fade">
              {profile.role} crafting <span className="hero__rotator">{heroRoles[0]}</span>
            </p>
            <div className="hero__actions hero__fade">
              <a className="btn btn--primary" href="#work" data-magnetic="0.25" onClick={goTo("#work")}>
                View my work <span className="btn__arrow" aria-hidden="true">→</span>
              </a>
              <a className="btn" href="#contact" data-magnetic="0.25" onClick={goTo("#contact")}>
                Get in touch
              </a>
            </div>
          </div>

          {PANES.map((pane) => (
            <a
              key={pane.id}
              className={`hero__pane hero__pane--side hero__pane--${pane.id}`}
              href={pane.href}
              data-depth={pane.depth}
              data-pose={poseOr(pane.pose)}
              data-say={pane.say}
              onClick={goTo(pane.href)}
            >
              <small>{pane.kicker}</small>
              <b>
                {pane.title}
                {pane.arrow && <span aria-hidden="true"> {pane.arrow}</span>}
              </b>
            </a>
          ))}
        </div>
      </div>

    </section>
  );
}
