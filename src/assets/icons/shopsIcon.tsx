import type React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const ShopsIcon: React.FC<IconProps> = ({ className, ...props }) => (
<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
<g clip-path="url(#clip0_63_101)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M4.97 12.7062C4.67762 12.889 4.5 13.2095 4.5 13.5542V35C4.5 35.5523 4.94772 36 5.5 36H14.5C15.0523 36 15.5 35.5523 15.5 35V22C15.5 21.4477 15.9477 21 16.5 21H25C25.5523 21 26 21.4477 26 22V35C26 35.5523 26.4477 36 27 36H35.5C36.0523 36 36.5 35.5523 36.5 35V13.5542C36.5 13.2095 36.3224 12.889 36.03 12.7062L21.03 3.33125C20.7057 3.12858 20.2943 3.12858 19.97 3.33125L4.97 12.7062Z" stroke="black" stroke-width="3" stroke-linejoin="bevel"/>
</g>
<defs>
<clipPath id="clip0_63_101">
<rect width="40" height="40" fill="white"/>
</clipPath>
</defs>
</svg>




);

export default ShopsIcon;

