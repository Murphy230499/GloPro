with open('src/components/staff/CommissionMatrix.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = "t('staff.commission.copy_success', '{t('staff.commission.copy', 'Sao chép')} hoa hồng thành công!')"
good_str = "t('staff.commission.copy_success', 'Sao chép hoa hồng thành công!')"

content = content.replace(bad_str, good_str)

with open('src/components/staff/CommissionMatrix.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed nested replace")
