import re

with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_keys_vi = """
    'common.sunday': 'Chủ nhật',
    'common.monday': 'Thứ 2',
    'common.tuesday': 'Thứ 3',
    'common.wednesday': 'Thứ 4',
    'common.thursday': 'Thứ 5',
    'common.friday': 'Thứ 6',
    'common.saturday': 'Thứ 7',
    'common.sun': 'CN',
    'common.mon': 'T2',
    'common.tue': 'T3',
    'common.wed': 'T4',
    'common.thu': 'T5',
    'common.fri': 'T6',
    'common.sat': 'T7',
    'common.full_date': '{day} ngày {dd} tháng {mm} năm {yyyy}',
"""

new_keys_en = """
    'common.sunday': 'Sunday',
    'common.monday': 'Monday',
    'common.tuesday': 'Tuesday',
    'common.wednesday': 'Wednesday',
    'common.thursday': 'Thursday',
    'common.friday': 'Friday',
    'common.saturday': 'Saturday',
    'common.sun': 'Sun',
    'common.mon': 'Mon',
    'common.tue': 'Tue',
    'common.wed': 'Wed',
    'common.thu': 'Thu',
    'common.fri': 'Fri',
    'common.sat': 'Sat',
    'common.full_date': '{day}, {mm}/{dd}/{yyyy}',
"""

# Insert into vi
content = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', content)
# Insert into en
content = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', content)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Date translations added to i18n!")
