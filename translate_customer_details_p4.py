import re

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    # General labels
    ("Lịch sử thanh toán hóa đơn", "{t('customers.detail.invoice_payment_history', 'Lịch sử thanh toán hóa đơn')}"),
    ("Lịch sử đặt cọc", "{t('customers.detail.deposit_history', 'Lịch sử đặt cọc')}"),
    ("Chưa có lịch sử đặt cọc nào.", "{t('customers.detail.no_deposit_history', 'Chưa có lịch sử đặt cọc nào.')}"),
    ("Mã ĐC", "{t('customers.detail.deposit_code', 'Mã ĐC')}"),
    ("Ngày tạo", "{t('common.created_date', 'Ngày tạo')}"),
    ("Cần cọc", "{t('customers.detail.required_deposit', 'Cần cọc')}"),
    ("Đã cọc", "{t('customers.detail.paid_deposit', 'Đã cọc')}"),
    
    # Deposit statuses
    ("'Đã thu'", "t('common.status_collected', 'Đã thu')"),
    ("'Thu một phần'", "t('common.status_partially_collected', 'Thu một phần')"),
    ("'Đã áp dụng'", "t('common.status_applied', 'Đã áp dụng')"),
    ("'Đã hoàn'", "t('common.status_refunded', 'Đã hoàn')"),
    
    # Activity Tab
    ("Dòng thời gian hoạt động", "{t('customers.detail.activity_timeline', 'Dòng thời gian hoạt động')}"),
    ("Đăng ký hồ sơ khách hàng", "{t('customers.detail.register_profile', 'Đăng ký hồ sơ khách hàng')}"),
    ("Khởi tạo hồ sơ khách hàng mới trên hệ thống GloPro.", "{t('customers.detail.create_new_profile_desc', 'Khởi tạo hồ sơ khách hàng mới trên hệ thống GloPro.')}"),
    ("Cập nhật hạng thành viên:", "{t('customers.detail.update_tier', 'Cập nhật hạng thành viên:')}"),
    ("Lý do:", "{t('common.reason', 'Lý do:')}"),
    
    # Gifts & Promos
    ("Không có chương trình khuyến mãi nào đang bật tính năng Quà tặng.", "{t('customers.detail.no_promotions', 'Không có chương trình khuyến mãi nào đang bật tính năng Quà tặng.')}"),
    ("'Chưa dùng'", "t('common.status_unused', 'Chưa dùng')"),
    
    # Messages & Notes
    ("Lịch sử tin nhắn đã gửi cho khách hàng", "{t('customers.detail.message_history', 'Lịch sử tin nhắn đã gửi cho khách hàng')}"),
    ("Thêm ghi chú mới", "{t('customers.detail.add_new_note', 'Thêm ghi chú mới')}"),
    ("Chưa có ghi chú nội bộ cho khách hàng này", "{t('customers.detail.no_internal_notes', 'Chưa có ghi chú nội bộ cho khách hàng này')}"),
    
    # Card details & Modals
    ("Thẻ & Lịch sử tiêu dùng", "{t('customers.detail.card_and_usage_history', 'Thẻ & Lịch sử tiêu dùng')}"),
    ("Lịch sử giao dịch", "{t('customers.detail.transaction_history', 'Lịch sử giao dịch')}"),
    ("'Vô thời hạn'", "t('common.lifetime', 'Vô thời hạn')"),
    ("Hết hạn:", "{t('common.expired_colon', 'Hết hạn:')}"),
    ("'Số dư thẻ'", "t('customers.detail.card_balance', 'Số dư thẻ')"),
    ("'Hạn mức sử dụng'", "t('customers.detail.usage_limit', 'Hạn mức sử dụng')"),
    (">Số buổi</label>", ">{t('customers.detail.sessions_count', 'Số buổi')}</label>"),
    (">Ngày mua</th>", ">{t('common.purchase_date', 'Ngày mua')}</th>"),
]

for old, new in replacements:
    c = c.replace(old, new)

# Special handle for "Đã dùng X/Y buổi" string
c = re.sub(
    r"`Đã dùng \$\{m\.total_sessions - m\.sessions_remaining\}/\$\{m\.total_sessions\} buổi`",
    r"`${t('customers.detail.used', 'Đã dùng')} ${m.total_sessions - m.sessions_remaining}/${m.total_sessions} ${t('customers.detail.sessions', 'buổi')}`",
    c
)
c = re.sub(
    r"Đã dùng \{selectedMembership\.total_sessions - selectedMembership\.sessions_remaining\}/\{selectedMembership\.total_sessions\} buổi",
    r"{t('customers.detail.used', 'Đã dùng')} {selectedMembership.total_sessions - selectedMembership.sessions_remaining}/{selectedMembership.total_sessions} {t('customers.detail.sessions', 'buổi')}",
    c
)


with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Customers.jsx modified p4.")
