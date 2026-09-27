import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.detail.search_purchases_placeholder': 'Tìm tên, mã HĐ, nhân viên...',
    'customers.detail.item': 'Mặt hàng',
    'customers.detail.unit_price': 'Đơn giá',
    'customers.detail.quantity': 'Số lượng',
    'customers.detail.buy_again': 'Mua lại',
    'customers.detail.loading_appointments': 'Đang tải lịch hẹn...',
    'customers.detail.no_appointments_found': 'Không tìm thấy lịch hẹn nào',
    """,
    'en': """
    'customers.detail.search_purchases_placeholder': 'Search name, invoice code, staff...',
    'customers.detail.item': 'Item',
    'customers.detail.unit_price': 'Unit Price',
    'customers.detail.quantity': 'Quantity',
    'customers.detail.buy_again': 'Buy Again',
    'customers.detail.loading_appointments': 'Loading appointments...',
    'customers.detail.no_appointments_found': 'No appointments found',
    """,
    'ko': """
    'customers.detail.search_purchases_placeholder': '이름, 송장 코드, 직원 검색...',
    'customers.detail.item': '품목',
    'customers.detail.unit_price': '단가',
    'customers.detail.quantity': '수량',
    'customers.detail.buy_again': '다시 구매',
    'customers.detail.loading_appointments': '예약 불러오는 중...',
    'customers.detail.no_appointments_found': '예약을 찾을 수 없습니다',
    """,
    'ja': """
    'customers.detail.search_purchases_placeholder': '名前、請求書コード、スタッフを検索...',
    'customers.detail.item': '品目',
    'customers.detail.unit_price': '単価',
    'customers.detail.quantity': '数量',
    'customers.detail.buy_again': '再購入',
    'customers.detail.loading_appointments': '予約を読み込み中...',
    'customers.detail.no_appointments_found': '予約が見つかりません',
    """,
    'zh': """
    'customers.detail.search_purchases_placeholder': '搜索名称、发票代码、员工...',
    'customers.detail.item': '物品',
    'customers.detail.unit_price': '单价',
    'customers.detail.quantity': '数量',
    'customers.detail.buy_again': '再次购买',
    'customers.detail.loading_appointments': '正在加载预约...',
    'customers.detail.no_appointments_found': '未找到预约',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("i18n.jsx modified with p9 keys.")
