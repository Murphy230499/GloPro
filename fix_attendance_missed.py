import re

with open('src/components/staff/AttendanceLog.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "> Đúng giờ<": "> {t('staff.attendance.on_time', 'Đúng giờ')}<",
    "> Đi trễ / Về sớm<": "> {t('staff.attendance.late_early', 'Đi trễ / Về sớm')}<",
    "> Chưa chấm công<": "> {t('staff.attendance.no_attendance', 'Chưa chấm công')}<",
    "> Chấm công thiếu<": "> {t('staff.attendance.missing_punch', 'Chấm công thiếu')}<",
    "> Nghỉ làm<": "> {t('staff.attendance.absent', 'Nghỉ làm')}<",
    ">Điều chỉnh chấm công<": ">{t('staff.attendance.update_modal_title', 'Điều chỉnh chấm công')}<",
    "Ngày: {": "{t('staff.attendance.date_label', 'Ngày:')} {",
    ">Nhân viên nghỉ làm hôm nay (Vắng mặt)<": ">{t('staff.attendance.mark_absent_long', 'Nhân viên nghỉ làm hôm nay (Vắng mặt)')}<",
    ">Giờ Vào (Check-In)<": ">{t('staff.attendance.check_in_long', 'Giờ Vào (Check-In)')}<",
    ">Giờ Ra (Check-Out)<": ">{t('staff.attendance.check_out_long', 'Giờ Ra (Check-Out)')}<",
}

for old, new in replacements.items():
    content = content.replace(old, new)

# For "Hủy" and "Lưu chỉnh sửa" which are plain text inside buttons
content = content.replace("\n                Hủy\n", "\n                {t('staff.scheduler.cancel', 'Hủy')}\n")
content = content.replace("\n                Lưu chỉnh sửa\n", "\n                {t('staff.attendance.save_changes', 'Lưu chỉnh sửa')}\n")

with open('src/components/staff/AttendanceLog.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.attendance.mark_absent_long': 'Nhân viên nghỉ làm hôm nay (Vắng mặt)',
    'staff.attendance.check_in_long': 'Giờ Vào (Check-In)',
    'staff.attendance.check_out_long': 'Giờ Ra (Check-Out)',
    'staff.attendance.save_changes': 'Lưu chỉnh sửa',
    'staff.attendance.date_label': 'Ngày:',
"""

new_keys_en = """
    'staff.attendance.mark_absent_long': 'Staff is absent today',
    'staff.attendance.check_in_long': 'Check-in Time',
    'staff.attendance.check_out_long': 'Check-out Time',
    'staff.attendance.save_changes': 'Save changes',
    'staff.attendance.date_label': 'Date:',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("Missed strings fixed!")
