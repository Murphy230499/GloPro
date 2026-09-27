import re

with open('/Volumes/Coding/GloPro/src/components/customers/LoyaltyPointsTab.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    ("Bấm nút để mô phỏng dọn dẹp điểm tích lũy của những khách hàng quá chu kỳ không ghé spa.", "{t('customers.points.simulate_desc', 'Bấm nút để mô phỏng dọn dẹp điểm tích lũy của những khách hàng quá chu kỳ không ghé spa.')}"),
    (" /> Mô phỏng reset điểm", " /> {t('customers.points.simulate_btn', 'Mô phỏng reset điểm')}"),
    ("{saving ? 'Đang lưu...' : 'Lưu cấu hình'}", "{saving ? t('common.saving', 'Đang lưu...') : t('customers.points.save_btn', 'Lưu cấu hình')}"),
    (">Đặt lịch trước<", ">{t('customers.points.book_advance', 'ĐẶT LỊCH TRƯỚC')}<"),
    (">Giới thiệu khách<", ">{t('customers.points.referral', 'GIỚI THIỆU KHÁCH')}<"),
    (">Không reset<", ">{t('customers.points.no_reset', 'Không reset')}<"),
    ("type: 'Dịch vụ'", "type: t('customers.points.service', 'DỊCH VỤ')"),
    ("type: 'Sản phẩm'", "type: t('customers.points.product', 'SẢN PHẨM')"),
    ('placeholder="Số điểm thưởng..."', 'placeholder={t("customers.points.reward_placeholder", "Số điểm thưởng...")}'),
    (">Không tìm thấy sản phẩm/dịch vụ nào<", ">{t('customers.points.exclude_empty', 'Không tìm thấy sản phẩm/dịch vụ nào')}<"),
    (">Số ngày không ghé tối đa<", ">{t('customers.points.max_inactive_days', 'Số ngày không ghé tối đa')}<"),
    (">Đang tải cấu hình tích điểm...<", ">{t('customers.points.loading_config', 'Đang tải cấu hình tích điểm...')}<")
]

for old, new in replacements:
    c = c.replace(old, new)
    
with open('/Volumes/Coding/GloPro/src/components/customers/LoyaltyPointsTab.jsx', 'w', encoding='utf-8') as f:
    f.write(c)


# i18n
with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'common.saving': 'Đang lưu...',
    'customers.points.no_reset': 'Không reset',
    'customers.points.reward_placeholder': 'Số điểm thưởng...',
    'customers.points.exclude_empty': 'Không tìm thấy sản phẩm/dịch vụ nào',
    'customers.points.max_inactive_days': 'Số ngày không ghé tối đa',
    'customers.points.loading_config': 'Đang tải cấu hình tích điểm...',
    """,
    'en': """
    'common.saving': 'Saving...',
    'customers.points.no_reset': 'No reset',
    'customers.points.reward_placeholder': 'Points amount...',
    'customers.points.exclude_empty': 'No products/services found',
    'customers.points.max_inactive_days': 'Max inactive days',
    'customers.points.loading_config': 'Loading config...',
    """,
    'ko': """
    'common.saving': '저장 중...',
    'customers.points.no_reset': '리셋 안 함',
    'customers.points.reward_placeholder': '포인트 금액...',
    'customers.points.exclude_empty': '제품/서비스를 찾을 수 없습니다',
    'customers.points.max_inactive_days': '최대 미방문 일수',
    'customers.points.loading_config': '설정 로딩 중...',
    """,
    'ja': """
    'common.saving': '保存中...',
    'customers.points.no_reset': 'リセットしない',
    'customers.points.reward_placeholder': 'ポイント数...',
    'customers.points.exclude_empty': '商品/サービスが見つかりません',
    'customers.points.max_inactive_days': '最大非アクティブ日数',
    'customers.points.loading_config': '設定を読み込み中...',
    """,
    'zh': """
    'common.saving': '保存中...',
    'customers.points.no_reset': '不重置',
    'customers.points.reward_placeholder': '积分数量...',
    'customers.points.exclude_empty': '未找到产品/服务',
    'customers.points.max_inactive_days': '最大不活跃天数',
    'customers.points.loading_config': '正在加载配置...',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

