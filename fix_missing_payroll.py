import re

jsx_path = 'src/components/staff/StaffPayrollDetailView.jsx'
i18n_path = 'src/lib/i18n.jsx'

with open(jsx_path, 'r', encoding='utf-8') as f:
    jsx_content = f.read()

replacements = [
    (
        r'<span>Mã NV: NV-\{\(staffData\.id \|\| \'\'\)\.substring\(0, 4\)\.toUpperCase\(\)\}</span>',
        r'<span>{t("payroll.staff_id_prefix", "Mã NV:")} NV-{(staffData.id || "").substring(0, 4).toUpperCase()}</span>'
    ),
    (
        r'<span>Kỳ đối soát: \{dateFromStr\} - \{dateToStr\}</span>',
        r'<span>{t("payroll.reconciliation_period", "Kỳ đối soát:")} {dateFromStr} - {dateToStr}</span>'
    ),
    (
        r'Nghỉ \{staffData\.daysOff \|\| 0\} ngày',
        r'{t("payroll.off", "Nghỉ")} {staffData.daysOff || 0} {t("payroll.days", "ngày")}'
    ),
    (
        r'\{staffData\.daysOff \|\| 0\} ngày',
        r'{staffData.daysOff || 0} {t("payroll.days", "ngày")}'
    ),
    (
        r'\{staffData\.noServices \|\| 0\} lượt',
        r'{staffData.noServices || 0} {t("payroll.turns", "lượt")}'
    ),
    (
        r'\{staffData\.noPackage \|\| 0\} gói',
        r'{staffData.noPackage || 0} {t("payroll.packages", "gói")}'
    ),
    (
        r'\{staffData\.noProduct \|\| 0\} món',
        r'{staffData.noProduct || 0} {t("payroll.items", "món")}'
    ),
    (
        r'\{filteredComms\.length\} lượt',
        r'{filteredComms.length} {t("payroll.turns", "lượt")}'
    ),
    (
        r'Tổng cộng hoa hồng \(\{filteredComms\.length\} lượt\)',
        r'{t("payroll.total_commission_count", "Tổng cộng hoa hồng")} ({filteredComms.length} {t("payroll.turns", "lượt")})'
    ),
    (
        r'\{filteredTips\.length\} lượt',
        r'{filteredTips.length} {t("payroll.turns", "lượt")}'
    ),
    (
        r'Tổng cộng tiền tip \(\{filteredTips\.length\} lượt\)',
        r'{t("payroll.total_tip_count", "Tổng cộng tiền tip")} ({filteredTips.length} {t("payroll.turns", "lượt")})'
    ),
    (
        r'\{shiftOffCount\} ngày',
        r'{shiftOffCount} {t("payroll.days", "ngày")}'
    )
]

for old, new in replacements:
    jsx_content = re.sub(old, new, jsx_content)

# Fix Shifts / Hours text: "24 Ca/ 120h"
jsx_content = jsx_content.replace(
    r'{staffData.shifts || 0} Ca/ {staffData.hours || 0}h',
    r'{staffData.shifts || 0} {t("payroll.shifts", "Ca")}/ {staffData.hours || 0}h'
)
jsx_content = jsx_content.replace(
    r'{shiftCount} Ca/ {totalHours}h',
    r'{shiftCount} {t("payroll.shifts", "Ca")}/ {totalHours}h'
)

# Fix 'Nghỉ phép' strings in arrays/objects
jsx_content = jsx_content.replace(
    r"'Nghỉ phép': 'bg-slate-100",
    r"[(t('payroll.leave', 'Nghỉ phép'))]: 'bg-slate-100"
)

with open(jsx_path, 'w', encoding='utf-8') as f:
    f.write(jsx_content)

print("Updated JSX file.")

# Now update i18n.jsx
with open(i18n_path, 'r', encoding='utf-8') as f:
    i18n_content = f.read()

vi_keys = """
      staff_id_prefix: "Mã NV:",
      reconciliation_period: "Kỳ đối soát:",
      off: "Nghỉ",
      days: "ngày",
      turns: "lượt",
      packages: "gói",
      items: "món",
      shifts: "Ca",
      leave: "Nghỉ phép",
      total_commission_count: "Tổng cộng hoa hồng",
      total_tip_count: "Tổng cộng tiền tip",
"""

en_keys = """
      staff_id_prefix: "Staff ID:",
      reconciliation_period: "Period:",
      off: "Off",
      days: "days",
      turns: "times",
      packages: "packages",
      items: "items",
      shifts: "Shifts",
      leave: "Leave",
      total_commission_count: "Total Commission",
      total_tip_count: "Total Tips",
"""

if 'staff_id_prefix:' not in i18n_content:
    i18n_content = i18n_content.replace('      auto_tong_luong_nhan_duoc: "Tổng lương nhận được",', f'      auto_tong_luong_nhan_duoc: "Tổng lương nhận được",{vi_keys}')
    i18n_content = i18n_content.replace('      auto_tong_luong_nhan_duoc: "Total Net Salary",', f'      auto_tong_luong_nhan_duoc: "Total Net Salary",{en_keys}')

with open(i18n_path, 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("Updated i18n.jsx.")
