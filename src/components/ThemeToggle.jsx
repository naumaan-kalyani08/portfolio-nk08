import { useEffect, useId, useState } from "react";
import { getTheme, onThemeChange, toggleTheme } from "../lib/theme";

// Sun ⇄ moon toggle. The icon morph is pure CSS keyed off <html data-theme>,
// so it flips in the same frame as the page. Clicking reveals the new theme
// as a circle growing out of the button (View Transitions, where supported).
const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const p = (r) => [12 + Math.cos(a) * r, 12 + Math.sin(a) * r].map((v) => v.toFixed(2));
  const [x1, y1] = p(8.4);
  const [x2, y2] = p(10.8);
  return { x1, y1, x2, y2 };
});

export default function ThemeToggle({ className = "" }) {
  const [theme, setThemeState] = useState(getTheme);
  const maskId = `theme-bite-${useId().replace(/:/g, "")}`;

  useEffect(() => onThemeChange(setThemeState), []);

  const next = theme === "dark" ? "light" : "dark";

  const handleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    toggleTheme({ origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } });
  };

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={handleClick}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      data-magnetic="0.3"
    >
      <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <mask id={maskId}>
          <rect x="-12" y="-12" width="48" height="48" fill="#fff" />
          <circle className="theme-toggle__bite" cx="18" cy="6.5" r="7" fill="#000" />
        </mask>
        <circle className="theme-toggle__disc" cx="12" cy="12" r="9" fill="currentColor" mask={`url(#${maskId})`} />
        <g className="theme-toggle__rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {RAYS.map((ray, i) => (
            <line key={i} {...ray} />
          ))}
        </g>
      </svg>
    </button>
  );
}
