import re

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    ("{ id: 'activity', label: 'Hoạt động' }", "{ id: 'activity', label: t('customers.tabs.activity', 'Hoạt động') }"),
    ("{ id: 'appointments', label: 'Lịch hẹn' }", "{ id: 'appointments', label: t('customers.tabs.appointments', 'Lịch hẹn') }"),
    ("/> Quản lý khách hàng", "/> {t('customers.tabs.manage', 'Quản lý khách hàng')}"),
    
    ("label: 'Đã hoàn thành'", "label: t('common.status_completed', 'Đã hoàn thành')"),
    ("label: 'Đã check-in'", "label: t('common.status_checked_in', 'Đã check-in')"),
    ("label: 'Đã đặt'", "label: t('common.status_booked', 'Đã đặt')"),
    ("label: 'Không đến'", "label: t('common.status_no_show', 'Không đến')"),
    ("label: 'Đã hủy'", "label: t('common.status_cancelled', 'Đã hủy')"),
    ("label: 'Đã xác nhận'", "label: t('common.status_confirmed', 'Đã xác nhận')"),
    
    ("<span>Hạng: {tier.name}</span>", "<span>{t('customers.detail.tier', 'Hạng:')} {tier.name}</span>"),
    ("Khách hàng cũ", "{t('customers.detail.old_customer', 'Khách hàng cũ')}"),
    ("Khách hàng mới", "{t('customers.detail.new_customer', 'Khách hàng mới')}"),
]

for old, new in replacements:
    c = c.replace(old, new)

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Customers.jsx modified p3.")
