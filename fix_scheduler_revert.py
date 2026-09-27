with open('src/components/staff/SchedulerGrid.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import useT
if "import { useT }" not in content:
    content = content.replace("import React,", "import { useT } from '@/lib/i18n';\nimport React,")

# 2. Add const { t } = useT();
if "const { t } = useT();" not in content:
    content = content.replace("export default function SchedulerGrid({ branchId }) {\n", "export default function SchedulerGrid({ branchId }) {\n  const { t } = useT();\n")

# 3. Move ROLES inside and translate
old_roles = """const ROLES = {
  manager: { label: 'Quản lý', color: '#FF6B9D' },
  receptionist: { label: 'Lễ tân', color: '#60A5FA' },
  stylist: { label: 'Kỹ thuật viên tóc', color: '#A78BFA' },
  barber: { label: 'Barber', color: '#34D399' },
  therapist: { label: 'Chuyên viên Spa', color: '#FBBF24' },
  nail_tech: { label: 'Nail tech', color: '#F472B6' },
  technician: { label: 'Kỹ thuật viên', color: '#F97316' },
  cashier: { label: 'Thu ngân', color: '#94A3B8' },
};"""

new_roles = """  const ROLES = {
    manager: { label: t('staff.roles.manager', 'Quản lý'), color: '#FF6B9D' },
    receptionist: { label: t('staff.roles.receptionist', 'Lễ tân'), color: '#60A5FA' },
    stylist: { label: t('staff.roles.stylist', 'Kỹ thuật viên tóc'), color: '#A78BFA' },
    barber: { label: t('staff.roles.barber', 'Barber'), color: '#34D399' },
    therapist: { label: t('staff.roles.therapist', 'Chuyên viên Spa'), color: '#FBBF24' },
    nail_tech: { label: t('staff.roles.nail_tech', 'Nail tech'), color: '#F472B6' },
    technician: { label: t('staff.roles.technician', 'Kỹ thuật viên'), color: '#F97316' },
    cashier: { label: t('staff.roles.cashier', 'Thu ngân'), color: '#94A3B8' },
  };"""

content = content.replace(old_roles, "")
content = content.replace("  const { t } = useT();\n", "  const { t } = useT();\n" + new_roles + "\n")

with open('src/components/staff/SchedulerGrid.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Roles and useT fixed!")
