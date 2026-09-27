import re

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    ("Khách hàng: <span", "{t('customers.detail.customer_label', 'Khách hàng:')} <span"),
    ("Giảm <span", "{t('customers.detail.discount', 'Giảm')} <span"),
    (">Tặng</button>", ">{t('customers.detail.give', 'Tặng')}</button>"),
    ("Khách hàng chưa có quà tặng nào trong ví.", "{t('customers.detail.no_gifts_in_wallet', 'Khách hàng chưa có quà tặng nào trong ví.')}"),
    ("'Tất cả'", "t('customers.detail.all_scopes', 'Tất cả')"),
    (">HSD: ", ">{t('customers.detail.expiry_date_label', 'HSD:')} "),
    ("'Đã gửi thành công'", "t('common.status_sent_success', 'Đã gửi thành công')"),
    ("'Đã nhận'", "t('common.status_received', 'Đã nhận')"),
    ('placeholder="Ghi chú da khô, tình trạng kích ứng hoặc yêu cầu KTV riêng..."', 'placeholder={t("customers.detail.notes_placeholder", "Ghi chú da khô, tình trạng kích ứng hoặc yêu cầu KTV riêng...")}'),
    ("10:15 AM - Hôm nay", "10:15 AM - ${t('common.today', 'Hôm nay')}"),
    ("Xin chào ${customer.name}, lịch hẹn của bạn tại GloPro đã hoàn thành. Hãy đánh giá dịch vụ của chúng tôi để nhận thêm 20 điểm tích lũy nhé!", "${t('customers.detail.mock_msg_1', 'Xin chào ')}${customer.name}${t('customers.detail.mock_msg_1_tail', ', lịch hẹn của bạn tại GloPro đã hoàn thành. Hãy đánh giá dịch vụ của chúng tôi để nhận thêm 20 điểm tích lũy nhé!')}"),
    ("Cảm ơn bạn ${customer.name} đã đặt lịch hẹn lúc 11:13 AM hôm nay. Trân trọng kính mời bạn đến đúng giờ để nhận phục vụ tốt nhất!", "${t('customers.detail.mock_msg_2', 'Cảm ơn bạn ')}${customer.name}${t('customers.detail.mock_msg_2_tail', ' đã đặt lịch hẹn lúc 11:13 AM hôm nay. Trân trọng kính mời bạn đến đúng giờ để nhận phục vụ tốt nhất!')}"),
    ("Mừng ngày 20/10! GloPro gửi tặng khách hàng VIP ${customer.name} mã voucher giảm 15% cho tất cả dịch vụ làm đẹp: GP2010. {t('customers.detail.book_now', 'Đặt lịch ngay')}!", "${t('customers.detail.mock_msg_3', 'Mừng ngày 20/10! GloPro gửi tặng khách hàng VIP ')}${customer.name}${t('customers.detail.mock_msg_3_tail', ' mã voucher giảm 15% cho tất cả dịch vụ làm đẹp: GP2010. Đặt lịch ngay!')}")
]

for old, new in replacements:
    c = c.replace(old, new)

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Customers.jsx modified p5.")
