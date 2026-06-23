import React from 'react';

const PosifyLogo = ({ className = "w-8 h-8", showText = true, textClassName = "text-lg font-bold" }) => {
  return (
    <div className={`flex items-center gap-2 ${className.includes('flex') ? '' : 'inline-flex'}`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7A18" />
            <stop offset="50%" stopColor="#FF9500" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>
          <linearGradient id="logoGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#16213e" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <path
          d="M20 2L36 11V29L20 38L4 29V11L20 2Z"
          fill="url(#logoGradientDark)"
          stroke="url(#logoGradient)"
          strokeWidth="2"
        />
        
        <g filter="url(#glow)">
          <circle cx="20" cy="20" r="4" fill="url(#logoGradient)" />
          
          <line x1="20" y1="20" x2="12" y2="10" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.8" />
          <line x1="20" y1="20" x2="28" y2="10" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.8" />
          <line x1="20" y1="20" x2="32" y2="20" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.8" />
          <line x1="20" y1="20" x2="28" y2="30" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.8" />
          <line x1="20" y1="20" x2="12" y2="30" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.8" />
          <line x1="20" y1="20" x2="8" y2="20" stroke="url(#logoGradient)" strokeWidth="1.5" opacity="0.8" />
          
          <circle cx="12" cy="10" r="2.5" fill="white" />
          <circle cx="28" cy="10" r="2.5" fill="white" />
          <circle cx="32" cy="20" r="2.5" fill="white" />
          <circle cx="28" cy="30" r="2.5" fill="white" />
          <circle cx="12" cy="30" r="2.5" fill="white" />
          <circle cx="8" cy="20" r="2.5" fill="white" />
        </g>
        
        <circle cx="20" cy="20" r="1.5" fill="white" />
      </svg>
      
      {showText && (
        <span className={`${textClassName} text-slate-900 tracking-tight`}>
          POSIFY
        </span>
      )}
    </div>
  );
};

export default PosifyLogo;
