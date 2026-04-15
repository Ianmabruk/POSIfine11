import { Navigate } from 'react-router-dom';

const WW_SESSION_KEY = 'ww_session';

export function getWWSession() {
  try {
    const s = localStorage.getItem(WW_SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function clearWWSession() {
  localStorage.removeItem(WW_SESSION_KEY);
}

export default function WWProtectedRoute({ children }) {
  const session = getWWSession();
  if (!session) return <Navigate to="/windatawind" replace />;
  return children;
}
