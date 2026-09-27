import sys

def process(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix POSInvoiceModal
    content = content.replace("export default function POSInvoiceModal({\n  const { t } = useT(); open", "export default function POSInvoiceModal({\n  open")
    content = content.replace("onRefresh \n}) {\n  const { currentBranchId", "onRefresh \n}) {\n  const { t } = useT();\n  const { currentBranchId")

    # Fix Invoices JSX props missing braces
    fixes = [
        ('title=t("invoices.clear_date", "Xóa ngày")', 'title={t("invoices.clear_date", "Xóa ngày")}'),
        ('title=t("invoices.clear_staff", "Xóa lọc nhân viên")', 'title={t("invoices.clear_staff", "Xóa lọc nhân viên")}'),
        ('placeholder=t("invoices.search_staff", "Tìm kiếm nhân viên...")', 'placeholder={t("invoices.search_staff", "Tìm kiếm nhân viên...")}'),
        ('title=t("invoices.clear_customer", "Xóa lọc khách hàng")', 'title={t("invoices.clear_customer", "Xóa lọc khách hàng")}'),
        ('placeholder=t("invoices.search_customer", "Tìm kiếm khách hàng...")', 'placeholder={t("invoices.search_customer", "Tìm kiếm khách hàng...")}'),
        ('placeholder=t("invoices.search_placeholder", "Tìm theo mã đơn, khách hàng hoặc nhân viên...")', 'placeholder={t("invoices.search_placeholder", "Tìm theo mã đơn, khách hàng hoặc nhân viên...")}'),
        ('title=t("invoices.view_customer", "Click để xem chi tiết khách hàng")', 'title={t("invoices.view_customer", "Click để xem chi tiết khách hàng")}'),
        ('title=t("invoices.action.cancel_edit", "Huỷ thanh toán & Sửa")', 'title={t("invoices.action.cancel_edit", "Huỷ thanh toán & Sửa")}'),
        ('title=t("invoices.action.print", "In hoá đơn")', 'title={t("invoices.action.print", "In hoá đơn")}'),
        ('title=t("invoices.action.delete", "Xoá hoá đơn")', 'title={t("invoices.action.delete", "Xoá hoá đơn")}'),
        ('title=t("invoices.action.pay", "Thanh toán hóa đơn")', 'title={t("invoices.action.pay", "Thanh toán hóa đơn")}'),
        ('title=t("invoices.action.edit", "Chỉnh sửa hóa đơn")', 'title={t("invoices.action.edit", "Chỉnh sửa hóa đơn")}'),
        ('title=t("invoices.action.restore", "Khôi phục hoá đơn")', 'title={t("invoices.action.restore", "Khôi phục hoá đơn")}'),
        ('title=t("invoices.action.permanent_delete", "Xoá vĩnh viễn hoá đơn")', 'title={t("invoices.action.permanent_delete", "Xoá vĩnh viễn hoá đơn")}'),
        
        # In POSInvoiceModal, there might be other issues.
        ("`Khởi tạo hoá đơn cho ${customer?.name || t('invoices.walk_in', 'Khách vãng lai')}`", "`Khởi tạo hoá đơn cho ${customer?.name || t('invoices.walk_in', 'Khách vãng lai')}`")
    ]
    
    for old, new in fixes:
        content = content.replace(old, new)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

process('/Volumes/Coding/GloPro/src/components/POSInvoiceModal.jsx')
process('/Volumes/Coding/GloPro/src/views/Invoices.jsx')

