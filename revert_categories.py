with open('src/components/staff/CommissionMatrix.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "? t('staff.commission.cat_hair', 'Uốn/Duỗi/Nhuộm') :": "? 'Uốn/Duỗi/Nhuộm' :",
    "? t('staff.commission.cat_nail', 'Nail & Móng') :": "? 'Nail & Móng' :",
    "? t('staff.commission.cat_massage', 'Spa & Massage') :": "? 'Spa & Massage' :",
    ": t('staff.commission.cat_other', 'Dịch vụ khác')": ": 'Dịch vụ khác'"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/CommissionMatrix.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Reverted service categories!")
