import type React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const GlobeIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <g clipPath="url(#clip0_globe)">
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="3" />
      <path
        d="M20 5C15 5 10.5 7.5 8 11.5C8 11.5 8 15 10 17C12 19 15 20 20 20C25 20 28 19 30 17C32 15 32 11.5 32 11.5C29.5 7.5 25 5 20 5Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M20 20C20 25 17.5 29.5 15 32C15 32 18.5 32 20 30C21.5 28 22 25 22 20C22 15 21.5 12 20 10C18.5 8 15 8 15 8C17.5 10.5 20 15 20 20Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M20 20C20 15 22.5 10.5 25 8C25 8 21.5 8 20 10C18.5 12 18 15 18 20C18 25 18.5 28 20 30C21.5 32 25 32 25 32C22.5 29.5 20 25 20 20Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8 11.5C8 11.5 8 15 10 17C12 19 15 20 20 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M32 11.5C32 11.5 32 15 30 17C28 19 25 20 20 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_globe">
        <rect width="40" height="40" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default GlobeIcon;
