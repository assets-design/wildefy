/*
  Standalone Conservation section — wildfy perfect circular canopy +
  concentric amber arc with appointment nodes, scaled up for a full
  vertical section (not inside Awards horizontal scroll).
*/

const PRINCIPLES = [
  {
    title: "Protects Wildlife & Habitats",
    copy: "Ensures A Safe Future For Species And Their Natural Homes.",
    icon: "/images/responsibility/icon-1.png",
  },
  {
    title: "Maintains Healthy Ecosystems",
    copy: "Keeps Forests, Rivers And Natural Cycles Balanced.",
    icon: "/images/responsibility/icon-2.png",
  },
  {
    title: "Supports Cleaner Air And Water",
    copy: "Helps Maintain A Healthier Environment For All.",
    icon: "/images/responsibility/icon-3.png",
  },
  {
    title: "Protects Our Natural Heritage",
    copy: "Keeps Our Planet's Biodiversity Alive For Years To Come.",
    icon: "/images/responsibility/icon-4.png",
  },
] as const;

export function Conservation() {
  return (
    <section className="resp-section" aria-label="Conservation">
      <header className="resp-header">
        <h2 className="resp-heading">
          <span className="resp-heading-line">The Wild Is Not Just</span>
          <span className="resp-heading-line">
            An Experience. It Is A Responsibility.
          </span>
        </h2>
      </header>

      <div className="resp-body">
        <div className="resp-graphic">
          <div className="resp-canopy">
            <img
              className="resp-canopy-img"
              src="/images/responsibility/forest-canopy.png"
              alt="Forest canopy with sunlight streaming through leaves"
              width={540}
              height={540}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>

          {/*
            Wildfy arc geometry (viewBox 350×260): radius 125, center
            (190,130), four appointment nodes + connectors. Scales via CSS.
          */}
          <svg
            className="resp-arcs"
            viewBox="0 0 350 260"
            fill="none"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M 162,8 A 125,125 0 1,1 162,252"
              stroke="#F9A01F"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="162" cy="8" r="4.5" fill="#F9A01F" />
            <circle cx="162" cy="252" r="4.5" fill="#F9A01F" />

            <circle cx="262" cy="28" r="7.5" fill="#F9A01F" />
            <circle cx="262" cy="28" r="4.2" fill="#FFFFFF" />
            <line
              x1="272"
              y1="28"
              x2="350"
              y2="28"
              stroke="#F9A01F"
              strokeWidth="2"
            />
            <circle cx="272" cy="28" r="3" fill="#F9A01F" />
            <circle cx="349" cy="28" r="3" fill="#F9A01F" />

            <circle cx="310" cy="96" r="7.5" fill="#F9A01F" />
            <circle cx="310" cy="96" r="4.2" fill="#FFFFFF" />
            <line
              x1="320"
              y1="96"
              x2="350"
              y2="96"
              stroke="#F9A01F"
              strokeWidth="2"
            />
            <circle cx="320" cy="96" r="3" fill="#F9A01F" />
            <circle cx="349" cy="96" r="3" fill="#F9A01F" />

            <circle cx="310" cy="164" r="7.5" fill="#F9A01F" />
            <circle cx="310" cy="164" r="4.2" fill="#FFFFFF" />
            <line
              x1="320"
              y1="164"
              x2="350"
              y2="164"
              stroke="#F9A01F"
              strokeWidth="2"
            />
            <circle cx="320" cy="164" r="3" fill="#F9A01F" />
            <circle cx="349" cy="164" r="3" fill="#F9A01F" />

            <circle cx="262" cy="232" r="7.5" fill="#F9A01F" />
            <circle cx="262" cy="232" r="4.2" fill="#FFFFFF" />
            <line
              x1="272"
              y1="232"
              x2="350"
              y2="232"
              stroke="#F9A01F"
              strokeWidth="2"
            />
            <circle cx="272" cy="232" r="3" fill="#F9A01F" />
            <circle cx="349" cy="232" r="3" fill="#F9A01F" />
          </svg>
        </div>

        <ul className="resp-badges">
          {PRINCIPLES.map((item) => (
            <li className="resp-badge" key={item.title}>
              <img
                className="resp-badge-icon"
                src={item.icon}
                alt=""
                width={92}
                height={92}
                aria-hidden="true"
                draggable={false}
              />
              <span className="resp-badge-text">
                <h3 className="resp-badge-title">{item.title}</h3>
                <p className="resp-badge-copy">{item.copy}</p>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
