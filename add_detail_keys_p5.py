import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.detail.invoice_code': 'Mã HĐ',
    'customers.detail.item_details': 'Chi tiết dịch vụ/sản phẩm',
    'customers.detail.edit_info': 'Sửa thông tin khách',
    'customers.detail.delete_customer': 'Xóa khách hàng',
    'customers.detail.group': 'Nhóm:',
    'common.from_date': 'Từ ngày',
    'common.to_date': 'Đến ngày',
    'common.clear_filter': 'Xóa bộ lọc',
    'customers.detail.no_invoice_found': 'Không tìm thấy hóa đơn nào phù hợp',
    """,
    'en': """
    'customers.detail.invoice_code': 'Invoice Code',
    'customers.detail.item_details': 'Service/Product Details',
    'customers.detail.edit_info': 'Edit Information',
    'customers.detail.delete_customer': 'Delete Customer',
    'customers.detail.group': 'Group:',
    'common.from_date': 'From Date',
    'common.to_date': 'To Date',
    'common.clear_filter': 'Clear Filter',
    'customers.detail.no_invoice_found': 'No matching invoice found',
    """,
    'ko': """
    'customers.detail.invoice_code': '송장 번호',
    'customers.detail.item_details': '서비스/제품 세부 정보',
    'customers.detail.edit_info': '정보 수정',
    'customers.detail.delete_customer': '고객 삭제',
    'customers.detail.group': '그룹:',
    'common.from_date': '시작일',
    'common.to_date': '종료일',
    'common.clear_filter': '필터 지우기',
    'customers.detail.no_invoice_found': '일치하는 송장을 찾을 수 없습니다',
    """,
    'ja': """
    'customers.detail.invoice_code': '請求書コード',
    'customers.detail.item_details': 'サービス/製品の詳細',
    'customers.detail.edit_info': '情報編集',
    'customers.detail.delete_customer': '顧客を削除',
    'customers.detail.group': 'グループ:',
    'common.from_date': '開始日',
    'common.to_date': '終了日',
    'common.clear_filter': 'フィルターをクリア',
    'customers.detail.no_invoice_found': '一致する請求書が見つかりません',
    """,
    'zh': """
    'customers.detail.invoice_code': '发票代码',
    'customers.detail.item_details': '服务/产品详情',
    'customers.detail.edit_info': '编辑信息',
    'customers.detail.delete_customer': '删除客户',
    'customers.detail.group': '群组:',
    'common.from_date': '开始日期',
    'common.to_date': '结束日期',
    'common.clear_filter': '清除筛选',
    'customers.detail.no_invoice_found': '未找到匹配的发票',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("i18n.jsx modified with p5 keys.")
