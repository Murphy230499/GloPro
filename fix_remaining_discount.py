import re

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = re.sub(old, new, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

common_replacements = [
    (r"Đang diễn ra\n", r"{t('discounts.status_ongoing', 'Đang diễn ra')}\n"),
    (r"Sắp diễn ra\n", r"{t('discounts.status_upcoming', 'Sắp diễn ra')}\n"),
    (r"Đã hoàn thành\n", r"{t('discounts.status_completed', 'Đã hoàn thành')}\n"),
    (r"Hết lượt\n", r"{t('discounts.status_sold_out', 'Hết lượt')}\n"),
    (r">Khách hàng<", r">{t('discounts.customer', 'Khách hàng')}<"),
    (r">Số điện thoại<", r">{t('discounts.phone', 'Số điện thoại')}<"),
    (r">Ngày tặng<", r">{t('discounts.date_gifted', 'Ngày tặng')}<"),
    (r">Trạng thái sử dụng<", r">{t('discounts.usage_status', 'Trạng thái sử dụng')}<"),
    (r"> Đã sử dụng ", r"> {t('discounts.used', 'Đã sử dụng')} "),
    (r"Chưa sử dụng\n", r"{t('discounts.unused', 'Chưa sử dụng')}\n"),
    (r">Mã hóa đơn<", r">{t('discounts.invoice_code', 'Mã hóa đơn')}<"),
    (r">Ngày sử dụng<", r">{t('discounts.date_used', 'Ngày sử dụng')}<"),
    (r">Chi phí \(Giảm\)<", r">{t('discounts.cost_discount', 'Chi phí (Giảm)')}<"),
    (r">Doanh thu<", r">{t('discounts.revenue', 'Doanh thu')}<"),
    (r">Chi nhánh<", r">{t('discounts.branch', 'Chi nhánh')}<"),
    (r">Danh sách khách hàng đã tặng \(", r">{t('discounts.gifted_list', 'Danh sách khách hàng đã tặng')} ("),
    (r"> Lượt sử dụng đơn hàng tại POS \(", r"> {t('discounts.pos_usage', 'Lượt sử dụng đơn hàng tại POS')} ("),
    (r"> Lịch sử sử dụng voucher tại POS \(", r"> {t('discounts.voucher_usage', 'Lịch sử sử dụng voucher tại POS')} ("),
    (r"Chưa tặng khuyến mãi này cho khách hàng nào\.", r"{t('discounts.no_gifted', 'Chưa tặng khuyến mãi này cho khách hàng nào.')}"),
    (r"Chưa có lượt sử dụng nào tại POS cho CTKM này\.", r"{t('discounts.no_pos_usage', 'Chưa có lượt sử dụng nào tại POS cho CTKM này.')}"),
    (r"Chưa có lượt sử dụng nào tại POS cho voucher này\.", r"{t('discounts.no_pos_usage_voucher', 'Chưa có lượt sử dụng nào tại POS cho voucher này.')}"),
]

update_file('src/components/discounts/PromoDetailModal.jsx', common_replacements)
update_file('src/components/discounts/VoucherDetailModal.jsx', common_replacements)

# i18n.jsx keys
i18n_path = 'src/lib/i18n.jsx'
with open(i18n_path, 'r', encoding='utf-8') as f:
    i18n_content = f.read()

vi_keys = """
    'discounts.customer': 'Khách hàng',
    'discounts.phone': 'Số điện thoại',
    'discounts.date_gifted': 'Ngày tặng',
    'discounts.usage_status': 'Trạng thái sử dụng',
    'discounts.invoice_code': 'Mã hóa đơn',
    'discounts.date_used': 'Ngày sử dụng',
    'discounts.revenue': 'Doanh thu',
    'discounts.branch': 'Chi nhánh',
    'discounts.gifted_list': 'Danh sách khách hàng đã tặng',
    'discounts.pos_usage': 'Lượt sử dụng đơn hàng tại POS',
    'discounts.voucher_usage': 'Lịch sử sử dụng voucher tại POS',
    'discounts.no_gifted': 'Chưa tặng khuyến mãi này cho khách hàng nào.',
    'discounts.no_pos_usage': 'Chưa có lượt sử dụng nào tại POS cho CTKM này.',
    'discounts.no_pos_usage_voucher': 'Chưa có lượt sử dụng nào tại POS cho voucher này.',
"""

en_keys = """
    'discounts.customer': 'Customer',
    'discounts.phone': 'Phone Number',
    'discounts.date_gifted': 'Date Gifted',
    'discounts.usage_status': 'Usage Status',
    'discounts.invoice_code': 'Invoice Code',
    'discounts.date_used': 'Date Used',
    'discounts.revenue': 'Revenue',
    'discounts.branch': 'Branch',
    'discounts.gifted_list': 'Gifted Customers List',
    'discounts.pos_usage': 'POS Order Usage Times',
    'discounts.voucher_usage': 'Voucher POS Usage History',
    'discounts.no_gifted': 'This promotion has not been gifted to any customer.',
    'discounts.no_pos_usage': 'No POS usage for this promotion yet.',
    'discounts.no_pos_usage_voucher': 'No POS usage for this voucher yet.',
"""

if "'discounts.customer':" not in i18n_content:
    i18n_content = i18n_content.replace(
        "'payroll.auto_tong_luong_thuc_nhan_ky_nay_ne': 'Tổng lương thực nhận kỳ này (Net Total)',",
        f"'payroll.auto_tong_luong_thuc_nhan_ky_nay_ne': 'Tổng lương thực nhận kỳ này (Net Total)',\n{vi_keys}"
    )
    i18n_content = i18n_content.replace(
        "'payroll.auto_tong_luong_thuc_nhan_ky_nay_ne': 'Total Net Salary This Period',",
        f"'payroll.auto_tong_luong_thuc_nhan_ky_nay_ne': 'Total Net Salary This Period',\n{en_keys}"
    )
    with open(i18n_path, 'w', encoding='utf-8') as f:
        f.write(i18n_content)
    print("Updated i18n.jsx.")

print("All done.")
