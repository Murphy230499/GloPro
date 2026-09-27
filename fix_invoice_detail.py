import re

# 1. Update i18n.jsx
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

translations_to_add = {
    'VI': """
    'invoice_detail.title': 'Chi tiết hoá đơn',
    'invoice_detail.action_history': 'Lịch sử thao tác',
    'invoice_detail.assign_staff': 'Xếp nhân viên',
    'invoice_detail.table.name': 'Tên',
    'invoice_detail.table.type': 'Loại',
    'invoice_detail.table.unit_price': 'Đơn giá',
    'invoice_detail.table.qty': 'Số lượng',
    'invoice_detail.subtotal': 'Thành tiền',
    'invoice_detail.need_to_pay': 'Cần thanh toán',
    'invoice_detail.type.service': 'Làm dịch vụ',
    'invoice_detail.type.package': 'Bán gói',
    'invoice_detail.type.product': 'Bán sản phẩm',
    'invoice_detail.unassigned': 'Chưa xếp nhân viên',
    """,
    'EN': """
    'invoice_detail.title': 'Invoice Details',
    'invoice_detail.action_history': 'Action History',
    'invoice_detail.assign_staff': 'Assign Staff',
    'invoice_detail.table.name': 'Name',
    'invoice_detail.table.type': 'Type',
    'invoice_detail.table.unit_price': 'Unit Price',
    'invoice_detail.table.qty': 'Quantity',
    'invoice_detail.subtotal': 'Subtotal',
    'invoice_detail.need_to_pay': 'To Pay',
    'invoice_detail.type.service': 'Service',
    'invoice_detail.type.package': 'Package',
    'invoice_detail.type.product': 'Product',
    'invoice_detail.unassigned': 'Unassigned',
    """,
    'KO': """
    'invoice_detail.title': '청구서 상세',
    'invoice_detail.action_history': '작업 내역',
    'invoice_detail.assign_staff': '직원 배정',
    'invoice_detail.table.name': '이름',
    'invoice_detail.table.type': '유형',
    'invoice_detail.table.unit_price': '단가',
    'invoice_detail.table.qty': '수량',
    'invoice_detail.subtotal': '소계',
    'invoice_detail.need_to_pay': '결제 금액',
    'invoice_detail.type.service': '서비스',
    'invoice_detail.type.package': '패키지',
    'invoice_detail.type.product': '제품',
    'invoice_detail.unassigned': '미배정',
    """,
    'JA': """
    'invoice_detail.title': '請求書詳細',
    'invoice_detail.action_history': '操作履歴',
    'invoice_detail.assign_staff': 'スタッフの割り当て',
    'invoice_detail.table.name': '名前',
    'invoice_detail.table.type': '種類',
    'invoice_detail.table.unit_price': '単価',
    'invoice_detail.table.qty': '数量',
    'invoice_detail.subtotal': '小計',
    'invoice_detail.need_to_pay': '支払額',
    'invoice_detail.type.service': 'サービス',
    'invoice_detail.type.package': 'パッケージ',
    'invoice_detail.type.product': '製品',
    'invoice_detail.unassigned': '未割り当て',
    """,
    'ZH': """
    'invoice_detail.title': '账单详情',
    'invoice_detail.action_history': '操作历史',
    'invoice_detail.assign_staff': '分配员工',
    'invoice_detail.table.name': '名称',
    'invoice_detail.table.type': '类型',
    'invoice_detail.table.unit_price': '单价',
    'invoice_detail.table.qty': '数量',
    'invoice_detail.subtotal': '小计',
    'invoice_detail.need_to_pay': '应付',
    'invoice_detail.type.service': '服务',
    'invoice_detail.type.package': '套餐',
    'invoice_detail.type.product': '产品',
    'invoice_detail.unassigned': '未分配',
    """
}

for lang in ['VI', 'EN', 'KO', 'JA', 'ZH']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{translations_to_add[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

# 2. Update InvoiceDetail.jsx
with open('/Volumes/Coding/GloPro/src/views/InvoiceDetail.jsx', 'r', encoding='utf-8') as f:
    inv_content = f.read()

inv_content = inv_content.replace(
    "<div>Làm dịch vụ</div>",
    "<div>{t('invoice_detail.type.service', 'Làm dịch vụ')}</div>"
)
inv_content = inv_content.replace(
    "<div>Bán gói</div>",
    "<div>{t('invoice_detail.type.package', 'Bán gói')}</div>"
)
inv_content = inv_content.replace(
    "<div>Bán sản phẩm</div>",
    "<div>{t('invoice_detail.type.product', 'Bán sản phẩm')}</div>"
)
inv_content = inv_content.replace(
    "<span className=\"text-slate-400 font-normal\">Chưa xếp nhân viên</span>",
    "<span className=\"text-slate-400 font-normal\">{t('invoice_detail.unassigned', 'Chưa xếp nhân viên')}</span>"
)

# And also replace other small texts like 'hàng loạt' -> t()
inv_content = inv_content.replace(
    "hàng loạt",
    "{t('invoice_detail.bulk', 'hàng loạt')}"
)

# Replace 'đơn' in Lịch sử thao tác đơn
inv_content = inv_content.replace(
    "Lịch sử thao tác'} đơn",
    "Lịch sử thao tác'}"
)

with open('/Volumes/Coding/GloPro/src/views/InvoiceDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(inv_content)

