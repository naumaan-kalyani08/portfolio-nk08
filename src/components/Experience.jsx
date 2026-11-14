import { Fragment, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { experience } from "../data/content";
import { isFinePointer, prefersReducedMotion, scrollToTarget } from "../lib/scroll";
import { createSparks } from "../lib/sparks";
import RevealHeading from "./RevealHeading";
import "../style/Experience.css";

/*
 * "The road so far." — a scroll-driven comet journey.
 *
 *  Layout   Cards are plain responsive HTML. On every resize the cards are
 *           measured and an SVG road is generated that weaves through a node
 *           beside each one (S-curves with vertical tangents → never under a card).
 *  Drawing  The road is split into small pieces, so a frame only repaints the
 *           strip being drawn. The comet head is HTML (compositor-only moves).
 *           Its tapered tail is a tiny polyline rebuilt from a precomputed
 *           lookup table — no getPointAtLength() per frame.
 *  Physics  Scroll speed stretches the comet along the curve's tangent, grows
 *           its tail and sheds embers onto a canvas. A ticker runs only while
 *           something is moving and sleeps otherwise.
 *  Colour   Every milestone inherits the road's colour at its position, so
 *           node, connector, card, big year and HUD all match.
 */

const DESKTOP_QUERY = "(min-width: 900px)";
const SAMPLES = 96; // per segment
const TENSION = 0.8; // how long curves lean vertically out of each node
const SEGMENTS = experience.length + 1;
// Each curve is split into pieces so a scroll frame only repaints a small strip.
const PIECES = 4;
const PIECE_COUNT = SEGMENTS * PIECES;
const COLOR_STEPS = 48; // live comet colour is quantised → rare repaints
const TAPER = [1, 0.58, 0.26]; // comet tail layers (length factors)
const DEG = Math.PI / 180;

const STOPS = [
  { t: 0, rgb: [99, 102, 241] },
  { t: 0.35, rgb: [95, 214, 246] },
  { t: 0.7, rgb: [124, 58, 237] },
  { t: 1, rgb: [236, 72, 153] },
];

const pad = (n) => String(n).padStart(2, "0");
const clamp = (min, max, v) => Math.min(max, Math.max(min, v));
const rgbVar = (c) => `${c[0]} ${c[1]} ${c[2]}`;

function colorAt(t) {
  const x = clamp(0, 1, t);
  for (let i = 1; i < STOPS.length; i += 1) {
    if (x <= STOPS[i].t) {
      const a = STOPS[i - 1];
      const b = STOPS[i];
      const f = (x - a.t) / (b.t - a.t);
      return a.rgb.map((v, k) => Math.round(v + (b.rgb[k] - v) * f));
    }
  }
  return STOPS[STOPS.length - 1].rgb;
}

function cubicPoint(a, c1, c2, b, t) {
  const mt = 1 - t;
  const w0 = mt * mt * mt;
  const w1 = 3 * mt * mt * t;
  const w2 = 3 * mt * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * a.x + w1 * c1.x + w2 * c2.x + w3 * b.x,
    y: w0 * a.y + w1 * c1.y + w2 * c2.y + w3 * b.y,
  };
}

// de Casteljau split of a cubic [p0, p1, p2, p3] at t.
function splitCubic([p0, p1, p2, p3], t) {
  const mix = (a, b) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const p01 = mix(p0, p1);
  const p12 = mix(p1, p2);
  const p23 = mix(p2, p3);
  const p012 = mix(p01, p12);
  const p123 = mix(p12, p23);
  const mid = mix(p012, p123);
  return [
    [p0, p01, p012, mid],
    [mid, p123, p23, p3],
  ];
}

// One pass: per-piece path data + a lookup table that is monotonic in y.
function buildJourney(points) {
  const f = (v) => v.toFixed(1);
  const xs = [points[0].x];
  const ys = [points[0].y];
  const ls = [0];
  const segments = [];
  const pieces = [];
  const per = SAMPLES / PIECES;
  let ghost = `M ${f(points[0].x)} ${f(points[0].y)}`;
  let length = 0;
  let prev = points[0];

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dy = b.y - a.y;
    const c1 = { x: a.x, y: a.y + dy * TENSION };
    const c2 = { x: b.x, y: b.y - dy * TENSION };
    const curve = `C ${f(c1.x)} ${f(c1.y)}, ${f(c2.x)} ${f(c2.y)}, ${f(b.x)} ${f(b.y)}`;
    const start = length;

    for (let s = 1; s <= SAMPLES; s += 1) {
      const p = cubicPoint(a, c1, c2, b, s / SAMPLES);
      length += Math.hypot(p.x - prev.x, p.y - prev.y);
      xs.push(p.x);
      ys.push(p.y);
      ls.push(length);
      prev = p;
    }

    ghost += ` ${curve}`;
    segments.push({ start, length: length - start });

    // Split into equal-t pieces; their lengths come straight from the LUT
    // because samples are uniform in t.
    const base = (i - 1) * SAMPLES;
    let rest = [a, c1, c2, b];
    for (let k = 0; k < PIECES; k += 1) {
      let piece = rest;
      if (k < PIECES - 1) [piece, rest] = splitCubic(rest, 1 / (PIECES - k));
      const [p0, p1, p2, p3] = piece;
      const from = ls[base + k * per];
      const to = ls[base + (k + 1) * per];
      pieces.push({
        d: `M ${f(p0.x)} ${f(p0.y)} C ${f(p1.x)} ${f(p1.y)}, ${f(p2.x)} ${f(p2.y)}, ${f(p3.x)} ${f(p3.y)}`,
        start: from,
        length: to - from,
      });
    }
  }

  return { xs, ys, ls, total: length, segments, pieces, ghost };
}

export default function Experience() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);

  useGSAP(
    () => {
      const stage = stageRef.current;
      const q = (selector) => stage.querySelector(selector);
      const all = (selector) => gsap.utils.toArray(selector, stage);

      const svg = q(".journey__svg");
      const gradient = q("#journey-gradient");
      const ghost = q(".jpath--ghost");
      const segMain = all(".jseg--main");
      const segGlow = all(".jseg--glow");
      const tails = all(".jtail");
      const head = q(".journey__head"); // HTML layer → moves without repainting the SVG
      const headBody = q(".jhead__body");
      const nodeEls = all(".jnode");
      const items = all(".journey__item");
      const next = q(".journey__next");
      const light = q(".journey__light");
      const canvas = q(".journey__sparks");
      const hud = q(".journey__hud");
      const odoCols = all(".odo__col");
      const hudIndex = q(".hud__index");
      const hudTitle = q(".hud__title");
      const hudFill = q(".hud__fill");

      const reduced = prefersReducedMotion();
      const fine = isFinePointer();
      let desktop = window.matchMedia(DESKTOP_QUERY).matches;

      const setLightX = gsap.quickSetter(light, "x", "px");
      const setLightY = gsap.quickSetter(light, "y", "px");
      const setHeadX = gsap.quickSetter(head, "x", "px");
      const setHeadY = gsap.quickSetter(head, "y", "px");

      // ---------------------------------------------------------------- state
      const state = { y: 0 }; // scrubbed: comet y in stage space
      let lut = null;
      let nodeLengths = [];
      let nodePos = [];
      const nodeColors = items.map(() => STOPS[1].rgb);
      let endPoint = { x: 0, y: 0 };
      let endY = 1;
      const segDrawn = new Array(PIECE_COUNT).fill(-1);

      let len = 0;
      let headX = 0;
      let headY = 0;
      let angle = 90;
      let travelDir = 1;
      let headRgb = STOPS[0].rgb;
      let colorStep = -1;
      let headVisible = null;
      let inView = false;

      let pendingDist = 0;
      let speed = 0;
      let stretch = 0;
      let spawnAcc = 0;
      let tailBase = 120;
      let alive = 0;

      let currentIndex = -1;
      let nextActive = false;
      let built = false;
      const active = items.map(() => false);
      let stageLeft = 0;
      let stageTop = 0;

      const sparks = !reduced ? createSparks(canvas, { max: desktop ? 150 : 60 }) : null;

      // ------------------------------------------------------- milestone FX
      const decodeTweens = items.map(() => null);
      const decode = (i) => {
        const el = items[i].querySelector(".jcard__digits");
        const final = experience[i].year;
        decodeTweens[i]?.kill();
        const proxy = { p: 0 };
        decodeTweens[i] = gsap.to(proxy, {
          p: 1,
          duration: 0.9,
          delay: 0.4,
          ease: "power1.out",
          onUpdate: () => {
            const settled = proxy.p * (final.length + 1);
            let out = "";
            for (let c = 0; c < final.length; c += 1) {
              out += settled > c + 1 || !/\d/.test(final[c]) ? final[c] : Math.floor(Math.random() * 10);
            }
            el.textContent = out;
          },
          onComplete: () => {
            el.textContent = final;
          },
        });
      };

      const timelines = items.map((item, i) => {
        const card = item.querySelector(".jcard");
        const parts = card.querySelectorAll(".jcard__anim");
        const words = card.querySelectorAll(".jword");
        const shine = card.querySelector(".jcard__shine");
        const node = nodeEls[i];
        const ball = node.querySelector(".jnode__ball");
        const core = node.querySelector(".jnode__core");
        const link = node.querySelector(".jnode__link");
        const linkDot = node.querySelector(".jnode__linkdot");
        const fromLeft = !desktop || i % 2 === 0;
        const hidden = fromLeft ? "inset(0% 100% 0% 0% round 24px)" : "inset(0% 0% 0% 100% round 24px)";

        gsap.set([ball, core, linkDot], { scale: 0, transformOrigin: "50% 50%" });
        gsap.set(link, { strokeDashoffset: 1 });
        gsap.set(card, { clipPath: hidden });
        gsap.set(parts, { y: 18, autoAlpha: 0 });
        gsap.set(words, { yPercent: 115 });
        gsap.set(shine, { xPercent: -110 });

        return gsap
          .timeline({ paused: true })
          .to(ball, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, 0)
          .to(core, { scale: 1, duration: 0.5, ease: "back.out(3)" }, 0.1)
          .to(link, { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut" }, 0.08)
          .to(linkDot, { scale: 1, duration: 0.45, ease: "back.out(4)" }, 0.4)
          .to(card, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.1, ease: "expo.out" }, 0.32)
          .to(parts, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 0.45)
          .to(words, { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.045 }, 0.5)
          .to(shine, { xPercent: 110, duration: 1.3, ease: "power2.inOut" }, 0.7);
      });

      const ripple = (i) => {
        gsap.fromTo(
          nodeEls[i].querySelector(".jnode__ripple"),
          { scale: 1, opacity: 0.9, transformOrigin: "50% 50%" },
          { scale: 4.5, opacity: 0, duration: 1.3, ease: "power2.out", overwrite: true }
        );
      };

      const setActive = (i, on, withFx) => {
        if (active[i] === on) return;
        active[i] = on;
        items[i].classList.toggle("is-active", on);
        nodeEls[i].classList.toggle("is-active", on);

        if (on) {
          timelines[i].timeScale(1).play();
          if (withFx) {
            ripple(i);
            decode(i);
            sparks?.burst(nodePos[i].x, nodePos[i].y, desktop ? 22 : 12, nodeColors[i], 0.75);
            wake();
          }
        } else {
          decodeTweens[i]?.kill();
          items[i].querySelector(".jcard__digits").textContent = experience[i].year;
          timelines[i].timeScale(2).reverse();
        }
      };

      // ------------------------------------------------------------- HUD
      let hudTl = null;
      const setHud = (index) => {
        if (index === currentIndex) return;
        const direction = index > currentIndex ? 1 : -1;
        currentIndex = index;
        const safe = Math.max(0, index);
        const digits = experience[safe].year.padStart(4, "0").split("");
        odoCols.forEach((col, c) => col.style.setProperty("--d", digits[c] ?? 0));
        hudIndex.textContent = pad(safe + 1);
        hud.style.setProperty("--c", rgbVar(nodeColors[safe]));

        if (hudTitle.textContent === experience[safe].title) return;
        hudTl?.kill();
        hudTl = gsap
          .timeline()
          .to(hudTitle, { yPercent: -100 * direction, autoAlpha: 0, duration: 0.18, ease: "power2.in" })
          .add(() => {
            hudTitle.textContent = experience[safe].title;
          })
          .fromTo(
            hudTitle,
            { yPercent: 100 * direction, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" }
          );
      };

      // ---------------------------------------------------------- drawing
      const indexAtLength = (l) => {
        const { ls } = lut;
        let lo = 0;
        let hi = ls.length - 1;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          if (ls[mid] < l) lo = mid;
          else hi = mid;
        }
        return lo;
      };

      // Only touches pieces whose drawn amount changed (usually just one).
      const paintSegments = () => {
        lut.pieces.forEach((piece, k) => {
          const drawn = Math.round(clamp(0, piece.length, len - piece.start) * 10) / 10;
          if (segDrawn[k] === drawn) return;
          segDrawn[k] = drawn;
          const offset = piece.length - drawn;
          // Hide fully-undrawn segments: a zero-length dash still renders a round-cap dot.
          const visibility = drawn > 0 ? "visible" : "hidden";
          segMain[k].style.strokeDashoffset = offset;
          segGlow[k].style.strokeDashoffset = offset;
          segMain[k].style.visibility = visibility;
          segGlow[k].style.visibility = visibility;
        });
      };

      // Comet tail: three stacked polylines of decreasing length / increasing width.
      const paintTail = () => {
        const { xs, ys, ls } = lut;
        const length = tailBase * (1 + stretch * 3.2);
        tails.forEach((tail, t) => {
          if (len < 2) {
            tail.setAttribute("d", "");
            return;
          }
          const from = Math.max(0, len - length * TAPER[t]);
          let i = Math.min(indexAtLength(from), ls.length - 2);
          const f = clamp(0, 1, (from - ls[i]) / (ls[i + 1] - ls[i] || 1));
          let d = `M${(xs[i] + (xs[i + 1] - xs[i]) * f).toFixed(1)} ${(ys[i] + (ys[i + 1] - ys[i]) * f).toFixed(1)}`;
          for (i += 1; i < ls.length && ls[i] < len; i += 1) d += `L${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`;
          d += `L${headX.toFixed(1)} ${headY.toFixed(1)}`;
          tail.setAttribute("d", d);
        });
      };

      // -------------------------------------------- physics ticker (sleeps)
      let running = false;
      const tick = (_time, deltaMs) => {
        const dt = clamp(0.001, 0.05, deltaMs / 1000);
        const instant = pendingDist / dt;
        pendingDist = 0;
        speed += (instant - speed) * (instant > speed ? 0.3 : 0.07);
        if (speed < 2) speed = 0;
        stretch = Math.min(1, speed / 2400);

        // Composited transform on an HTML layer — no repaint.
        headBody.style.transform = `rotate(${angle.toFixed(1)}deg) scale(${(1 + stretch * 1.9).toFixed(3)}, ${(
          1 -
          stretch * 0.4
        ).toFixed(3)})`;
        paintTail();

        if (sparks) {
          if (stretch > 0.03 && headVisible) {
            spawnAcc += (18 + stretch * 150) * dt;
            const back = (angle + (travelDir > 0 ? 180 : 0)) * DEG;
            while (spawnAcc >= 1) {
              spawnAcc -= 1;
              const a = back + (Math.random() - 0.5) * 1.1;
              const v = 40 + Math.random() * 170 * (0.4 + stretch);
              sparks.spawn(
                headX + (Math.random() - 0.5) * 5,
                headY + (Math.random() - 0.5) * 5,
                Math.cos(a) * v,
                Math.sin(a) * v,
                0.45 + Math.random() * 0.85,
                0.7 + Math.random() * 1.8,
                headRgb
              );
            }
          }
          alive = sparks.step(dt, stageLeft, stageTop - window.scrollY);
        }

        if (speed === 0 && alive === 0) sleep();
      };
      // The sparks canvas is only displayed while the ticker runs and the
      // section is near the viewport — otherwise it isn't even a layer.
      const setCanvasLive = (on) => canvas.classList.toggle("is-live", on && inView);
      const wake = () => {
        if (running || reduced) return;
        running = true;
        setCanvasLive(true);
        gsap.ticker.add(tick);
      };
      const sleep = () => {
        if (!running) return;
        running = false;
        setCanvasLive(false);
        gsap.ticker.remove(tick);
      };

      // ------------------------------------------------- frame render (scrub)
      const render = () => {
        if (!lut) return;
        const { xs, ys, ls, total } = lut;
        const y = clamp(0, ys[ys.length - 1], state.y);

        let lo = 0;
        let hi = ys.length - 1;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          if (ys[mid] < y) lo = mid;
          else hi = mid;
        }
        const f = clamp(0, 1, (y - ys[lo]) / (ys[hi] - ys[lo] || 1));
        const nextLen = ls[lo] + (ls[hi] - ls[lo]) * f;
        const delta = nextLen - len;
        const teleport = Math.abs(delta) > 420 || !built; // menu jumps, refreshes
        if (!teleport) pendingDist += Math.abs(delta);
        if (Math.abs(delta) > 0.01) travelDir = delta > 0 ? 1 : -1;

        len = nextLen;
        headX = xs[lo] + (xs[hi] - xs[lo]) * f;
        headY = y;
        angle = Math.atan2(ys[hi] - ys[lo], xs[hi] - xs[lo]) / DEG;

        paintSegments();
        setHeadX(headX);
        setHeadY(headY);
        setLightX(headX);
        setLightY(headY);

        const visible = len > 2 && len < total - 2;
        if (visible !== headVisible) {
          headVisible = visible;
          head.style.opacity = visible ? 1 : 0;
          light.style.opacity = visible ? 1 : 0;
        }

        // Quantised so the light/halo gradients repaint ~48 times over the
        // whole journey instead of every frame (steps are imperceptible).
        const step = Math.round(clamp(0, 1, headY / endY) * COLOR_STEPS);
        if (step !== colorStep) {
          colorStep = step;
          headRgb = colorAt(step / COLOR_STEPS);
          const key = rgbVar(headRgb);
          head.style.setProperty("--jc", key);
          light.style.setProperty("--jc", key);
        }

        const withFx = !reduced && !teleport && delta > 0;
        let last = -1;
        nodeLengths.forEach((nodeLen, i) => {
          const on = len >= nodeLen - 1;
          setActive(i, on, withFx);
          if (on) last = i;
        });
        setHud(last);
        hudFill.style.transform = `scaleX(${(len / total).toFixed(4)})`;

        const reachedEnd = len >= total - 2;
        if (reachedEnd !== nextActive) {
          nextActive = reachedEnd;
          next.classList.toggle("is-active", reachedEnd);
          if (reachedEnd && withFx && sparks) {
            sparks.burst(endPoint.x, endPoint.y, desktop ? 70 : 32, STOPS[3].rgb, 1.25);
            sparks.burst(endPoint.x, endPoint.y, desktop ? 24 : 12, STOPS[1].rgb, 0.7);
          }
        }

        paintTail();
        if (!teleport || speed > 0) wake();
      };

      // ------------------------------------------- measure layout → build road
      const measureOffsets = () => {
        const rect = stage.getBoundingClientRect();
        stageLeft = rect.left;
        stageTop = rect.top + window.scrollY;
      };

      const build = () => {
        desktop = window.matchMedia(DESKTOP_QUERY).matches;
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        tailBase = desktop ? 120 : 70;

        const nodes = items.map((item, i) => ({
          x: desktop ? width * (i % 2 === 0 ? 0.24 : 0.76) : i % 2 === 0 ? 18 : 46,
          y: item.offsetTop + item.offsetHeight / 2,
        }));
        endY = next.offsetTop;
        measureOffsets();
        endPoint = { x: desktop ? width * 0.5 : 18, y: endY };
        lut = buildJourney([{ x: desktop ? width * 0.5 : nodes[0].x, y: 0 }, ...nodes, endPoint]);
        nodeLengths = lut.segments.slice(0, items.length).map((s) => s.start + s.length);
        nodePos = nodes;

        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        gradient.setAttribute("y2", endY);
        ghost.setAttribute("d", lut.ghost);

        lut.pieces.forEach((piece, k) => {
          [segMain[k], segGlow[k]].forEach((path) => {
            path.setAttribute("d", piece.d);
            path.setAttribute("pathLength", piece.length.toFixed(2));
            path.style.strokeDasharray = `${piece.length} ${piece.length}`;
          });
          segDrawn[k] = -1;
        });

        // Read pass (all layout reads together → a single layout)…
        const reaches = nodes.map((n, i) => {
          const card = items[i].querySelector(".jcard");
          const cardX = items[i].offsetLeft + card.offsetLeft;
          const edge = cardX > n.x ? cardX : cardX + card.offsetWidth;
          const dir = edge > n.x ? 1 : -1;
          return { dir, reach: edge - n.x - dir * 2 };
        });

        // …then the write pass (no forced re-layouts in between).
        nodes.forEach((n, i) => {
          const node = nodeEls[i];
          node.setAttribute("transform", `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);

          const rgb = colorAt(n.y / endY);
          nodeColors[i] = rgb;
          items[i].style.setProperty("--c", rgbVar(rgb));
          node.style.setProperty("--c", rgbVar(rgb));

          // Connector from the node to the nearest card edge.
          const { dir, reach } = reaches[i];
          node.querySelector(".jnode__link").setAttribute("d", `M ${dir * 15} 0 H ${reach.toFixed(1)}`);
          node.querySelector(".jnode__linkpos").setAttribute("transform", `translate(${reach.toFixed(1)} 0)`);
        });

        if (currentIndex >= 0) hud.style.setProperty("--c", rgbVar(nodeColors[currentIndex]));
        render();
        built = true;
      };

      build();

      if (reduced) {
        state.y = stage.clientHeight;
        render();
        timelines.forEach((tl) => tl.progress(1));
        return undefined;
      }

      // The comet's y follows the viewport's 55% line, with a soft scrub.
      gsap.to(state, {
        y: () => stage.clientHeight,
        ease: "none",
        onUpdate: render,
        scrollTrigger: {
          trigger: stage,
          start: "top 55%",
          end: "bottom 55%",
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });

      // Giant outlined years drift at a different depth.
      items.forEach((item) => {
        gsap.fromTo(
          item.querySelector(".journey__bigyear"),
          { yPercent: -35 },
          {
            yPercent: 35,
            ease: "none",
            scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });

      // Card hover: 3D tilt + spotlight + linked node highlight.
      const cleanups = [];
      if (fine) {
        items.forEach((item, i) => {
          const card = item.querySelector(".jcard");
          gsap.set(card, { transformPerspective: 1000 });
          const rotX = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3" });
          const rotY = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3" });
          const lift = gsap.quickTo(card, "y", { duration: 0.7, ease: "power3" });

          const onMove = (event) => {
            const rect = card.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width;
            const py = (event.clientY - rect.top) / rect.height;
            card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
            card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
            rotY((px - 0.5) * 8);
            rotX((0.5 - py) * 8);
          };
          const onEnter = () => {
            lift(-8);
            nodeEls[i].classList.add("is-hover");
          };
          const onLeave = () => {
            rotX(0);
            rotY(0);
            lift(0);
            nodeEls[i].classList.remove("is-hover");
          };

          card.addEventListener("pointermove", onMove);
          card.addEventListener("pointerenter", onEnter);
          card.addEventListener("pointerleave", onLeave);
          cleanups.push(() => {
            card.removeEventListener("pointermove", onMove);
            card.removeEventListener("pointerenter", onEnter);
            card.removeEventListener("pointerleave", onLeave);
          });
        });
      }

      // Sparks canvas exists only while the section is near the viewport.
      const io = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          setCanvasLive(running);
          if (!inView) sparks.clear();
        },
        { rootMargin: "120px 0px" }
      );
      io.observe(sectionRef.current);

      const onResize = () => {
        sparks.resize();
        measureOffsets();
      };
      window.addEventListener("resize", onResize);
      ScrollTrigger.addEventListener("refresh", measureOffsets);

      // Rebuild the road when the stage changes size (resize, fonts, images).
      let lastSize = `${stage.clientWidth}x${stage.clientHeight}`;
      let timer = 0;
      const ro = new ResizeObserver(() => {
        const size = `${stage.clientWidth}x${stage.clientHeight}`;
        if (size === lastSize) return;
        lastSize = size;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          built = false;
          build();
          ScrollTrigger.refresh();
        }, 120);
      });
      ro.observe(stage);

      return () => {
        sleep();
        io.disconnect();
        ro.disconnect();
        window.clearTimeout(timer);
        window.removeEventListener("resize", onResize);
        ScrollTrigger.removeEventListener("refresh", measureOffsets);
        hudTl?.kill();
        decodeTweens.forEach((tween) => tween?.kill());
        cleanups.forEach((fn) => fn());
      };
    },
    { scope: sectionRef }
  );

  const firstYear = experience[0].year.padStart(4, "0").split("");

  return (
    <section id="experience" className="journey" ref={sectionRef}>
      <div className="journey__bg" aria-hidden="true" />

      <header className="section-head journey__head">
        <p className="eyebrow" data-reveal>
          04 — Journey
        </p>
        <RevealHeading className="section-title" gradientWords={["far."]}>
          The road so far.
        </RevealHeading>
        <p className="journey__intro" data-reveal>
          Every line of code, every late night and every shipped feature — the milestones that shaped how I build.
        </p>
        <div className="journey__range" data-reveal>
          <span>{experience[0].year}</span>
          <span className="journey__range-line" aria-hidden="true" />
          <span>Today</span>
        </div>
      </header>

      <div className="journey__stage" ref={stageRef}>
        <div className="journey__light" aria-hidden="true" />

        <svg className="journey__svg" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="journey-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000">
              {STOPS.map((stop) => (
                <stop key={stop.t} offset={stop.t} stopColor={`rgb(${stop.rgb.join(",")})`} />
              ))}
            </linearGradient>
          </defs>

          <path className="jpath--ghost" />
          {Array.from({ length: PIECE_COUNT }, (_, k) => (
            <path key={`glow-${k}`} className="jseg jseg--glow" />
          ))}
          {Array.from({ length: PIECE_COUNT }, (_, k) => (
            <path key={`main-${k}`} className="jseg jseg--main" />
          ))}
          {TAPER.map((_, t) => (
            <path key={`tail-${t}`} className={`jtail jtail--${t + 1}`} />
          ))}

          {experience.map((item) => (
            <g className="jnode" key={item.year + item.title}>
              <path className="jnode__link" pathLength="1" />
              <g className="jnode__linkpos">
                <circle className="jnode__linkdot" r="3.5" />
              </g>
              <circle className="jnode__ripple" r="14" />
              <circle className="jnode__ring" r="14" />
              <circle className="jnode__ball" r="11" />
              <circle className="jnode__core" r="4" />
            </g>
          ))}
        </svg>

        {/* Comet head: HTML layers so moving/stretching/pulsing is compositor-only */}
        <div className="journey__head" aria-hidden="true">
          <span className="jhead__halo" />
          <span className="jhead__pulse" />
          <span className="jhead__body">
            <span className="jhead__dot" />
          </span>
        </div>

        <canvas className="journey__sparks" aria-hidden="true" />

        <div className="journey__hud-track" aria-hidden="true">
          <div className="journey__hud">
            <div className="hud__row">
              <span className="hud__label">Chapter</span>
              <span className="hud__count">
                <span className="hud__index">01</span> / {pad(experience.length)}
              </span>
            </div>
            <div className="odo">
              {firstYear.map((digit, col) => (
                <span className="odo__col" key={col} style={{ "--d": digit, "--c-i": col }}>
                  <span className="odo__strip">
                    {Array.from({ length: 10 }, (_, n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </span>
                </span>
              ))}
            </div>
            <div className="hud__title-wrap">
              <span className="hud__title">{experience[0].title}</span>
            </div>
            <span className="hud__bar">
              <span className="hud__fill" />
            </span>
          </div>
        </div>

        <ol className="journey__list">
          {experience.map((item, i) => (
            <li className={`journey__item ${i % 2 ? "is-odd" : "is-even"}`} key={item.year + item.title}>
              <span className="journey__bigyear" aria-hidden="true">
                {item.year}
              </span>
              <article className="jcard">
                <span className="jcard__shine" aria-hidden="true" />
                <div className="jcard__top jcard__anim">
                  <span className="jcard__index">
                    {pad(i + 1)} <span>/ {pad(experience.length)}</span>
                  </span>
                  <span className="jcard__place">{item.place}</span>
                </div>
                <p className="jcard__year jcard__anim">
                  <span className="jcard__digits">{item.year}</span>
                </p>
                <h3 className="jcard__title">
                  {item.title.split(" ").map((word, w, words) => (
                    <Fragment key={`${word}-${w}`}>
                      <span className="jmask">
                        <span className="jword">{word}</span>
                      </span>
                      {w < words.length - 1 ? " " : null}
                    </Fragment>
                  ))}
                </h3>
                <p className="jcard__text jcard__anim">{item.text}</p>
              </article>
            </li>
          ))}
        </ol>

        <div className="journey__next">
          <span className="journey__next-dot" aria-hidden="true" />
          <p className="journey__next-label">Next chapter</p>
          <a
            className="journey__next-link"
            href="#contact"
            onClick={(event) => {
              event.preventDefault();
              scrollToTarget("#contact");
            }}
          >
            Could be with you <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
