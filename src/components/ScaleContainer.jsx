import { useState, useEffect, useRef } from 'react';

export default function ScaleContainer({ children, minWidth = 1200, className = '' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

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

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        width: `${minWidth}px`,
        marginLeft: scale < 1 ? `calc((100vw - ${minWidth}px * ${scale}) / 2)` : 'auto',
        marginRight: scale < 1 ? `calc((100vw - ${minWidth}px * ${scale}) / 2)` : 'auto',
      }}
    >
      {children}
    </div>
  );
}
