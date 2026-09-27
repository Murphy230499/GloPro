import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple search & replace for common terms
    replacements = {
        "'Quản lý'": "t('staff.roles.manager', 'Quản lý')",
        "'Lễ tân'": "t('staff.roles.receptionist', 'Lễ tân')",
        "'Kỹ thuật viên tóc'": "t('staff.roles.stylist', 'Kỹ thuật viên tóc')",
        "'Barber'": "t('staff.roles.barber', 'Barber')",
        "'Chuyên viên Spa'": "t('staff.roles.therapist', 'Chuyên viên Spa')",
        "'Nail tech'": "t('staff.roles.nail_tech', 'Nail tech')",
        "'Kỹ thuật viên'": "t('staff.roles.technician', 'Kỹ thuật viên')",
        "'Thu ngân'": "t('staff.roles.cashier', 'Thu ngân')",
        "'Quản lý Nhân viên'": "t('staff.tabs.manage', 'Quản lý Nhân viên')",
        "'Lịch làm việc'": "t('staff.tabs.schedule', 'Lịch làm việc')",
        "'Chấm công'": "t('staff.tabs.attendance', 'Chấm công')",
        "'Hoa hồng Nhân viên'": "t('staff.tabs.commission', 'Hoa hồng Nhân viên')",
        "'Bảng tính lương'": "t('staff.tabs.payroll', 'Bảng tính lương')",
        "'Bảng xếp ca tuần'": "t('staff.tabs.schedule.grid', 'Bảng xếp ca tuần')",
        "'Quản lý ca làm việc'": "t('staff.tabs.schedule.templates', 'Quản lý ca làm việc')",
        ">nhân viên đang hoạt động<": ">{t('staff.active_count', 'nhân viên đang hoạt động')}<"
    }

    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        # Check if we need to import useT
        if 'useT' not in new_content:
            new_content = new_content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")
        
        # Inject const { t } = useT() into the main component
        # We look for `export default function `
        match = re.search(r"export default function \w+\([^)]*\)\s*{", new_content)
        if match and 'const { t } = useT();' not in new_content:
            pos = match.end()
            new_content = new_content[:pos] + "\n  const { t } = useT();" + new_content[pos:]
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

process_file('src/views/Staff.jsx')
process_file('src/components/staff/SchedulerGrid.jsx')
