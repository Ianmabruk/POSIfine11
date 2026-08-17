import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDeviceMode, getDeviceMode, setDeviceMode } from '../hooks/useDeviceMode';

const ScreenModeContext = createContext();

export const useScreenMode = () => useContext(ScreenModeContext);

export const ScreenModeProvider = ({ children }) => {
  const deviceMode = useDeviceMode();
  const [screenMode, setScreenMode] = useState(() => {
    try {
      const cached = localStorage.getItem('screenMode');
      if (cached) return cached;
      const device = getDeviceMode();
      if (device) {
        localStorage.setItem('screenMode', device);
        return device;
      }
      return 'desktop';
    } catch {
      return 'desktop';
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (mounted) setLoading(false);
          return;
        }
        const res = await fetch(`${import.meta.env.VITE_API_BASE || 'https://posifine22.onrender.com/api'}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const cached = localStorage.getItem('screenMode');
          const mode = data?.screenMode || cached || deviceMode || 'desktop';
          if (mounted) {
            setScreenMode(mode);
            if (!cached) {
              localStorage.setItem('screenMode', mode);
            }
          }
        }
      } catch {
        // use cached
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [deviceMode]);

  const updateScreenMode = useCallback(async (mode) => {
    setScreenMode(mode);
    localStorage.setItem('screenMode', mode);
    setDeviceMode(mode);
  }, []);

  return (
    <ScreenModeContext.Provider value={{ screenMode, setScreenMode: updateScreenMode, loading }}>
      {children}
    </ScreenModeContext.Provider>
  );
};
