import re

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = re.sub(old, new, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# PromoDetailModal
promo_replacements = [
    (r"Loại: <span (.*?)>CTKM Tặng khách</span>", r"{t('discounts.type', 'Loại:')} <span \1>{t('discounts.gift_promo', 'CTKM Tặng khách')}</span>"),
    (r">Đang diễn ra<", r">{t('discounts.status_ongoing', 'Đang diễn ra')}<"),
    (r">Sắp diễn ra<", r">{t('discounts.status_upcoming', 'Sắp diễn ra')}<"),
    (r">Đã hoàn thành<", r">{t('discounts.status_completed', 'Đã hoàn thành')}<"),
    (r">Hết lượt<", r">{t('discounts.status_sold_out', 'Hết lượt')}<"),
    (r">Đã tặng cho khách<", r">{t('discounts.gifted_to_customers', 'Đã tặng cho khách')}<"),
    (r">lượt<", r">{t('discounts.turns', 'lượt')}<"),
    (r"Dùng: (\{giftedUsedCount\}) • Chưa dùng: (\{giftedUnusedCount\})", r"{t('discounts.used', 'Dùng:')} \1 • {t('discounts.unused', 'Chưa dùng:')} \2"),
    (r">Sử dụng POS / Tổng<", r">{t('discounts.pos_usage_total', 'Sử dụng POS / Tổng')}<"),
    (r"Chưa dùng: (\{unusedQuantity !== null \? unusedQuantity : '—'\})", r"{t('discounts.unused', 'Chưa dùng:')} \1"),
    (r">Doanh thu đem về<", r">{t('discounts.generated_revenue', 'Doanh thu đem về')}<"),
    (r"Chi phí: (\{formatVND\(totalCost\)\})", r"{t('discounts.cost', 'Chi phí:')} \1"),
    (r">Khách hàng mới<", r">{t('discounts.new_customers', 'Khách hàng mới')}<"),
    (r">Khách dùng lần đầu<", r">{t('discounts.first_time_users', 'Khách dùng lần đầu')}<"),
    (r">Khách hàng cũ<", r">{t('discounts.returning_customers', 'Khách hàng cũ')}<"),
    (r">Khách quay lại<", r">{t('discounts.returning_users', 'Khách quay lại')}<"),
    (r"> Thông tin khuyến mãi<", r"> {t('discounts.promo_info', 'Thông tin khuyến mãi')}<"),
    (r">Mức giảm:<", r">{t('discounts.discount_level', 'Mức giảm:')}<"),
    (r">Mục tiêu:<", r">{t('discounts.target', 'Mục tiêu:')}<"),
    (r"'Khách mới'", r"t('discounts.new_customers', 'Khách mới')"),
    (r"'Khách cũ'", r"t('discounts.returning_customers', 'Khách cũ')"),
    (r"'Tất cả khách hàng'", r"t('discounts.all_customers', 'Tất cả khách hàng')"),
    (r">Đơn tối thiểu:<", r">{t('discounts.min_spend_label', 'Đơn tối thiểu:')}<"),
    (r"'Không yêu cầu'", r"t('discounts.no_requirement', 'Không yêu cầu')"),
    (r"> Hiệu lực & Giới hạn<", r"> {t('discounts.validity_limits', 'Hiệu lực & Giới hạn')}<"),
    (r">Thời gian:<", r">{t('discounts.duration', 'Thời gian:')}<"),
    (r">Số lượng đã dùng:<", r">{t('discounts.quantity_used', 'Số lượng đã dùng:')}<"),
    (r">Khung giờ:<", r">{t('discounts.time_frame', 'Khung giờ:')}<"),
    (r">Lặp lại:<", r">{t('discounts.repeat', 'Lặp lại:')}<"),
    (r"'Hàng ngày'", r"t('discounts.daily', 'Hàng ngày')"),
    (r"'Hàng tuần'", r"t('discounts.weekly', 'Hàng tuần')"),
    (r"'Hàng tháng'", r"t('discounts.monthly', 'Hàng tháng')"),
    (r"đến", r"{t('discounts.to', 'đến')}"),
]
update_file('src/components/discounts/PromoDetailModal.jsx', promo_replacements)

# VoucherDetailModal
voucher_replacements = [
    (r"Mã Voucher: <span (.*?)>(\{voucher\.code\})</span>", r"{t('discounts.voucher_code_label', 'Mã Voucher:')} <span \1>\2</span>"),
    (r">Đang diễn ra<", r">{t('discounts.status_ongoing', 'Đang diễn ra')}<"),
    (r">Sắp diễn ra<", r">{t('discounts.status_upcoming', 'Sắp diễn ra')}<"),
    (r">Đã hoàn thành<", r">{t('discounts.status_completed', 'Đã hoàn thành')}<"),
    (r">Hết lượt<", r">{t('discounts.status_sold_out', 'Hết lượt')}<"),
    (r">Đã sử dụng / Tổng<", r">{t('discounts.used_total', 'Đã sử dụng / Tổng')}<"),
    (r"Chưa dùng: (\{unusedQuantity !== null \? unusedQuantity : '—'\}) • Hết hạn: (\{expiredQuantity\})", r"{t('discounts.unused', 'Chưa dùng:')} \1 • {t('discounts.expired', 'Hết hạn:')} \2"),
    (r">Doanh thu đem về<", r">{t('discounts.generated_revenue', 'Doanh thu đem về')}<"),
    (r"Chi phí \(giảm giá\): (\{formatVND\(totalCost\)\})", r"{t('discounts.cost_discount', 'Chi phí (giảm giá):')} \1"),
    (r">Khách hàng mới<", r">{t('discounts.new_customers', 'Khách hàng mới')}<"),
    (r">Lần đầu sử dụng dịch vụ<", r">{t('discounts.first_time_service', 'Lần đầu sử dụng dịch vụ')}<"),
    (r">Khách hàng cũ<", r">{t('discounts.returning_customers', 'Khách hàng cũ')}<"),
    (r">Khách quay lại<", r">{t('discounts.returning_users', 'Khách quay lại')}<"),
    (r"> Thông tin voucher<", r"> {t('discounts.voucher_info', 'Thông tin voucher')}<"),
    (r">Mức giảm:<", r">{t('discounts.discount_level', 'Mức giảm:')}<"),
    (r">Mục tiêu:<", r">{t('discounts.target', 'Mục tiêu:')}<"),
    (r"'Khách mới'", r"t('discounts.new_customers', 'Khách mới')"),
    (r"'Khách cũ'", r"t('discounts.returning_customers', 'Khách cũ')"),
    (r"'Tất cả khách hàng'", r"t('discounts.all_customers', 'Tất cả khách hàng')"),
    (r">Đơn tối thiểu:<", r">{t('discounts.min_spend_label', 'Đơn tối thiểu:')}<"),
    (r"'Không yêu cầu'", r"t('discounts.no_requirement', 'Không yêu cầu')"),
    (r"> Hiệu lực & Giới hạn<", r"> {t('discounts.validity_limits', 'Hiệu lực & Giới hạn')}<"),
    (r">Thời gian:<", r">{t('discounts.duration', 'Thời gian:')}<"),
    (r">Số lượng đã dùng:<", r">{t('discounts.quantity_used', 'Số lượng đã dùng:')}<"),
    (r">Khung giờ:<", r">{t('discounts.time_frame', 'Khung giờ:')}<"),
    (r">Lặp lại:<", r">{t('discounts.repeat', 'Lặp lại:')}<"),
    (r"'Hàng ngày'", r"t('discounts.daily', 'Hàng ngày')"),
    (r"'Hàng tuần'", r"t('discounts.weekly', 'Hàng tuần')"),
    (r"'Hàng tháng'", r"t('discounts.monthly', 'Hàng tháng')"),
    (r"đến", r"{t('discounts.to', 'đến')}"),
]
update_file('src/components/discounts/VoucherDetailModal.jsx', voucher_replacements)

# Discounts.jsx placeholders
discounts_replacements = [
    (r"placeholder=\{promoValueType === 'percent' \? 'Ví dụ: 10 \(%\)' : 'Ví dụ: 50,000 \(đ\)'\}", r"placeholder={promoValueType === 'percent' ? t('discounts.value_percent_ph', 'Ví dụ: 10 (%)') : t('discounts.value_vnd_ph', 'Ví dụ: 50,000 (đ)')}"),
    (r'placeholder="Ví dụ: 1, 15, 30"', r'placeholder={t("discounts.days_of_month_ph", "Ví dụ: 1, 15, 30")}'),
    (r"placeholder=\{voucherValueType === 'percent' \? '10 \(%\)' : '50,000 \(đ\)'\}", r"placeholder={voucherValueType === 'percent' ? t('discounts.value_percent_ph_short', '10 (%)') : t('discounts.value_vnd_ph_short', '50,000 (đ)')}"),
]
update_file('src/views/Discounts.jsx', discounts_replacements)

# i18n.jsx keys
i18n_path = 'src/lib/i18n.jsx'
with open(i18n_path, 'r', encoding='utf-8') as f:
    i18n_content = f.read()

vi_keys = """
    'discounts.type': 'Loại:',
    'discounts.gift_promo': 'CTKM Tặng khách',
    'discounts.status_ongoing': 'Đang diễn ra',
    'discounts.status_upcoming': 'Sắp diễn ra',
    'discounts.status_completed': 'Đã hoàn thành',
    'discounts.status_sold_out': 'Hết lượt',
    'discounts.gifted_to_customers': 'Đã tặng cho khách',
    'discounts.turns': 'lượt',
    'discounts.used': 'Dùng:',
    'discounts.unused': 'Chưa dùng:',
    'discounts.pos_usage_total': 'Sử dụng POS / Tổng',
    'discounts.generated_revenue': 'Doanh thu đem về',
    'discounts.cost': 'Chi phí:',
    'discounts.new_customers': 'Khách hàng mới',
    'discounts.first_time_users': 'Khách dùng lần đầu',
    'discounts.returning_customers': 'Khách hàng cũ',
    'discounts.returning_users': 'Khách quay lại',
    'discounts.promo_info': 'Thông tin khuyến mãi',
    'discounts.discount_level': 'Mức giảm:',
    'discounts.target': 'Mục tiêu:',
    'discounts.all_customers': 'Tất cả khách hàng',
    'discounts.min_spend_label': 'Đơn tối thiểu:',
    'discounts.no_requirement': 'Không yêu cầu',
    'discounts.validity_limits': 'Hiệu lực & Giới hạn',
    'discounts.duration': 'Thời gian:',
    'discounts.quantity_used': 'Số lượng đã dùng:',
    'discounts.time_frame': 'Khung giờ:',
    'discounts.repeat': 'Lặp lại:',
    'discounts.daily': 'Hàng ngày',
    'discounts.weekly': 'Hàng tuần',
    'discounts.monthly': 'Hàng tháng',
    'discounts.to': 'đến',
    'discounts.voucher_code_label': 'Mã Voucher:',
    'discounts.used_total': 'Đã sử dụng / Tổng',
    'discounts.expired': 'Hết hạn:',
    'discounts.cost_discount': 'Chi phí (giảm giá):',
    'discounts.first_time_service': 'Lần đầu sử dụng dịch vụ',
    'discounts.voucher_info': 'Thông tin voucher',
    'discounts.value_percent_ph': 'Ví dụ: 10 (%)',
    'discounts.value_vnd_ph': 'Ví dụ: 50,000 (đ)',
    'discounts.days_of_month_ph': 'Ví dụ: 1, 15, 30',
    'discounts.value_percent_ph_short': '10 (%)',
    'discounts.value_vnd_ph_short': '50,000 (đ)',
"""

en_keys = """
    'discounts.type': 'Type:',
    'discounts.gift_promo': 'Gift Promo',
    'discounts.status_ongoing': 'Ongoing',
    'discounts.status_upcoming': 'Upcoming',
    'discounts.status_completed': 'Completed',
    'discounts.status_sold_out': 'Sold Out',
    'discounts.gifted_to_customers': 'Gifted to Customers',
    'discounts.turns': 'times',
    'discounts.used': 'Used:',
    'discounts.unused': 'Unused:',
    'discounts.pos_usage_total': 'POS Uses / Total',
    'discounts.generated_revenue': 'Generated Revenue',
    'discounts.cost': 'Cost:',
    'discounts.new_customers': 'New Customers',
    'discounts.first_time_users': 'First-time users',
    'discounts.returning_customers': 'Returning Customers',
    'discounts.returning_users': 'Returning users',
    'discounts.promo_info': 'Promotion Info',
    'discounts.discount_level': 'Discount:',
    'discounts.target': 'Target:',
    'discounts.all_customers': 'All Customers',
    'discounts.min_spend_label': 'Min Spend:',
    'discounts.no_requirement': 'No requirement',
    'discounts.validity_limits': 'Validity & Limits',
    'discounts.duration': 'Duration:',
    'discounts.quantity_used': 'Quantity Used:',
    'discounts.time_frame': 'Time Frame:',
    'discounts.repeat': 'Repeat:',
    'discounts.daily': 'Daily',
    'discounts.weekly': 'Weekly',
    'discounts.monthly': 'Monthly',
    'discounts.to': 'to',
    'discounts.voucher_code_label': 'Voucher Code:',
    'discounts.used_total': 'Used / Total',
    'discounts.expired': 'Expired:',
    'discounts.cost_discount': 'Cost (Discount):',
    'discounts.first_time_service': 'First time service',
    'discounts.voucher_info': 'Voucher Info',
    'discounts.value_percent_ph': 'Ex: 10 (%)',
    'discounts.value_vnd_ph': 'Ex: 50,000 (VND)',
    'discounts.days_of_month_ph': 'Ex: 1, 15, 30',
    'discounts.value_percent_ph_short': '10 (%)',
    'discounts.value_vnd_ph_short': '50,000 (VND)',
"""

if "'discounts.type':" not in i18n_content:
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
