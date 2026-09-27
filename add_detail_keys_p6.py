import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.detail.search_invoice_placeholder': 'Tìm mã hóa đơn, tên hàng...',
    """,
    'en': """
    'customers.detail.search_invoice_placeholder': 'Search invoice code, item name...',
    """,
    'ko': """
    'customers.detail.search_invoice_placeholder': '송장 코드, 항목 이름 검색...',
    """,
    'ja': """
    'customers.detail.search_invoice_placeholder': '請求書コード、品名を検索...',
    """,
    'zh': """
    'customers.detail.search_invoice_placeholder': '搜索发票代码、商品名称...',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("i18n.jsx modified with p6 keys.")
