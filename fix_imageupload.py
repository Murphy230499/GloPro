import re

with open('/Volumes/Coding/GloPro/src/components/ImageUpload.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    "import { useLanguage } from '@/hooks/useLanguage';",
    "import { useT } from '@/lib/i18n';"
)
c = c.replace(
    "const { t } = useLanguage();",
    "const t = useT();"
)

with open('/Volumes/Coding/GloPro/src/components/ImageUpload.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
