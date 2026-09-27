import re

with open('src/components/staff/AdvancedConfigModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Trước giảm giá\n", "{t('staff.commission.before_discount', 'Trước giảm giá')}\n")
content = content.replace("Sau giảm giá\n", "{t('staff.commission.after_discount', 'Sau giảm giá')}\n")

with open('src/components/staff/AdvancedConfigModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("AdvancedConfigModal labels translated successfully!")
