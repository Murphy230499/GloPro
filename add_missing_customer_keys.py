import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.form.address': 'Địa chỉ',
    'customers.form.address_placeholder': 'Địa chỉ',
    'customers.form.ref_staff': 'Nhân viên',
    'customers.form.ref_customer': 'Khách hàng',
    'customers.form.ref_none': 'Không có',
    """,
    'en': """
    'customers.form.address': 'Address',
    'customers.form.address_placeholder': 'Address',
    'customers.form.ref_staff': 'Staff',
    'customers.form.ref_customer': 'Customer',
    'customers.form.ref_none': 'None',
    """,
    'ko': """
    'customers.form.address': '주소',
    'customers.form.address_placeholder': '주소',
    'customers.form.ref_staff': '직원',
    'customers.form.ref_customer': '고객',
    'customers.form.ref_none': '없음',
    """,
    'ja': """
    'customers.form.address': '住所',
    'customers.form.address_placeholder': '住所',
    'customers.form.ref_staff': 'スタッフ',
    'customers.form.ref_customer': '顧客',
    'customers.form.ref_none': 'なし',
    """,
    'zh': """
    'customers.form.address': '地址',
    'customers.form.address_placeholder': '地址',
    'customers.form.ref_staff': '员工',
    'customers.form.ref_customer': '客户',
    'customers.form.ref_none': '无',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

