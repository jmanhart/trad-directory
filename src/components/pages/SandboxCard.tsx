import styles from "./SandboxCard.module.css";

interface SandboxCardProps {
  title: string;
  description: string;
}

export default function SandboxCard({ title, description }: SandboxCardProps) {
  return (
    <div className={styles.card}>
      {/* Extrusion frame - maintains fixed aspect ratio */}
      <svg
        className={styles.cardFrame}
        viewBox="0 0 320 120"
        preserveAspectRatio="xMidYMin meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* bottom face */}
        <path
          d="M12 104 L308 104 L296 116 L0 116 Z"
          fill="var(--card-bottom)"
          stroke="var(--card-stroke)"
          strokeWidth="var(--card-stroke-width, 2)"
          strokeLinejoin="bevel"
        />

        {/* left face */}
        <path
          d="M0 12 L12 0 L12 104 L0 116 Z"
          fill="var(--card-side)"
          stroke="var(--card-stroke)"
          strokeWidth="var(--card-stroke-width, 2)"
          strokeLinejoin="bevel"
        />

        {/* front face base (top portion) */}
        <rect
          x="12"
          y="0"
          width="296"
          height="104"
          fill="var(--card-face)"
          stroke="var(--card-stroke)"
          strokeWidth="var(--card-stroke-width, 2)"
          strokeLinejoin="bevel"
        />
      </svg>
      
      {/* Extendable front face background */}
      <div className={styles.frontFace}></div>
      
      <div className={styles.cardContent}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}

