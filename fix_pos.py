import re

with open('/Volumes/Coding/GloPro/src/views/POS.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("t('pos.create_order', 'Tạo đơn')", "t('pos.btn_create_order', 'Tạo đơn')")

with open('/Volumes/Coding/GloPro/src/views/POS.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
