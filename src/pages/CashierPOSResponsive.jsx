import { useScreenMode } from '../context/ScreenModeContext';
import CashierPOS from './CashierPOS';
import MobileCashier from './MobileCashier';

export default function CashierPOSResponsive() {
  const { screenMode, loading } = useScreenMode();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (screenMode === 'phone') {
    return <MobileCashier />;
  }

  return <CashierPOS />;
}
