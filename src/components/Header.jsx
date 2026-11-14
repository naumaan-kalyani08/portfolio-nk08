import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { navItems, profile, socials as socialLinks } from "../data/content";
import { getLenis, scrollToTarget } from "../lib/scroll";
import ThemeToggle from "./ThemeToggle";
import "../style/Header.css";

gsap.registerPlugin(ScrambleTextPlugin);

// Sections tracked for the "current section" label next to the logo.
const SECTIONS = [
  ["home", "Home"],
  ["about", "About"],
  ["services", "Services"],
  ["work", "Work"],
  ["experience", "Journey"],
  ["skills", "Skills"],
  ["contact", "Contact"],
];

const menuItems = navItems.map((item, index) => ({ ...item, number: String(index + 1).padStart(2, "0") }));
const cityLabel = profile.city;
const emailAddress = profile.email;

const getCurrentTimeLabel = () => {
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(now);

  return `${cityLabel} - ${time}`;
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHeroInView, setIsHeroInView] = useState(true);
  const [clockLabel, setClockLabel] = useState(getCurrentTimeLabel());
  const [section, setSection] = useState("Home");
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuOrigin = () => {
    if (!menuButtonRef.current) return;

    const rect = menuButtonRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    document.documentElement.style.setProperty("--ox", `${x}px`);
    document.documentElement.style.setProperty("--oy", `${y}px`);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    window.setTimeout(() => {
      if (!document.body.classList.contains("menu-open") && menuButtonRef.current) {
        menuButtonRef.current.focus();
      }
    }, 950);
  };

  const openMenu = () => {
    updateMenuOrigin();
    setIsMenuOpen(true);
  };

  const handleToggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const handleMenuItemClick = (event, href) => {
    event.preventDefault();
    closeMenu();
    // Restart Lenis *before* scrolling — start() resets any in-flight scroll.
    getLenis()?.start();
    scrollToTarget(href);
  };

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 80);
      // Hide on scroll down, reveal on scroll up (ignore tiny jitters).
      if (Math.abs(y - lastY) > 6) {
        setIsHidden(y > lastY && y > 400);
        lastY = y;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isMenuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [isMenuOpen]);

  useEffect(() => {
    document.body.classList.toggle("in-hero", isHeroInView);
    return () => document.body.classList.remove("in-hero");
  }, [isHeroInView]);

  useEffect(() => {
    const heroSection = document.getElementById("home");
    if (!heroSection) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        setIsHeroInView(entry.isIntersecting || entry.intersectionRatio > 0.35);
      },
      { threshold: [0.35, 0.5] }
    );

    observer.observe(heroSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleResize = () => updateMenuOrigin();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !menuRef.current) {
        return;
      }

      const focusableSelectors = [
        "a[href]",
        "button:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ];

      const focusable = [
        ...menuRef.current.querySelectorAll(focusableSelectors.join(", ")),
        menuButtonRef.current,
      ].filter((element) => Boolean(element) && !element.hasAttribute("disabled"));

      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // Lock scroll: stop Lenis (wheel/touch) and the native scroller.
    getLenis()?.stop();
    document.documentElement.classList.add("is-locked");
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    const focusable = menuRef.current.querySelectorAll("a[href]");
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    return () => {
      getLenis()?.start();
      document.documentElement.classList.remove("is-locked");
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const tickClock = () => {
      setClockLabel(getCurrentTimeLabel());
    };

    tickClock();
    const clockInterval = window.setInterval(tickClock, 60000);

    return () => window.clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    updateMenuOrigin();
  }, [isScrolled]);

  // Current section = whichever section crosses the middle of the viewport.
  useEffect(() => {
    const labels = new Map(SECTIONS);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setSection(labels.get(entry.target.id));
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Menu labels scramble on hover.
  useEffect(() => {
    const labels = [...menuRef.current.querySelectorAll(".site-menu__label")];
    const cleanups = labels.map((label) => {
      const text = label.textContent;
      const onEnter = () =>
        gsap.to(label, { duration: 0.6, scrambleText: { text, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", speed: 0.8 }, overwrite: true });
      label.parentElement.addEventListener("pointerenter", onEnter);
      return () => label.parentElement.removeEventListener("pointerenter", onEnter);
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <>
      <header className={`site-header ${isScrolled ? "is-scrolled" : ""} ${isHidden && !isMenuOpen ? "is-hidden" : ""}`}>
        <div className="site-header__inner">
          <a
            className="brand"
            href="#home"
            aria-label="Home"
            onClick={(event) => {
              event.preventDefault();
              scrollToTarget("#home");
            }}
          >
            <span className="brand__mark">{profile.initials}</span>
            <span className="brand__reg" aria-hidden="true">®</span>
            <span className="brand__section" aria-hidden="true">
              <span className="brand__slash">/</span>
              <span className="brand__section-text" key={section}>
                {section}
              </span>
            </span>
          </a>

          <div className="site-header__actions">
            <a
              className="header-talk"
              href="#contact"
              data-magnetic="0.35"
              onClick={(event) => {
                event.preventDefault();
                scrollToTarget("#contact");
              }}
            >
              Let&apos;s talk
            </a>

            <ThemeToggle />

            <button
              ref={menuButtonRef}
              type="button"
              className={`menu-button ${isMenuOpen ? "is-open" : ""}`}
              data-magnetic="0.2"
              onClick={handleToggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="site-menu"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <span className="menu-button__label-group" aria-hidden="true">
                <span className={`menu-button__label menu-button__label--closed ${!isMenuOpen ? "is-visible" : ""}`}>
                  Menu
                </span>
                <span className={`menu-button__label menu-button__label--open ${isMenuOpen ? "is-visible" : ""}`}>
                  Close
                </span>
              </span>

              <span className="menu-button__icon" aria-hidden="true">
                <span className="menu-button__bar menu-button__bar--wide" />
                <span className="menu-button__bar menu-button__bar--short" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <aside className="side-rail" aria-label="Social links" aria-hidden={!isHeroInView || isMenuOpen}>
        <div className="side-rail__line" aria-hidden="true" />
        <nav className="side-rail__nav" aria-label="Social">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-hidden={!isHeroInView || isMenuOpen}
              tabIndex={isHeroInView && !isMenuOpen ? 0 : -1}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>

      <div
        className={`site-menu ${isMenuOpen ? "is-open" : ""}`}
        id="site-menu"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeMenu();
          }
        }}
      >
        <div className="site-menu__content" ref={menuRef}>
          <nav className="site-menu__nav" aria-label="Main navigation">
            <ul className="site-menu__list">
              {menuItems.map((item, index) => (
                <li key={item.href} className="site-menu__item" style={{ "--i": index }}>
                  <a className="site-menu__link" href={item.href} onClick={(event) => handleMenuItemClick(event, item.href)}>
                    <span className="site-menu__number">{item.number}</span>
                    <span className="site-menu__label">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-menu__meta">
            <div className="site-menu__meta-item">
              <span className="site-menu__meta-label">Email</span>
              <a href={`mailto:${emailAddress}`}>{emailAddress}</a>
            </div>

            <div className="site-menu__meta-item">
              <span className="site-menu__meta-label">Socials</span>
              <div className="site-menu__meta-links">
                {socialLinks.map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noreferrer noopener">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="site-menu__meta-item site-menu__meta-item--time">
              <span className="site-menu__meta-label">Local time</span>
              <span className="site-menu__time">{clockLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
