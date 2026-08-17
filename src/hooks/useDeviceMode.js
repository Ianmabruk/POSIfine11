import { useEffect, useState } from 'react';

const DEVICE_STORAGE_KEY = 'posify_device_mode';

export const getDeviceMode = () => {
  try {
    return localStorage.getItem(DEVICE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setDeviceMode = (mode) => {
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
};

const detectDeviceMode = () => {
  if (typeof navigator === 'undefined') {
    return 'desktop';
  }

  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isAndroid = /android/i.test(ua);
  const isIPhone = /iPhone|iPod/i.test(ua);
  const isIPad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isTablet = isIPad || /Tablet|PlayBook|Silk|(Kindle)|(Nook)/i.test(ua);
  const isPhone = isAndroid || isIPhone || (/Mobile|Windows Phone|Lumia|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(ua) && !isTablet);

  if (isPhone) {
    return 'phone';
  }

  if (isTablet) {
    return 'tablet';
  }

  return 'desktop';
};

export const useDeviceMode = () => {
  const [deviceMode, setDeviceMode] = useState(() => {
    if (typeof window === 'undefined') {
      return 'desktop';
    }
    return detectDeviceMode();
  });

  useEffect(() => {
    let mounted = true;
    const handler = () => {
      if (mounted) {
        setDeviceMode(detectDeviceMode());
      }
    };
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      mounted = false;
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  return deviceMode;
};

export { useDeviceMode, getDeviceMode, setDeviceMode };
export default useDeviceMode;
