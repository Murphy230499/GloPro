import re

with open('src/components/staff/PayrollHistoryTab.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function PayrollHistoryTab\([^)]*\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    ">Ngày trả<": ">{t('staff.payroll.pay_date', 'Ngày trả')}<",
    ">Kỳ lương<": ">{t('staff.payroll.pay_period', 'Kỳ lương')}<",
    ">Trạng thái<": ">{t('staff.payroll.status', 'Trạng thái')}<",
    ">Tổng quỹ lương<": ">{t('staff.payroll.total_fund', 'Tổng quỹ lương')}<",
    ">Chi tiết<": ">{t('staff.payroll.details', 'Chi tiết')}<",
    "{row.status}": "{row.status === 'Hoàn thành' ? t('staff.payroll.completed', 'Hoàn thành') : row.status === 'Đang xử lý' ? t('staff.payroll.processing', 'Đang xử lý') : row.status}",
    "\n                        Chi tiết\n": "\n                        {t('staff.payroll.details', 'Chi tiết')}\n"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/PayrollHistoryTab.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("PayrollHistoryTab translated")
