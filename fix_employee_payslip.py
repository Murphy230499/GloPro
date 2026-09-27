import re

with open('src/components/staff/EmployeePayslipModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function EmployeePayslipModal\([^)]*\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    ">Chi tiết phiếu lương<": ">{t('staff.payroll.payslip_detail_title', 'Chi tiết phiếu lương')}<",
    ">Cơ sở<": ">{t('staff.payroll.branch', 'Cơ sở')}<",
    "'Chi nhánh trung tâm'": "t('staff.payroll.central_branch', 'Chi nhánh trung tâm')",
    "Địa chỉ:": "{t('staff.payroll.address', 'Địa chỉ:')}",
    ">Nhân viên<": ">{t('staff.payroll.col_staff', 'Nhân viên')}<",
    "'Chưa cập nhật'": "t('staff.payroll.not_updated', 'Chưa cập nhật')",
    ">Kỳ lương:<": ">{t('staff.payroll.pay_period_colon', 'Kỳ lương:')}<",
    ">Ngày TT:<": ">{t('staff.payroll.pay_date_colon', 'Ngày TT:')}<",
    ">Phương thức TT:<": ">{t('staff.payroll.payment_method_colon', 'Phương thức TT:')}<",
    ">Tiền mặt<": ">{t('staff.payroll.cash', 'Tiền mặt')}<",
    ">Thu nhập<": ">{t('staff.payroll.income', 'Thu nhập')}<",
    ">Số tiền<": ">{t('staff.payroll.amount', 'Số tiền')}<",
    ">HH Dịch vụ<": ">{t('staff.payroll.col_svc_com', 'HH Dịch vụ')}<",
    ">HH Sản phẩm<": ">{t('staff.payroll.col_prod_com', 'HH Sản phẩm')}<",
    ">HH Liệu trình<": ">{t('staff.payroll.col_trt_com', 'HH Liệu trình')}<",
    ">HH Gói DV<": ">{t('staff.payroll.col_pkg_com', 'HH Gói DV')}<",
    ">HH Combo DV<": ">{t('staff.payroll.col_svccmb_com', 'HH Combo DV')}<",
    ">HH Combo SP<": ">{t('staff.payroll.col_prodcmb_com', 'HH Combo SP')}<",
    ">HH Thẻ TM<": ">{t('staff.payroll.col_card_com', 'HH Thẻ TM')}<",
    ">HH Khách yêu cầu<": ">{t('staff.payroll.col_req_com', 'HH Khách yêu cầu')}<",
    ">HH Tăng ca<": ">{t('staff.payroll.col_ot_com', 'HH Tăng ca')}<",
    ">HH Doanh thu<": ">{t('staff.payroll.col_rev_com', 'HH Doanh thu')}<",
    ">Tiền Tip<": ">{t('staff.payroll.col_tip', 'Tiền Tip')}<",
    ">Lương cơ bản<": ">{t('staff.payroll.col_base_salary', 'Lương cơ bản')}<",
    ">Thưởng<": ">{t('staff.payroll.col_bonus', 'Thưởng')}<",
    ">Phạt<": ">{t('staff.payroll.col_penalty', 'Phạt')}<",
    ">Thuế giữ lại<": ">{t('staff.payroll.withheld_taxes', 'Thuế giữ lại')}<",
    ">Thuế thu nhập liên bang<": ">{t('staff.payroll.federal_tax', 'Thuế thu nhập liên bang')}<",
    ">Bảo hiểm xã hội<": ">{t('staff.payroll.social_security', 'Bảo hiểm xã hội')}<",
    ">Bảo hiểm y tế<": ">{t('staff.payroll.medicare', 'Bảo hiểm y tế')}<",
    ">Thuế thu nhập cá nhân<": ">{t('staff.payroll.state_tax', 'Thuế thu nhập cá nhân')}<",
    ">Đóng góp<": ">{t('staff.payroll.contributions', 'Đóng góp')}<",
    ">Bảo hiểm thất nghiệp liên bang<": ">{t('staff.payroll.futa', 'Bảo hiểm thất nghiệp liên bang')}<",
    ">Bảo hiểm thất nghiệp tiểu bang<": ">{t('staff.payroll.state_unemployment', 'Bảo hiểm thất nghiệp tiểu bang')}<",
    ">Thực lãnh:<": ">{t('staff.payroll.net_pay', 'Thực lãnh:')}<",
    ">Tổng cộng<": ">{t('staff.payroll.total_sum', 'Tổng cộng')}<",
    "\n            Đóng\n": "\n            {t('staff.scheduler.close_btn', 'Đóng')}\n"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/EmployeePayslipModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Update i18n
with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.payroll.processing': 'Đang xử lý',
    'staff.payroll.history_detail_title': 'Chi tiết thanh toán lương',
    'staff.payroll.payslip_detail_title': 'Chi tiết phiếu lương',
    'staff.payroll.branch': 'Cơ sở',
    'staff.payroll.central_branch': 'Chi nhánh trung tâm',
    'staff.payroll.address': 'Địa chỉ:',
    'staff.payroll.not_updated': 'Chưa cập nhật',
    'staff.payroll.pay_period_colon': 'Kỳ lương:',
    'staff.payroll.pay_date_colon': 'Ngày TT:',
    'staff.payroll.payment_method_colon': 'Phương thức TT:',
    'staff.payroll.income': 'Thu nhập',
    'staff.payroll.amount': 'Số tiền',
    'staff.payroll.withheld_taxes': 'Thuế giữ lại',
    'staff.payroll.federal_tax': 'Thuế thu nhập liên bang',
    'staff.payroll.social_security': 'Bảo hiểm xã hội',
    'staff.payroll.medicare': 'Bảo hiểm y tế',
    'staff.payroll.state_tax': 'Thuế thu nhập cá nhân',
    'staff.payroll.contributions': 'Đóng góp',
    'staff.payroll.futa': 'Bảo hiểm thất nghiệp liên bang',
    'staff.payroll.state_unemployment': 'Bảo hiểm thất nghiệp tiểu bang',
    'staff.payroll.net_pay': 'Thực lãnh:',
    'staff.payroll.status': 'Trạng thái',
    'staff.payroll.total_fund': 'Tổng quỹ lương',
    'staff.payroll.details': 'Chi tiết',
"""

new_keys_en = """
    'staff.payroll.processing': 'Processing',
    'staff.payroll.history_detail_title': 'Payroll Details',
    'staff.payroll.payslip_detail_title': 'Payslip Details',
    'staff.payroll.branch': 'Branch',
    'staff.payroll.central_branch': 'Central Branch',
    'staff.payroll.address': 'Address:',
    'staff.payroll.not_updated': 'Not updated',
    'staff.payroll.pay_period_colon': 'Pay Period:',
    'staff.payroll.pay_date_colon': 'Pay Date:',
    'staff.payroll.payment_method_colon': 'Payment Method:',
    'staff.payroll.income': 'Income',
    'staff.payroll.amount': 'Amount',
    'staff.payroll.withheld_taxes': 'Withheld Taxes',
    'staff.payroll.federal_tax': 'Federal Income Tax',
    'staff.payroll.social_security': 'Social Security',
    'staff.payroll.medicare': 'Medicare',
    'staff.payroll.state_tax': 'State Income Tax',
    'staff.payroll.contributions': 'Contributions',
    'staff.payroll.futa': 'Federal Unemployment',
    'staff.payroll.state_unemployment': 'State Unemployment',
    'staff.payroll.net_pay': 'Net Pay:',
    'staff.payroll.status': 'Status',
    'staff.payroll.total_fund': 'Total Fund',
    'staff.payroll.details': 'Details',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("EmployeePayslipModal translated")
