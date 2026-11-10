// Renders a heading whose words are wrapped in overflow masks so they can
// slide up on scroll (animated globally in App.jsx via `.split-heading`).
// Splitting happens at render time — no DOM rewriting, SSR/StrictMode safe.
export default function RevealHeading({ className = "", children, gradientWords = [] }) {
  const words = String(children).split(" ");

  return (
    <h2 className={`split-heading ${className}`} aria-label={children}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden="true">
          <span className="split-mask">
            <span className={`split-word ${gradientWords.includes(word) ? "text-gradient" : ""}`}>{word}</span>
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </h2>
  );
}
