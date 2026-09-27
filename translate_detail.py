import re

with open('/Volumes/Coding/GloPro/src/views/InvoiceDetail.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add useT import
if "import { useT }" not in content:
    content = content.replace("import { useParams, useRouter }", "import { useParams, useRouter }\nimport { useT } from '@/lib/i18n';")

# 2. Add useT hook inside InvoiceDetail
if "const { t } = useT();" not in content:
    content = content.replace(
        "export default function InvoiceDetail({ invoiceId: invoiceIdProp } = {}) {\n  const params",
        "export default function InvoiceDetail({ invoiceId: invoiceIdProp } = {}) {\n  const { t } = useT();\n  const params"
    )

# 3. Move METHODS, STATUS_BADGE, TYPE_LABELS inside InvoiceDetail
# Extract them first
methods_match = re.search(r'const METHODS = \[.*?\];', content, flags=re.DOTALL)
status_badge_match = re.search(r'const STATUS_BADGE = \{.*?\};', content, flags=re.DOTALL)
type_labels_match = re.search(r'const TYPE_LABELS = \{.*?\};', content, flags=re.DOTALL)

if methods_match and status_badge_match and type_labels_match:
    methods_str = methods_match.group(0)
    status_str = status_badge_match.group(0)
    type_str = type_labels_match.group(0)

    # Remove from global
    content = content.replace(methods_str, "")
    content = content.replace(status_str, "")
    content = content.replace(type_str, "")

    # Inject inside component with translations
    methods_translated = """  const METHODS = [
    { value: 'cash', label: t('pos.payment.cash', 'Tiền mặt') },
    { value: 'transfer', label: t('pos.payment.transfer', 'Chuyển khoản') },
    { value: 'card', label: t('pos.payment.card', 'Thẻ tín dụng') },
    { value: 'ewallet', label: t('pos.payment.ewallet', 'Ví điện tử') },
    { value: 'membership', label: t('pos.payment.membership', 'Thẻ tiền mặt') },
    { value: 'points', label: t('pos.payment.points', 'Điểm tích lũy') },
    { value: 'debt', label: t('pos.payment.debt', 'Ghi nợ') },
  ];"""

    status_translated = """  const STATUS_BADGE = {
    paid: { bg: '#E6F4EA', text: '#137333', border: '#CEEAD6', label: t('invoices.status.paid', 'Đã thanh toán') },
    unpaid: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: t('invoices.status.unpaid', 'Chưa thanh toán') },
    cancelled: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5', label: t('invoices.status.cancelled', 'Đã huỷ') },
    refunded: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5', label: t('invoices.status.refunded', 'Đã hoàn') },
  };"""

    type_translated = """  const TYPE_LABELS = {
    service: t('pos.invoice.service', 'Dịch vụ'),
    product: t('pos.invoice.product', 'Sản phẩm'),
    package: t('pos.invoice.package', 'Gói dịch vụ'),
    treatment: t('pos.invoice.treatment', 'Liệu trình'),
    service_combo: t('pos.invoice.service_combo', 'Combo dịch vụ'),
    product_combo: t('pos.invoice.product_combo', 'Combo sản phẩm'),
    prepaid_card: t('pos.invoice.prepaid_card', 'Thẻ tiền mặt'),
  };"""

    insertion = f"\n{methods_translated}\n\n{status_translated}\n\n{type_translated}\n"
    content = content.replace("const { t } = useT();\n  const params = useParams();", f"const {{ t }} = useT();\n{insertion}  const params = useParams();")


# Let's do simple text replacements
replacements = [
    ("'Không tìm thấy hoá đơn'", "t('invoice_detail.not_found', 'Không tìm thấy hoá đơn')"),
    ("Chi tiết hoá đơn", "{t('invoice_detail.title', 'Chi tiết hoá đơn')}"),
    ("'Chỉnh sửa hoá đơn'", "t('invoices.action.edit', 'Chỉnh sửa hoá đơn')"),
    ("'Cập nhật lại chi tiết hoá đơn và giảm giá ('", "t('invoice_detail.log_edit_discount', 'Cập nhật lại chi tiết hoá đơn và giảm giá (')"),
    ("'Đã cập nhật hoá đơn'", "t('invoice_detail.toast_updated', 'Đã cập nhật hoá đơn')"),
    ("'Lỗi: '", "t('invoices.error_prefix', 'Lỗi: ')"),
    ("'Đã huỷ hoá đơn'", "t('invoices.action.delete', 'Đã huỷ hoá đơn')"),
    ("'Đã huỷ hoá đơn. Đang chuyển về danh sách...'", "t('invoice_detail.toast_deleted', 'Đã huỷ hoá đơn. Đang chuyển về danh sách...')"),
    ("Lịch sử thao tác", "{t('invoice_detail.action_history', 'Lịch sử thao tác')}"),
    ("Huỷ hoá đơn", "{t('invoices.action.delete', 'Huỷ hoá đơn')}"),
    ("Xếp nhân viên", "{t('invoice_detail.assign_staff', 'Xếp nhân viên')}"),
    ("In hoá đơn", "{t('invoices.action.print', 'In hoá đơn')}"),
    ("Chỉnh sửa", "{t('invoices.action.edit', 'Chỉnh sửa')}"),
    ("Huỷ thanh toán", "{t('invoices.action.cancel_payment', 'Huỷ thanh toán')}"),
    ("Lưu thay đổi", "{t('invoice_detail.save_changes', 'Lưu thay đổi')}"),
    (">Tên<", ">{t('invoice_detail.table.name', 'Tên')}<"),
    (">Loại<", ">{t('invoice_detail.table.type', 'Loại')}<"),
    (">Nhân viên<", ">{t('invoices.table.staff', 'Nhân viên')}<"),
    (">Đơn giá<", ">{t('invoice_detail.table.unit_price', 'Đơn giá')}<"),
    (">Số lượng<", ">{t('invoice_detail.table.qty', 'Số lượng')}<"),
    (">Giảm giá<", ">{t('invoices.print.discount', 'Giảm giá')}<"),
    (">Tổng tiền<", ">{t('invoices.table.total', 'Tổng tiền')}<"),
    ("'Chưa xếp nhân viên'", "t('appointments.unassigned', 'Chưa xếp nhân viên')"),
    ("Thành tiền", "{t('invoice_detail.subtotal', 'Thành tiền')}"),
    ("Thanh toán", "{t('invoice_detail.pay', 'Thanh toán')}"),
    ("Đã thanh toán", "{t('invoices.status.paid', 'Đã thanh toán')}"),
    ("Cần thanh toán", "{t('invoice_detail.need_to_pay', 'Cần thanh toán')}"),
    ("Khách vãng lai", "{t('invoices.walk_in', 'Khách vãng lai')}"),
    ("'Thanh toán hoá đơn ' + invoice.code", "t('invoice_detail.log_pay', 'Thanh toán hoá đơn ') + invoice.code"),
    ("'Đã thanh toán thành công'", "t('invoice_detail.toast_pay_success', 'Đã thanh toán thành công')"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('/Volumes/Coding/GloPro/src/views/InvoiceDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

