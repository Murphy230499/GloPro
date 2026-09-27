import re

with open('src/components/staff/RunPayrollModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function RunPayrollModal\([^)]*\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    "'Chưa chọn'": "t('staff.payroll.unselected', 'Chưa chọn')",
    "'Hoàn thành'": "t('staff.payroll.completed', 'Hoàn thành')",
    ">Thanh toán lương<": ">{t('staff.payroll.run_payroll_title', 'Thanh toán lương')}<",
    ">Kỳ lương<": ">{t('staff.payroll.pay_period', 'Kỳ lương')}<",
    ">Ngày thanh toán<": ">{t('staff.payroll.pay_date', 'Ngày thanh toán')}<",
    ">Tổng thanh toán<": ">{t('staff.payroll.total_payout', 'Tổng thanh toán')}<",
    ">Nhân viên<": ">{t('staff.payroll.col_staff', 'Nhân viên')}<",
    ">Phương thức TT<": ">{t('staff.payroll.col_payment_method', 'Phương thức TT')}<",
    ">Lương CB<": ">{t('staff.payroll.col_base_salary', 'Lương CB')}<",
    ">HH Sản phẩm<": ">{t('staff.payroll.col_prod_com', 'HH Sản phẩm')}<",
    ">HH Dịch vụ<": ">{t('staff.payroll.col_svc_com', 'HH Dịch vụ')}<",
    ">HH Liệu trình<": ">{t('staff.payroll.col_trt_com', 'HH Liệu trình')}<",
    ">HH Gói DV<": ">{t('staff.payroll.col_pkg_com', 'HH Gói DV')}<",
    ">HH Combo DV<": ">{t('staff.payroll.col_svccmb_com', 'HH Combo DV')}<",
    ">HH Combo SP<": ">{t('staff.payroll.col_prodcmb_com', 'HH Combo SP')}<",
    ">HH Thẻ TM<": ">{t('staff.payroll.col_card_com', 'HH Thẻ TM')}<",
    ">HH Khách yêu cầu<": ">{t('staff.payroll.col_req_com', 'HH Khách yêu cầu')}<",
    ">HH Tăng ca<": ">{t('staff.payroll.col_ot_com', 'HH Tăng ca')}<",
    ">HH Doanh thu<": ">{t('staff.payroll.col_rev_com', 'HH Doanh thu')}<",
    ">Tiền Tip<": ">{t('staff.payroll.col_tip', 'Tiền Tip')}<",
    ">Thưởng<": ">{t('staff.payroll.col_bonus', 'Thưởng')}<",
    ">Phạt<": ">{t('staff.payroll.col_penalty', 'Phạt')}<",
    ">Tổng nhận<": ">{t('staff.payroll.col_total', 'Tổng nhận')}<",
    ">Tiền mặt<": ">{t('staff.payroll.cash', 'Tiền mặt')}<",
    ">Tổng cộng<": ">{t('staff.payroll.total_sum', 'Tổng cộng')}<",
    "\n            Thanh toán\n": "\n            {t('staff.payroll.pay', 'Thanh toán')}\n"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/RunPayrollModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Update i18n
with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.payroll.add_adj_title': 'Thêm thưởng / phạt',
    'staff.payroll.adj_type': 'Loại điều chỉnh',
    'staff.payroll.bonus': 'Thưởng',
    'staff.payroll.penalty': 'Phạt',
    'staff.payroll.apply_for_staff': 'Áp dụng cho nhân viên',
    'staff.payroll.select_staff': 'Chọn nhân viên...',
    'staff.payroll.uncategorized': 'Chưa phân nhóm',
    'staff.payroll.amount': 'Số tiền (VNĐ)',
    'staff.payroll.note_optional': 'Ghi chú (tùy chọn)',
    'staff.payroll.enter_reason': 'Nhập lý do...',
    'staff.payroll.err_select_staff': 'Vui lòng chọn ít nhất một nhân viên',
    'staff.payroll.err_valid_amount': 'Vui lòng nhập số tiền hợp lệ',
    'staff.payroll.unselected': 'Chưa chọn',
    'staff.payroll.completed': 'Hoàn thành',
    'staff.payroll.run_payroll_title': 'Thanh toán lương',
    'staff.payroll.pay_period': 'Kỳ lương',
    'staff.payroll.pay_date': 'Ngày thanh toán',
    'staff.payroll.total_payout': 'Tổng thanh toán',
    'staff.payroll.col_staff': 'Nhân viên',
    'staff.payroll.col_payment_method': 'Phương thức TT',
    'staff.payroll.col_base_salary': 'Lương CB',
    'staff.payroll.col_prod_com': 'HH Sản phẩm',
    'staff.payroll.col_svc_com': 'HH Dịch vụ',
    'staff.payroll.col_trt_com': 'HH Liệu trình',
    'staff.payroll.col_pkg_com': 'HH Gói DV',
    'staff.payroll.col_svccmb_com': 'HH Combo DV',
    'staff.payroll.col_prodcmb_com': 'HH Combo SP',
    'staff.payroll.col_card_com': 'HH Thẻ TM',
    'staff.payroll.col_req_com': 'HH Khách yêu cầu',
    'staff.payroll.col_ot_com': 'HH Tăng ca',
    'staff.payroll.col_rev_com': 'HH Doanh thu',
    'staff.payroll.cash': 'Tiền mặt',
    'staff.payroll.pay': 'Thanh toán',
"""

new_keys_en = """
    'staff.payroll.add_adj_title': 'Add Bonus / Penalty',
    'staff.payroll.adj_type': 'Adjustment Type',
    'staff.payroll.bonus': 'Bonus',
    'staff.payroll.penalty': 'Penalty',
    'staff.payroll.apply_for_staff': 'Apply to Staff',
    'staff.payroll.select_staff': 'Select staff...',
    'staff.payroll.uncategorized': 'Uncategorized',
    'staff.payroll.amount': 'Amount (VND)',
    'staff.payroll.note_optional': 'Note (optional)',
    'staff.payroll.enter_reason': 'Enter reason...',
    'staff.payroll.err_select_staff': 'Please select at least one staff',
    'staff.payroll.err_valid_amount': 'Please enter a valid amount',
    'staff.payroll.unselected': 'Unselected',
    'staff.payroll.completed': 'Completed',
    'staff.payroll.run_payroll_title': 'Run Payroll',
    'staff.payroll.pay_period': 'Pay Period',
    'staff.payroll.pay_date': 'Pay Date',
    'staff.payroll.total_payout': 'Total Payout',
    'staff.payroll.col_staff': 'Staff',
    'staff.payroll.col_payment_method': 'Payment Method',
    'staff.payroll.col_base_salary': 'Base Salary',
    'staff.payroll.col_prod_com': 'Product Com',
    'staff.payroll.col_svc_com': 'Service Com',
    'staff.payroll.col_trt_com': 'Treatment Com',
    'staff.payroll.col_pkg_com': 'Package Com',
    'staff.payroll.col_svccmb_com': 'S.Combo Com',
    'staff.payroll.col_prodcmb_com': 'P.Combo Com',
    'staff.payroll.col_card_com': 'P.Card Com',
    'staff.payroll.col_req_com': 'Requested Com',
    'staff.payroll.col_ot_com': 'Overtime Com',
    'staff.payroll.col_rev_com': 'Revenue Com',
    'staff.payroll.cash': 'Cash',
    'staff.payroll.pay': 'Pay',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("RunPayrollModal translated successfully!")
