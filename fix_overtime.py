import re

with open('src/components/staff/CommissionMatrix.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    '<h3 className="font-bold text-slate-800 text-xs px-2 mb-3">Nhân viên</h3>': '<h3 className="font-bold text-slate-800 text-xs px-2 mb-3">{t("staff.commission.staff_col", "Nhân viên")}</h3>',
    '<h3 className="font-bold text-slate-800 text-xs px-2 mb-3">Dịch vụ</h3>': '<h3 className="font-bold text-slate-800 text-xs px-2 mb-3">{t("staff.commission.service_col", "Dịch vụ")}</h3>',
    '<h3 className="font-bold text-slate-800 text-xs">Hoa hồng theo khung giờ</h3>': '<h3 className="font-bold text-slate-800 text-xs">{t("staff.commission.overtime_title", "Hoa hồng theo khung giờ")}</h3>',
    '<p className="text-[9px] text-slate-400 font-medium mt-0.5">Thiết lập hoa hồng tăng ca cộng thêm</p>': '<p className="text-[9px] text-slate-400 font-medium mt-0.5">{t("staff.commission.overtime_subtitle", "Thiết lập hoa hồng tăng ca cộng thêm")}</p>',
    '\n                  Chưa cấu hình khung giờ nào. Bấm "+ Thêm mới" để thiết lập.\n': '\n                  {t("staff.commission.overtime_empty", \'Chưa cấu hình khung giờ nào. Bấm "+ Thêm mới" để thiết lập.\')}\n',
    '<span className="text-[10px] text-slate-400 font-bold shrink-0">Từ</span>': '<span className="text-[10px] text-slate-400 font-bold shrink-0">{t("staff.commission.from", "Từ")}</span>',
    '<span className="text-[10px] text-slate-400 font-bold shrink-0">Đến</span>': '<span className="text-[10px] text-slate-400 font-bold shrink-0">{t("staff.commission.to", "Đến")}</span>',
    '\n                Thêm mới\n': '\n                {t("staff.commission.add_new", "Thêm mới")}\n',
    "? 'Uốn/Duỗi/Nhuộm' :": "? t('staff.commission.cat_hair', 'Uốn/Duỗi/Nhuộm') :",
    "? 'Nail & Móng' :": "? t('staff.commission.cat_nail', 'Nail & Móng') :",
    "? 'Spa & Massage' :": "? t('staff.commission.cat_massage', 'Spa & Massage') :",
    ": 'Dịch vụ khác'": ": t('staff.commission.cat_other', 'Dịch vụ khác')"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/CommissionMatrix.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Update i18n
with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.commission.staff_col': 'Nhân viên',
    'staff.commission.service_col': 'Dịch vụ',
    'staff.commission.overtime_title': 'Hoa hồng theo khung giờ',
    'staff.commission.overtime_subtitle': 'Thiết lập hoa hồng tăng ca cộng thêm',
    'staff.commission.overtime_empty': 'Chưa cấu hình khung giờ nào. Bấm "+ Thêm mới" để thiết lập.',
    'staff.commission.from': 'Từ',
    'staff.commission.to': 'Đến',
    'staff.commission.add_new': 'Thêm mới',
    'staff.commission.cat_hair': 'Uốn/Duỗi/Nhuộm',
    'staff.commission.cat_nail': 'Nail & Móng',
    'staff.commission.cat_massage': 'Spa & Massage',
    'staff.commission.cat_other': 'Dịch vụ khác',
"""

new_keys_en = """
    'staff.commission.staff_col': 'Staff',
    'staff.commission.service_col': 'Service',
    'staff.commission.overtime_title': 'Time-based Commission',
    'staff.commission.overtime_subtitle': 'Configure additional overtime commission',
    'staff.commission.overtime_empty': 'No time slots configured. Click "+ Add new" to setup.',
    'staff.commission.from': 'From',
    'staff.commission.to': 'To',
    'staff.commission.add_new': 'Add new',
    'staff.commission.cat_hair': 'Hair/Dye',
    'staff.commission.cat_nail': 'Nails',
    'staff.commission.cat_massage': 'Spa & Massage',
    'staff.commission.cat_other': 'Other Services',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("Overtime tab translated successfully!")
