import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.detail.default_tier_promo': 'Mặc định hưởng ưu đãi hạng:',
    'customers.detail.tier_normal': 'thường',
    'customers.detail.give_promotion_btn': 'Tặng ưu đãi',
    'common.status_used': 'Đã dùng',
    """,
    'en': """
    'customers.detail.default_tier_promo': 'Default tier promotion:',
    'customers.detail.tier_normal': 'normal',
    'customers.detail.give_promotion_btn': 'Give Promotion',
    'common.status_used': 'Used',
    """,
    'zh': """
    'customers.detail.default_tier_promo': '默认等级优惠:',
    'customers.detail.tier_normal': '正常',
    'customers.detail.give_promotion_btn': '赠送促销',
    'common.status_used': '已使用',
    """,
    'ko': """
    'customers.detail.default_tier_promo': '기본 등급 프로모션:',
    'customers.detail.tier_normal': '일반',
    'customers.detail.give_promotion_btn': '프로모션 선물하기',
    'common.status_used': '사용됨',
    """,
    'ja': """
    'customers.detail.default_tier_promo': 'デフォルトティアプロモーション:',
    'customers.detail.tier_normal': '通常',
    'customers.detail.give_promotion_btn': 'プロモーションを付与',
    'common.status_used': '使用済み',
    """
}

for lang, new_keys in new_translations.items():
    pattern = r'(' + lang + r':\s*\{)'
    replacement = r'\1\n' + new_keys
    i18n_content = re.sub(pattern, replacement, i18n_content)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("Added new keys successfully.")
