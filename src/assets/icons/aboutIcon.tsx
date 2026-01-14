import type React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const AboutIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>About Icon</title>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export default AboutIcon;

