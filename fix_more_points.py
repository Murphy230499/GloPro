import re

# 1. Update i18n.jsx
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.total_appointments': 'Tổng số lịch hẹn đã đặt:',
    'customers.current_points': 'Điểm tích lũy hiện tại:',
    """,
    'en': """
    'customers.total_appointments': 'Total appointments booked:',
    'customers.current_points': 'Current accumulated points:',
    """,
    'ko': """
    'customers.total_appointments': '총 예약된 예약:',
    'customers.current_points': '현재 누적 포인트:',
    """,
    'ja': """
    'customers.total_appointments': '予約された合計予約数:',
    'customers.current_points': '現在の累積ポイント:',
    """,
    'zh': """
    'customers.total_appointments': '总预订的预约数:',
    'customers.current_points': '当前累积积分:',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

# 2. Update Customers.jsx line 1503
with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    c_content = f.read()

c_content = c_content.replace(
    "Tổng số lịch hẹn đã đặt: <span className=\"font-semibold text-slate-650\">{appointments.length}</span> | Điểm tích lũy hiện tại: <span className=\"font-semibold text-pink-650\">{customer.points || 0} điểm</span>",
    "{t('customers.total_appointments', 'Tổng số lịch hẹn đã đặt:')} <span className=\"font-semibold text-slate-650\">{appointments.length}</span> | {t('customers.current_points', 'Điểm tích lũy hiện tại:')} <span className=\"font-semibold text-pink-650\">{customer.points || 0} {t('customers.points', 'điểm')}</span>"
)

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(c_content)

