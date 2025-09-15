
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div aria-label="Application Logo">
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="90" cy="90" r="88" fill="white" stroke="#E2E8F0" strokeWidth="4"/>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" 
              fontFamily="sans-serif" fontSize="36" fontWeight="bold" fill="#475569">
          LOGO
        </text>
      </svg>
    </div>
  );
};

export default Logo;
