import re

with open('/Volumes/Coding/GloPro/src/components/customers/LoyaltyPointsTab.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    (">Hằng năm<", ">{t('customers.tiers.period_year', 'Hằng năm')}<"),
    (">Hằng 6 tháng<", ">{t('customers.tiers.period_6m', 'Hằng 6 tháng')}<"),
    (">Hằng quý<", ">{t('customers.tiers.period_quarter', 'Hằng quý')}<"),
    (">Xét khoảng thời gian không ghé<", ">{t('customers.points.inactive_duration', 'Xét khoảng thời gian không ghé')}<")
]

for old, new in replacements:
    c = c.replace(old, new)
    
with open('/Volumes/Coding/GloPro/src/components/customers/LoyaltyPointsTab.jsx', 'w', encoding='utf-8') as f:
    f.write(c)


# i18n
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.points.inactive_duration': 'Xét khoảng thời gian không ghé',
    """,
    'en': """
    'customers.points.inactive_duration': 'Based on inactive period',
    """,
    'ko': """
    'customers.points.inactive_duration': '미방문 기간 기준',
    """,
    'ja': """
    'customers.points.inactive_duration': '未訪問期間に基づく',
    """,
    'zh': """
    'customers.points.inactive_duration': '基于未访问时长',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

