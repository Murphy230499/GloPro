import re

with open('src/components/PrepaidCardView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React from 'react';", "import React from 'react';\nimport { useT } from '@/lib/i18n';")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function PrepaidCardView\([^)]*\) \{", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    "'Thẻ tiền mặt'": "t('catalog.card_default_name', 'Thẻ tiền mặt')",
    ">Mệnh giá<": ">{t('catalog.card_face_value', 'Mệnh giá')}<",
    ">Mã thẻ<": ">{t('catalog.card_code', 'Mã thẻ')}<",
    ">Hạn: {": ">{t('catalog.card_expiry', 'Hạn:')} {",
    "}T<": "} {t('catalog.card_months', 'tháng')}<",
    ">Bán: {": ">{t('catalog.card_sell_price', 'Bán:')} {"
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Special fix for the }T
content = content.replace("Hạn: {card.expiry_months}T", "{t('catalog.card_expiry', 'Hạn:')} {card.expiry_months} {t('catalog.card_months', 'tháng')}")

with open('src/components/PrepaidCardView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("PrepaidCardView translated")
