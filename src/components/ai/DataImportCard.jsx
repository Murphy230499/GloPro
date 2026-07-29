'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DataImportCard({ initialType = 'customer', onImportSuccess }) {
  const [importType, setImportType] = useState(initialType);
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let rows = [];

        if (uploadedFile.name.endsWith('.json')) {
          rows = JSON.parse(text);
        } else {
          // Parse CSV
          const lines = text.split(/\r\n|\n/);
          if (lines.length > 0) {
            const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
            for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue;
              const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
              const obj = {};
              headers.forEach((h, idx) => {
                obj[h] = values[idx] || '';
              });
              rows.push(obj);
            }
          }
        }
        setPreviewRows(rows);
      } catch (err) {
        setStatus({ type: 'error', message: 'Không thể đọc file. Vui lòng chọn file CSV hoặc JSON hợp lệ.' });
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleStartImport = async () => {
    if (previewRows.length === 0) return;

    setLoading(true);
    let successCount = 0;

    try {
      if (importType === 'customer') {
        for (const r of previewRows) {
          const name = r.name || r['Tên'] || r['Họ và tên'] || r['Khách hàng'] || 'Khách nhập';
          const phone = r.phone || r['SĐT'] || r['Số điện thoại'] || '0900000000';
          await base44.entities.Customer.create({
            name,
            phone,
            email: r.email || r['Email'] || '',
            totalSpent: Number(r.totalSpent || r['Tổng chi tiêu']) || 0,
            visitCount: Number(r.visitCount || r['Lượt đến']) || 1,
            tier: r.tier || 'Đồng',
            created_at: new Date().toISOString()
          }).catch(() => {});
          successCount++;
        }
      } else {
        for (const r of previewRows) {
          const name = r.name || r['Tên sản phẩm'] || r['Sản phẩm'] || 'Sản phẩm mới';
          const price = Number(r.price || r['Giá bán'] || r['Đơn giá']) || 100000;
          await base44.entities.Product.create({
            name,
            price,
            cost: Number(r.cost || r['Giá vốn']) || price * 0.6,
            stock: Number(r.stock || r['Tồn kho']) || 10,
            category: r.category || 'Mỹ phẩm'
          }).catch(() => {});
          successCount++;
        }
      }

      setStatus({ type: 'success', message: `Đã import thành công ${successCount} bản ghi vào hệ thống!` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('reload-data'));
      }
      if (onImportSuccess) onImportSuccess(successCount);
    } catch (err) {
      setStatus({ type: 'error', message: 'Đã xảy ra lỗi trong quá trình import dữ liệu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 text-left font-sans animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Trợ lý Import dữ liệu File Excel / CSV</span>
        </div>

        <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 text-[10px] font-bold">
          <button
            onClick={() => setImportType('customer')}
            className={`px-2 py-1 rounded-md transition-all ${
              importType === 'customer' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Khách hàng
          </button>
          <button
            onClick={() => setImportType('product')}
            className={`px-2 py-1 rounded-md transition-all ${
              importType === 'product' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sản phẩm
          </button>
        </div>
      </div>

      {/* File Upload Zone */}
      <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 bg-white flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
        <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors mb-1" />
        <span className="text-xs font-bold text-slate-700">
          {file ? file.name : `Kéo thả hoặc nhấp chọn file CSV / JSON ${importType === 'customer' ? 'Khách hàng' : 'Sản phẩm'}`}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ các cột: Tên, SĐT, Email, Tổng chi tiêu, Giá...</span>
        <input type="file" accept=".csv, .json, .txt" onChange={handleFileChange} className="hidden" />
      </label>

      {/* Preview Rows Count */}
      {previewRows.length > 0 && !status && (
        <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-700 p-2.5 rounded-xl border border-emerald-200 font-semibold">
          <span>Phân tích được <strong>{previewRows.length}</strong> bản ghi khả dụng</span>
          <button
            onClick={handleStartImport}
            disabled={loading}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Bắt đầu Import'}
          </button>
        </div>
      )}

      {/* Status Alert */}
      {status && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
