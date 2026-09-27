import re

with open('src/components/staff/ShiftTemplateManager.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace {branch.name} with {branch.name === 'Tất cả chi nhánh' ? t('common.all_branches', 'Tất cả chi nhánh') : branch.name}
content = content.replace("{branch.name}", "{branch.name === 'Tất cả chi nhánh' ? t('common.all_branches', 'Tất cả chi nhánh') : branch.name}")

with open('src/components/staff/ShiftTemplateManager.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Branch translated successfully again!")
