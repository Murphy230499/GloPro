import fs from 'fs';
let content = fs.readFileSync('src/views/Dashboard.jsx', 'utf8');

// Add import
if (!content.includes("import { useT } from '@/lib/i18n';")) {
  content = content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { useT } from '@/lib/i18n';"
  );
}

// Add const { t } = useT(); to main components
const componentsToUpdate = ['export default function Dashboard() {'];
componentsToUpdate.forEach(comp => {
  if (content.includes(comp) && !content.includes(`${comp}\n  const { t } = useT();`)) {
    content = content.replace(comp, `${comp}\n  const { t } = useT();`);
  }
});

// Replace strings
const replacements = [
  ["pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', checked_in: 'Đã check-in',", "pending: t('dash.status.pending'), confirmed: t('dash.status.confirmed'), checked_in: t('dash.status.checked_in'),"],
  ["in_progress: 'Đang làm', completed: 'Hoàn thành', cancelled: 'Đã hủy', no_show: 'Không đến'", "in_progress: t('dash.status.in_progress'), completed: t('dash.status.completed'), cancelled: t('dash.status.cancelled'), no_show: t('dash.status.no_show')"],
  ["{ value: 'day', label: 'Hôm nay' },", "{ value: 'day', label: t('dash.filter.day') },"],
  ["{ value: 'week', label: 'Tuần' },", "{ value: 'week', label: t('dash.filter.week') },"],
  ["{ value: 'month', label: 'Tháng' },", "{ value: 'month', label: t('dash.filter.month') },"],
  ["{ value: 'quarter', label: 'Quý' },", "{ value: 'quarter', label: t('dash.filter.quarter') },"],
  ["{ value: 'year', label: 'Năm' },", "{ value: 'year', label: t('dash.filter.year') },"],
  ["<h1 className=\"text-2xl md:text-3xl font-bold tracking-tight\">Tổng quan</h1>", "<h1 className=\"text-2xl md:text-3xl font-bold tracking-tight\">{t('dash.title')}</h1>"],
  ["<p className=\"text-slate-400 text-sm mt-1\">Xin chào 👋 Đây là tình hình hôm nay</p>", "<p className=\"text-slate-400 text-sm mt-1\">{t('dash.subtitle')}</p>"],
  ["label=\"Doanh thu hôm nay\"", "label={t('dash.stat.revenue')}"],
  ["sub={`${invoices.filter((i) => i.date === today).length} Hóa đơn`}", "sub={t('dash.stat.invoices').replace('{count}', invoices.filter((i) => i.date === today).length)}"],
  ["label=\"Lịch hẹn hôm nay\"", "label={t('dash.stat.appts')}"],
  ["sub={`${completedToday} Hoàn thành`}", "sub={t('dash.stat.completed').replace('{count}', completedToday)}"],
  ["label=\"Khách hàng\"", "label={t('dash.stat.customers')}"],
  ["sub=\"Toàn chuỗi\"", "sub={t('dash.stat.chain')}"],
  ["label=\"Nhân viên\"", "label={t('dash.stat.staff')}"],
  ["sub=\"Đang làm việc\"", "sub={t('dash.stat.working')}"],
  ["<h3 className=\"font-bold mb-1 text-xl\">Doanh thu 7 ngày qua</h3>", "<h3 className=\"font-bold mb-1 text-xl\">{t('dash.chart.revenue')}</h3>"],
  ["<p className=\"text-xs text-slate-400 mb-3\">Theo ngày</p>", "<p className=\"text-xs text-slate-400 mb-3\">{t('dash.chart.by_day')}</p>"],
  ["<h3 className=\"font-bold mb-3 flex items-center gap-2 text-xl\">Lịch hẹn sắp tới</h3>", "<h3 className=\"font-bold mb-3 flex items-center gap-2 text-xl\">{t('dash.appts.title')}</h3>"],
  ["Không có lịch hẹn nào sắp tới", "{t('dash.appts.empty')}"],
  ["Chưa chọn dịch vụ", "{t('dash.appts.no_service')}"],
  ["<h3 className=\"font-bold mb-3 text-xl\">Top dịch vụ theo doanh thu</h3>", "<h3 className=\"font-bold mb-3 text-xl\">{t('dash.top.services')}</h3>"],
  ["<h3 className=\"font-bold mb-3 text-xl\">Top sản phẩm theo doanh thu</h3>", "<h3 className=\"font-bold mb-3 text-xl\">{t('dash.top.products')}</h3>"],
  ["<h3 className=\"font-bold mb-3 text-xl\">Top nhân viên theo doanh thu</h3>", "<h3 className=\"font-bold mb-3 text-xl\">{t('dash.top.staff')}</h3>"],
  ["<h3 className=\"font-bold mb-3 text-xl\">Top khách hàng theo doanh thu</h3>", "<h3 className=\"font-bold mb-3 text-xl\">{t('dash.top.customers')}</h3>"]
];

replacements.forEach(([search, replace]) => {
  content = content.split(search).join(replace);
});
fs.writeFileSync('src/views/Dashboard.jsx', content);
console.log('Updated Dashboard.jsx');
