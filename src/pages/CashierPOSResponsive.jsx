import { useDeviceMode } from '../context/DeviceModeContext';
import { lazy, Suspense } from 'react';

const CashierPOS = lazy(() => import('./CashierPOS'));
const MobileCashier = lazy(() => import('./MobileCashier'));

export default function CashierPOSResponsive() {
  const { getEffectiveDeviceMode } = useDeviceMode();
  const deviceMode = getEffectiveDeviceMode();

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading POS...</div>}>
      {deviceMode === 'mobile' ? <MobileCashier /> : <CashierPOS />}
    </Suspense>
  );
}
