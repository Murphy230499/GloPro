import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.detail.search_history_placeholder': 'Tìm tên, mã HĐ, nhân viên...',
    'customers.detail.invoice_code': 'Mã HĐ',
    'customers.detail.item_details': 'Chi tiết dịch vụ/sản phẩm',
    'customers.detail.search_invoice_placeholder': 'Tìm mã hóa đơn, tên hàng...',
    """,
    'en': """
    'customers.detail.search_history_placeholder': 'Search name, invoice code, staff...',
    'customers.detail.invoice_code': 'Invoice Code',
    'customers.detail.item_details': 'Service/Product Details',
    'customers.detail.search_invoice_placeholder': 'Search invoice code, item name...',
    """,
    'ko': """
    'customers.detail.search_history_placeholder': '이름, 송장 코드, 직원 검색...',
    'customers.detail.invoice_code': '송장 코드',
    'customers.detail.item_details': '서비스/제품 상세',
    'customers.detail.search_invoice_placeholder': '송장 코드, 항목 이름 검색...',
    """,
    'ja': """
    'customers.detail.search_history_placeholder': '名前、請求書コード、スタッフを検索...',
    'customers.detail.invoice_code': '請求書コード',
    'customers.detail.item_details': 'サービス/商品の詳細',
    'customers.detail.search_invoice_placeholder': '請求書コード、商品名を検索...',
    """,
    'zh': """
    'customers.detail.search_history_placeholder': '搜索姓名、发票代码、员工...',
    'customers.detail.invoice_code': '发票代码',
    'customers.detail.item_details': '服务/产品详情',
    'customers.detail.search_invoice_placeholder': '搜索发票代码，商品名称...',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("i18n.jsx modified with invoice table keys.")
