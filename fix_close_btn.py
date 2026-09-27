import re

with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

if "staff.scheduler.close_btn" not in i18n:
    i18n = re.sub(r"('staff.scheduler.cancel': 'Huỷ bỏ',)", r"\1\n    'staff.scheduler.close_btn': 'Đóng',", i18n)
    i18n = re.sub(r"('staff.scheduler.cancel': 'Cancel',)", r"\1\n    'staff.scheduler.close_btn': 'Close',", i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("close_btn added")
