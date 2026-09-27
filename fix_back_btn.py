import re

# 1. Update i18n.jsx
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

translations_to_add = {
    'VI': "'invoices.back_to_pos': 'Quay lại thu ngân',",
    'EN': "'invoices.back_to_pos': 'Back to POS',",
    'KO': "'invoices.back_to_pos': 'POS로 돌아가기',",
    'JA': "'invoices.back_to_pos': 'POSに戻る',",
    'ZH': "'invoices.back_to_pos': '返回收银台',"
}

for lang in ['VI', 'EN', 'KO', 'JA', 'ZH']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n    {translations_to_add[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

# 2. Update Invoices.jsx
with open('/Volumes/Coding/GloPro/src/views/Invoices.jsx', 'r', encoding='utf-8') as f:
    inv_content = f.read()

inv_content = inv_content.replace(
    ">Quay lại thu ngân<", 
    ">{t('invoices.back_to_pos', 'Quay lại thu ngân')}<"
)
inv_content = inv_content.replace(
    ">\n            Quay lại thu ngân\n          </button>",
    ">\n            {t('invoices.back_to_pos', 'Quay lại thu ngân')}\n          </button>"
)

with open('/Volumes/Coding/GloPro/src/views/Invoices.jsx', 'w', encoding='utf-8') as f:
    f.write(inv_content)
