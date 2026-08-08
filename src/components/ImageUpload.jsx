'use client';
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import { useT } from '@/lib/i18n';

export default function ImageUpload({ value, onChange, label, shape = 'square' }) {
  const { t } = useT();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Ảnh quá lớn (tối đa 5MB)');
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onChange(dataUrl);
          setUploading(false);
        };
        img.onerror = () => {
          toast.error('Định dạng ảnh không hợp lệ');
          setUploading(false);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (e) {
      toast.error('Tải ảnh thất bại');
      setUploading(false);
    }
  };

  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div>
      {label && <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>}
      <div className="flex items-center gap-3">
        <div 
          onClick={() => inputRef.current?.click()}
          className={`group relative w-20 h-20 ${rounded} bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer`}
        >
          {value ? (
            <>
              <img src={value} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium backdrop-blur-[2px] text-center px-1">
                <Upload className="w-4 h-4 mb-0.5" /> {t('common.change_photo', 'Đổi ảnh')}
              </div>
            </>
          ) : uploading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-pink-500 rounded-full animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-slate-300" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium backdrop-blur-[2px] text-center px-1">
                <Upload className="w-4 h-4 mb-0.5" /> {t('common.upload_photo', 'Tải ảnh lên')}
              </div>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}