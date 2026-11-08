import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import "../style/scrollAnimation.css";

gsap.registerPlugin(ScrollTrigger);

const LEAD = 0.015;
const LAST_MILESTONE_DELAY = 0.0;
const TIMELINE_SECTION = {
  id: "scroll-animation",
  start: "top 50%",
  end: "bottom 50%",
};

export default function ScrollAnimation() {
  const timelineSvgRef = useRef(null);

  useLayoutEffect(() => {
    const svg = timelineSvgRef.current;
    if (!svg) return undefined;

    const refreshTrigger = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    };

    const ctx = gsap.context(() => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (isMobile) {
        ScrollTrigger.config({
          limitCallbacks: true,
          ignoreMobileResize: true,
        });
      }

      const path = svg.querySelector(".timeline-path");
      const travelBall = svg.querySelector(".timeline-travel-ball");
      const milestoneConfigs = [
        { ball: svg.querySelector(".ball02"), text: svg.querySelector(".text01"), y: 360 },
        { ball: svg.querySelector(".ball03"), text: svg.querySelector(".text02"), y: 720 },
        { ball: svg.querySelector(".ball04"), text: svg.querySelector(".text03"), y: 1080 },
        { ball: svg.querySelector(".ball05"), text: svg.querySelector(".text04"), y: 1440 },
        { ball: svg.querySelector(".ball06"), text: svg.querySelector(".text05"), y: 1800 },
        { ball: svg.querySelector(".ball07"), text: svg.querySelector(".text06"), y: 2160 },
      ];

      if (!path || !travelBall) return;

      const totalLength = path.getTotalLength();
      const state = { p: 0 };

      const findProgressAtY = (targetY) => {
        let min = 0;
        let max = totalLength;

        for (let i = 0; i < 32; i += 1) {
          const mid = (min + max) / 2;
          const point = path.getPointAtLength(mid);
          if (point.y < targetY) {
            min = mid;
          } else {
            max = mid;
          }
        }

        return Math.min(1, Math.max(0, max / totalLength));
      };

      const milestoneState = milestoneConfigs.map((item, index) => {
        const progress = findProgressAtY(item.y);
        const isLast = index === milestoneConfigs.length - 1;
        const showAt = Math.min(1, Math.max(0, progress - LEAD - (isLast ? LAST_MILESTONE_DELAY : 0)));
        const ballTimeline = gsap.timeline({
          paused: true,
          id: `milestone-${index + 1}`,
        });

        if (!reduceMotion) {
          ballTimeline
            .fromTo(
              item.ball,
              { scale: 0, autoAlpha: 0, visibility: "hidden" },
              {
                scale: 2,
                autoAlpha: 1,
                visibility: "visible",
                duration: 0.46,
                ease: "elastic.out(1, 0.5)",
                transformOrigin: "50% 50%",
              },
              0
            )
            .fromTo(
              item.text,
              { autoAlpha: 0, y: 8, visibility: "hidden" },
              {
                autoAlpha: 1,
                y: 0,
                visibility: "visible",
                duration: 0.26,
                ease: "power3.out",
                delay: 0.03,
              },
              0.03
            );
        }

        gsap.set(item.ball, { autoAlpha: 0, visibility: "hidden", scale: 0, transformOrigin: "50% 50%" });
        gsap.set(item.text, { autoAlpha: 0, visibility: "hidden", y: 8 });

        return {
          ...item,
          progress,
          showAt,
          active: false,
          timeline: ballTimeline,
          reduceMotion,
        };
      });

      const updatePathAndBall = () => {
        const drawLength = Math.min(totalLength, totalLength * state.p);
        path.style.strokeDasharray = String(totalLength);
        path.style.strokeDashoffset = String(totalLength * (1 - state.p));

        const point = path.getPointAtLength(drawLength);
        travelBall.setAttribute("cx", point.x);
        travelBall.setAttribute("cy", point.y);

        const visible = state.p > 0.001;
        travelBall.style.visibility = visible ? "visible" : "hidden";
        travelBall.style.opacity = visible ? "1" : "0";
      };

      const isTimelineVisible = () => {
        const rect = svg.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.98 && rect.bottom > 0;
      };

      const setMilestoneState = (milestone, shouldShow) => {
        if (milestone.reduceMotion) {
          gsap.set(milestone.ball, { autoAlpha: shouldShow ? 1 : 0, visibility: shouldShow ? "visible" : "hidden", scale: shouldShow ? 2 : 0, transformOrigin: "50% 50%" });
          gsap.set(milestone.text, { autoAlpha: shouldShow ? 1 : 0, visibility: shouldShow ? "visible" : "hidden", y: shouldShow ? 0 : 8 });
          milestone.active = shouldShow;
          return;
        }

        if (shouldShow) {
          gsap.set(milestone.ball, { autoAlpha: 1, visibility: "visible", scale: 2, transformOrigin: "50% 50%" });
          gsap.set(milestone.text, { autoAlpha: 1, visibility: "visible", y: 0 });
          milestone.active = true;
          milestone.timeline.progress(1).pause();
        } else {
          gsap.set(milestone.ball, { autoAlpha: 0, visibility: "hidden", scale: 0, transformOrigin: "50% 50%" });
          gsap.set(milestone.text, { autoAlpha: 0, visibility: "hidden", y: 8 });
          milestone.active = false;
          milestone.timeline.progress(0).pause();
        }
      };

      const updateMilestones = () => {
        const visible = isTimelineVisible();

        milestoneState.forEach((milestone) => {
          const shouldShow = visible && state.p >= milestone.showAt;

          if (shouldShow && !milestone.active) {
            milestone.active = true;
            milestone.timeline.play(0);
            return;
          }

          if (!shouldShow && milestone.active) {
            milestone.active = false;
            milestone.timeline.timeScale(1.6);
            milestone.timeline.reverse();
          }
        });
      };

      gsap.set(path, { strokeDasharray: totalLength, strokeDashoffset: totalLength });
      gsap.set(travelBall, { autoAlpha: 0, visibility: "hidden" });

      milestoneState.forEach((milestone) => {
        const visible = isTimelineVisible();
        setMilestoneState(milestone, visible && state.p >= milestone.showAt);
      });

      ScrollTrigger.create({
        id: TIMELINE_SECTION.id,
        trigger: svg,
        start: TIMELINE_SECTION.start,
        end: TIMELINE_SECTION.end,
        scrub: isMobile ? 1 : true,
        invalidateOnRefresh: true,
        refreshPriority: 0,
        fastScrollEnd: true,
        onUpdate: (self) => {
          state.p = self.progress;
          updatePathAndBall();
          updateMilestones();
        },
      });

      window.addEventListener("resize", refreshTrigger);
      updatePathAndBall();
      updateMilestones();
      ScrollTrigger.sort();
    }, svg);

    const onLoad = () => refreshTrigger();
    const onFontsReady = () => refreshTrigger();

    window.addEventListener("load", onLoad);
    document.fonts?.ready?.then(onFontsReady);

    refreshTrigger();

    return () => {
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", refreshTrigger);
      ctx.revert();
    };
  }, []);

  return (
    <section className="timeline-wrapper">
      <h1 className="timeline-heading">Scroll to see a timeline animation</h1>

      <svg
        ref={timelineSvgRef}
        id="timeline-svg"
        viewBox="0 0 600 2160"
        className="timeline-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path className="timeline-line" d="M10 360 600 360" />
        <path className="timeline-line" d="M10 720 600 720" />
        <path className="timeline-line" d="M10 1080 600 1080" />
        <path className="timeline-line" d="M10 1440 600 1440" />
        <path className="timeline-line" d="M10 1610 600 1610" />
        <path className="timeline-line" d="M10 1800 600 1800" />
        <path className="timeline-line" d="M10 2160 600 2160" />

        <text className="timeline-text text01" x="30" y="342">2002</text>
        <text className="timeline-text text02" x="30" y="702">2018</text>
        <text className="timeline-text text03" x="30" y="1062">2020</text>
        <text className="timeline-text text04" x="30" y="1422">2023</text>
        <text className="timeline-text text05" x="30" y="1800">2024</text>
        <text className="timeline-text text06" x="30" y="1600">2024</text>
        <text className="timeline-text text07" x="30" y="2160">2025</text>

        <path
          className="timeline-path"
          d="
            M -5,0
            Q 450 414 300 810
            T 130 1350
            Q 100 1530 300 1800
            T 150 2160
          "
        />

        <circle className="timeline-ball ball01" r="20" cx="50" cy="180" />
        <circle className="timeline-ball ball02" r="20" cx="278" cy="362" />
        <circle className="timeline-ball ball03" r="20" cx="327" cy="722" />
        <circle className="timeline-ball ball04" r="20" cx="216" cy="1082" />
        <circle className="timeline-ball ball05" r="20" cx="147" cy="1442" />
        <circle className="timeline-ball ball06" r="20" cx="200" cy="1800" />
        <circle className="timeline-ball ball07" r="20" cx="147" cy="2160" />
        <circle className="timeline-travel-ball" r="18" cx="0" cy="0" />
      </svg>
    </section>
  );
}
