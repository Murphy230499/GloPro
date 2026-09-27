import re

files = [
    '/Volumes/Coding/GloPro/src/components/customers/CustomerTiersTab.jsx',
    '/Volumes/Coding/GloPro/src/components/customers/CustomerSegmentsTab.jsx',
    '/Volumes/Coding/GloPro/src/components/customers/LoyaltyPointsTab.jsx'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Inject import { useT }
    if "import { useT }" not in content:
        content = content.replace(
            "import React, { useState, useEffect } from 'react';",
            "import React, { useState, useEffect } from 'react';\nimport { useT } from '@/lib/i18n';"
        )
        content = content.replace(
            "import React, { useState } from 'react';",
            "import React, { useState } from 'react';\nimport { useT } from '@/lib/i18n';"
        )
        
    # 2. Inject const { t } = useT();
    if "const { t } = useT();" not in content:
        content = content.replace(
            "export default function CustomerTiersTab({ onChanged, createTrigger }) {",
            "export default function CustomerTiersTab({ onChanged, createTrigger }) {\n  const { t } = useT();"
        )
        content = content.replace(
            "export default function CustomerSegmentsTab({ createTrigger }) {",
            "export default function CustomerSegmentsTab({ createTrigger }) {\n  const { t } = useT();"
        )
        content = content.replace(
            "export default function LoyaltyPointsTab({ onChanged }) {",
            "export default function LoyaltyPointsTab({ onChanged }) {\n  const { t } = useT();"
        )
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 3. Apply string replacements
replacements_tiers = [
    ("Xét duyệt nâng & hạ hạng tự động", "{t('customers.tiers.auto_review', 'Xét duyệt nâng & hạ hạng tự động')}"),
    ("Chạy quét toàn bộ chi tiêu và điểm tích luỹ khách hàng theo chu kỳ thiết lập.", "{t('customers.tiers.auto_review_desc', 'Chạy quét toàn bộ chi tiêu và điểm tích luỹ khách hàng theo chu kỳ thiết lập.')}"),
    (">Chạy xét duyệt hạng<", ">{t('customers.tiers.run_review', 'Chạy xét duyệt hạng')}<"),
    ("Danh sách hạng thành viên hiện tại", "{t('customers.tiers.list_title', 'Danh sách hạng thành viên hiện tại')}"),
    ("Điều kiện: Chi tiêu", "{t('customers.tiers.condition_spend', 'Điều kiện: Chi tiêu')}"),
    (">hoặc<", ">{t('common.or', 'hoặc')}<"),
    (" điểm<", " {t('customers.points', 'điểm')}<"),
    ("Quyền lợi: Giảm", "{t('customers.tiers.benefit_discount', 'Quyền lợi: Giảm')}"),
    (" hóa đơn<", " {t('customers.tiers.invoice', 'hóa đơn')}<"),
    ("Chu kỳ:", "{t('customers.tiers.cycle', 'Chu kỳ:')}")
]

with open(files[0], 'r', encoding='utf-8') as f:
    c = f.read()
for old, new in replacements_tiers:
    c = c.replace(old, new)
with open(files[0], 'w', encoding='utf-8') as f:
    f.write(c)


replacements_segments = [
    ("Khách hàng thuộc tập", "{t('customers.segments.customers_in_segment', 'Khách hàng thuộc tập')}"),
    ("Không có khách hàng nào đạt điều kiện", "{t('customers.segments.empty', 'Không có khách hàng nào đạt điều kiện')}"),
    ("Báo cáo hiệu quả CTKM đã tặng", "{t('customers.segments.report_title', 'Báo cáo hiệu quả CTKM đã tặng')}"),
    ("Thống kê chi phí, doanh thu và tình trạng sử dụng của các chương trình khuyến mãi đã áp dụng cho tập khách hàng này.", "{t('customers.segments.report_desc', 'Thống kê chi phí, doanh thu và tình trạng sử dụng của các chương trình khuyến mãi đã áp dụng cho tập khách hàng này.')}")
]

with open(files[1], 'r', encoding='utf-8') as f:
    c = f.read()
for old, new in replacements_segments:
    c = c.replace(old, new)
with open(files[1], 'w', encoding='utf-8') as f:
    f.write(c)


replacements_points = [
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
    (">ĐẶT LỊCH TRƯỚC<", ">{t('customers.points.book_advance', 'ĐẶT LỊCH TRƯỚC')}<"),
    (">GIỚI THIỆU KHÁCH<", ">{t('customers.points.referral', 'GIỚI THIỆU KHÁCH')}<"),
    ("Lịch reset điểm tích luỹ", "{t('customers.points.reset_schedule', 'Lịch reset điểm tích luỹ')}"),
    ("Chu kỳ reset điểm", "{t('customers.points.reset_cycle', 'Chu kỳ reset điểm')}"),
    ("Danh sách loại trừ tích điểm", "{t('customers.points.exclude_list', 'Danh sách loại trừ tích điểm')}"),
    ("Tích chọn các dịch vụ hoặc sản phẩm cụ thể muốn LOẠI TRỪ không cho tích điểm.", "{t('customers.points.exclude_desc', 'Tích chọn các dịch vụ hoặc sản phẩm cụ thể muốn LOẠI TRỪ không cho tích điểm.')}"),
    ('placeholder="Tìm dịch vụ/sản phẩm loại trừ..."', 'placeholder={t("customers.points.exclude_search", "Tìm dịch vụ/sản phẩm loại trừ...")}'),
    (">DỊCH VỤ<", ">{t('customers.points.service', 'DỊCH VỤ')}<"),
    (">SẢN PHẨM<", ">{t('customers.points.product', 'SẢN PHẨM')}<")
]

with open(files[2], 'r', encoding='utf-8') as f:
    c = f.read()
for old, new in replacements_points:
    c = c.replace(old, new)
with open(files[2], 'w', encoding='utf-8') as f:
    f.write(c)

