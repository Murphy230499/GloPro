import re

# 1. Update Customers.jsx
with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'r', encoding='utf-8') as f:
    c_content = f.read()

replacements = [
    # Top bar & Tabs
    ("{tab === 'list' && 'Khách hàng'}", "{tab === 'list' && t('customers.title', 'Khách hàng')}"),
    ("{tab === 'tiers' && 'Hạng khách hàng'}", "{tab === 'tiers' && t('customers.tabs.tiers', 'Hạng khách hàng')}"),
    ("{tab === 'segments' && 'Tập khách hàng'}", "{tab === 'segments' && t('customers.tabs.segments', 'Tập khách hàng')}"),
    ("{tab === 'points' && 'Tích điểm'}", "{tab === 'points' && t('customers.tabs.points', 'Tích điểm')}"),
    (" khách hàng toàn chuỗi", " {t('customers.total_customers', 'khách hàng toàn chuỗi')}"),
    (">Quản lý nhóm<", ">{t('customers.manage_groups', 'Quản lý nhóm')}<"),
    (" Thêm khách<", " {t('customers.add_customer', 'Thêm khách')}<"),
    ("<span>Quản lý khách hàng</span>", "<span>{t('customers.tabs.manage', 'Quản lý khách hàng')}</span>"),
    ("<span>Hạng khách hàng</span>", "<span>{t('customers.tabs.tiers', 'Hạng khách hàng')}</span>"),
    ("<span>Tập khách hàng</span>", "<span>{t('customers.tabs.segments', 'Tập khách hàng')}</span>"),
    ("<span>Tích điểm</span>", "<span>{t('customers.tabs.points', 'Tích điểm')}</span>"),
    ('placeholder="Tìm theo tên hoặc SĐT..."', 'placeholder={t("customers.search_placeholder", "Tìm theo tên hoặc SĐT...")}'),
    
    # Customer List
    ('lần đến</div>', "{t('customers.visits', 'lần đến')}</div>"),
    ('lần đến</span>', "{t('customers.visits', 'lần đến')}</span>"),
    ('Xem chi tiết &rarr;', "{t('customers.view_detail', 'Xem chi tiết')} &rarr;"),

    # Tiers (Hạng khách hàng)
    ("Định nghĩa điều kiện lên hạng và quyền lợi giảm giá thành viên.", "{t('customers.tiers.desc', 'Định nghĩa điều kiện lên hạng và quyền lợi giảm giá thành viên.')}"),
    ("Tạo hạng thành viên", "{t('customers.tiers.create', 'Tạo hạng thành viên')}"),
    ("Xét duyệt nâng & hạ hạng tự động", "{t('customers.tiers.auto_review', 'Xét duyệt nâng & hạ hạng tự động')}"),
    ("Chạy quét toàn bộ chi tiêu và điểm tích luỹ khách hàng theo chu kỳ thiết lập.", "{t('customers.tiers.auto_review_desc', 'Chạy quét toàn bộ chi tiêu và điểm tích luỹ khách hàng theo chu kỳ thiết lập.')}"),
    (">Chạy xét duyệt hạng<", ">{t('customers.tiers.run_review', 'Chạy xét duyệt hạng')}<"),
    ("Danh sách hạng thành viên hiện tại", "{t('customers.tiers.list_title', 'Danh sách hạng thành viên hiện tại')}"),
    ("Điều kiện: Chi tiêu", "{t('customers.tiers.condition_spend', 'Điều kiện: Chi tiêu')}"),
    ("Quyền lợi: Giảm", "{t('customers.tiers.benefit_discount', 'Quyền lợi: Giảm')}"),
    
    # Segments (Tập khách hàng)
    ("Bộ lọc tập khách hàng theo các điều kiện hành vi & thông tin.", "{t('customers.segments.desc', 'Bộ lọc tập khách hàng theo các điều kiện hành vi & thông tin.')}"),
    ("Tạo tập khách hàng", "{t('customers.segments.create', 'Tạo tập khách hàng')}"),
    ("Danh sách tập khách hàng", "{t('customers.segments.list_title', 'Danh sách tập khách hàng')}"),
    ("Khách hàng thuộc tập", "{t('customers.segments.customers_in_segment', 'Khách hàng thuộc tập')}"),
    ("Không có khách hàng nào đạt điều kiện", "{t('customers.segments.empty', 'Không có khách hàng nào đạt điều kiện')}"),
    ("Báo cáo hiệu quả CTKM đã tặng", "{t('customers.segments.report_title', 'Báo cáo hiệu quả CTKM đã tặng')}"),
    ("Thống kê chi phí, doanh thu và tình trạng sử dụng của các chương trình khuyến mãi đã áp dụng cho tập khách hàng này.", "{t('customers.segments.report_desc', 'Thống kê chi phí, doanh thu và tình trạng sử dụng của các chương trình khuyến mãi đã áp dụng cho tập khách hàng này.')}"),
    
    # Points (Tích điểm)
    ("Cấu hình tỷ lệ tích luỹ điểm và chính sách reset điểm tích luỹ.", "{t('customers.points.desc', 'Cấu hình tỷ lệ tích luỹ điểm và chính sách reset điểm tích luỹ.')}"),
    ("Cài đặt & Mô phỏng Reset điểm tích luỹ", "{t('customers.points.simulate_title', 'Cài đặt & Mô phỏng Reset điểm tích luỹ')}"),
    ("Bấm nút để mô phỏng dọn dẹp điểm tích luỹ của những khách hàng quá chu kỳ không ghé spa.", "{t('customers.points.simulate_desc', 'Bấm nút để mô phỏng dọn dẹp điểm tích luỹ của những khách hàng quá chu kỳ không ghé spa.')}"),
    (">Mô phỏng reset điểm<", ">{t('customers.points.simulate_btn', 'Mô phỏng reset điểm')}<"),
    ("Quy tắc tích luỹ điểm", "{t('customers.points.rules_title', 'Quy tắc tích luỹ điểm')}"),
    (">Lưu cấu hình<", ">{t('customers.points.save_btn', 'Lưu cấu hình')}<"),
    ("Tỷ lệ quy đổi điểm", "{t('customers.points.exchange_rate', 'Tỷ lệ quy đổi điểm')}"),
    ("Quy đổi số tiền chi tiêu của hóa đơn sang 1 điểm tích lũy.", "{t('customers.points.exchange_rate_desc', 'Quy đổi số tiền chi tiêu của hóa đơn sang 1 điểm tích lũy.')}"),
    ("Tích điểm khi thanh toán", "{t('customers.points.earn_on_pay', 'Tích điểm khi thanh toán')}"),
    ("Dùng dịch vụ", "{t('customers.points.use_service', 'Dùng dịch vụ')}"),
    ("Mua sản phẩm", "{t('customers.points.buy_product', 'Mua sản phẩm')}"),
    ("Mua gói dịch vụ", "{t('customers.points.buy_package', 'Mua gói dịch vụ')}"),
    ("Mua liệu trình", "{t('customers.points.buy_course', 'Mua liệu trình')}"),
    ("Mua thẻ tiền mặt", "{t('customers.points.buy_cash_card', 'Mua thẻ tiền mặt')}"),
    ("Điểm thưởng hoạt động", "{t('customers.points.reward_points', 'Điểm thưởng hoạt động')}"),
    ("ĐẶT LỊCH TRƯỚC", "{t('customers.points.book_advance', 'ĐẶT LỊCH TRƯỚC')}"),
    ("GIỚI THIỆU KHÁCH", "{t('customers.points.referral', 'GIỚI THIỆU KHÁCH')}"),
    ("Lịch reset điểm tích luỹ", "{t('customers.points.reset_schedule', 'Lịch reset điểm tích luỹ')}"),
    ("Chu kỳ reset điểm", "{t('customers.points.reset_cycle', 'Chu kỳ reset điểm')}"),
    ("Danh sách loại trừ tích điểm", "{t('customers.points.exclude_list', 'Danh sách loại trừ tích điểm')}"),
    ("Tích chọn các dịch vụ hoặc sản phẩm cụ thể muốn LOẠI TRỪ không cho tích điểm.", "{t('customers.points.exclude_desc', 'Tích chọn các dịch vụ hoặc sản phẩm cụ thể muốn LOẠI TRỪ không cho tích điểm.')}"),
    ('placeholder="Tìm dịch vụ/sản phẩm loại trừ..."', 'placeholder={t("customers.points.exclude_search", "Tìm dịch vụ/sản phẩm loại trừ...")}')
]

for old, new in replacements:
    c_content = c_content.replace(old, new)

with open('/Volumes/Coding/GloPro/src/views/Customers.jsx', 'w', encoding='utf-8') as f:
    f.write(c_content)

