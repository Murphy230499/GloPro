import re

with open('src/components/staff/SchedulerGrid.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace formatVietnameseDate
new_full_date_fn = """const formatVietnameseDate = (dateStr, t) => {
  const d = new Date(dateStr);
  const days = [
    t('common.sunday', 'Chủ nhật'), 
    t('common.monday', 'Thứ 2'), 
    t('common.tuesday', 'Thứ 3'), 
    t('common.wednesday', 'Thứ 4'), 
    t('common.thursday', 'Thứ 5'), 
    t('common.friday', 'Thứ 6'), 
    t('common.saturday', 'Thứ 7')
  ];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return t('common.full_date', '{day} ngày {dd} tháng {mm} năm {yyyy}')
    .replace('{day}', dayLabel)
    .replace('{dd}', dateNum)
    .replace('{mm}', monthNum)
    .replace('{yyyy}', year);
};"""

old_full_date_fn = """const formatVietnameseDate = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${dayLabel} ngày ${dateNum} tháng ${monthNum} năm ${year}`;
};"""

# Replace formatDateHeader
new_short_date_fn = """const formatDateHeader = (dateStr, t) => {
  const d = new Date(dateStr);
  const days = [
    t('common.sun', 'CN'), 
    t('common.mon', 'T2'), 
    t('common.tue', 'T3'), 
    t('common.wed', 'T4'), 
    t('common.thu', 'T5'), 
    t('common.fri', 'T6'), 
    t('common.sat', 'T7')
  ];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayLabel} ${dateNum}/${monthNum}`;
};"""

old_short_date_fn = """const formatDateHeader = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayLabel} ${dateNum}/${monthNum}`;
};"""

content = content.replace(old_full_date_fn, new_full_date_fn)
content = content.replace(old_short_date_fn, new_short_date_fn)

# Replace all occurrences of formatVietnameseDate(
content = content.replace('formatVietnameseDate(', 'formatVietnameseDate(')
content = re.sub(r'formatVietnameseDate\(([^,)]+)\)', r'formatVietnameseDate(\1, t)', content)

# Replace all occurrences of formatDateHeader(
content = re.sub(r'formatDateHeader\(([^,)]+)\)', r'formatDateHeader(\1, t)', content)

with open('src/components/staff/SchedulerGrid.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dates translated!")
