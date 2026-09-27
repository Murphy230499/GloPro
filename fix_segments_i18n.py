import re

with open('/Volumes/Coding/GloPro/src/components/customers/CustomerSegmentsTab.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    (">Danh sách tập khách hàng<", ">{t('customers.segments.list_title', 'Danh sách tập khách hàng')}<"),
    (">Đang tải tập khách hàng...<", ">{t('customers.segments.loading_segments', 'Đang tải tập khách hàng...')}<"),
    (">Chưa có tập khách hàng nào<", ">{t('customers.segments.empty_segments', 'Chưa có tập khách hàng nào')}<"),
    ("} khách", "} {t('customers.segments.customers', 'khách')}"),
    (">Đang tải khách hàng...<", ">{t('customers.segments.loading_customers', 'Đang tải khách hàng...')}<"),
    (">Chưa có chiến dịch khuyến mãi nào được tặng cho tập này.<", ">{t('customers.segments.no_promos', 'Chưa có chiến dịch khuyến mãi nào được tặng cho tập này.')}<"),
    (">Chưa có khách hàng nào sử dụng ưu đãi.<", ">{t('customers.segments.no_usage', 'Chưa có khách hàng nào sử dụng ưu đãi.')}<"),
    (">Chi tiết khách hàng đã sử dụng<", ">{t('customers.segments.usage_details', 'Chi tiết khách hàng đã sử dụng')}<"),
    (">Khách hàng<", ">{t('customers.title', 'Khách hàng')}<"), # Line 532 <th>Khách hàng</th>
    (">Tặng khuyến mãi cho tập khách hàng<", ">{t('customers.segments.gift_promo', 'Tặng khuyến mãi cho tập khách hàng')}<"),
    ("Thiết lập các điều kiện lọc khách hàng", "{t('customers.segments.form_subtitle', 'Thiết lập các điều kiện lọc khách hàng')}"),
    (">Tên tập khách hàng<", ">{t('customers.segments.form_name', 'Tên tập khách hàng')}<")
]

for old, new in replacements:
    c = c.replace(old, new)
    
c = c.replace(
    "{editingId ? 'Chỉnh sửa tập khách' : 'Tạo tập khách hàng mới'}",
    "{editingId ? t('customers.segments.edit', 'Chỉnh sửa tập khách') : t('customers.segments.create_new', 'Tạo tập khách hàng mới')}"
)

c = c.replace(
    "{editingId ? 'Cập nhật' : 'Tạo tập khách'}",
    "{editingId ? t('common.update', 'Cập nhật') : t('customers.segments.create', 'Tạo tập khách')}"
)

with open('/Volumes/Coding/GloPro/src/components/customers/CustomerSegmentsTab.jsx', 'w', encoding='utf-8') as f:
    f.write(c)


# i18n
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.segments.loading_segments': 'Đang tải tập khách hàng...',
    'customers.segments.empty_segments': 'Chưa có tập khách hàng nào',
    'customers.segments.customers': 'khách',
    'customers.segments.loading_customers': 'Đang tải khách hàng...',
    'customers.segments.no_promos': 'Chưa có chiến dịch khuyến mãi nào được tặng cho tập này.',
    'customers.segments.no_usage': 'Chưa có khách hàng nào sử dụng ưu đãi.',
    'customers.segments.usage_details': 'Chi tiết khách hàng đã sử dụng',
    'customers.segments.gift_promo': 'Tặng khuyến mãi cho tập khách hàng',
    'customers.segments.form_subtitle': 'Thiết lập các điều kiện lọc khách hàng',
    'customers.segments.form_name': 'Tên tập khách hàng',
    'customers.segments.edit': 'Chỉnh sửa tập khách',
    'customers.segments.create_new': 'Tạo tập khách hàng mới',
    """,
    'en': """
    'customers.segments.loading_segments': 'Loading segments...',
    'customers.segments.empty_segments': 'No segments available',
    'customers.segments.customers': 'customers',
    'customers.segments.loading_customers': 'Loading customers...',
    'customers.segments.no_promos': 'No promo campaigns have been gifted to this segment yet.',
    'customers.segments.no_usage': 'No customers have used the offer yet.',
    'customers.segments.usage_details': 'Usage details',
    'customers.segments.gift_promo': 'Gift promotion to segment',
    'customers.segments.form_subtitle': 'Configure customer filter conditions',
    'customers.segments.form_name': 'Segment Name',
    'customers.segments.edit': 'Edit Segment',
    'customers.segments.create_new': 'Create New Segment',
    """,
    'ko': """
    'customers.segments.loading_segments': '세그먼트 로딩 중...',
    'customers.segments.empty_segments': '세그먼트가 없습니다',
    'customers.segments.customers': '명',
    'customers.segments.loading_customers': '고객 로딩 중...',
    'customers.segments.no_promos': '이 세그먼트에 지급된 프로모션이 아직 없습니다.',
    'customers.segments.no_usage': '제안을 사용한 고객이 없습니다.',
    'customers.segments.usage_details': '사용 내역',
    'customers.segments.gift_promo': '세그먼트에 프로모션 선물',
    'customers.segments.form_subtitle': '고객 필터 조건 구성',
    'customers.segments.form_name': '세그먼트 이름',
    'customers.segments.edit': '세그먼트 편집',
    'customers.segments.create_new': '새 세그먼트 만들기',
    """,
    'ja': """
    'customers.segments.loading_segments': 'セグメントを読み込み中...',
    'customers.segments.empty_segments': 'セグメントがありません',
    'customers.segments.customers': '名',
    'customers.segments.loading_customers': '顧客を読み込み中...',
    'customers.segments.no_promos': 'このセグメントにギフトされたプロモーションはまだありません。',
    'customers.segments.no_usage': 'オファーを利用した顧客はまだいません。',
    'customers.segments.usage_details': '利用詳細',
    'customers.segments.gift_promo': 'セグメントにプロモーションをギフト',
    'customers.segments.form_subtitle': '顧客フィルター条件を設定',
    'customers.segments.form_name': 'セグメント名',
    'customers.segments.edit': 'セグメントを編集',
    'customers.segments.create_new': '新しいセグメントを作成',
    """,
    'zh': """
    'customers.segments.loading_segments': '正在加载分群...',
    'customers.segments.empty_segments': '没有可用的分群',
    'customers.segments.customers': '名客户',
    'customers.segments.loading_customers': '正在加载客户...',
    'customers.segments.no_promos': '该分群尚未获赠任何促销活动。',
    'customers.segments.no_usage': '尚未有客户使用该优惠。',
    'customers.segments.usage_details': '使用详情',
    'customers.segments.gift_promo': '向分群赠送促销活动',
    'customers.segments.form_subtitle': '配置客户筛选条件',
    'customers.segments.form_name': '分群名称',
    'customers.segments.edit': '编辑分群',
    'customers.segments.create_new': '创建新分群',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

