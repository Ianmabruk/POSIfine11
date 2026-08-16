import { useState, useEffect } from 'react';
import CashierPOS from './CashierPOS';
import MobileCashier from './MobileCashier';

export default function CashierPOSResponsive() {
  const [isMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  if (isMobile) {
    return <MobileCashier />;
  }

  return <CashierPOS />;
}
