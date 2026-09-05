import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

const riderUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

export default function RiderGuard({ children }) {
  const user = riderUser();
  const token = localStorage.getItem('token');
  if (!token || user?.role !== 'rider') {
    return <Navigate to="/rider/login" replace />;
  }
  return children || <Outlet />;
}

export const useRiderSession = () => {
  const [user, setUser] = useState(riderUser);
  const token = localStorage.getItem('token');
  useEffect(() => {
    const handler = () => setUser(riderUser());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  return { user, token, logout };
};

function logout() {
  localStorage.removeItem('token'); localStorage.removeItem('riderToken'); localStorage.removeItem('user');
  window.location.href = '/rider/login';
}
