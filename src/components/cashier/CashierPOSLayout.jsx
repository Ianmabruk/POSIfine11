import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HeaderStats = ({ label, value, meta, metaSecondary, valueClass }) => (
  <div className="text-left sm:text-right">
    <p className="text-sm text-slate-500">{label}</p>
    <p className={`text-2xl font-bold ${valueClass || 'text-emerald-600'}`}>{value}</p>
    {meta && <p className="text-xs text-slate-400">{meta}</p>}
    {metaSecondary && (
      <div className="mt-1 text-xs text-slate-400">{metaSecondary}</div>
    )}
  </div>
);

export default function CashierPOSLayout({
  title,
  subtitle,
  icon: Icon,
  theme,
  stats,
  errorMessage,
  alert,
  topSections,
  children,
  footer,
  headerRight,
  onLogout
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
      return;
    }
    logout();
    navigate('/auth/login');
  }, [logout, navigate, onLogout]);

  return (
    <div className={theme?.pageBg || 'min-h-screen bg-slate-50'}>
      <header className={theme?.headerBg || 'bg-white/90 backdrop-blur border-b border-slate-200'}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={theme?.iconWrap || 'w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white shadow'}>
              {Icon ? <Icon size={24} className={theme?.iconClass} /> : null}
            </div>
            <div>
              <h1 className={theme?.titleClass || 'text-2xl font-bold text-slate-900'}>{title}</h1>
              {subtitle && <p className={theme?.subtitleClass || 'text-slate-500 text-sm'}>{subtitle}</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
            {stats && (
              <HeaderStats
                label={stats.label}
                value={stats.value}
                meta={stats.meta}
                metaSecondary={stats.metaSecondary}
                valueClass={stats.valueClass}
              />
            )}
            {headerRight}
            <button
              onClick={handleLogout}
              className={theme?.logoutClass || 'flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-3 sm:py-2 min-h-[44px] rounded-lg text-white transition text-sm sm:text-base touch-manipulation w-full sm:w-auto'}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
        {errorMessage && (
          <div className="max-w-7xl mx-auto px-4 pb-3 text-xs text-amber-600">{errorMessage}</div>
        )}
      </header>

      {alert && (
        <div className={theme?.alertWrap || 'bg-amber-50 border-b border-amber-200'}>
          <div className="max-w-7xl mx-auto px-4 py-3">{alert}</div>
        </div>
      )}

      {topSections && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">{topSections}</div>
        </div>
      )}

      <main className={theme?.mainBg || 'bg-white'}>{children}</main>

      {footer && (
        <footer className={theme?.footerBg || 'bg-slate-900 text-white py-3 text-center'}>
          <div className="max-w-7xl mx-auto px-4">{footer}</div>
        </footer>
      )}
    </div>
  );
}
