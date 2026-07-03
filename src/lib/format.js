export const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + '₫';

export const formatNumber = (n) =>
  new Intl.NumberFormat('vi-VN').format(n || 0);

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
};

export const last7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    days.push({
      key: dt.toISOString().slice(0, 10),
      label: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dt.getDay()],
    });
  }
  return days;
};