import { prefersReducedMotion } from "./scroll";

// Light / dark theme store.
// The initial theme is applied by an inline script in index.html before the
// first paint (no flash). This module keeps it in sync afterwards:
//  - an explicit choice is persisted in localStorage,
//  - otherwise the OS preference is followed live.
// Non-CSS consumers (WebGL scenes, canvas sparks) subscribe via onThemeChange().

const STORAGE_KEY = "theme";
const META_COLORS = { dark: "#05070f", light: "#f4f3ef" };
const listeners = new Set();

const readStored = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
};

const store = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode / blocked storage — the choice just won't persist */
  }
};

export const getTheme = () =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark";

export const onThemeChange = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

function apply(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLORS[theme]);
  listeners.forEach((callback) => callback(theme));
}

// Swap instantly with every CSS transition suspended, so all surfaces change
// in the same frame instead of fading at their own speeds.
function swap(theme) {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  apply(theme);
  return () => root.classList.remove("theme-switching");
}

/**
 * Change the theme. With `origin` ({ x, y } in viewport px) and View
 * Transitions support, the new theme is revealed as a circle growing from
 * that point; otherwise it swaps instantly.
 */
export function setTheme(theme, { origin } = {}) {
  if (theme !== "light" && theme !== "dark") return;
  store(theme);
  if (theme === getTheme()) return;

  const animated = origin && typeof document.startViewTransition === "function" && !prefersReducedMotion();
  if (!animated) {
    const done = swap(theme);
    requestAnimationFrame(() => requestAnimationFrame(done));
    return;
  }

  const { x, y } = origin;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  let done = () => {};
  const transition = document.startViewTransition(() => {
    done = swap(theme);
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 800, easing: "cubic-bezier(0.76, 0, 0.24, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    })
    .catch(() => {});
  transition.finished.finally(() => done());
}

export const toggleTheme = (options) => setTheme(getTheme() === "dark" ? "light" : "dark", options);

// Follow the OS preference until the visitor makes an explicit choice.
if (typeof window !== "undefined" && window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (event) => {
    if (readStored()) return;
    const done = swap(event.matches ? "light" : "dark");
    requestAnimationFrame(() => requestAnimationFrame(done));
  });
}
