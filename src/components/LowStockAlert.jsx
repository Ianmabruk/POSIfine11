import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { products as productsAPI } from '../services/api';

export default function LowStockAlert() {
  const [warnings, setWarnings] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  // Fetch low-stock warnings on mount and periodically
  useEffect(() => {
    const fetchWarnings = async () => {
      try {
        const result = await productsAPI.getLowStockWarnings?.();
        if (Array.isArray(result)) {
          setWarnings(result);
        } else if (result?.warnings) {
          setWarnings(result.warnings);
        }
      } catch (error) {
        console.warn('Failed to fetch low-stock warnings:', error);
      }
    };

    fetchWarnings();
    const interval = setInterval(fetchWarnings, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getWarningId = (warning) => warning.id ?? warning.productId ?? warning.product_id;
  const visibleWarnings = warnings.filter(w => !dismissed.includes(getWarningId(w)));

  if (visibleWarnings.length === 0) {
    return null;
  }

  const handleDismiss = (id) => {
    setDismissed([...dismissed, id]);
  };

  return (
    <div className="fixed top-24 right-6 max-w-md space-y-2 z-40">
      {visibleWarnings.map(warning => {
        const warningId = getWarningId(warning);
        const name = warning.name || warning.productName || warning.product_name || 'Unknown';
        const quantity = warning.quantity ?? warning.currentStock ?? warning.current ?? 0;
        const unit = warning.unit || 'pcs';
        const threshold = warning.threshold ?? warning.reorder_level ?? 0;

        return (
        <div
          key={warningId}
          className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">⚠️ Stock Warning</h3>
                <p className="text-sm text-red-800 mt-1">
                  <strong>{name}</strong>: {quantity}{unit} remaining
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  Threshold: {threshold}{unit}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(warningId)}
              className="text-red-600 hover:text-red-900 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      );})}
    </div>
  );
}
