import type { ReactNode } from "react";

/*
  Conservation principles with white line icons drawn as inline SVG
  (paw, ecosystem, leaf, seedling), matching the amber-circle icon
  treatment in the reference.
*/
const PRINCIPLES: { title: string; copy: string; icon: ReactNode }[] = [
  {
    title: "Protects Wildlife & Habitats",
    copy: "Ensures a safe future for species and their natural homes.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <ellipse cx="24" cy="31" rx="9" ry="7.5" fill="currentColor" />
        <ellipse cx="10.5" cy="22" rx="4" ry="5.5" fill="currentColor" transform="rotate(-18 10.5 22)" />
        <ellipse cx="17.5" cy="15.5" rx="4.2" ry="6" fill="currentColor" transform="rotate(-6 17.5 15.5)" />
        <ellipse cx="26.5" cy="14.5" rx="4.2" ry="6" fill="currentColor" transform="rotate(8 26.5 14.5)" />
        <ellipse cx="34.5" cy="19" rx="4" ry="5.5" fill="currentColor" transform="rotate(20 34.5 19)" />
      </svg>
    ),
  },
  {
    title: "Maintains Healthy Ecosystems",
    copy: "Keeps forests, rivers and natural cycles balanced.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" fill="none">
        <circle cx="23" cy="25" r="14" stroke="currentColor" strokeWidth="3" />
        <ellipse cx="23" cy="25" rx="6.5" ry="14" stroke="currentColor" strokeWidth="2.4" />
        <path d="M9.5 20h27M9.5 30h27" stroke="currentColor" strokeWidth="2.4" />
        <path
          d="M38 6c-5 1-8 4-8.5 9 5-.5 8-3.5 8.5-9z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    title: "Supports Cleaner Air And Water",
    copy: "Helps maintain a healthier environment for all.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M38 8C24 9 12 16 9.5 30 8.6 35 10 39 10 40c1-6 5-13 11-18C14 29 11 35 11 39.5 22 39 30 33 34 24 37 17 38 8 38 8z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    title: "Protects Our Natural Heritage",
    copy: "Keeps our planet's biodiversity alive for years to come.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" fill="none">
        <path d="M24 42V26" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <path
          d="M24 27C24 19 19 14 10 14c0 9 5 13 14 13z"
          fill="currentColor"
        />
        <path
          d="M24 22c0-7 4.5-11 13-11 0 8-4 12-13 11z"
          fill="currentColor"
        />
        <path d="M14 42h20" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

// Node positions (% of the content box) — shared by the SVG route's
// horizontal connectors and the HTML node dots so they stay aligned.
const NODES = [
  { x: 39.5, y: 11 },
  { x: 41.5, y: 37 },
  { x: 40.5, y: 63 },
  { x: 36.5, y: 89 },
] as const;

export function Conservation() {
  return (
    <section className="conservation-section" aria-label="Conservation">
      <h2 className="conservation-heading">
        <span className="conservation-heading-line">The Wild Is Not Just</span>
        <span className="conservation-heading-line">
          An Experience. It Is A Responsibility.
        </span>
      </h2>

      <div className="conservation-content">
        {/*
          Amber storytelling route: SVG path curving around the forest
          circle, with a short horizontal connector at each principle.
          Node dots are HTML so their rings stay crisp at any size.
        */}
        <svg
          className="conservation-route"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 17 1 C 34 3, 39.5 6, 39.5 11 C 39.5 22, 41.5 28, 41.5 37 C 41.5 47, 40.5 54, 40.5 63 C 40.5 74, 36.5 80, 36.5 89 C 36.5 95, 30 98, 22 99.5"
            fill="none"
            stroke="var(--color-accent, #f5a623)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {NODES.map((node) => (
            <line
              key={node.y}
              x1={node.x}
              y1={node.y}
              x2="47"
              y2={node.y}
              stroke="var(--color-accent, #f5a623)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <span
          className="conservation-endpoint"
          style={{ left: "17%", top: "1%" }}
          aria-hidden="true"
        />
        <span
          className="conservation-endpoint"
          style={{ left: "22%", top: "99.5%" }}
          aria-hidden="true"
        />
        {NODES.map((node) => (
          <span
            key={node.y}
            className="conservation-node"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            aria-hidden="true"
          />
        ))}

        <div className="conservation-visual">
          <img
            className="conservation-forest"
            src="/images/gallery/forest-circle.jpg"
            alt="Sunlight filtering through a lush green forest canopy"
            width={364}
            height={364}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>

        <ul className="conservation-panels">
          {PRINCIPLES.map((item) => (
            <li className="conservation-panel" key={item.title}>
              <span className="conservation-panel-icon">{item.icon}</span>
              <span className="conservation-panel-text">
                <h3 className="conservation-panel-title">{item.title}</h3>
                <p className="conservation-panel-copy">{item.copy}</p>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
