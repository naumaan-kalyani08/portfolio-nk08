import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import useThreeScene from "../three/useThreeScene";
import Dock from "./Dock";
import { profile } from "../data/content";
import { onAppReady } from "../lib/ready";
import { introEnabled, markIntroSceneReady, revealHero, setHeroDormant } from "../lib/intro";
import { isSmallScreen, registerScrollAnchor, scrollToTarget } from "../lib/scroll";
import "../style/LaptopIntro.css";

gsap.registerPlugin(ScrollTrigger);

const loadIntroScene = () => import("../three/introScene.js");
const DONE_AT = 0.999;
const SCREEN_OFF_OPACITY = 0.002; // see onFrame
const SITE_HOST = profile.site || "naumaan.dev";
const CLOCK = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date());
const MENU = ["File", "Edit", "View", "History", "Window", "Help"];
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Cinematic intro: a closed laptop on a desk → the camera dollies in, the lid
 * opens, the screen wakes up showing the hero, and the camera pushes in until
 * the screen *is* the page.
 *
 * Hand-off: the screen doesn't show a picture of the hero — it shows the real
 * hero DOM, mapped onto the 3D screen with a per-frame CSS matrix3d (computed
 * by the scene). The final camera pose makes that matrix the identity, so the
 * pin releases with the hero exactly where it lives in the page: no cut.
 *
 * With prefers-reduced-motion the intro is skipped entirely (children only).
 */
export default function LaptopIntro({ children }) {
  const [enabled] = useState(introEnabled);
  if (!enabled) return children;
  return <IntroStage>{children}</IntroStage>;
}

function IntroStage({ children }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const screenRef = useRef(null);
  const glareRef = useRef(null);
  const skipRef = useRef(null);
  const windowRef = useRef(null);
  const cursorRef = useRef(null);
  // Bridge between the scene loader (async) and the scroll timeline.
  const controlRef = useRef(null);

  useThreeScene(stageRef, loadIntroScene, {
    progress: false,
    onReady: (scene) => controlRef.current?.attach(scene),
    onError: () => controlRef.current?.disable(),
  });

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      const stage = stageRef.current;
      const screen = screenRef.current;
      const glare = glareRef.current;
      const ui = skipRef.current.parentElement;
      const body = document.body;

      // Phase values scrubbed by the timeline and read by the scene each frame.
      // win: 1 = the site sits in a browser window on a macOS desktop,
      // 0 = full screen. cursorIn/cursor/click: the pointer that clicks the
      // window's green (full-screen) button.
      const state = {
        reveal: 0, glow: 0, orbit: 0, dolly: 0, lid: 0, screen: 0, align: 0, push: 0, out: 0,
        win: 1, cursorIn: 0, cursor: 0, click: 0,
      };
      const win = windowRef.current;
      const cursor = cursorRef.current;
      const desktop = screen.querySelector(".intro__desktop");
      const menubar = screen.querySelector(".intro__menubar");
      const deskDock = screen.querySelector(".intro__desk-dock");
      const chrome = screen.querySelector(".intro__chrome");
      let geo = null; // windowed geometry (hero-box px), from layoutWindow
      let lastWin = -1;
      let lastCursor = "";
      let scene = null;
      let done = false;
      let disabled = false;
      let lastMatrix = "";
      let lastLum = -1;
      let lastGlare = -1;
      let lastStage = -1;
      let lastUi = -1;
      let clip = null; // display clip insets (from the scene)
      let lastClip = "";
      let liveTimer = 0;

      screen.inert = true;
      body.classList.add("in-intro");

      // While the screen is dark the hero is invisible: pause its per-frame
      // work (JS loops + particle render via the signal, CSS via the class).
      let dormant = null;
      const setDormant = (value) => {
        if (value === dormant) return;
        dormant = value;
        setHeroDormant(value);
        root.classList.toggle("is-dormant", value);
      };
      setDormant(true);
      const setDone = (value) => {
        if (disabled || value === done) return;
        done = value;
        screen.inert = !value;
        root.classList.toggle("is-done", value);
        body.classList.toggle("in-intro", !value);
        scene?.setActive(!value);
        // Hero ambient animations that are costly under the flight transform
        // resume a beat after the hand-off (off the seam frame), see CSS.
        window.clearTimeout(liveTimer);
        if (value) liveTimer = window.setTimeout(() => root.classList.add("is-live"), 600);
        else root.classList.remove("is-live");
        if (value) {
          setDormant(false);
          // Landed past the screen-on frames (a jump or a fast fling): the
          // hero's entrance must still play.
          revealHero();
          // Hand-off: the hero is back in normal flow, untransformed.
          screen.style.transform = "";
          screen.style.opacity = "";
          screen.style.clipPath = "";
          resetWindow();
          lastMatrix = "";
          lastClip = "";
          lastLum = -1;
        }
      };

      // Called by the scene right after each render (same tick → no lag).
      const onFrame = (matrix, lum) => {
        if (done || disabled) return;
        const stageOpacity = Math.round(state.reveal * (1 - state.out) * 1000) / 1000;
        if (stageOpacity !== lastStage) {
          lastStage = stageOpacity;
          stage.style.opacity = stageOpacity;
        }

        // Screen off (or not drawable): the hero stays *almost* transparent.
        // Never exactly 0 — Chrome skips rasterising fully transparent layers,
        // and the layer must keep its 1× raster (taken under the preloader) so
        // the push-in never re-rasters the hero.
        const opacity = matrix ? Math.max(SCREEN_OFF_OPACITY, Math.round(lum * 1000) / 1000) : SCREEN_OFF_OPACITY;
        if (opacity !== lastLum) {
          lastLum = opacity;
          screen.style.opacity = opacity;
        }
        setDormant(opacity <= SCREEN_OFF_OPACITY);
        if (opacity <= SCREEN_OFF_OPACITY) return;
        if (matrix !== lastMatrix) {
          lastMatrix = matrix;
          screen.style.transform = matrix;
        }
        applyClip();
        applyWindow();
        // The notch belongs to the laptop: it fades out with the final push.
        const notchOpacity = Math.round((1 - state.out) * 1000) / 1000;
        if (notchOpacity !== lastNotch) {
          lastNotch = notchOpacity;
          notch.style.opacity = notchOpacity;
        }
        const glareOpacity = Math.round(lum * (1 - state.out) * 1000) / 1000;
        if (glareOpacity !== lastGlare) {
          lastGlare = glareOpacity;
          glare.style.opacity = glareOpacity;
        }
        if (lum > 0.25) revealHero();
      };

      // ---- Scroll choreography (one scrubbed timeline, reversible) ----
      const tl = gsap
        .timeline({ paused: true, defaults: { ease: "none" } })
        .to(state, { glow: 1, duration: 0.05, ease: "power1.out" }, 0) // lid logo lights up
        .to(state, { orbit: 1, duration: 0.3, ease: "sine.inOut" }, 0)
        .to(state, { dolly: 1, duration: 0.37, ease: "power2.inOut" }, 0.25)
        .to(state, { lid: 1.05, duration: 0.25, ease: "power3.inOut" }, 0.3)
        .to(state, { lid: 1, duration: 0.07, ease: "sine.out" }, 0.55)
        .to(state, { screen: 1, duration: 0.1 }, 0.58)
        .to(state, { align: 1, duration: 0.22, ease: "power2.inOut" }, 0.58)
        // the site in a browser tab → the cursor clicks "full screen" →
        .to(state, { cursorIn: 1, duration: 0.03 }, 0.68)
        .to(state, { cursor: 1, duration: 0.08, ease: "power2.inOut" }, 0.69)
        .to(state, { click: 1, duration: 0.012, ease: "power1.out" }, 0.775)
        .to(state, { click: 0, duration: 0.018, ease: "power1.in" }, 0.787)
        .to(state, { win: 0, duration: 0.1, ease: "power3.inOut" }, 0.79)
        .to(state, { cursorIn: 0, duration: 0.04 }, 0.84)
        // → the camera pushes in until the screen is the page.
        .to(state, { push: 1, duration: 0.11, ease: "power2.inOut" }, 0.89)
        .to(state, { out: 1, duration: 0.09, ease: "power1.in" }, 0.91);

      const trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * (isSmallScreen() ? 2.3 : 3.8))}`,
        pin: true,
        anticipatePin: 1,
        scrub: true,
        animation: tl,
        invalidateOnRefresh: true,
        // Refresh before the hero's own triggers (they offset by this pin).
        refreshPriority: 1,
        onUpdate: (self) => {
          setDone(self.progress >= DONE_AT);
          // Cue + skip link fade out before the final push.
          const uiOpacity = Math.round((1 - gsap.utils.clamp(0, 1, (self.progress - 0.72) / 0.14)) * 100) / 100;
          if (uiOpacity !== lastUi) {
            lastUi = uiOpacity;
            ui.style.opacity = uiOpacity;
            ui.style.visibility = uiOpacity > 0 ? "" : "hidden";
          }
        },
        onRefresh: (self) => setDone(self.progress >= DONE_AT),
      });
      ScrollTrigger.sort();

      // "#home" (logo, menu, back-to-top) → the hero, i.e. the end of the pin.
      const offAnchor = registerScrollAnchor("#home", () => trigger.end);

      // Establishing shot fades in as the preloader curtain lifts.
      // setAppReady() runs inside the preloader's GSAP context; anything (even
      // a contextSafe call) executed synchronously there gets adopted by it and
      // reverted when the preloader unmounts — so hop out with a microtask.
      const startReveal = contextSafe(() => gsap.to(state, { reveal: 1, duration: 2.4, ease: "power3.out" }));
      const offReady = onAppReady(() => queueMicrotask(startReveal));

      // Triggers inside the hero must measure it untransformed.
      const onRefreshInit = () => {
        if (done || disabled) return;
        screen.style.transform = "none";
        win.style.transform = "none";
      };
      const onRefreshDone = () => {
        if (done || disabled) return;
        if (lastMatrix) screen.style.transform = lastMatrix;
        lastWin = -1;
        applyWindow();
      };
      ScrollTrigger.addEventListener("refreshInit", onRefreshInit);
      ScrollTrigger.addEventListener("refresh", onRefreshDone);

      // The camera notch overlay, sized from the model's geometry (it lives in
      // the hero's box, so it's carried by the same matrix3d → always aligned).
      const notch = screen.querySelector(".intro__notch");
      let lastNotch = -1;
      // Display clip: the hero is cover-fitted over the laptop display; the
      // parts beyond it stay clipped until the final push opens the clip.
      const layoutNotch = () => {
        const n = scene?.getNotch?.();
        if (!n) return;
        notch.style.left = `${n.left}px`;
        notch.style.top = `${n.top}px`;
        notch.style.width = `${n.width}px`;
        notch.style.height = `${n.height}px`;
        clip = scene.getClip();
        lastClip = "";
        layoutWindow(n);
      };

      // ---- macOS desktop + browser window, laid out inside the display ----
      // The window wrapper holds the tab bar + the hero; while "windowed" it
      // is translated/scaled (from its top-left) into a rect on the desktop.
      const layoutWindow = (n) => {
        const W = screen.offsetWidth;
        const H = screen.offsetHeight;
        const barH = Math.max(16, n.height);
        screen.style.setProperty("--clip-t", `${clip.top}px`);
        screen.style.setProperty("--clip-r", `${clip.right}px`);
        screen.style.setProperty("--clip-b", `${clip.bottom}px`);
        screen.style.setProperty("--clip-l", `${clip.left}px`);
        screen.style.setProperty("--bar-h", `${barH}px`);
        const dw = W - clip.left - clip.right;
        const dh = H - clip.top - clip.bottom;
        const dockSpace = deskDock.offsetHeight + 14;
        const pad = dh * 0.035;
        const R = { x: clip.left + dw * 0.06, y: clip.top + barH + pad, w: dw * 0.88 };
        R.h = dh - barH - pad * 2 - dockSpace;
        const c = chrome.offsetHeight;
        const s = Math.min(R.w / W, R.h / (H + c));
        const x0 = R.x + (R.w - W * s) / 2;
        const y0 = R.y + (R.h - (H + c) * s) / 2;
        // The green button's centre in window-local px (its offsetParent is
        // the window wrapper, the nearest positioned ancestor).
        const green = chrome.querySelector(".intro__light--max");
        const gx = green.offsetLeft + green.offsetWidth / 2;
        const gy = green.offsetTop + green.offsetHeight / 2;
        geo = { s, a: x0, b: y0 + c, c, gx, gy, start: { x: x0 + W * s * 0.62, y: y0 + (H + c) * s * 0.6 } };
        lastWin = -1;
        lastCursor = "";
      };

      const applyWindow = () => {
        if (!geo) return;
        const k = Math.round(state.win * 1000) / 1000;
        const s = 1 + (geo.s - 1) * k;
        const a = geo.a * k;
        const b = geo.b * k;
        if (k !== lastWin) {
          lastWin = k;
          win.style.transform = k > 0 ? `translate3d(${a.toFixed(2)}px, ${b.toFixed(2)}px, 0) scale(${s.toFixed(5)})` : "none";
          win.style.borderRadius = k > 0 ? `${((14 * k) / s).toFixed(2)}px` : "";
          // Full screen hides the menu bar and the dock (the dock exists only
          // on this desktop — the site itself has none).
          const hide = 1 - k;
          menubar.style.transform = `translate3d(0, ${(-hide * 105).toFixed(1)}%, 0)`;
          deskDock.style.transform = `translate3d(0, ${(hide * 160).toFixed(1)}%, 0)`;
          desktop.style.visibility = k > 0 ? "" : "hidden";
        }
        // Cursor: glides from the page to the green button and rides it.
        const vis = Math.round(state.cursorIn * 100) / 100;
        let value = "hidden";
        if (vis > 0) {
          const t = smooth(state.cursor);
          const x = lerp(geo.start.x, a + s * geo.gx, t);
          const y = lerp(geo.start.y, -geo.c + b + s * geo.gy, t);
          value = `${x.toFixed(1)},${y.toFixed(1)},${(1 - state.click * 0.18).toFixed(3)},${vis}`;
        }
        if (value === lastCursor) return;
        lastCursor = value;
        if (value === "hidden") {
          cursor.style.opacity = "0";
          return;
        }
        const [x, y, scale, opacity] = value.split(",");
        cursor.style.opacity = opacity;
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      };

      function resetWindow() {
        win.style.transform = "";
        win.style.borderRadius = "";
        cursor.style.opacity = "0";
        lastWin = -1;
        lastCursor = "";
      };
      const applyClip = () => {
        if (!clip) return;
        const k = 1 - state.out;
        const value = `inset(${(clip.top * k).toFixed(1)}px ${(clip.right * k).toFixed(1)}px ${(clip.bottom * k).toFixed(1)}px ${(clip.left * k).toFixed(1)}px)`;
        if (value === lastClip) return;
        lastClip = value;
        screen.style.clipPath = value;
      };

      const ro = new ResizeObserver(() => {
        scene?.setScreenBox(screen.offsetWidth, screen.offsetHeight);
        layoutNotch();
      });
      ro.observe(screen);

      // WebGL / model failure → no intro: unpin and show the hero normally.
      const disable = () => {
        if (disabled) return;
        setDone(true);
        disabled = true;
        markIntroSceneReady();
        revealHero();
        offAnchor();
        trigger.kill();
        tl.kill();
        setDormant(false);
        resetWindow();
        root.classList.add("is-done", "is-disabled", "is-live");
        ScrollTrigger.refresh();
      };

      controlRef.current = {
        attach: (instance) => {
          scene = instance;
          scene.bind(state, onFrame);
          scene.setScreenBox(screen.offsetWidth, screen.offsetHeight);
          scene.setActive(!done && !disabled);
          scene.ready.then(() => {
            layoutNotch();
            markIntroSceneReady();
          }, (error) => {
            console.warn("[intro] laptop model failed to load:", error);
            disable();
          });
        },
        disable,
      };

      return () => {
        window.clearTimeout(liveTimer);
        controlRef.current = null;
        offAnchor();
        offReady();
        ro.disconnect();
        ScrollTrigger.removeEventListener("refreshInit", onRefreshInit);
        ScrollTrigger.removeEventListener("refresh", onRefreshDone);
        body.classList.remove("in-intro");
        setHeroDormant(false);
        screen.inert = false;
      };
    },
    { scope: rootRef }
  );

  const handleSkip = (event) => {
    event.preventDefault();
    revealHero();
    scrollToTarget("#home", { immediate: true });
    requestAnimationFrame(() => {
      const title = screenRef.current?.querySelector(".hero__title");
      if (!title) return;
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    });
  };

  return (
    <div className="intro" ref={rootRef}>
      <div className="intro__stage" ref={stageRef} aria-hidden="true" />
      <div className="intro__screen" ref={screenRef}>
        <div className="intro__desktop" aria-hidden="true">
          <div className="intro__menubar">
            <span className="intro__menu-logo">nk</span>
            <b>Portfolio</b>
            {MENU.map((item) => (
              <span className="intro__menu-item" key={item}>
                {item}
              </span>
            ))}
            <span className="intro__menu-right">
              <svg viewBox="0 0 20 14" width="17" height="12">
                <path d="M10 12.5 7.6 10a3.4 3.4 0 0 1 4.8 0zM4.9 7.3a7.3 7.3 0 0 1 10.2 0M2.3 4.6a11 11 0 0 1 15.4 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <svg viewBox="0 0 26 13" width="24" height="12">
                <rect x="0.75" y="0.75" width="21.5" height="11.5" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                <rect x="2.5" y="2.5" width="15" height="8" rx="1.6" fill="currentColor" />
                <rect x="23.4" y="4.3" width="1.8" height="4.4" rx="0.9" fill="currentColor" opacity="0.6" />
              </svg>
              <span>{CLOCK}</span>
            </span>
          </div>
          <div className="intro__desk-dock">
            <Dock />
          </div>
        </div>

        <div className="intro__window" ref={windowRef}>
          <div className="intro__chrome" aria-hidden="true">
            <span className="intro__lights">
              <i className="intro__light intro__light--close" />
              <i className="intro__light intro__light--min" />
              <i className="intro__light intro__light--max" />
            </span>
            <span className="intro__nav">
              <svg viewBox="0 0 34 14" width="34" height="14">
                <path d="M7 2 2 7l5 5M27 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="intro__tab intro__tab--active">
              <span className="intro__favicon">nk</span>
              <span className="intro__tab-title">{profile.name} — Portfolio</span>
            </span>
            <span className="intro__tab">
              <span className="intro__favicon intro__favicon--muted">gh</span>
              <span className="intro__tab-title">GitHub</span>
            </span>
            <span className="intro__address">
              <svg viewBox="0 0 12 14" width="10" height="12">
                <path d="M3 6V4.5a3 3 0 0 1 6 0V6" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <rect x="1.5" y="6" width="9" height="7" rx="1.6" fill="currentColor" />
              </svg>
              {SITE_HOST}
            </span>
          </div>
          {children}
        </div>

        <svg className="intro__cursor" ref={cursorRef} viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path d="M5 2.5v17.2l4.4-4.2 2.9 6.6 2.6-1.1-2.8-6.5h6.2z" fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span className="intro__notch" aria-hidden="true" />
        <span className="intro__glare" ref={glareRef} aria-hidden="true" />
      </div>
      <div className="intro__ui">
        <span className="intro__cue" aria-hidden="true">
          <span className="intro__cue-line" />
          Scroll to open
        </span>
        <a className="intro__skip" href="#home" ref={skipRef} onClick={handleSkip}>
          Skip intro <span aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
  );
}
