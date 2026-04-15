import { useState, useEffect } from 'react';

/**
 * LogoPreloader - Shows the business logo as a loading/preloader animation.
 * Falls back to a standard spinner if no logo is set.
 */
export default function LogoPreloader({ size = 'md', text = '' }) {
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem('appLogo');
    if (cached) setLogo(cached);

    const handleSettingsChange = (e) => {
      const newLogo = e.detail?.logo;
      if (newLogo) setLogo(newLogo);
    };
    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  const sizes = {
    sm: { img: 'w-10 h-10', ring: 'w-14 h-14', text: 'text-sm' },
    md: { img: 'w-16 h-16', ring: 'w-20 h-20', text: 'text-base' },
    lg: { img: 'w-24 h-24', ring: 'w-32 h-32', text: 'text-lg' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        {logo ? (
          <div className="relative flex items-center justify-center">
            <div className={`absolute ${s.ring} rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin`} />
            <img
              src={logo}
              alt="Loading"
              className={`${s.img} rounded-full object-contain relative z-10`}
            />
          </div>
        ) : (
          <div className={`animate-spin rounded-full ${s.ring} border-4 border-blue-200 border-t-blue-600`} />
        )}
        {text && <p className={`${s.text} text-gray-500 animate-pulse`}>{text}</p>}
      </div>
    </div>
  );
}
