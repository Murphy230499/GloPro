import re

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    (">Thẻ tiền mặt tích lũy</h4>", ">{t('customers.detail.cash_cards_accumulated', 'Thẻ tiền mặt tích lũy')}</h4>"),
    (">Gói dịch vụ combo trả trước</h4>", ">{t('customers.detail.prepaid_packages', 'Gói dịch vụ combo trả trước')}</h4>"),
    (">Khuyến mãi &amp; Quà tặng của khách</h4>", ">{t('customers.detail.promotions_gifts', 'Khuyến mãi & Quà tặng của khách')}</h4>"),
    (">Khuyến mãi & Quà tặng của khách</h4>", ">{t('customers.detail.promotions_gifts', 'Khuyến mãi & Quà tặng của khách')}</h4>"),
    (">Tặng Khuyến mãi</h2>", ">{t('customers.detail.give_promotion', 'Tặng Khuyến mãi')}</h2>"),
    ("Ghi chú nội bộ (", "{t('customers.detail.internal_notes', 'Ghi chú nội bộ')} ("),
    (">Ghi chú nội bộ</div>", ">{t('customers.detail.internal_notes', 'Ghi chú nội bộ')}</div>"),
    
    (">Mã lịch hẹn:</span>", ">{t('customers.detail.booking_code_colon', 'Mã lịch hẹn:')}</span>"),
    (">Dịch vụ:</span>", ">{t('common.service_colon', 'Dịch vụ:')}</span>"),
    (">Trạng thái:</span>", ">{t('common.status_colon', 'Trạng thái:')}</span>"),
    (">Tổng tiền:</span>", ">{t('common.total_colon', 'Tổng tiền:')}</span>"),
    
    (">Thao tác thẻ</div>", ">{t('customers.detail.card_actions', 'Thao tác thẻ')}</div>"),
    ("Danh sách lịch hẹn dự kiến (", "{t('customers.detail.expected_appointments', 'Danh sách lịch hẹn dự kiến')} ("),
    ("'Chưa phân'", "t('common.unassigned', 'Chưa phân')"),
    ("'Gói dịch vụ đã hoàn thành'", "t('customers.detail.package_completed', 'Gói dịch vụ đã hoàn thành')"),
    ("'Liệu trình đã hoàn thành'", "t('customers.detail.treatment_completed', 'Liệu trình đã hoàn thành')"),
    
    (">Staff</th>", ">{t('common.staff', 'Nhân viên')}</th>"),
]

for old, new in replacements:
    c = c.replace(old, new)

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Customers.jsx modified p2.")
