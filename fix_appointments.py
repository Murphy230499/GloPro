import re

with open('/Volumes/Coding/GloPro/src/views/Appointments.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 'Chưa phân công' -> t('appointments.unassigned', 'Chưa phân công')
# but wait! Appointments.jsx might already have useT imported.
if "import { useT }" not in content:
    content = content.replace("import { Plus, Search, Filter } from 'lucide-react';", "import { Plus, Search, Filter } from 'lucide-react';\nimport { useT } from '@/lib/i18n';")

# Find if `const { t } = useT();` is present in Appointments()
if "const { t } = useT();" not in content:
    content = content.replace(
        "export default function Appointments() {",
        "export default function Appointments() {\n  const { t } = useT();"
    )

content = content.replace("'Chưa phân công'", "t('appointments.unassigned', 'Chưa phân công')")
content = content.replace("? 'Nhân viên'", "? t('invoices.table.staff', 'Nhân viên')")
content = content.replace("|| 'Nhân viên'", "|| t('invoices.table.staff', 'Nhân viên')")

with open('/Volumes/Coding/GloPro/src/views/Appointments.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

