import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'common.status_active': 'Đang sử dụng',
    'common.status_suspended': 'Đang bảo lưu',
    'common.status_completed': 'Đã hoàn thành',
    'common.status_expired': 'Đã hết hạn',
    'common.activated': 'Kích hoạt:',
    'customers.detail.last_visit': 'Đến gần nhất:',
    'common.unused': 'Chưa sử dụng',
    """,
    'en': """
    'common.status_active': 'Active',
    'common.status_suspended': 'Suspended',
    'common.status_completed': 'Completed',
    'common.status_expired': 'Expired',
    'common.activated': 'Activated:',
    'customers.detail.last_visit': 'Last Visit:',
    'common.unused': 'Unused',
    """,
    'ko': """
    'common.status_active': '사용 중',
    'common.status_suspended': '보류 중',
    'common.status_completed': '완료됨',
    'common.status_expired': '만료됨',
    'common.activated': '활성화됨:',
    'customers.detail.last_visit': '최근 방문:',
    'common.unused': '사용 안 함',
    """,
    'ja': """
    'common.status_active': '使用中',
    'common.status_suspended': '保留中',
    'common.status_completed': '完了',
    'common.status_expired': '期限切れ',
    'common.activated': 'アクティベート:',
    'customers.detail.last_visit': '最終来店:',
    'common.unused': '未使用',
    """,
    'zh': """
    'common.status_active': '使用中',
    'common.status_suspended': '已暂停',
    'common.status_completed': '已完成',
    'common.status_expired': '已过期',
    'common.activated': '激活:',
    'customers.detail.last_visit': '上次光临:',
    'common.unused': '未使用',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("i18n.jsx modified with p7 keys.")
