import re

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    (">Nữ<", ">{t('customers.form.female', 'Nữ')}<"),
    (">Nam<", ">{t('customers.form.male', 'Nam')}<"),
    (">Khác<", ">{t('customers.form.other', 'Khác')}<"),
    (">Ngày sinh<", ">{t('customers.form.birth_date', 'Ngày sinh')}<"),
    ('placeholder="Ngày sinh"', 'placeholder={t("customers.form.birth_date_placeholder", "Ngày sinh")}'),
]

for old, new in replacements:
    c = c.replace(old, new)
    
with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(c)


# i18n
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.form.female': 'Nữ',
    'customers.form.male': 'Nam',
    'customers.form.other': 'Khác',
    'customers.form.birth_date': 'Ngày sinh',
    'customers.form.birth_date_placeholder': 'Ngày sinh',
    """,
    'en': """
    'customers.form.female': 'Female',
    'customers.form.male': 'Male',
    'customers.form.other': 'Other',
    'customers.form.birth_date': 'Birth Date',
    'customers.form.birth_date_placeholder': 'Birth Date',
    """,
    'ko': """
    'customers.form.female': '여성',
    'customers.form.male': '남성',
    'customers.form.other': '기타',
    'customers.form.birth_date': '생년월일',
    'customers.form.birth_date_placeholder': '생년월일',
    """,
    'ja': """
    'customers.form.female': '女性',
    'customers.form.male': '男性',
    'customers.form.other': 'その他',
    'customers.form.birth_date': '生年月日',
    'customers.form.birth_date_placeholder': '生年月日',
    """,
    'zh': """
    'customers.form.female': '女性',
    'customers.form.male': '男性',
    'customers.form.other': '其他',
    'customers.form.birth_date': '出生日期',
    'customers.form.birth_date_placeholder': '出生日期',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

