import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.detail.cancel_payment_edit': 'Huỷ thanh toán & Sửa',
    'customers.form.staff': 'Nhân viên',
    'customers.detail.spa_service': 'Dịch vụ spa',
    'customers.detail.guest_customer': 'Khách vãng lai',
    """,
    'en': """
    'customers.detail.cancel_payment_edit': 'Cancel Payment & Edit',
    'customers.form.staff': 'Staff',
    'customers.detail.spa_service': 'Spa Service',
    'customers.detail.guest_customer': 'Walk-in Guest',
    """,
    'ko': """
    'customers.detail.cancel_payment_edit': '결제 취소 및 편집',
    'customers.form.staff': '직원',
    'customers.detail.spa_service': '스파 서비스',
    'customers.detail.guest_customer': '워크인 고객',
    """,
    'ja': """
    'customers.detail.cancel_payment_edit': '支払いのキャンセルと編集',
    'customers.form.staff': 'スタッフ',
    'customers.detail.spa_service': 'スパサービス',
    'customers.detail.guest_customer': 'ウォークインゲスト',
    """,
    'zh': """
    'customers.detail.cancel_payment_edit': '取消付款并编辑',
    'customers.form.staff': '员工',
    'customers.detail.spa_service': '水疗服务',
    'customers.detail.guest_customer': '散客',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("i18n.jsx modified with p8 keys.")
