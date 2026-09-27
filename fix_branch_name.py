import re

with open('src/components/staff/ShiftTemplateManager.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace {b.name} with {b.name === 'Tất cả chi nhánh' ? t('common.all_branches', 'Tất cả chi nhánh') : b.name}
content = content.replace("{b.name}", "{b.name === 'Tất cả chi nhánh' ? t('common.all_branches', 'Tất cả chi nhánh') : b.name}")

with open('src/components/staff/ShiftTemplateManager.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Update i18n
with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

if "'common.all_branches'" not in i18n:
    i18n = re.sub(r'(\n  vi: {\n)', r'\1' + "    'common.all_branches': 'Tất cả chi nhánh',\n", i18n)
    i18n = re.sub(r'(\n  en: {\n)', r'\1' + "    'common.all_branches': 'All Branches',\n", i18n)

    with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
        f.write(i18n)

print("Branch translated successfully!")
