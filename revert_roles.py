with open('src/components/staff/CommissionMatrix.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "return t('staff.commission.roles.primary', 'Thợ chính');": "return 'Thợ chính';",
    "return t('staff.commission.roles.assistant', 'Thợ phụ');": "return 'Thợ phụ';",
    "return t('staff.commission.roles.technician', 'Kỹ thuật viên');": "return 'Kỹ thuật viên';",
    "return t('staff.commission.roles.cashier', 'Thu ngân');": "return 'Thu ngân';",
    "return t('staff.commission.roles.manager', 'Quản lý');": "return 'Quản lý';",
    "return t('staff.commission.roles.partner', 'Đối tác');": "return 'Đối tác';",
    "return t('staff.commission.roles.default', 'Nhân viên');": "return 'Nhân viên';"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/CommissionMatrix.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Reverted staff roles!")
