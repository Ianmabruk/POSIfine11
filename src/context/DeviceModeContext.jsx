import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DeviceModeContext = createContext();

export const TEMP_DEVICE_MODE_KEY = 'posify_temp_device_mode';

export const useDeviceMode = () => useContext(DeviceModeContext);

export const DeviceModeProvider = ({ children }) => {
  const [tempDeviceMode, setTempDeviceModeState] = useState(() => {
    try {
      return localStorage.getItem(TEMP_DEVICE_MODE_KEY);
    } catch {
      return null;
    }
  });

  const [persistedDeviceMode, setPersistedDeviceMode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const setTempDeviceMode = useCallback((mode) => {
    setTempDeviceModeState(mode);
    try {
      if (mode) {
        localStorage.setItem(TEMP_DEVICE_MODE_KEY, mode);
      } else {
        localStorage.removeItem(TEMP_DEVICE_MODE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const clearTempDeviceMode = useCallback(() => {
    setTempDeviceModeState(null);
    try {
      localStorage.removeItem(TEMP_DEVICE_MODE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const getEffectiveDeviceMode = useCallback((user) => {
    if (user?.deviceMode) return user.deviceMode;
    if (persistedDeviceMode) return persistedDeviceMode;
    return tempDeviceMode || 'desktop';
  }, [persistedDeviceMode, tempDeviceMode]);

  useEffect(() => {
    const stored = localStorage.getItem(TEMP_DEVICE_MODE_KEY);
    if (stored) {
      setTempDeviceModeState(stored);
    }
    setIsLoading(false);
  }, []);

  return (
    <DeviceModeContext.Provider value={{
      tempDeviceMode,
      setTempDeviceMode,
      clearTempDeviceMode,
      persistedDeviceMode,
      setPersistedDeviceMode,
      getEffectiveDeviceMode,
      isLoading,
    }}>
      {children}
    </DeviceModeContext.Provider>
  );
};
