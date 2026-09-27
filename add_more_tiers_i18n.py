import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.tiers.running_review': 'Đang xét hạng...',
    'customers.tiers.or': 'hoặc',
    'customers.tiers.invoice_word': 'hóa đơn',
    'customers.tiers.period_year': 'Hằng năm',
    'customers.tiers.period_6m': 'Hằng 6 tháng',
    'customers.tiers.period_quarter': 'Hằng quý',
    'customers.tiers.period_upgrade': 'Số ngày sau nâng hạng',
    'customers.tiers.days': 'ngày',
    """,
    'en': """
    'customers.tiers.running_review': 'Running review...',
    'customers.tiers.or': 'or',
    'customers.tiers.invoice_word': 'invoice',
    'customers.tiers.period_year': 'Annually',
    'customers.tiers.period_6m': 'Every 6 months',
    'customers.tiers.period_quarter': 'Quarterly',
    'customers.tiers.period_upgrade': 'Days after upgrade',
    'customers.tiers.days': 'days',
    """,
    'ko': """
    'customers.tiers.running_review': '등급 검토 중...',
    'customers.tiers.or': '또는',
    'customers.tiers.invoice_word': '청구서',
    'customers.tiers.period_year': '매년',
    'customers.tiers.period_6m': '매 6개월',
    'customers.tiers.period_quarter': '매 분기',
    'customers.tiers.period_upgrade': '승급 후 일수',
    'customers.tiers.days': '일',
    """,
    'ja': """
    'customers.tiers.running_review': '審査実行中...',
    'customers.tiers.or': 'または',
    'customers.tiers.invoice_word': '請求書',
    'customers.tiers.period_year': '毎年',
    'customers.tiers.period_6m': '6ヶ月ごと',
    'customers.tiers.period_quarter': '四半期ごと',
    'customers.tiers.period_upgrade': 'アップグレード後の日数',
    'customers.tiers.days': '日',
    """,
    'zh': """
    'customers.tiers.running_review': '正在审核等级...',
    'customers.tiers.or': '或',
    'customers.tiers.invoice_word': '发票',
    'customers.tiers.period_year': '每年',
    'customers.tiers.period_6m': '每6个月',
    'customers.tiers.period_quarter': '每季度',
    'customers.tiers.period_upgrade': '升级后天数',
    'customers.tiers.days': '天',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

