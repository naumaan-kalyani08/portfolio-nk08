import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, isSmallScreen } from "../lib/scroll";
import { getTheme, onThemeChange } from "../lib/theme";

/**
 * Mounts a lazily-loaded Three.js scene into `containerRef`.
 *
 * Performance guarantees:
 *  - three.js is code-split: it's only downloaded when the scene is requested.
 *  - Rendering runs on the shared GSAP ticker (one rAF loop for Lenis + GSAP + WebGL).
 *  - The loop stops when the canvas is off-screen or the tab is hidden.
 *  - Pixel ratio is capped; mobile gets lighter geometry.
 *  - With prefers-reduced-motion, a single static frame is rendered.
 *
 * A scene module must export `createScene(container, { isMobile, reduced })`
 * returning `{ resize(w, h), update(time, dt), setPointer(x, y), setProgress(p), dispose() }`
 * and optionally `setTheme("dark" | "light")` (palette/blending swap),
 * and may expose extras (e.g. `pulse(x, y)`). The returned ref points at the
 * live scene so components can call those extras.
 *
 * Options:
 *  - progressStart / progressEnd: the scroll range mapped to setProgress(0 → 1).
 *  - progress: false skips that trigger (the scene is driven some other way).
 *  - pinnedContainer: (container) => Element — set when the container sits
 *    inside another pinned element, so the range is offset by that pin.
 *  - paused: () => boolean — checked every frame; true skips the render
 *    (e.g. the hero while it sits on the laptop intro's dark screen).
 *  - onReady(scene) / onError(error).
 */
export default function useThreeScene(
  containerRef,
  loadScene,
  { progressStart = "top top", progressEnd = "bottom top", progress = true, pinnedContainer, paused, onReady, onError } = {}
) {
  const sceneRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();
    let scene = null;
    let disposed = false;
    let inView = false;
    let running = false;
    let lastTime = 0;

    const tick = (time, deltaMs) => {
      if (paused?.()) return;
      lastTime = time;
      scene.update(time, Math.min(deltaMs, 64) / 1000);
    };

    const start = () => {
      if (running || !scene || !inView || document.hidden || reduced) return;
      running = true;
      gsap.ticker.add(tick);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(container);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    const resize = () => {
      if (!scene) return;
      scene.resize(container.clientWidth, container.clientHeight);
      if (reduced) scene.update(0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onPointerMove = (event) => {
      if (!scene) return;
      scene.setPointer((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    };
    if (!reduced) window.addEventListener("pointermove", onPointerMove, { passive: true });

    const progressTrigger = progress
      ? ScrollTrigger.create({
          trigger: container,
          start: progressStart,
          end: progressEnd,
          pinnedContainer: pinnedContainer?.(container) || undefined,
          onUpdate: (self) => scene?.setProgress(self.progress),
        })
      : null;

    // Theme swaps re-render a frame right away (also keeps paused or
    // reduced-motion scenes correct, and the view-transition snapshot fresh).
    const offTheme = onThemeChange((theme) => {
      if (!scene?.setTheme) return;
      scene.setTheme(theme);
      scene.update(lastTime, 0);
    });

    loadScene()
      .then((mod) => {
        if (disposed) return;
        scene = mod.createScene(container, { isMobile: isSmallScreen(), reduced });
        sceneRef.current = scene;
        scene.setTheme?.(getTheme());
        resize();
        scene.update(0, 0);
        onReady?.(scene);
        start();
      })
      .catch((error) => {
        // WebGL unavailable or chunk failed — the page still works without 3D.
        console.warn("[three] scene disabled:", error);
        if (!disposed) onError?.(error);
      });

    return () => {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      progressTrigger?.kill();
      offTheme();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      scene?.dispose();
      scene = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return sceneRef;
}
