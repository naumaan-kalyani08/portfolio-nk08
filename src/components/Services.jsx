import { services } from "../data/content";
import RevealHeading from "./RevealHeading";
import "../style/Services.css";

export default function Services() {
  return (
    <section id="services" className="section services">
      <header className="section-head">
        <p className="eyebrow" data-reveal>
          02 — What I do
        </p>
        <RevealHeading className="section-title" gradientWords={["life."]}>
          Ideas brought to life.
        </RevealHeading>
      </header>

      <ol className="services__list">
        {services.map((service, index) => (
          <li className="service" key={service.title} data-reveal>
            <span className="service__index">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="service__title">{service.title}</h3>
            <p className="service__text">{service.text}</p>
            <span className="service__arrow" aria-hidden="true">
              ↗
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
