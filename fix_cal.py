import re

with open('/Volumes/Coding/GloPro/src/components/appointments/AppointmentCalendarView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import { ChevronLeft, ChevronRight, Filter, ChevronDown, Check, Users, MapPin, Search } from 'lucide-react';", "import { ChevronLeft, ChevronRight, Filter, ChevronDown, Check, Users, MapPin, Search } from 'lucide-react';\nimport { useT } from '@/lib/i18n';")

if "const { t } = useT();" not in content:
    content = re.sub(
        r"(export default function AppointmentCalendarView\([^\)]+\)\s*\{)",
        r"\1\n  const { t } = useT();\n",
        content
    )

content = content.replace("'Chưa phân công'", "t('appointments.unassigned', 'Chưa phân công')")

with open('/Volumes/Coding/GloPro/src/components/appointments/AppointmentCalendarView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

