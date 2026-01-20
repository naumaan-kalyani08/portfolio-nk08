import { useEffect, useState } from "react";

const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

 useEffect(() => {
  const updateScrollProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setScrollProgress((scrollTop / docHeight) * 100);
  };
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  return () => window.removeEventListener("scroll", updateScrollProgress);
}, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "4px",
        // backgroundColor: "#e0e0e014",
        backgroundColor: "rgb(255 255 255 / 3%)",
        backdropFilter: "blur(2.9px)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${scrollProgress}%`,
          backgroundColor: "#5fd6f6", // Tailwind blue-500
          transition: "width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "width",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
};

export default ScrollProgressBar;
