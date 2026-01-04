import { useAuth } from '../context/AuthContext';

export default function DebugUser() {
  const { user, loading } = useAuth();
  
  // Only show in development
  if (import.meta.env.PROD) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <div className="space-y-1">
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
        {user && (
          <>
            <p>Email: {user?.email || 'N/A'}</p>
            <p>Role: {user?.role || 'N/A'}</p>
            <p>Plan: {user?.plan || 'N/A'}</p>
            <p>Active: {user?.active ? 'Yes' : 'No'}</p>
            <p>Price: {user?.price || 'N/A'}</p>
          </>
        )}
      </div>
    </div>
  );
}