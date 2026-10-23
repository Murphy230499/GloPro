'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  User, 
  Scissors, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Sparkles, 
  X, 
  Settings2, 
  ShieldCheck,
  Check,
  ArrowRight
} from 'lucide-react';
import { 
  SUPPORTED_ENTITY_TYPES, 
  ENTITY_SCHEMAS, 
  autoMapColumns, 
  validateAndTransformRows 
} from '@/lib/excelImportHelper';

export default function AIExcelImportPreview({
  fileData,
  initialEntityType = 'customer',
  onConfirm,
  onCancel,
  isImporting = false
}) {
  const [selectedEntity, setSelectedEntity] = useState(initialEntityType);
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip'); // 'skip' | 'update'
  const [showMappingDetail, setShowMappingDetail] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(true);

  // Khởi tạo ánh xạ cột tự động cho loại thực thể đang chọn
  const [columnMapping, setColumnMapping] = useState(() => {
    return autoMapColumns(fileData?.headers || [], initialEntityType);
  });

  // Khi người dùng chuyển đổi loại thực thể (Khách hàng <-> Dịch vụ <-> Sản phẩm)
  const handleEntityChange = (newType) => {
    setSelectedEntity(newType);
    const newMapping = autoMapColumns(fileData?.headers || [], newType);
    setColumnMapping(newMapping);
  };

  // Cập nhật khi người dùng chỉnh sửa ánh xạ một cột cụ thể
  const handleMapFieldChange = (fieldKey, headerName) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldKey]: headerName || undefined
    }));
  };

  // Tính toán kết quả validate và chuyển đổi dữ liệu
  const validationResult = useMemo(() => {
    if (!fileData?.rawRows) return { validRows: [], invalidRows: [], totalCount: 0, validCount: 0, invalidCount: 0 };
    return validateAndTransformRows(fileData.rawRows, columnMapping, selectedEntity);
  }, [fileData?.rawRows, columnMapping, selectedEntity]);

  const currentSchema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS.customer;

  // Định dạng dung lượng tệp
  const formattedFileSize = useMemo(() => {
    const bytes = fileData?.fileSize || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [fileData?.fileSize]);

  // Đếm số trường đã được ánh xạ
  const mappedCount = useMemo(() => {
    return currentSchema.fields.filter(f => Boolean(columnMapping[f.key])).length;
  }, [currentSchema, columnMapping]);

  const handleStartImport = () => {
    if (onConfirm) {
      onConfirm({
        entityType: selectedEntity,
        duplicateStrategy,
        columnMapping,
        validationResult
      });
    }
  };

  return (
    <div className="my-2 p-3.5 bg-slate-800/95 border border-slate-700/80 rounded-2xl shadow-xl text-slate-100 text-xs flex flex-col gap-3 font-sans transition-all">
      {/* 1. Header Tệp */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-white truncate max-w-[220px]" title={fileData?.fileName}>
              {fileData?.fileName || 'Tệp dữ liệu Excel'}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{fileData?.rowCount || 0} dòng</span>
              <span>•</span>
              <span>{formattedFileSize}</span>
              {fileData?.activeSheet && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[90px]">Sheet: {fileData.activeSheet}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {onCancel && !isImporting && (
          <button
            onClick={onCancel}
            title="Hủy bỏ"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Lựa chọn Loại dữ liệu (Khách hàng / Dịch vụ / Sản phẩm) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
          <span>Loại dữ liệu import:</span>
          {initialEntityType === selectedEntity && (
            <span className="flex items-center gap-1 text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
              <Sparkles className="w-2.5 h-2.5" />
              AI gợi ý khớp file
            </span>
          )}
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          {SUPPORTED_ENTITY_TYPES.map(type => {
            const isSelected = selectedEntity === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleEntityChange(type.id)}
                disabled={isImporting}
                className={`py-1.5 px-2 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {type.id === 'customer' && <User className="w-3.5 h-3.5" />}
                {type.id === 'service' && <Scissors className="w-3.5 h-3.5" />}
                {type.id === 'product' && <Package className="w-3.5 h-3.5" />}
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tùy chọn xử lý trùng lặp */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Nếu trùng ({currentSchema.uniqueLabel}):</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDuplicateStrategy('skip')}
            disabled={isImporting}
            className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition cursor-pointer ${
              duplicateStrategy === 'skip'
                ? 'bg-slate-700/80 border-emerald-500/50 text-white'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between font-medium text-[11px]">
              <span>Bỏ qua dòng trùng</span>
              {duplicateStrategy === 'skip' && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
            <span className="text-[10px] text-slate-400 leading-tight">
              Giữ nguyên dữ liệu cũ, chỉ thêm mới
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDuplicateStrategy('update')}
            disabled={isImporting}
            className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition cursor-pointer ${
              duplicateStrategy === 'update'
                ? 'bg-slate-700/80 border-indigo-500/50 text-white'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between font-medium text-[11px]">
              <span>Cập nhật / Ghi đè</span>
              {duplicateStrategy === 'update' && <Check className="w-3 h-3 text-indigo-400" />}
            </div>
            <span className="text-[10px] text-slate-400 leading-tight">
              Ghi đè thông tin mới nhất vào bản ghi cũ
            </span>
          </button>
        </div>
      </div>

      {/* 4. Tóm tắt Ánh xạ Cột (Collapsible) */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMappingDetail(!showMappingDetail)}
          className="w-full px-3 py-2 flex items-center justify-between text-slate-300 hover:text-white transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium text-[11px]">
              Ánh xạ cột: <span className="text-emerald-400 font-semibold">{mappedCount}/{currentSchema.fields.length}</span> trường
            </span>
          </div>
          {showMappingDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showMappingDetail && (
          <div className="p-3 pt-1 border-t border-slate-800 flex flex-col gap-2 max-h-48 overflow-y-auto">
            {currentSchema.fields.map(field => {
              const currentMappedHeader = columnMapping[field.key] || '';
              return (
                <div key={field.key} className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1 min-w-[110px]">
                    <span className="text-slate-300">{field.label}</span>
                    {field.required && <span className="text-rose-400 font-bold">*</span>}
                  </div>
                  <select
                    value={currentMappedHeader}
                    onChange={(e) => handleMapFieldChange(field.key, e.target.value)}
                    disabled={isImporting}
                    className="flex-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Bỏ qua trường này --</option>
                    {fileData?.headers?.map(header => (
                      <option key={header} value={header}>
                        Cột: {header}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Xem trước Dữ liệu Thực tế (Top 3 dòng) */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDataPreview(!showDataPreview)}
          className="w-full px-3 py-2 flex items-center justify-between text-slate-300 hover:text-white transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-[11px]">Xem trước dữ liệu chuẩn hóa (3 dòng đầu)</span>
          </div>
          {showDataPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDataPreview && (
          <div className="p-2.5 pt-0 border-t border-slate-800 overflow-x-auto">
            {validationResult.validRows.length === 0 ? (
              <p className="text-[11px] text-amber-400 py-2 text-center">
                Chưa tìm thấy dòng dữ liệu nào hợp lệ với cấu hình cột hiện tại.
              </p>
            ) : (
              <div className="space-y-1.5 pt-2">
                {validationResult.validRows.slice(0, 3).map((row, idx) => (
                  <div key={idx} className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60 flex flex-col gap-1">
                    <div className="flex items-center justify-between font-medium text-[11px] text-slate-200">
                      <span className="text-emerald-400">#{row.rowNum}: {row.data.name || '---'}</span>
                      {selectedEntity === 'customer' && (
                        <span className="text-slate-300 font-mono text-[10px]">{row.data.phone || 'Chưa có SĐT'}</span>
                      )}
                      {selectedEntity === 'service' && (
                        <span className="text-emerald-400 font-semibold">{Number(row.data.price || 0).toLocaleString()} đ</span>
                      )}
                      {selectedEntity === 'product' && (
                        <span className="text-emerald-400 font-semibold">{Number(row.data.price || 0).toLocaleString()} đ</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                      {selectedEntity === 'customer' && (
                        <>
                          {row.data.tier && <span>Hạng: {row.data.tier}</span>}
                          {row.data.address && <span className="truncate max-w-[180px]">Đ/C: {row.data.address}</span>}
                          {row.data.total_spent > 0 && <span>Chi: {row.data.total_spent.toLocaleString()} đ</span>}
                        </>
                      )}
                      {selectedEntity === 'service' && (
                        <>
                          <span>Thời lượng: {row.data.duration_minutes || 45}p</span>
                          {row.data.category && <span>Nhóm: {row.data.category}</span>}
                        </>
                      )}
                      {selectedEntity === 'product' && (
                        <>
                          {row.data.barcode && <span>Mã: {row.data.barcode}</span>}
                          <span>Tồn: {row.data.stock || 0} {row.data.unit || 'Cái'}</span>
                          {row.data.category && <span>Nhóm: {row.data.category}</span>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Thống kê Hợp lệ & Cảnh báo */}
      <div className="flex items-center justify-between px-1 text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{validationResult.validCount} dòng hợp lệ</span>
        </div>
        {validationResult.invalidCount > 0 && (
          <div className="flex items-center gap-1 text-amber-400 text-[10px]" title="Các dòng thiếu tên hoặc SĐT sẽ tự động được bỏ qua">
            <AlertTriangle className="w-3 h-3" />
            <span>{validationResult.invalidCount} dòng lỗi (sẽ bỏ qua)</span>
          </div>
        )}
      </div>

      {/* 7. Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isImporting}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
        )}
        <button
          type="button"
          onClick={handleStartImport}
          disabled={isImporting || validationResult.validCount === 0}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tiến hành import...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Xác nhận Import ({validationResult.validCount} dòng)</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
