import re

# 1. Update i18n.jsx
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

translations_to_add = {
    'VI': "'nav.deposits': 'Đặt cọc',",
    'EN': "'nav.inventory': 'Inventory', 'nav.deposits': 'Deposits',",
    'KO': "'nav.inventory': '재고', 'nav.deposits': '보증금',",
    'JA': "'nav.inventory': '在庫', 'nav.deposits': 'デポジット',",
    'ZH': "'nav.inventory': '库存', 'nav.deposits': '押金',"
}

for lang in ['VI', 'EN', 'KO', 'JA', 'ZH']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n    {translations_to_add[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

# 2. Update Layout.jsx
with open('/Volumes/Coding/GloPro/src/components/Layout.jsx', 'r', encoding='utf-8') as f:
    layout = f.read()

layout = layout.replace("tkey: 'Đặt cọc'", "tkey: 'nav.deposits'")

with open('/Volumes/Coding/GloPro/src/components/Layout.jsx', 'w', encoding='utf-8') as f:
    f.write(layout)
