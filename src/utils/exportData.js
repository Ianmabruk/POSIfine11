/**
 * Utility to export data as CSV and HTML report files for local download.
 * Includes business branding (name, logo) in exports.
 * Handles escaping, date formatting, and triggering browser download.
 */

/** Get business info from localStorage/user for branding exports */
function getBusinessInfo() {
  const logo = localStorage.getItem('appLogo') || '';
  let businessName = '';
  let email = '';
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    businessName = user.businessName || user.business_name || user.name || '';
    email = user.email || '';
  } catch { /* ignore */ }
  return { logo, businessName, email };
}

function escapeCSVValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function buildCSV(headers, rows, reportTitle = '') {
  const { businessName, email } = getBusinessInfo();
  const lines = [];
  // Business header
  if (businessName) lines.push(escapeCSVValue(`Business: ${businessName}`));
  if (email) lines.push(escapeCSVValue(`Email: ${email}`));
  if (reportTitle) lines.push(escapeCSVValue(`Report: ${reportTitle}`));
  lines.push(escapeCSVValue(`Generated: ${new Date().toLocaleString()}`));
  lines.push(''); // blank line before data
  // Data
  lines.push(headers.map(escapeCSVValue).join(','));
  rows.forEach(row => lines.push(row.map(escapeCSVValue).join(',')));
  return lines.join('\n');
}

/** Build a branded HTML report with logo, table, and print support */
function buildHTMLReport(title, headers, rows, summaryHTML = '') {
  const { logo, businessName, email } = getBusinessInfo();
  const logoTag = logo ? `<img src="${logo}" style="max-height:80px;max-width:200px;object-fit:contain;" alt="Logo" />` : '';
  const tableRows = rows.map(row =>
    '<tr>' + row.map(cell => `<td style="border:1px solid #ddd;padding:8px 12px;font-size:13px;">${cell ?? ''}</td>`).join('') + '</tr>'
  ).join('\n');
  const headerCells = headers.map(h => `<th style="border:1px solid #ccc;padding:8px 12px;background:#f5f5f5;font-size:13px;text-align:left;">${h}</th>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:Arial,sans-serif;margin:20px;color:#333}
  .header{display:flex;align-items:center;gap:20px;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #2563eb}
  .header h1{margin:0;font-size:22px;color:#1e293b}
  .header p{margin:2px 0;font-size:13px;color:#64748b}
  table{border-collapse:collapse;width:100%;margin-top:10px}
  .summary{margin-top:20px;padding:15px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}
  @media print{body{margin:0}.no-print{display:none}}
</style></head><body>
<div class="header">
  ${logoTag}
  <div>
    <h1>${businessName || 'Business Report'}</h1>
    ${email ? `<p>${email}</p>` : ''}
    <p>${title} &mdash; ${new Date().toLocaleDateString()}</p>
  </div>
</div>
<button class="no-print" onclick="window.print()" style="margin-bottom:15px;padding:8px 20px;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px">Print / Save as PDF</button>
<table><thead><tr>${headerCells}</tr></thead><tbody>${tableRows}</tbody></table>
${summaryHTML}
</body></html>`;
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
  const headers = ['Sale ID', 'Date', 'Items Count', 'Items', 'Payment Method', 'Cashier', 'Total (KSH)', 'COGS (KSH)', 'Profit (KSH)'];
  const rows = sales.map(sale => {
    const cogs = sale.cogs ?? sale.total_cost ?? 0;
    const profit = sale.profit ?? sale.gross_profit ?? (sale.total || 0) - cogs;
    const itemNames = (sale.items || []).map(i => i.name || 'Unknown').join('; ');
    return [
      sale.id,
      formatDate(sale.createdAt || sale.created_at),
      sale.items?.length || 0,
      itemNames,
      sale.paymentMethod || sale.payment_method || '',
      sale.cashier_name || sale.cashierName || '',
      sale.total || 0,
      cogs,
      profit
    ];
  });
  const csv = buildCSV(headers, rows, 'Sales Report');
  downloadFile(csv, `sales-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export sales as branded HTML report with logo */
export function exportSalesHTML(sales) {
  const headers = ['Sale ID', 'Date', 'Items', 'Payment', 'Cashier', 'Total (KSH)', 'COGS (KSH)', 'Profit (KSH)'];
  const totalSales = sales.reduce((s, sale) => s + (sale.total || 0), 0);
  const totalCOGS = sales.reduce((s, sale) => s + (sale.cogs ?? sale.total_cost ?? 0), 0);
  const totalProfit = totalSales - totalCOGS;
  const rows = sales.map(sale => {
    const cogs = sale.cogs ?? sale.total_cost ?? 0;
    const profit = sale.profit ?? sale.gross_profit ?? (sale.total || 0) - cogs;
    const itemNames = (sale.items || []).map(i => `${i.name || 'Unknown'} x${i.quantity || 1}`).join(', ');
    return [
      sale.id,
      formatDate(sale.createdAt || sale.created_at),
      itemNames,
      sale.paymentMethod || sale.payment_method || '',
      sale.cashier_name || sale.cashierName || '',
      `KSH ${(sale.total || 0).toLocaleString()}`,
      `KSH ${cogs.toLocaleString()}`,
      `KSH ${profit.toLocaleString()}`
    ];
  });
  const summary = `<div class="summary"><h3>Summary</h3><p><strong>Total Sales:</strong> KSH ${totalSales.toLocaleString()} | <strong>Total COGS:</strong> KSH ${totalCOGS.toLocaleString()} | <strong>Net Profit:</strong> KSH ${totalProfit.toLocaleString()} | <strong>Transactions:</strong> ${sales.length}</p></div>`;
  const html = buildHTMLReport('Sales Report', headers, rows, summary);
  downloadFile(html, `sales-report-${new Date().toISOString().slice(0, 10)}.html`, 'text/html');
}

/** Export detailed sales with item breakdown */
export function exportSalesDetailedCSV(sales) {
  const headers = ['Sale ID', 'Date', 'Item Name', 'Quantity', 'Unit Price (KSH)', 'Item Total (KSH)', 'Payment Method', 'Cashier', 'Sale Total (KSH)'];
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
          sale.cashier_name || sale.cashierName || '',
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
        sale.cashier_name || sale.cashierName || '',
        sale.total || 0
      ]);
    }
  });
  const csv = buildCSV(headers, rows, 'Detailed Sales Report');
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
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  rows.push([]);
  rows.push(['--- TOTAL ---', '', '', '', '', totalExpenses, '', '']);
  const csv = buildCSV(headers, rows, 'Expenses Report');
  downloadFile(csv, `expenses-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export expenses as branded HTML report */
export function exportExpensesHTML(expenses) {
  const headers = ['ID', 'Date', 'Description', 'Category', 'Source', 'Amount (KSH)', 'Quantity', 'Unit'];
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const rows = expenses.map(exp => [
    exp.id,
    formatDate(exp.created_at || exp.createdAt),
    exp.description || '',
    exp.category || '',
    exp.source || 'manual',
    `KSH ${(exp.amount || 0).toLocaleString()}`,
    exp.quantity || '',
    exp.unit || ''
  ]);
  const summary = `<div class="summary"><h3>Summary</h3><p><strong>Total Expenses:</strong> KSH ${totalExpenses.toLocaleString()} | <strong>Total Items:</strong> ${expenses.length}</p></div>`;
  const html = buildHTMLReport('Expenses Report', headers, rows, summary);
  downloadFile(html, `expenses-report-${new Date().toISOString().slice(0, 10)}.html`, 'text/html');
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
  const csv = buildCSV(headers, rows, 'Vendors Report');
  downloadFile(csv, `vendors-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export vendors as branded HTML report */
export function exportVendorsHTML(vendors) {
  const headers = ['Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Products'];
  const rows = vendors.map(v => [
    v.name || '',
    v.email || '',
    v.phone || '',
    v.address || '',
    v.city || '',
    v.country || '',
    v.products || ''
  ]);
  const html = buildHTMLReport('Vendors Report', headers, rows, `<div class="summary"><p><strong>Total Vendors:</strong> ${vendors.length}</p></div>`);
  downloadFile(html, `vendors-report-${new Date().toISOString().slice(0, 10)}.html`, 'text/html');
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

  const csv = buildCSV(headers, rows, 'Analytics Report');
  downloadFile(csv, `analytics-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export analytics as branded HTML report */
export function exportAnalyticsHTML(productStats, summaryStats) {
  const headers = ['Product Name', 'Quantity Sold', 'Revenue (KSH)', 'Profit (KSH)', 'Times Sold'];
  const rows = productStats.map(p => [
    p.name,
    p.quantity,
    `KSH ${(p.revenue || 0).toLocaleString()}`,
    `KSH ${(p.profit || 0).toLocaleString()}`,
    p.count
  ]);
  const summary = `<div class="summary"><h3>Summary</h3>
    <p><strong>Total Revenue:</strong> KSH ${(summaryStats.totalRevenue || 0).toLocaleString()}</p>
    <p><strong>Total Profit:</strong> KSH ${(summaryStats.totalProfit || 0).toLocaleString()}</p>
    <p><strong>Profit Margin:</strong> ${(summaryStats.profitMargin || 0).toFixed(1)}%</p>
    <p><strong>Total Transactions:</strong> ${summaryStats.totalTransactions || 0}</p>
    <p><strong>Average Transaction:</strong> KSH ${(summaryStats.avgTransaction || 0).toFixed(0)}</p>
  </div>`;
  const html = buildHTMLReport('Analytics Report', headers, rows, summary);
  downloadFile(html, `analytics-report-${new Date().toISOString().slice(0, 10)}.html`, 'text/html');
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

  const csv = buildCSV(headers, rows, 'Stock & Inventory Report');
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
  const csv = buildCSV(headers, rows, 'Credit Requests Report');
  downloadFile(csv, `credit-requests-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export credit requests as branded HTML report */
export function exportCreditRequestsHTML(requests) {
  const headers = ['Date', 'Customer', 'Amount (KSH)', 'Reason', 'Status', 'Cashier', 'Admin Notes'];
  const rows = requests.map(r => [
    formatDate(r.created_at || r.createdAt),
    r.customer_name || r.customerName || '',
    `KSH ${(r.amount || 0).toLocaleString()}`,
    r.reason || '',
    r.status || '',
    r.cashier_name || r.cashierName || '',
    r.admin_notes || r.rejectionReason || ''
  ]);
  const total = requests.reduce((s, r) => s + (r.amount || 0), 0);
  const pending = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;
  const summary = `<div class="summary"><h3>Summary</h3><p><strong>Total Amount:</strong> KSH ${total.toLocaleString()} | <strong>Pending:</strong> ${pending} | <strong>Approved:</strong> ${approved} | <strong>Rejected:</strong> ${rejected}</p></div>`;
  const html = buildHTMLReport('Credit Requests Report', headers, rows, summary);
  downloadFile(html, `credit-requests-report-${new Date().toISOString().slice(0, 10)}.html`, 'text/html');
}
