import re

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    # Breadcrumbs & Headers
    ("Chi tiết khách hàng</span>", "{t('customers.detail.title', 'Chi tiết khách hàng')}</span>"),
    ("Chi tiết khách hàng</h2>", "{t('customers.detail.title', 'Chi tiết khách hàng')}</h2>"),
    ("Thao tác <", "{t('common.actions', 'Thao tác')} <"),
    ("Đặt lịch ngay", "{t('customers.detail.book_now', 'Đặt lịch ngay')}"),
    ("Tạo hóa đơn", "{t('customers.detail.create_invoice', 'Tạo hóa đơn')}"),
    
    # Stats
    ("Truy cập lần cuối:", "{t('customers.detail.last_visit', 'Truy cập lần cuối:')}"),
    ("'Hôm nay'", "t('common.today', 'Hôm nay')"),
    (">Lịch hẹn</div>", ">{t('customers.detail.stats_appointments', 'Lịch hẹn')}</div>"),
    (">Tích điểm</div>", ">{t('customers.detail.stats_points', 'Tích điểm')}</div>"),
    (">Chi tiêu (đ)</div>", ">{t('customers.detail.stats_spend', 'Chi tiêu (đ)')}</div>"),
    
    # Tabs
    ("{ id: 'deposits', label: 'Đặt cọc' }", "{ id: 'deposits', label: t('customers.tabs.deposits', 'Đặt cọc') }"),
    ("{ id: 'sales', label: 'Hóa đơn' }", "{ id: 'sales', label: t('customers.tabs.invoices', 'Hóa đơn') }"),
    ("{ id: 'purchased_services', label: 'Dịch vụ' }", "{ id: 'purchased_services', label: t('customers.tabs.services', 'Dịch vụ') }"),
    ("{ id: 'purchased_products', label: 'Sản phẩm' }", "{ id: 'purchased_products', label: t('customers.tabs.products', 'Sản phẩm') }"),
    ("{ id: 'purchased_service_combos', label: 'Combo dịch vụ' }", "{ id: 'purchased_service_combos', label: t('customers.tabs.service_combos', 'Combo dịch vụ') }"),
    ("{ id: 'purchased_product_combos', label: 'Combo sản phẩm' }", "{ id: 'purchased_product_combos', label: t('customers.tabs.product_combos', 'Combo sản phẩm') }"),
    ("{ id: 'cash_cards', label: 'Thẻ tiền mặt' }", "{ id: 'cash_cards', label: t('customers.tabs.cash_cards', 'Thẻ tiền mặt') }"),
    ("{ id: 'packages', label: 'Gói dịch vụ' }", "{ id: 'packages', label: t('customers.tabs.packages', 'Gói dịch vụ') }"),
    ("{ id: 'treatments', label: 'Liệu trình' }", "{ id: 'treatments', label: t('customers.tabs.treatments', 'Liệu trình') }"),
    ("{ id: 'notes', label: 'Ghi chú' }", "{ id: 'notes', label: t('customers.tabs.notes', 'Ghi chú') }"),
    ("{ id: 'promotions', label: 'Khuyến mãi' }", "{ id: 'promotions', label: t('customers.tabs.promotions', 'Khuyến mãi') }"),
    ("{ id: 'messages', label: 'Tin nhắn' }", "{ id: 'messages', label: t('customers.tabs.messages', 'Tin nhắn') }"),
    
    # Appointment List
    (">Danh sách lịch hẹn</h4>", ">{t('customers.detail.appointments_list', 'Danh sách lịch hẹn')}</h4>"),
    ('placeholder="Tìm theo mã, KTV, dịch vụ..."', 'placeholder={t("customers.detail.search_appointments_placeholder", "Tìm theo mã, KTV, dịch vụ...")}'),
    ("> Lọc\n", "> {t('common.filter', 'Lọc')}\n"),
    
    # Table headers
    (">Mã lịch</th>", ">{t('customers.detail.booking_code', 'Mã lịch')}</th>"),
    (">Ngày & giờ</th>", ">{t('common.date_time', 'Ngày & giờ')}</th>"),
    (">Dịch vụ</th>", ">{t('common.service', 'Dịch vụ')}</th>"),
    (">Trạng thái</th>", ">{t('common.status', 'Trạng thái')}</th>"),
    (">Tổng tiền</th>", ">{t('common.total', 'Tổng tiền')}</th>"),
    (">Hành động</th>", ">{t('common.action', 'Hành động')}</th>"),
    
    # Small labels
    ("uppercase\">Dịch vụ</label>", "uppercase\">{t('common.service', 'Dịch vụ')}</label>"),
    ("uppercase\">Trạng thái</label>", "uppercase\">{t('common.status', 'Trạng thái')}</label>"),
    
    # Purchased tab headers
    ("'Dịch vụ đã mua'", "t('customers.purchases.services_bought', 'Dịch vụ đã mua')"),
    ("'Chưa mua dịch vụ nào'", "t('customers.purchases.no_services', 'Chưa mua dịch vụ nào')"),
    ("'Sản phẩm đã mua'", "t('customers.purchases.products_bought', 'Sản phẩm đã mua')"),
    ("'Chưa mua sản phẩm nào'", "t('customers.purchases.no_products', 'Chưa mua sản phẩm nào')"),
    ("'Combo dịch vụ đã mua'", "t('customers.purchases.service_combos_bought', 'Combo dịch vụ đã mua')"),
    ("'Chưa mua combo dịch vụ nào'", "t('customers.purchases.no_service_combos', 'Chưa mua combo dịch vụ nào')"),
    ("'Combo sản phẩm đã mua'", "t('customers.purchases.product_combos_bought', 'Combo sản phẩm đã mua')"),
    ("'Chưa mua combo sản phẩm nào'", "t('customers.purchases.no_product_combos', 'Chưa mua combo sản phẩm nào')")
]

for old, new in replacements:
    c = c.replace(old, new)

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Customers.jsx modified.")

