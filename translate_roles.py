import re

with open('/Volumes/Coding/GloPro/src/components/appointments/AppointmentTimelineView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

role_map_replacement = """
  const ROLE_MAP = {
    manager: t('roles.manager', 'Quản lý'),
    receptionist: t('roles.receptionist', 'Lễ tân'),
    stylist: t('roles.stylist', 'Kỹ thuật viên tóc'),
    barber: t('roles.barber', 'Barber'),
    therapist: t('roles.therapist', 'Chuyên viên Spa'),
    nail_tech: t('roles.nail_tech', 'Nail tech'),
    technician: t('roles.technician', 'Kỹ thuật viên'),
    cashier: t('roles.cashier', 'Thu ngân')
  };
"""

content = re.sub(
    r"const ROLE_MAP = \{.*?\n\s*\};\n",
    role_map_replacement,
    content,
    flags=re.DOTALL
)

with open('/Volumes/Coding/GloPro/src/components/appointments/AppointmentTimelineView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
