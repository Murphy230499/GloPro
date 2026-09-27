import fs from 'fs';

let content = fs.readFileSync('src/views/Settings.jsx', 'utf8');

// Add import
if (!content.includes("import { useT } from '@/lib/i18n';")) {
  content = content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { useT } from '@/lib/i18n';"
  );
}

// Add const { t } = useT(); to main components
const componentsToUpdate = ['function Settings() {', 'function BranchForm({ branch, onClose, onSave }) {'];
componentsToUpdate.forEach(comp => {
  if (content.includes(comp) && !content.includes(`${comp}\n  const { t } = useT();`)) {
    content = content.replace(comp, `${comp}\n  const { t } = useT();`);
  }
});

// Replace strings
const replacements = [
  ["<h1 className=\"text-2xl md:text-3xl font-bold tracking-tight text-slate-800\">Cài đặt hệ thống</h1>", "<h1 className=\"text-2xl md:text-3xl font-bold tracking-tight text-slate-800\">{t('settings.title')}</h1>"],
  ["<p className=\"text-slate-400 text-sm mt-1\">Cấu hình các phân hệ chi nhánh, tài khoản và quyền hoạt động.</p>", "<p className=\"text-slate-400 text-sm mt-1\">{t('settings.subtitle')}</p>"],
  ["<span>Chi nhánh</span>", "<span>{t('settings.tab.branch')}</span>"],
  ["<span>Tài khoản</span>", "<span>{t('settings.tab.account')}</span>"],
  ["<span>Phân quyền</span>", "<span>{t('settings.tab.role')}</span>"],
  ["<span>Tích hợp</span>", "<span>{t('settings.tab.integration')}</span>"],
  ["<Plus className=\"w-4 h-4\" /> Thêm cơ sở", "<Plus className=\"w-4 h-4\" /> {t('settings.branch.add')}"],
  ["<h2 className=\"text-xl font-bold text-slate-800\">Cấu hình Chi nhánh</h2>", "<h2 className=\"text-xl font-bold text-slate-800\">{t('settings.branch.edit')}</h2>"],
  ["Thông tin chung", "{t('settings.branch.general')}"],
  ["Giờ hoạt động", "{t('settings.branch.working_hours')}"],
  ["<h3 className=\"font-bold text-slate-800 text-sm uppercase tracking-wider text-left\">Hồ sơ chi nhánh</h3>", "<h3 className=\"font-bold text-slate-800 text-sm uppercase tracking-wider text-left\">{t('settings.branch.profile')}</h3>"],
  ["<h3 className=\"font-bold text-slate-800 text-sm uppercase tracking-wider text-left\">Mạng xã hội</h3>", "<h3 className=\"font-bold text-slate-800 text-sm uppercase tracking-wider text-left\">{t('settings.branch.social')}</h3>"],
  ["<h3 className=\"font-bold text-slate-800 text-sm uppercase tracking-wider text-left\">Định dạng hiển thị</h3>", "<h3 className=\"font-bold text-slate-800 text-sm uppercase tracking-wider text-left\">{t('settings.branch.format')}</h3>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Tên chi nhánh <span className=\"text-red-500\">*</span></label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.name')} <span className=\"text-red-500\">*</span></label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Quốc gia <span className=\"text-red-500\">*</span></label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.country')} <span className=\"text-red-500\">*</span></label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Thành phố / Quận huyện <span className=\"text-red-500\">*</span></label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.city')} <span className=\"text-red-500\">*</span></label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Tỉnh / Bang <span className=\"text-red-500\">*</span></label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.state')} <span className=\"text-red-500\">*</span></label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Mã bưu điện <span className=\"text-red-500\">*</span></label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.zip')} <span className=\"text-red-500\">*</span></label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Số điện thoại</label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.phone')}</label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Địa chỉ chi tiết <span className=\"text-red-500\">*</span></label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.address')} <span className=\"text-red-500\">*</span></label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Mã số thuế</label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.tax')}</label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Múi giờ <span className=\"text-red-500\">*</span></label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.timezone')} <span className=\"text-red-500\">*</span></label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Định dạng ngày</label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.date_format')}</label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Đơn vị tiền tệ</label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.currency')}</label>"],
  ["<label className=\"text-xs font-semibold text-slate-500 block mb-1\">Ngôn ngữ hiển thị</label>", "<label className=\"text-xs font-semibold text-slate-500 block mb-1\">{t('settings.branch.language')}</label>"],
  ["toast.success('Đã cập nhật cơ sở')", "toast.success(t('settings.success.saved'))"],
  ["toast.success('Đã thêm cơ sở')", "toast.success(t('settings.success.added'))"],
  ["toast.success('Đã xóa chi nhánh')", "toast.success(t('settings.success.deleted'))"],
  ["toast.error('Vui lòng nhập đầy đủ các trường bắt buộc (*)')", "toast.error(t('settings.error.required'))"],
  ["label=\"Logo chi nhánh (hiển thị trên website đặt lịch & hoá đơn giao dịch)\"", "label={t('settings.branch.logo')}"],
];

replacements.forEach(([search, replace]) => {
  content = content.split(search).join(replace);
});

fs.writeFileSync('src/views/Settings.jsx', content);
console.log('Updated Settings.jsx');
