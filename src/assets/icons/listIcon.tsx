import type React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const ListIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <rect x="3" y="4" width="18" height="3" rx="1" fill="currentColor" />
    <rect x="3" y="10.5" width="18" height="3" rx="1" fill="currentColor" />
    <rect x="3" y="17" width="18" height="3" rx="1" fill="currentColor" />
  </svg>
);

export default ListIcon;
