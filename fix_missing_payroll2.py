import re

i18n_path = 'src/lib/i18n.jsx'
with open(i18n_path, 'r', encoding='utf-8') as f:
    i18n_content = f.read()

vi_keys = """
    'payroll.staff_id_prefix': 'Mã NV:',
    'payroll.reconciliation_period': 'Kỳ đối soát:',
    'payroll.off': 'Nghỉ',
    'payroll.days': 'ngày',
    'payroll.turns': 'lượt',
    'payroll.packages': 'gói',
    'payroll.items': 'món',
    'payroll.shifts': 'Ca',
    'payroll.leave': 'Nghỉ phép',
    'payroll.total_commission_count': 'Tổng cộng hoa hồng',
    'payroll.total_tip_count': 'Tổng cộng tiền tip',
"""

en_keys = """
    'payroll.staff_id_prefix': 'Staff ID:',
    'payroll.reconciliation_period': 'Period:',
    'payroll.off': 'Off',
    'payroll.days': 'days',
    'payroll.turns': 'times',
    'payroll.packages': 'packages',
    'payroll.items': 'items',
    'payroll.shifts': 'Shifts',
    'payroll.leave': 'Leave',
    'payroll.total_commission_count': 'Total Commission',
    'payroll.total_tip_count': 'Total Tips',
"""

if "'payroll.staff_id_prefix'" not in i18n_content:
    i18n_content = i18n_content.replace(
        "'payroll.auto_tong_luong_thuc_nhan_ky_nay_ne': 'Tổng lương thực nhận kỳ này (Net Total)',",
        f"'payroll.auto_tong_luong_thuc_nhan_ky_nay_ne': 'Tổng lương thực nhận kỳ này (Net Total)',\n{vi_keys}"
    )
    i18n_content = i18n_content.replace(
        "'payroll.auto_tong_luong_thuc_nhan_ky_nay_ne': 'Total Net Salary This Period',",
        f"'payroll.auto_tong_luong_thuc_nhan_ky_nay_ne': 'Total Net Salary This Period',\n{en_keys}"
    )
    with open(i18n_path, 'w', encoding='utf-8') as f:
        f.write(i18n_content)
    print("Updated i18n.jsx.")
else:
    print("Keys already exist.")
