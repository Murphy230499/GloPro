import re

with open('src/components/staff/PayrollHistoryDetailModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function PayrollHistoryDetailModal\([^)]*\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    ">Chi tiết thanh toán lương<": ">{t('staff.payroll.history_detail_title', 'Chi tiết thanh toán lương')}<",
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
    "\n              Đóng\n": "\n              {t('staff.scheduler.close_btn', 'Đóng')}\n"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/PayrollHistoryDetailModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("PayrollHistoryDetailModal translated")
