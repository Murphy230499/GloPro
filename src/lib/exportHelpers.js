// Helper for exporting data to CSV, Excel, or preparing print views

export const exportToCSV = (filename, headers, rows) => {
  if (!rows || !rows.length) return;

  const processRow = (row) => {
    return row.map(val => {
      let finalVal = val === null || val === undefined ? '' : String(val);
      if (finalVal.includes('"') || finalVal.includes(',') || finalVal.includes('\n')) {
        finalVal = `"${finalVal.replace(/"/g, '""')}"`;
      }
      return finalVal;
    }).join(',');
  };

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(processRow)
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printReportTable = (title, headers, rows) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; }
          h1 { font-size: 18px; margin-bottom: 5px; color: #0f172a; }
          p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 600; color: #475569; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: right; }
        </style>
      </head>
      <body>
        <h1>GloPro - ${title}</h1>
        <p>Thời gian xuất báo cáo: ${new Date().toLocaleString('vi-VN')}</p>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">Phần mềm quản lý Salon & Spa GloPro</div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
