import { useDeviceMode } from '../context/DeviceModeContext';
import CashierPOS from './CashierPOS';
import MobileCashier from './MobileCashier';

export default function CashierPOSResponsive() {
  const { getEffectiveDeviceMode } = useDeviceMode();
  const deviceMode = getEffectiveDeviceMode();

  if (deviceMode === 'mobile') {
    return <MobileCashier />;
  }

  return <CashierPOS />;
}
