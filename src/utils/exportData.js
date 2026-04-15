/**
 * Utility to export data as CSV files for local download.
 * Handles escaping, date formatting, and triggering browser download.
 */

function escapeCSVValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function buildCSV(headers, rows) {
  const headerLine = headers.map(escapeCSVValue).join(',');
  const dataLines = rows.map(row =>
    row.map(escapeCSVValue).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return String(dateStr);
  }
}

/** Export sales data as CSV */
export function exportSalesCSV(sales) {
  const headers = ['Sale ID', 'Date', 'Items Count', 'Payment Method', 'Total (KSH)', 'COGS (KSH)', 'Profit (KSH)'];
  const rows = sales.map(sale => {
    const cogs = sale.cogs ?? sale.total_cost ?? 0;
    const profit = sale.profit ?? sale.gross_profit ?? (sale.total || 0) - cogs;
    return [
      sale.id,
      formatDate(sale.createdAt || sale.created_at),
      sale.items?.length || 0,
      sale.paymentMethod || sale.payment_method || '',
      sale.total || 0,
      cogs,
      profit
    ];
  });
  const csv = buildCSV(headers, rows);
  downloadFile(csv, `sales-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export detailed sales with item breakdown */
export function exportSalesDetailedCSV(sales) {
  const headers = ['Sale ID', 'Date', 'Item Name', 'Quantity', 'Unit Price (KSH)', 'Item Total (KSH)', 'Payment Method', 'Sale Total (KSH)'];
  const rows = [];
  sales.forEach(sale => {
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach(item => {
        rows.push([
          sale.id,
          formatDate(sale.createdAt || sale.created_at),
          item.name || '',
          item.quantity || 0,
          item.price || 0,
          (item.price || 0) * (item.quantity || 0),
          sale.paymentMethod || sale.payment_method || '',
          sale.total || 0
        ]);
      });
    } else {
      rows.push([
        sale.id,
        formatDate(sale.createdAt || sale.created_at),
        'N/A',
        0,
        0,
        0,
        sale.paymentMethod || sale.payment_method || '',
        sale.total || 0
      ]);
    }
  });
  const csv = buildCSV(headers, rows);
  downloadFile(csv, `sales-detailed-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export expenses data as CSV */
export function exportExpensesCSV(expenses) {
  const headers = ['ID', 'Date', 'Description', 'Category', 'Source', 'Amount (KSH)', 'Quantity', 'Unit'];
  const rows = expenses.map(exp => [
    exp.id,
    formatDate(exp.created_at || exp.createdAt),
    exp.description || '',
    exp.category || '',
    exp.source || 'manual',
    exp.amount || 0,
    exp.quantity || '',
    exp.unit || ''
  ]);
  const csv = buildCSV(headers, rows);
  downloadFile(csv, `expenses-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export vendor data as CSV */
export function exportVendorsCSV(vendors) {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Products'];
  const rows = vendors.map(v => [
    v.id,
    v.name || '',
    v.email || '',
    v.phone || '',
    v.address || '',
    v.city || '',
    v.country || '',
    v.products || ''
  ]);
  const csv = buildCSV(headers, rows);
  downloadFile(csv, `vendors-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export analytics/product performance as CSV */
export function exportAnalyticsCSV(productStats, summaryStats) {
  const headers = ['Product Name', 'Quantity Sold', 'Revenue (KSH)', 'Profit (KSH)', 'Times Sold'];
  const rows = productStats.map(p => [
    p.name,
    p.quantity,
    p.revenue,
    p.profit,
    p.count
  ]);
  // Add summary row at the bottom
  rows.push([]);
  rows.push(['--- SUMMARY ---', '', '', '', '']);
  rows.push(['Total Revenue (KSH)', summaryStats.totalRevenue, '', '', '']);
  rows.push(['Total Profit (KSH)', summaryStats.totalProfit, '', '', '']);
  rows.push(['Profit Margin (%)', summaryStats.profitMargin?.toFixed(1), '', '', '']);
  rows.push(['Total Transactions', summaryStats.totalTransactions, '', '', '']);
  rows.push(['Avg Transaction (KSH)', summaryStats.avgTransaction?.toFixed(0), '', '', '']);

  const csv = buildCSV(headers, rows);
  downloadFile(csv, `analytics-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export stock/inventory data as CSV */
export function exportStockCSV(products, ingredientStocks) {
  const headers = ['Name', 'Type', 'Quantity', 'Unit', 'Cost Per Unit (KSH)', 'Selling Price (KSH)', 'Status'];
  const rows = [];

  if (products && products.length > 0) {
    products.forEach(p => {
      rows.push([
        p.name || '',
        'Product',
        p.quantity ?? p.stock ?? '',
        p.unit || 'pcs',
        p.cost_per_unit ?? p.cost ?? '',
        p.price ?? p.selling_price ?? '',
        (p.quantity ?? p.stock ?? 0) <= 0 ? 'Out of Stock' : 'In Stock'
      ]);
    });
  }

  if (ingredientStocks && ingredientStocks.length > 0) {
    ingredientStocks.forEach(m => {
      const qty = Number(m.quantity || 0);
      const reorder = Number(m.reorder_level || 0);
      rows.push([
        m.name || '',
        'Ingredient/Raw Material',
        qty,
        m.unit || 'units',
        m.cost_per_unit ?? '',
        '',
        reorder > 0 && qty <= reorder ? 'Low Stock' : 'In Stock'
      ]);
    });
  }

  const csv = buildCSV(headers, rows);
  downloadFile(csv, `stock-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export credit requests as CSV */
export function exportCreditRequestsCSV(requests) {
  const headers = ['ID', 'Date', 'Customer Name', 'Amount (KSH)', 'Reason', 'Status', 'Cashier', 'Reviewed Date', 'Admin Notes'];
  const rows = requests.map(r => [
    r.id,
    formatDate(r.created_at || r.createdAt),
    r.customer_name || r.customerName || '',
    r.amount || 0,
    r.reason || '',
    r.status || '',
    r.cashier_name || r.cashierName || '',
    formatDate(r.reviewed_at || r.approvalDate || ''),
    r.admin_notes || r.rejectionReason || ''
  ]);
  const csv = buildCSV(headers, rows);
  downloadFile(csv, `credit-requests-${new Date().toISOString().slice(0, 10)}.csv`);
}
