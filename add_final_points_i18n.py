import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.points.simulate_desc': 'Bấm nút để mô phỏng dọn dẹp điểm tích lũy của những khách hàng quá chu kỳ không ghé spa.',
    'customers.points.simulate_btn': 'Mô phỏng reset điểm',
    'customers.points.save_btn': 'Lưu cấu hình',
    'customers.points.book_advance': 'ĐẶT LỊCH TRƯỚC',
    'customers.points.referral': 'GIỚI THIỆU KHÁCH',
    'customers.points.service': 'DỊCH VỤ',
    'customers.points.product': 'SẢN PHẨM',
    """,
    'en': """
    'customers.points.simulate_desc': 'Click to simulate clearing points for customers who have not visited the spa past the reset cycle.',
    'customers.points.simulate_btn': 'Simulate Point Reset',
    'customers.points.save_btn': 'Save Config',
    'customers.points.book_advance': 'BOOKING IN ADVANCE',
    'customers.points.referral': 'REFERRAL',
    'customers.points.service': 'SERVICE',
    'customers.points.product': 'PRODUCT',
    """,
    'ko': """
    'customers.points.simulate_desc': '버튼을 눌러 리셋 주기가 지난 미방문 고객의 포인트 소멸을 시뮬레이션하세요.',
    'customers.points.simulate_btn': '포인트 리셋 시뮬레이션',
    'customers.points.save_btn': '설정 저장',
    'customers.points.book_advance': '사전 예약',
    'customers.points.referral': '고객 추천',
    'customers.points.service': '서비스',
    'customers.points.product': '제품',
    """,
    'ja': """
    'customers.points.simulate_desc': 'ボタンをクリックして、リセットサイクルを過ぎた未訪問顧客のポイントクリアをシミュレートします。',
    'customers.points.simulate_btn': 'ポイントリセットシミュレーション',
    'customers.points.save_btn': '設定を保存',
    'customers.points.book_advance': '事前予約',
    'customers.points.referral': '顧客紹介',
    'customers.points.service': 'サービス',
    'customers.points.product': '製品',
    """,
    'zh': """
    'customers.points.simulate_desc': '点击按钮以模拟清除超过重置周期未访问水疗中心的客户积分。',
    'customers.points.simulate_btn': '模拟积分重置',
    'customers.points.save_btn': '保存配置',
    'customers.points.book_advance': '提前预订',
    'customers.points.referral': '客户推荐',
    'customers.points.service': '服务',
    'customers.points.product': '产品',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

