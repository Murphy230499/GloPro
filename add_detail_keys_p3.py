import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n_content = f.read()

new_translations = {
    'vi': """
    'customers.tabs.activity': 'Hoạt động',
    'customers.tabs.appointments': 'Lịch hẹn',
    'common.status_completed': 'Đã hoàn thành',
    'common.status_checked_in': 'Đã check-in',
    'common.status_booked': 'Đã đặt',
    'common.status_no_show': 'Không đến',
    'common.status_cancelled': 'Đã hủy',
    'common.status_confirmed': 'Đã xác nhận',
    'customers.detail.tier': 'Hạng:',
    'customers.detail.old_customer': 'Khách hàng cũ',
    'customers.detail.new_customer': 'Khách hàng mới',
    """,
    'en': """
    'customers.tabs.activity': 'Activity',
    'customers.tabs.appointments': 'Appointments',
    'common.status_completed': 'Completed',
    'common.status_checked_in': 'Checked In',
    'common.status_booked': 'Booked',
    'common.status_no_show': 'No Show',
    'common.status_cancelled': 'Cancelled',
    'common.status_confirmed': 'Confirmed',
    'customers.detail.tier': 'Tier:',
    'customers.detail.old_customer': 'Returning Customer',
    'customers.detail.new_customer': 'New Customer',
    """,
    'ko': """
    'customers.tabs.activity': '활동',
    'customers.tabs.appointments': '예약',
    'common.status_completed': '완료됨',
    'common.status_checked_in': '체크인됨',
    'common.status_booked': '예약됨',
    'common.status_no_show': '노쇼',
    'common.status_cancelled': '취소됨',
    'common.status_confirmed': '확정됨',
    'customers.detail.tier': '등급:',
    'customers.detail.old_customer': '기존 고객',
    'customers.detail.new_customer': '신규 고객',
    """,
    'ja': """
    'customers.tabs.activity': 'アクティビティ',
    'customers.tabs.appointments': '予約',
    'common.status_completed': '完了',
    'common.status_checked_in': 'チェックイン済',
    'common.status_booked': '予約済',
    'common.status_no_show': '無断キャンセル',
    'common.status_cancelled': 'キャンセル',
    'common.status_confirmed': '確認済',
    'customers.detail.tier': 'ランク:',
    'customers.detail.old_customer': 'リピーター',
    'customers.detail.new_customer': '新規顧客',
    """,
    'zh': """
    'customers.tabs.activity': '活动',
    'customers.tabs.appointments': '预约',
    'common.status_completed': '已完成',
    'common.status_checked_in': '已签到',
    'common.status_booked': '已预订',
    'common.status_no_show': '未到',
    'common.status_cancelled': '已取消',
    'common.status_confirmed': '已确认',
    'customers.detail.tier': '等级:',
    'customers.detail.old_customer': '老客户',
    'customers.detail.new_customer': '新客户',
    """
}

for lang in ['vi', 'en', 'ko', 'ja', 'zh']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{new_translations[lang]}"
    i18n_content = i18n_content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("i18n.jsx modified with customer detail keys p3.")
