import { useEffect, useRef } from 'react';

const PAYMENT_LABELS = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
};

export default function Invoice({ sale, businessName, businessLogo, onClose }) {
  const invoiceRef = useRef(null);

  useEffect(() => {
    if (sale && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 300000);
      return () => clearTimeout(timer);
    }
  }, [sale, onClose]);

  if (!sale) return null;

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${sale.receipt_number || sale.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; padding: 40px; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
            .logo { width: 64px; height: 64px; object-fit: contain; border-radius: 12px; border: 1px solid #e5e5e5; }
            .business-info { text-align: right; }
            .business-name { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
            .invoice-title { font-size: 32px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.02em; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #f0f0f0; }
            .meta-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            .meta-value { font-size: 14px; font-weight: 500; color: #1a1a1a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { text-align: left; padding: 12px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #f0f0f0; }
            td { padding: 14px 8px; font-size: 14px; border-bottom: 1px solid #f5f5f5; }
            .text-right { text-align: right; }
            .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
            .totals-table { width: 280px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .totals-row.grand-total { font-size: 18px; font-weight: 700; border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 8px; }
            .payment-info { background: #f8f8f6; border-radius: 12px; padding: 16px; margin-bottom: 32px; }
            .footer { text-align: center; padding-top: 24px; border-top: 1px solid #f0f0f0; color: #888; font-size: 13px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div>
                ${businessLogo ? `<img src="${businessLogo}" class="logo" alt="Logo" />` : ''}
              </div>
              <div class="business-info">
                <div class="business-name">${businessName || 'POSIFY'}</div>
                <div class="invoice-title">INVOICE</div>
              </div>
            </div>
            <div class="meta">
              <div>
                <div class="meta-label">Invoice Number</div>
                <div class="meta-value">INV-${String(sale.receipt_number || sale.id).padStart(6, '0')}</div>
              </div>
              <div>
                <div class="meta-label">Date</div>
                <div class="meta-value">${sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</div>
              </div>
              <div>
                <div class="meta-label">Time</div>
                <div class="meta-value">${sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(sale.items || []).map(item => `
                  <tr>
                    <td>${item.name || item.product_name || 'Item'}</td>
                    <td class="text-right">${item.quantity || 1}</td>
                    <td class="text-right">KSH ${(item.price || 0).toLocaleString()}</td>
                    <td class="text-right">KSH ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totals">
              <div class="totals-table">
                <div class="totals-row">
                  <span>Subtotal</span>
                  <span>KSH ${(sale.total || 0).toLocaleString()}</span>
                </div>
                ${sale.discount_amount > 0 ? `
                <div class="totals-row">
                  <span>Discount</span>
                  <span>-KSH ${sale.discount_amount.toLocaleString()}</span>
                </div>` : ''}
                ${sale.tax_amount > 0 ? `
                <div class="totals-row">
                  <span>Tax</span>
                  <span>KSH ${sale.tax_amount.toLocaleString()}</span>
                </div>` : ''}
                <div class="totals-row grand-total">
                  <span>Total</span>
                  <span>KSH ${(sale.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div class="payment-info">
              <div class="totals-row">
                <span>Payment Method</span>
                <span>${PAYMENT_LABELS[sale.payment_method] || sale.payment_method || 'Cash'}</span>
              </div>
              <div class="totals-row">
                <span>Amount Paid</span>
                <span>KSH ${(sale.amount_paid || 0).toLocaleString()}</span>
              </div>
              ${sale.change > 0 ? `
              <div class="totals-row">
                <span>Change</span>
                <span>KSH ${sale.change.toLocaleString()}</span>
              </div>` : ''}
            </div>
            <div class="footer">
              <p>Thank you for your business.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" ref={invoiceRef}>
        <div className="p-6 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                Print Invoice
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                {businessLogo && <img src={businessLogo} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-gray-200 mb-3" />}
                <h1 className="text-3xl font-bold text-gray-900">{businessName || 'POSIFY'}</h1>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">INVOICE</p>
                <p className="text-sm text-gray-500 mt-1">#{String(sale.receipt_number || sale.id).padStart(6, '0')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Date</p>
                <p className="font-medium">{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Time</p>
                <p className="font-medium">{sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Cashier</p>
                <p className="font-medium">{sale.cashier_name || '-'}</p>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-xs uppercase tracking-wider text-gray-500 font-medium">Item</th>
                  <th className="text-right py-3 text-xs uppercase tracking-wider text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-3 text-xs uppercase tracking-wider text-gray-500 font-medium">Price</th>
                  <th className="text-right py-3 text-xs uppercase tracking-wider text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 text-sm">{item.name || item.product_name || 'Item'}</td>
                    <td className="py-3 text-sm text-right">{item.quantity || 1}</td>
                    <td className="py-3 text-sm text-right">KSH {(item.price || 0).toLocaleString()}</td>
                    <td className="py-3 text-sm text-right font-medium">KSH {((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">KSH {(sale.total || 0).toLocaleString()}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-red-600">-KSH {sale.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                {sale.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">KSH {sale.tax_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-2">
                  <span>Total</span>
                  <span>KSH {(sale.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">{PAYMENT_LABELS[sale.payment_method] || sale.payment_method || 'Cash'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium">KSH {(sale.amount_paid || 0).toLocaleString()}</span>
              </div>
              {sale.change > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Change</span>
                  <span className="font-medium">KSH {sale.change.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
              Thank you for your business.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
