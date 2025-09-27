import React from 'react';

const Logo: React.FC = () => {
  return (
    <svg 
      viewBox="0 0 320 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="h-16 w-auto sm:h-20"
      aria-label="SISTEMA CLIP LIB Logo"
    >
      {/* Icon Part */}
      <g transform="translate(4, 4)">
        {/* Main shape 'A' */}
        <path d="M20 40 L0 0 L14 0 L24.5 21 L35 0 L49 0 L29 40 Z" fill="#2563EB"/>
        {/* Inner shape (graph/document) */}
        <path d="M20 40 L24.5 21 L29 40 Z" fill="#60A5FA"/>
      </g>
      
      {/* Text Part */}
      <text x="56" y="32" fontFamily="Inter, sans-serif" fontSize="28" fontWeight="bold" fill="#1E293B">
        SISTEMA CLIP LIB
      </text>
    </svg>
  );
};

export default Logo;
