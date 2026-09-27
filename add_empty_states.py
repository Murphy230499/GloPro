import re

with open('/Volumes/Coding/GloPro/src/components/customers/CustomerTiersTab.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    ">Chưa có hạng thành viên nào được định nghĩa<",
    ">{t('customers.tiers.empty', 'Chưa có hạng thành viên nào được định nghĩa')}<"
)
c = c.replace(
    ">Đang tải cấu hình hạng...<",
    ">{t('customers.tiers.loading', 'Đang tải cấu hình hạng...')}<"
)

with open('/Volumes/Coding/GloPro/src/components/customers/CustomerTiersTab.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

# i18n
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.tiers.empty': 'Chưa có hạng thành viên nào được định nghĩa',
    'customers.tiers.loading': 'Đang tải cấu hình hạng...',
    """,
    'en': """
    'customers.tiers.empty': 'No member tier defined yet',
    'customers.tiers.loading': 'Loading tier config...',
    """,
    'ko': """
    'customers.tiers.empty': '정의된 회원 등급이 없습니다',
    'customers.tiers.loading': '등급 구성 로딩 중...',
    """,
    'ja': """
    'customers.tiers.empty': '定義された会員ランクはありません',
    'customers.tiers.loading': 'ランク設定を読み込み中...',
    """,
    'zh': """
    'customers.tiers.empty': '尚未定义会员等级',
    'customers.tiers.loading': '正在加载等级配置...',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

