import sys

def process(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'useT' not in content:
        import_block_end = content.rfind('import')
        if import_block_end != -1:
            next_newline = content.find('\n', import_block_end)
            content = content[:next_newline+1] + "import { useT } from '@/lib/i18n';\n" + content[next_newline+1:]
        
        comp_def = content.find('export default function')
        if comp_def != -1:
            next_brace = content.find('{', comp_def)
            content = content[:next_brace+1] + "\n  const { t } = useT();" + content[next_brace+1:]

    for old, new in replacements:
        content = content.replace(old, new)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

invoices_reps = [
    ("'Chọn ngày'", "t('invoices.select_date', 'Chọn ngày')"),
    ('>Từ:<', '>{t("invoices.from", "Từ:")}<'),
    ('"Xóa ngày"', 't("invoices.clear_date", "Xóa ngày")'),
    ('>Đến:<', '>{t("invoices.to", "Đến:")}<'),
    ("'NHÂN VIÊN CHUYÊN MÔN'", "t('invoices.specialist', 'NHÂN VIÊN CHUYÊN MÔN')"),
    ("'Chọn nhân viên áp dụng'", "t('invoices.select_staff', 'Chọn nhân viên áp dụng')"),
    ('"Xóa lọc nhân viên"', 't("invoices.clear_staff", "Xóa lọc nhân viên")'),
    ('"Tìm kiếm nhân viên..."', 't("invoices.search_staff", "Tìm kiếm nhân viên...")'),
    ('>Chọn tất cả<', '>{t("invoices.select_all", "Chọn tất cả")}<'),
    ("'Chọn khách hàng áp dụng'", "t('invoices.select_customer', 'Chọn khách hàng áp dụng')"),
    ("'Khách vãng lai'", "t('invoices.walk_in', 'Khách vãng lai')"),
    ('"Khách vãng lai"', 't("invoices.walk_in", "Khách vãng lai")'),
    (">Khách vãng lai<", ">{t('invoices.walk_in', 'Khách vãng lai')}<"),
    ('"Xóa lọc khách hàng"', 't("invoices.clear_customer", "Xóa lọc khách hàng")'),
    ('"Tìm kiếm khách hàng..."', 't("invoices.search_customer", "Tìm kiếm khách hàng...")'),
    ("'Tất cả'", "t('invoices.status.all', 'Tất cả')"),
    ("'Chưa thanh toán'", "t('invoices.status.unpaid', 'Chưa thanh toán')"),
    ("'Đã thanh toán'", "t('invoices.status.paid', 'Đã thanh toán')"),
    ("'Đã huỷ'", "t('invoices.status.cancelled', 'Đã huỷ')"),
    ("'Đã huỷ thanh toán. Đang chuyển về màn hình Thu ngân...'", "t('invoices.cancel_payment_success', 'Đã huỷ thanh toán. Đang chuyển về màn hình Thu ngân...')"),
    ("'Lỗi: '", "t('invoices.error_prefix', 'Lỗi: ')"),
    ("'Lỗi khi cập nhật trạng thái thẻ mua kèm hoá đơn:'", "t('invoices.error_update_card', 'Lỗi khi cập nhật trạng thái thẻ mua kèm hoá đơn:')"),
    ("'Đã huỷ/xoá hoá đơn'", "t('invoices.cancel_success', 'Đã huỷ/xoá hoá đơn')"),
    ("'Đã xoá vĩnh viễn hoá đơn'", "t('invoices.permanent_delete_success', 'Đã xoá vĩnh viễn hoá đơn')"),
    ("'Lỗi khi thanh toán hóa đơn:'", "t('invoices.error_payment', 'Lỗi khi thanh toán hóa đơn:')"),
    ("'Lỗi khi thanh toán: '", "t('invoices.error_payment_prefix', 'Lỗi khi thanh toán: ')"),
    ("'Lỗi khi khôi phục trạng thái thẻ mua kèm hoá đơn:'", "t('invoices.error_restore_card', 'Lỗi khi khôi phục trạng thái thẻ mua kèm hoá đơn:')"),
    ("`Đã khôi phục hoá đơn về trạng thái ${targetStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}`", "`Đã khôi phục hoá đơn về trạng thái ${targetStatus === 'paid' ? t('invoices.status.paid', 'Đã thanh toán') : t('invoices.status.unpaid', 'Chưa thanh toán')}`"),
    (">Danh sách hoá đơn<", ">{t('invoices.title', 'Danh sách hoá đơn')}<"),
    ('"Tìm theo mã đơn, khách hàng hoặc nhân viên..."', 't("invoices.search_placeholder", "Tìm theo mã đơn, khách hàng hoặc nhân viên...")'),
    (">Lọc<", ">{t('invoices.filter', 'Lọc')}<"),
    (">In danh sách<", ">{t('invoices.print_list', 'In danh sách')}<"),
    (">Chưa có hoá đơn nào.<", ">{t('invoices.empty', 'Chưa có hoá đơn nào.')}<"),
    (">Không có hoá đơn nào phù hợp bộ lọc<", ">{t('invoices.empty_filter', 'Không có hoá đơn nào phù hợp bộ lọc')}<"),
    (">Mã đơn<", ">{t('invoices.table.code', 'Mã đơn')}<"),
    (">Khách hàng<", ">{t('invoices.table.customer', 'Khách hàng')}<"),
    (">Nhân viên<", ">{t('invoices.table.staff', 'Nhân viên')}<"),
    (">Ngày tạo<", ">{t('invoices.table.created_at', 'Ngày tạo')}<"),
    (">Tổng tiền<", ">{t('invoices.table.total', 'Tổng tiền')}<"),
    (">Trạng thái<", ">{t('invoices.table.status', 'Trạng thái')}<"),
    (">Hành động<", ">{t('invoices.table.action', 'Hành động')}<"),
    ('"Click để xem chi tiết khách hàng"', 't("invoices.view_customer", "Click để xem chi tiết khách hàng")'),
    ('"Huỷ thanh toán & Sửa"', 't("invoices.action.cancel_edit", "Huỷ thanh toán & Sửa")'),
    ('"In hoá đơn"', 't("invoices.action.print", "In hoá đơn")'),
    ('"Xoá hoá đơn"', 't("invoices.action.delete", "Xoá hoá đơn")'),
    ('"Thanh toán hóa đơn"', 't("invoices.action.pay", "Thanh toán hóa đơn")'),
    ('"Chỉnh sửa hóa đơn"', 't("invoices.action.edit", "Chỉnh sửa hóa đơn")'),
    ('"Khôi phục hoá đơn"', 't("invoices.action.restore", "Khôi phục hoá đơn")'),
    ('"Xoá vĩnh viễn hoá đơn"', 't("invoices.action.permanent_delete", "Xoá vĩnh viễn hoá đơn")'),
    ("'In hoá đơn tạm tính' : 'In hóa đơn thanh toán'", "t('invoices.print_draft', 'In hoá đơn tạm tính') : t('invoices.print_final', 'In hóa đơn thanh toán')"),
    ("'HÓA ĐƠN TẠM TÍNH' : 'HÓA ĐƠN BÁN HÀNG'", "t('invoices.receipt_draft', 'HÓA ĐƠN TẠM TÍNH') : t('invoices.receipt_final', 'HÓA ĐƠN BÁN HÀNG')"),
    (">Tên khách hàng:<", ">{t('invoices.print.customer_name', 'Tên khách hàng:')}<"),
    (">Số điện thoại:<", ">{t('invoices.print.phone', 'Số điện thoại:')}<"),
    (">Mã hóa đơn:<", ">{t('invoices.print.code', 'Mã hóa đơn:')}<"),
    (">Tạm tính:<", ">{t('invoices.print.subtotal', 'Tạm tính:')}<"),
    (">Giảm giá:<", ">{t('invoices.print.discount', 'Giảm giá:')}<"),
    (">Thuế (Tax):<", ">{t('invoices.print.tax', 'Thuế (Tax):')}<"),
    (">Tiền tip:<", ">{t('invoices.print.tip', 'Tiền tip:')}<"),
    (">TỔNG THANH TOÁN:<", ">{t('invoices.print.total', 'TỔNG THANH TOÁN:')}<"),
    (">Phương thức thanh toán<", ">{t('invoices.print.payment_method', 'Phương thức thanh toán')}<"),
    (">Quét mã QR để tải ứng dụng đặt lịch hẹn<", ">{t('invoices.print.qr_note', 'Quét mã QR để tải ứng dụng đặt lịch hẹn')}<"),
    ("'Đang thực thi in...'", "t('invoices.print_executing', 'Đang thực thi in...')"),
]

pos_modal_reps = [
    ("'Khách vãng lai'", "t('invoices.walk_in', 'Khách vãng lai')"),
    ('"Khách vãng lai"', 't("invoices.walk_in", "Khách vãng lai")'),
    (">Khách vãng lai<", ">{t('invoices.walk_in', 'Khách vãng lai')}<"),
    ("'Lỗi tải danh mục POS:'", "t('pos.invoice.error_catalog', 'Lỗi tải danh mục POS:')"),
    ("`Khởi tạo hoá đơn cho ${customer?.name || t('invoices.walk_in', 'Khách vãng lai')}`", "`Khởi tạo hoá đơn cho ${customer?.name || t('invoices.walk_in', 'Khách vãng lai')}`"), # No change but safe
    ("'Lễ tân'", "t('pos.invoice.receptionist', 'Lễ tân')"),
    ("'Chọn khách hàng'", "t('pos.invoice.select_customer', 'Chọn khách hàng')"),
    ("'Bỏ chọn khách hàng'", "t('pos.invoice.deselect_customer', 'Bỏ chọn khách hàng')"),
    ("'Thay đổi giảm giá hóa đơn'", "t('pos.invoice.change_discount', 'Thay đổi giảm giá hóa đơn')"),
    ("'Thêm vào giỏ hàng'", "t('pos.invoice.add_to_cart', 'Thêm vào giỏ hàng')"),
    ("'Xóa khỏi giỏ hàng'", "t('pos.invoice.remove_from_cart', 'Xóa khỏi giỏ hàng')"),
    ("`Thay đổi số lượng ${item.name}`", "`Thay đổi số lượng ${item.name}`"),
    ("'Vui lòng chọn khách hàng khi thanh toán gói dịch vụ, liệu trình hoặc thẻ tiền mặt'", "t('pos.invoice.error_require_customer', 'Vui lòng chọn khách hàng khi thanh toán gói dịch vụ, liệu trình hoặc thẻ tiền mặt')"),
    ("'Bán gói / Thẻ'", "t('pos.invoice.sell_package', 'Bán gói / Thẻ')"),
    ("'Bán hàng / Dịch vụ'", "t('pos.invoice.sell_service', 'Bán hàng / Dịch vụ')"),
    ("'Tiền TIP'", "t('pos.invoice.tip', 'Tiền TIP')"),
    ("'Lỗi khi thanh toán: '", "t('pos.invoice.error_payment', 'Lỗi khi thanh toán: ')"),
    (">Tạo Hóa Đơn Trực Tiếp<", ">{t('pos.invoice.create_direct', 'Tạo Hóa Đơn Trực Tiếp')}<"),
    ("'Đã thêm khách hàng mới'", "t('pos.invoice.add_customer_success', 'Đã thêm khách hàng mới')"),
    ("'Lỗi khi tạo khách hàng: '", "t('pos.invoice.error_create_customer', 'Lỗi khi tạo khách hàng: ')"),
    ("item.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'", "item.type === 'service' ? t('pos.invoice.service', 'Dịch vụ') : t('pos.invoice.product', 'Sản phẩm')"),
]

process('/Volumes/Coding/GloPro/src/views/Invoices.jsx', invoices_reps)
process('/Volumes/Coding/GloPro/src/components/POSInvoiceModal.jsx', pos_modal_reps)

