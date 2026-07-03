import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

export default function ImageUpload({ value, onChange, label, shape = 'square' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Ảnh quá lớn (tối đa 5MB)');
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch (e) {
      toast.error('Tải ảnh thất bại');
    }
    setUploading(false);
  };

  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div>
      {label && <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>}
      <div className="flex items-center gap-3">
        <div className={`relative w-20 h-20 ${rounded} bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0`}>
          {value ? (
            <>
              <img src={value} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onChange('')} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </>
          ) : uploading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-pink-500 rounded-full animate-spin" />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-300" />
          )}
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-sm font-medium text-slate-600 disabled:opacity-50">
          <Upload className="w-4 h-4" /> {value ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}