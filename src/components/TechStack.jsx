import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "../style/techStack.css";

gsap.registerPlugin(ScrollTrigger);

export default function StackingCards() {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    // Wait for TechStack container to enter viewport before creating ScrollTrigger
    const techStackObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Container is in view, create the ScrollTriggers
            const cards = gsap.utils.toArray(".card-container");

            cards.forEach((card, index) => {
              // scale animation
              gsap.to(card, {
                scale: 1 - (cards.length - index) * 0.025,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  start: "top bottom-=100",
                  end: "bottom top+=200",
                  scrub: true,
                  markers: true,
                  invalidateOnRefresh: true,
                },
              });

              // pinning
              ScrollTrigger.create({
                trigger: card,
                start: "top top",
                end: "max",
                pin: true,
                pinSpacing: false,
                // markers: true,
                invalidateOnRefresh: true,
              });
            });

            // Stop observing after ScrollTriggers are created
            techStackObserver.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      techStackObserver.observe(containerRef.current);
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      techStackObserver.disconnect();
    };
  }, []);

  return (
    <div className="tech-stack-container" ref={containerRef}>
      <h1>Stacking Cards</h1>

      <div className="container">
      <div className="cards">
        <div className="card-container" style={{top:"45px"}}>
          <div className="card" >HTML</div>
        </div>
         <div className="card-container" style={{top:"55px"}}>
          <div className="card" >CSS</div>
         </div> 
         <div className="card-container" style={{top:"50px"}}>
          <div className="card" >JavaScript</div>
         </div>
         <div className="card-container" style={{top:"55px"}}>
          <div className="card" >React</div>
          </div>
          <div className="card-container" style={{top:"60px"}}>
            <div className="card" >laravel</div>
          </div>
          <div className="card-container" style={{top:"70px"}}>
            <div className="card" >php</div>
          </div>
          <div className="card-container" style={{top:"75px"}}>
            <div className="card" >Mysql</div>
          </div>
          <div className="card-container" style={{top:"80px"}}>
            <div className="card" >Git</div>
          </div>
          <div className="card-container" style={{top:"85px"}}>
            <div className="card" >Figma</div>
          </div>
          <div className="card-container" style={{top:"90px"}}>
            <div className="card" >Jira</div>
          </div>
          <div className="card-container" style={{top:"95px"}}>
            <div className="card" >Docker</div>
          </div>
      </div>
    </div>

      <div classNameName="container2"></div>
    </div>
  );
}
