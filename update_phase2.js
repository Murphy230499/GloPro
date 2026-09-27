import fs from 'fs';

const dict = {
  'appt.title': { vi: 'Quản lý Lịch hẹn', en: 'Appointments', zh: '预约管理', ko: '예약 관리', ja: '予約管理' },
  'appt.subtitle': { vi: 'Sắp xếp, điều phối và quản lý thời gian phục vụ khách hàng.', en: 'Schedule, coordinate and manage customer service time.', zh: '安排、协调和管理客户服务时间。', ko: '고객 서비스 시간을 예약, 조정 및 관리합니다.', ja: '顧客サービス時間のスケジュール、調整、管理を行います。' },
  'appt.filter.all': { vi: 'Tất cả', en: 'All', zh: '全部', ko: '전체', ja: 'すべて' },
  'appt.filter.unassigned': { vi: 'Chưa phân công', en: 'Unassigned', zh: '未分配', ko: '미배정', ja: '未割り当て' },
  'appt.filter.staff': { vi: 'Nhân viên', en: 'Staff', zh: '员工', ko: '직원', ja: 'スタッフ' },
  'appt.status.pending': { vi: 'Chờ xác nhận', en: 'Pending', zh: '待确认', ko: '대기 중', ja: '保留中' },
  'appt.status.confirmed': { vi: 'Đã xác nhận', en: 'Confirmed', zh: '已确认', ko: '확인됨', ja: '確認済み' },
  'appt.status.checked_in': { vi: 'Đã check-in', en: 'Checked-in', zh: '已签到', ko: '체크인 됨', ja: 'チェックイン済み' },
  'appt.status.in_progress': { vi: 'Đang làm', en: 'In Progress', zh: '进行中', ko: '진행 중', ja: '進行中' },
  'appt.status.completed': { vi: 'Hoàn thành', en: 'Completed', zh: '已完成', ko: '완료됨', ja: '完了' },
  'appt.status.cancelled': { vi: 'Đã hủy', en: 'Cancelled', zh: '已取消', ko: '취소됨', ja: 'キャンセル済み' },
  'appt.status.no_show': { vi: 'Không đến', en: 'No-show', zh: '未出现', ko: '노쇼', ja: 'ノーショー' },
  'appt.action.add': { vi: 'Lịch hẹn mới', en: 'New Appointment', zh: '新预约', ko: '새 예약', ja: '新規予約' },
  'appt.action.calendar': { vi: 'Lịch', en: 'Calendar', zh: '日历', ko: '달력', ja: 'カレンダー' },
  'appt.action.list': { vi: 'Danh sách', en: 'List', zh: '列表', ko: '목록', ja: 'リスト' },
  'appt.action.timeline': { vi: 'Dòng thời gian', en: 'Timeline', zh: '时间轴', ko: '타임라인', ja: 'タイムライン' },
  'customer.title': { vi: 'Quản lý Khách hàng', en: 'Customers', zh: '客户', ko: '고객', ja: '顧客' },
  'customer.subtitle': { vi: 'Theo dõi thông tin cá nhân, lịch sử giao dịch và dịch vụ của khách.', en: 'Manage customer info and transaction history', zh: '管理客户信息和交易历史', ko: '고객 정보 및 거래 내역 관리', ja: '顧客情報と取引履歴の管理' },
  'customer.action.add': { vi: 'Thêm khách hàng', en: 'Add Customer', zh: '添加客户', ko: '고객 추가', ja: '顧客を追加' },
  'customer.action.import': { vi: 'Nhập Excel', en: 'Import Excel', zh: '导入 Excel', ko: 'Excel 가져오기', ja: 'Excel インポート' },
  'customer.action.export': { vi: 'Xuất dữ liệu', en: 'Export Data', zh: '导出数据', ko: '데이터 내보내기', ja: 'データ エクスポート' },
  'customer.search': { vi: 'Tìm theo tên, SĐT...', en: 'Search by name, phone...', zh: '按姓名、电话搜索...', ko: '이름, 전화번호로 검색...', ja: '名前、電話番号で検索...' },
};

let content = fs.readFileSync('src/lib/i18n.jsx', 'utf8');
['vi', 'en', 'zh', 'ko', 'ja'].forEach(lang => {
  const injection = Object.keys(dict).map(k => `    '${k}': '${dict[k][lang].replace(/'/g, "\\'")}',`).join('\n');
  const regex = new RegExp(`(${lang}: {\\s*)`);
  content = content.replace(regex, `$1\n${injection}\n`);
});
fs.writeFileSync('src/lib/i18n.jsx', content);

// Update Appointments.jsx
let apptContent = fs.readFileSync('src/views/Appointments.jsx', 'utf8');

if (!apptContent.includes("import { useT } from '@/lib/i18n';")) {
  apptContent = apptContent.replace(
    "import React, { useState, useEffect",
    "import { useT } from '@/lib/i18n';\nimport React, { useState, useEffect"
  );
}

if (!apptContent.includes("const { t } = useT();")) {
  apptContent = apptContent.replace(
    "export default function Appointments() {",
    "export default function Appointments() {\n  const { t } = useT();\n  const STATUS_LABEL = {\n    pending: t('appt.status.pending'), confirmed: t('appt.status.confirmed'), checked_in: t('appt.status.checked_in'),\n    in_progress: t('appt.status.in_progress'), completed: t('appt.status.completed'), cancelled: t('appt.status.cancelled'), no_show: t('appt.status.no_show')\n  };"
  );
  
  // Remove original STATUS_LABEL outside component
  apptContent = apptContent.replace(/const STATUS_LABEL = {[\s\S]*?no_show: 'Không đến'[\s\S]*?};/, '');
}

const apptReplacements = [
  ["<h1 className=\"text-2xl md:text-3xl font-bold tracking-tight text-slate-900\">Quản lý Lịch hẹn</h1>", "<h1 className=\"text-2xl md:text-3xl font-bold tracking-tight text-slate-900\">{t('appt.title')}</h1>"],
  ["<p className=\"text-sm text-slate-500 mt-1\">Sắp xếp, điều phối và quản lý thời gian phục vụ khách hàng.</p>", "<p className=\"text-sm text-slate-500 mt-1\">{t('appt.subtitle')}</p>"],
  ["<Plus className=\"w-4 h-4 mr-2\" /> Lịch hẹn mới", "<Plus className=\"w-4 h-4 mr-2\" /> {t('appt.action.add')}"],
  ["Lịch", "{t('appt.action.calendar')}"],
  ["Danh sách", "{t('appt.action.list')}"],
  ["Dòng thời gian", "{t('appt.action.timeline')}"],
];

apptReplacements.forEach(([search, replace]) => {
  apptContent = apptContent.split(search).join(replace);
});
fs.writeFileSync('src/views/Appointments.jsx', apptContent);

// Update Customers.jsx
let custContent = fs.readFileSync('src/views/Customers.jsx', 'utf8');

if (!custContent.includes("import { useT } from '@/lib/i18n';")) {
  custContent = custContent.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { useT } from '@/lib/i18n';"
  );
}

if (!custContent.includes("const { t } = useT();")) {
  custContent = custContent.replace(
    "export default function Customers() {",
    "export default function Customers() {\n  const { t } = useT();"
  );
}

const custReplacements = [
  ["<h1 className=\"text-2xl md:text-3xl font-bold tracking-tight text-slate-900\">Quản lý Khách hàng</h1>", "<h1 className=\"text-2xl md:text-3xl font-bold tracking-tight text-slate-900\">{t('customer.title')}</h1>"],
  ["<p className=\"text-sm text-slate-500 mt-1\">Theo dõi thông tin cá nhân, lịch sử giao dịch và dịch vụ của khách.</p>", "<p className=\"text-sm text-slate-500 mt-1\">{t('customer.subtitle')}</p>"],
  ["<Plus className=\"w-4 h-4\" /> Thêm khách hàng", "<Plus className=\"w-4 h-4\" /> {t('customer.action.add')}"],
  ["<Download className=\"w-4 h-4\" /> Nhập Excel", "<Download className=\"w-4 h-4\" /> {t('customer.action.import')}"],
  ["<Upload className=\"w-4 h-4\" /> Xuất dữ liệu", "<Upload className=\"w-4 h-4\" /> {t('customer.action.export')}"],
  ["placeholder=\"Tìm theo tên, SĐT...\"", "placeholder={t('customer.search')}"],
];

custReplacements.forEach(([search, replace]) => {
  custContent = custContent.split(search).join(replace);
});
fs.writeFileSync('src/views/Customers.jsx', custContent);

console.log('Updated i18n, Appointments.jsx and Customers.jsx');
