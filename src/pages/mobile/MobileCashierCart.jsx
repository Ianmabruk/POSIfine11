import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileCashier from '../MobileCashier';

export default function MobileCashierCart() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/mobile/cashier', { replace: true });
  }, [navigate]);

  return null;
}

