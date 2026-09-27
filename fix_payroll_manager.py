import re

with open('src/components/staff/PayrollManager.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function PayrollManager\([^)]*\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    "\n          Bảng lương nhân viên\n": "\n          {t('staff.payroll.tab_run', 'Bảng lương nhân viên')}\n",
    "\n          Lịch sử thanh toán\n": "\n          {t('staff.payroll.tab_history', 'Lịch sử thanh toán')}\n"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/PayrollManager.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("PayrollManager translated!")
