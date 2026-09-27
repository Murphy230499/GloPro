import re

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

translations_to_add = {
    'VI': """
    'appointments.free_slot': 'Lịch tự do',
    'roles.manager': 'Quản lý',
    'roles.receptionist': 'Lễ tân',
    'roles.stylist': 'Kỹ thuật viên tóc',
    'roles.barber': 'Barber',
    'roles.therapist': 'Chuyên viên Spa',
    'roles.nail_tech': 'Nail tech',
    'roles.technician': 'Kỹ thuật viên',
    'roles.cashier': 'Thu ngân',
    """,
    'EN': """
    'appointments.free_slot': 'Free Slot',
    'roles.manager': 'Manager',
    'roles.receptionist': 'Receptionist',
    'roles.stylist': 'Stylist',
    'roles.barber': 'Barber',
    'roles.therapist': 'Spa Therapist',
    'roles.nail_tech': 'Nail Tech',
    'roles.technician': 'Technician',
    'roles.cashier': 'Cashier',
    """,
    'KO': """
    'appointments.free_slot': '무료 시간대',
    'roles.manager': '매니저',
    'roles.receptionist': '리셉셔니스트',
    'roles.stylist': '스타일리스트',
    'roles.barber': '바버',
    'roles.therapist': '스파 테라피스트',
    'roles.nail_tech': '네일 테크니션',
    'roles.technician': '테크니션',
    'roles.cashier': '계산원',
    """,
    'JA': """
    'appointments.free_slot': 'フリースロット',
    'roles.manager': 'マネージャー',
    'roles.receptionist': '受付',
    'roles.stylist': 'スタイリスト',
    'roles.barber': '理容師',
    'roles.therapist': 'セラピスト',
    'roles.nail_tech': 'ネイリスト',
    'roles.technician': '技術者',
    'roles.cashier': 'レジ係',
    """,
    'ZH': """
    'appointments.free_slot': '空闲时间段',
    'roles.manager': '经理',
    'roles.receptionist': '接待员',
    'roles.stylist': '发型师',
    'roles.barber': '理发师',
    'roles.therapist': '水疗师',
    'roles.nail_tech': '美甲师',
    'roles.technician': '技师',
    'roles.cashier': '收银员',
    """
}

# Find each language dictionary and inject
for lang in ['VI', 'EN', 'KO', 'JA', 'ZH']:
    marker = f"{lang}: {{"
    replacement = f"{marker}\n{translations_to_add[lang]}"
    content = content.replace(marker, replacement)

with open('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

