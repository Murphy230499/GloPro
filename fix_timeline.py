import re

with open('/Volumes/Coding/GloPro/src/components/appointments/AppointmentTimelineView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Import useT if missing
if "import { useT }" not in content:
    content = content.replace("import { Users, Info, MapPin } from 'lucide-react';", "import { Users, Info, MapPin } from 'lucide-react';\nimport { useT } from '@/lib/i18n';")

# Inject const { t } = useT(); into the component if not already there
if "const { t } = useT();" not in content:
    content = content.replace(
        "export default function AppointmentTimelineView({",
        "export default function AppointmentTimelineView({\n  const { t } = useT();\n",
        1
    )
    # Actually the signature might be multi-line:
    if "export default function AppointmentTimelineView({" not in content:
        # try regex
        content = re.sub(
            r"(export default function AppointmentTimelineView\([^\)]+\)\s*\{)",
            r"\1\n  const { t } = useT();\n",
            content
        )

# Replace 'Chưa phân công' -> t('appointments.unassigned', 'Chưa phân công')
content = content.replace("'Chưa phân công'", "t('appointments.unassigned', 'Chưa phân công')")

# Replace <span>Nhân viên</span> -> <span>{t('appointments.table.staff', 'Nhân viên')}</span>
content = content.replace("<span>Nhân viên</span>", "<span>{t('invoices.table.staff', 'Nhân viên')}</span>")
content = content.replace("'Nhân viên'", "t('invoices.table.staff', 'Nhân viên')")

# Replace 'Lịch tự do' -> t('appointments.free_slot', 'Lịch tự do')
content = content.replace("'Lịch tự do'", "t('appointments.free_slot', 'Lịch tự do')")

with open('/Volumes/Coding/GloPro/src/components/appointments/AppointmentTimelineView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

