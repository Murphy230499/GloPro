import fs from 'fs';

const dict = {
  'dash.title': { vi: 'Tổng quan', en: 'Dashboard', zh: '概览', ko: '대시보드', ja: 'ダッシュボード' },
  'dash.subtitle': { vi: 'Xin chào 👋 Đây là tình hình hôm nay', en: 'Hello 👋 Here is today\'s overview', zh: '你好 👋 这是今天的概况', ko: '안녕하세요 👋 오늘의 현황입니다', ja: 'こんにちは 👋 今日の状況です' },
  'dash.stat.revenue': { vi: 'Doanh thu hôm nay', en: 'Today Revenue', zh: '今日营业额', ko: '오늘 매출', ja: '本日の売上' },
  'dash.stat.invoices': { vi: '{count} Hóa đơn', en: '{count} Invoices', zh: '{count} 账单', ko: '{count} 청구서', ja: '{count} 請求書' },
  'dash.stat.appts': { vi: 'Lịch hẹn hôm nay', en: 'Today Appts', zh: '今日预约', ko: '오늘 예약', ja: '本日の予約' },
  'dash.stat.completed': { vi: '{count} Hoàn thành', en: '{count} Completed', zh: '{count} 已完成', ko: '{count} 완료', ja: '{count} 完了' },
  'dash.stat.customers': { vi: 'Khách hàng', en: 'Customers', zh: '客户', ko: '고객', ja: '顧客' },
  'dash.stat.chain': { vi: 'Toàn chuỗi', en: 'Entire Chain', zh: '全连锁', ko: '전체 체인', ja: '全店舗' },
  'dash.stat.staff': { vi: 'Nhân viên', en: 'Staff', zh: '员工', ko: '직원', ja: 'スタッフ' },
  'dash.stat.working': { vi: 'Đang làm việc', en: 'Working', zh: '工作中', ko: '근무 중', ja: '勤務中' },
  'dash.chart.revenue': { vi: 'Doanh thu 7 ngày qua', en: 'Revenue (Last 7 days)', zh: '过去 7 天收入', ko: '지난 7일 매출', ja: '過去7日間の売上' },
  'dash.chart.by_day': { vi: 'Theo ngày', en: 'By day', zh: '按天', ko: '일별', ja: '日別' },
  'dash.appts.title': { vi: 'Lịch hẹn sắp tới', en: 'Upcoming Appointments', zh: '即将到来的预约', ko: '예정된 예약', ja: '今後の予約' },
  'dash.appts.empty': { vi: 'Không có lịch hẹn nào sắp tới', en: 'No upcoming appointments', zh: '没有即将到来的预约', ko: '예정된 예약이 없습니다', ja: '今後の予約はありません' },
  'dash.appts.no_service': { vi: 'Chưa chọn dịch vụ', en: 'No service selected', zh: '未选择服务', ko: '선택된 서비스 없음', ja: 'サービスが選択されていません' },
  'dash.top.services': { vi: 'Top dịch vụ theo doanh thu', en: 'Top Services by Revenue', zh: '按收入排名的顶级服务', ko: '매출 상위 서비스', ja: '売上トップのサービス' },
  'dash.top.products': { vi: 'Top sản phẩm theo doanh thu', en: 'Top Products by Revenue', zh: '按收入排名的顶级产品', ko: '매출 상위 상품', ja: '売上トップの商品' },
  'dash.top.staff': { vi: 'Top nhân viên theo doanh thu', en: 'Top Staff by Revenue', zh: '按收入排名的顶级员工', ko: '매출 상위 직원', ja: '売上トップのスタッフ' },
  'dash.top.customers': { vi: 'Top khách hàng theo doanh thu', en: 'Top Customers by Revenue', zh: '按收入排名的顶级客户', ko: '매출 상위 고객', ja: '売上トップの顧客' },
  'dash.status.pending': { vi: 'Chờ xác nhận', en: 'Pending', zh: '待确认', ko: '대기 중', ja: '保留中' },
  'dash.status.confirmed': { vi: 'Đã xác nhận', en: 'Confirmed', zh: '已确认', ko: '확인됨', ja: '確認済み' },
  'dash.status.checked_in': { vi: 'Đã check-in', en: 'Checked-in', zh: '已签到', ko: '체크인 됨', ja: 'チェックイン済み' },
  'dash.status.in_progress': { vi: 'Đang làm', en: 'In Progress', zh: '进行中', ko: '진행 중', ja: '進行中' },
  'dash.status.completed': { vi: 'Hoàn thành', en: 'Completed', zh: '已完成', ko: '완료됨', ja: '完了' },
  'dash.status.cancelled': { vi: 'Đã hủy', en: 'Cancelled', zh: '已取消', ko: '취소됨', ja: 'キャンセル済み' },
  'dash.status.no_show': { vi: 'Không đến', en: 'No-show', zh: '未出现', ko: '노쇼', ja: 'ノーショー' },
  'dash.filter.day': { vi: 'Hôm nay', en: 'Today', zh: '今天', ko: '오늘', ja: '今日' },
  'dash.filter.week': { vi: 'Tuần', en: 'Week', zh: '周', ko: '이번 주', ja: '今週' },
  'dash.filter.month': { vi: 'Tháng', en: 'Month', zh: '月', ko: '이번 달', ja: '今月' },
  'dash.filter.quarter': { vi: 'Quý', en: 'Quarter', zh: '季度', ko: '이번 분기', ja: '今四半期' },
  'dash.filter.year': { vi: 'Năm', en: 'Year', zh: '年', ko: '올해', ja: '今年' },
};

let content = fs.readFileSync('src/lib/i18n.jsx', 'utf8');
['vi', 'en', 'zh', 'ko', 'ja'].forEach(lang => {
  const injection = Object.keys(dict).map(k => `    '${k}': '${dict[k][lang].replace(/'/g, "\\'")}',`).join('\n');
  const regex = new RegExp(`(${lang}: {\\s*)`);
  content = content.replace(regex, `$1\n${injection}\n`);
});
fs.writeFileSync('src/lib/i18n.jsx', content);
console.log('Updated i18n.jsx for Dashboard');
