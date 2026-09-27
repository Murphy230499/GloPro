import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.detail.activity_booked_service': 'Đặt lịch dịch vụ:',
    'customers.detail.activity_performed_by': 'Thực hiện bởi KTV',
    'common.at': 'lúc',
    'common.on_date': 'ngày',
    """,
    'en': """
    'customers.detail.activity_booked_service': 'Booked service:',
    'customers.detail.activity_performed_by': 'Performed by staff',
    'common.at': 'at',
    'common.on_date': 'on',
    """,
    'ko': """
    'customers.detail.activity_booked_service': '예약된 서비스:',
    'customers.detail.activity_performed_by': '담당 직원:',
    'common.at': '시간:',
    'common.on_date': '날짜:',
    """,
    'ja': """
    'customers.detail.activity_booked_service': '予約したサービス:',
    'customers.detail.activity_performed_by': '担当スタッフ:',
    'common.at': '時間:',
    'common.on_date': '日付:',
    """,
    'zh': """
    'customers.detail.activity_booked_service': '预约服务:',
    'customers.detail.activity_performed_by': '服务人员:',
    'common.at': '时间:',
    'common.on_date': '日期:',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("i18n.jsx modified with activity keys.")
