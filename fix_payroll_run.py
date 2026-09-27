import re

with open('src/components/staff/PayrollRunTab.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function PayrollRunTab\([^)]*\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    ">khoảng thời gian<": ">{t('staff.payroll.date_placeholder', 'khoảng thời gian')}<",
    "\n                  Hủy\n": "\n                  {t('staff.scheduler.cancel', 'Hủy')}\n",
    "\n                  Áp dụng\n": "\n                  {t('staff.commission.apply_btn', 'Áp dụng')}\n",
    "\n                            Hủy\n": "\n                            {t('staff.scheduler.cancel', 'Hủy')}\n",
    "\n                          Áp dụng\n": "\n                          {t('staff.commission.apply_btn', 'Áp dụng')}\n",
    "\n                  tất cả nhân viên\n": "\n                  {t('staff.payroll.all_staff', 'tất cả nhân viên')}\n",
    "\n                    tất cả nhân viên\n": "\n                    {t('staff.payroll.all_staff', 'tất cả nhân viên')}\n",
    "`Đã chọn ${selectedStaffIds.length} nhân viên`": "t('staff.payroll.selected_staff', 'Đã chọn {count} nhân viên').replace('{count}', selectedStaffIds.length)",
    'placeholder="tìm kiếm nhân viên..."': 'placeholder={t("staff.commission.search_staff", "tìm kiếm nhân viên...")}',
    ">Chọn tất cả<": ">{t('staff.commission.select_all', 'Chọn tất cả')}<",
    "\n            Thêm thưởng/phạt\n": "\n            {t('staff.payroll.add_adjustment', 'Thêm thưởng/phạt')}\n",
    "\n            Thanh toán lương\n": "\n            {t('staff.payroll.run_payroll', 'Thanh toán lương')}\n",
    ">Nhân viên<": ">{t('staff.commission.staff_col', 'Nhân viên')}<",
    ">Chọn cột muốn hiển thị<": ">{t('staff.payroll.choose_columns', 'Chọn cột muốn hiển thị')}<",
    'title="Bấm để xem chi tiết lương nhân viên"': 'title={t("staff.payroll.view_detail_tooltip", "Bấm để xem chi tiết lương nhân viên")}',
    ">Tổng cộng<": ">{t('staff.payroll.total_sum', 'Tổng cộng')}<",
    "'Thanh toán lương thành công!'": "t('staff.payroll.run_success', 'Thanh toán lương thành công!')",
    "const role = emp.role || 'Chưa phân nhóm';": "const role = emp.role || 'Chưa phân nhóm';" # Wait, the user said don't translate staff groups. This is fine.
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Replace col.label with t() dynamically
content = content.replace("{col.label}", "{t(`staff.payroll.col_${col.id}`, col.label)}")

with open('src/components/staff/PayrollRunTab.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Update i18n
with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.payroll.tab_run': 'Bảng lương nhân viên',
    'staff.payroll.tab_history': 'Lịch sử thanh toán',
    'staff.payroll.date_placeholder': 'khoảng thời gian',
    'staff.payroll.all_staff': 'tất cả nhân viên',
    'staff.payroll.selected_staff': 'Đã chọn {count} nhân viên',
    'staff.payroll.add_adjustment': 'Thêm thưởng/phạt',
    'staff.payroll.run_payroll': 'Thanh toán lương',
    'staff.payroll.choose_columns': 'Chọn cột muốn hiển thị',
    'staff.payroll.view_detail_tooltip': 'Bấm để xem chi tiết lương nhân viên',
    'staff.payroll.total_sum': 'Tổng cộng',
    'staff.payroll.run_success': 'Thanh toán lương thành công!',
    'staff.payroll.col_shifts': 'Tổng số ca',
    'staff.payroll.col_daysOff': 'Số ngày nghỉ',
    'staff.payroll.col_salary': 'Lương CB',
    'staff.payroll.col_noServices': 'Số dịch vụ',
    'staff.payroll.col_serviceSales': 'Doanh số DV',
    'staff.payroll.col_serviceCom': 'Hoa hồng DV',
    'staff.payroll.col_noTreatment': 'Số liệu trình',
    'staff.payroll.col_treatmentSales': 'Doanh thu LT',
    'staff.payroll.col_treatmentCom': 'Hoa hồng LT',
    'staff.payroll.col_noPackage': 'Số gói DV',
    'staff.payroll.col_packageSales': 'Doanh thu gói DV',
    'staff.payroll.col_packageCom': 'Hoa hồng gói DV',
    'staff.payroll.col_noServiceCombo': 'Số combo DV',
    'staff.payroll.col_serviceComboSales': 'Doanh thu combo DV',
    'staff.payroll.col_serviceComboCom': 'Hoa hồng combo DV',
    'staff.payroll.col_noProductCombo': 'Số combo SP',
    'staff.payroll.col_productComboSales': 'Doanh thu combo SP',
    'staff.payroll.col_productComboCom': 'Hoa hồng combo SP',
    'staff.payroll.col_noProduct': 'Số sản phẩm',
    'staff.payroll.col_productSales': 'Doanh số SP',
    'staff.payroll.col_productCom': 'Hoa hồng SP',
    'staff.payroll.col_noPrepaidCard': 'Số thẻ TM',
    'staff.payroll.col_prepaidCardSales': 'Doanh thu thẻ TM',
    'staff.payroll.col_prepaidCardCom': 'Hoa hồng thẻ TM',
    'staff.payroll.col_requestedCom': 'HH khách yêu cầu',
    'staff.payroll.col_overtimeCom': 'HH tăng ca',
    'staff.payroll.col_revenueCom': 'HH doanh thu',
    'staff.payroll.col_tip': 'Tiền Tip',
    'staff.payroll.col_bonus': 'Thưởng',
    'staff.payroll.col_penalty': 'Phạt',
    'staff.payroll.col_total': 'Tổng nhận',
"""

new_keys_en = """
    'staff.payroll.tab_run': 'Staff Payroll',
    'staff.payroll.tab_history': 'Payment History',
    'staff.payroll.date_placeholder': 'date range',
    'staff.payroll.all_staff': 'all staff',
    'staff.payroll.selected_staff': 'Selected {count} staff',
    'staff.payroll.add_adjustment': 'Add Bonus/Penalty',
    'staff.payroll.run_payroll': 'Run Payroll',
    'staff.payroll.choose_columns': 'Choose columns to display',
    'staff.payroll.view_detail_tooltip': 'Click to view payroll details',
    'staff.payroll.total_sum': 'Total',
    'staff.payroll.run_success': 'Payroll ran successfully!',
    'staff.payroll.col_shifts': 'Total Shifts',
    'staff.payroll.col_daysOff': 'Days Off',
    'staff.payroll.col_salary': 'Base Salary',
    'staff.payroll.col_noServices': 'Services',
    'staff.payroll.col_serviceSales': 'Service Rev',
    'staff.payroll.col_serviceCom': 'Service Com',
    'staff.payroll.col_noTreatment': 'Treatments',
    'staff.payroll.col_treatmentSales': 'Treatment Rev',
    'staff.payroll.col_treatmentCom': 'Treatment Com',
    'staff.payroll.col_noPackage': 'Packages',
    'staff.payroll.col_packageSales': 'Package Rev',
    'staff.payroll.col_packageCom': 'Package Com',
    'staff.payroll.col_noServiceCombo': 'Service Combos',
    'staff.payroll.col_serviceComboSales': 'S.Combo Rev',
    'staff.payroll.col_serviceComboCom': 'S.Combo Com',
    'staff.payroll.col_noProductCombo': 'Product Combos',
    'staff.payroll.col_productComboSales': 'P.Combo Rev',
    'staff.payroll.col_productComboCom': 'P.Combo Com',
    'staff.payroll.col_noProduct': 'Products',
    'staff.payroll.col_productSales': 'Product Rev',
    'staff.payroll.col_productCom': 'Product Com',
    'staff.payroll.col_noPrepaidCard': 'Prepaid Cards',
    'staff.payroll.col_prepaidCardSales': 'P.Card Rev',
    'staff.payroll.col_prepaidCardCom': 'P.Card Com',
    'staff.payroll.col_requestedCom': 'Requested Com',
    'staff.payroll.col_overtimeCom': 'Overtime Com',
    'staff.payroll.col_revenueCom': 'Revenue Com',
    'staff.payroll.col_tip': 'Tips',
    'staff.payroll.col_bonus': 'Bonus',
    'staff.payroll.col_penalty': 'Penalty',
    'staff.payroll.col_total': 'Total Pay',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("PayrollRunTab translated successfully!")
