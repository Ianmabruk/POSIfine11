import { useState, useEffect, useRef } from 'react';

export default function ScaleContainer({ children, minWidth = 1200, className = '' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.min(1, window.innerWidth / minWidth);
    }
    return 1;
  });

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const viewportWidth = window.innerWidth;
        if (viewportWidth < minWidth) {
          const newScale = viewportWidth / minWidth;
          setScale(newScale);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [minWidth]);

  const containerStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    width: `${minWidth}px`,
    marginLeft: scale < 1 ? `calc((100vw - ${minWidth}px * ${scale}) / 2)` : 'auto',
    marginRight: scale < 1 ? `calc((100vw - ${minWidth}px * ${scale}) / 2)` : 'auto',
  };

  return (
    <div 
      ref={containerRef}
      className={className}
      style={containerStyle}
    >
      {children}
    </div>
  );
}
