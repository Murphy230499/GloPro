import re

with open('src/components/staff/AddAdjustmentModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function AddAdjustmentModal\([^)]*\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    ">Thêm thưởng / phạt<": ">{t('staff.payroll.add_adj_title', 'Thêm thưởng / phạt')}<",
    ">Loại điều chỉnh<": ">{t('staff.payroll.adj_type', 'Loại điều chỉnh')}<",
    ">Thưởng<": ">{t('staff.payroll.bonus', 'Thưởng')}<",
    ">Phạt<": ">{t('staff.payroll.penalty', 'Phạt')}<",
    ">Áp dụng cho nhân viên<": ">{t('staff.payroll.apply_for_staff', 'Áp dụng cho nhân viên')}<",
    "\n                  ? 'Chọn nhân viên...' \n": "\n                  ? t('staff.payroll.select_staff', 'Chọn nhân viên...') \n",
    "\n                    ? 'Tất cả nhân viên' \n": "\n                    ? t('staff.payroll.all_staff', 'Tất cả nhân viên') \n",
    "`Đã chọn ${selectedStaffIds.length} nhân viên`": "t('staff.payroll.selected_staff', 'Đã chọn {count} nhân viên').replace('{count}', selectedStaffIds.length)",
    'placeholder="tìm kiếm nhân viên..."': 'placeholder={t("staff.commission.search_staff", "tìm kiếm nhân viên...")}',
    ">Chọn tất cả<": ">{t('staff.commission.select_all', 'Chọn tất cả')}<",
    "'Chưa phân nhóm'": "t('staff.payroll.uncategorized', 'Chưa phân nhóm')",
    ">Số tiền (VNĐ)<": ">{t('staff.payroll.amount', 'Số tiền (VNĐ)')}<",
    ">Ghi chú (tùy chọn)<": ">{t('staff.payroll.note_optional', 'Ghi chú (tùy chọn)')}<",
    'placeholder="Nhập lý do..."': 'placeholder={t("staff.payroll.enter_reason", "Nhập lý do...")}',
    "'Vui lòng chọn ít nhất một nhân viên'": "t('staff.payroll.err_select_staff', 'Vui lòng chọn ít nhất một nhân viên')",
    "'Vui lòng nhập số tiền hợp lệ'": "t('staff.payroll.err_valid_amount', 'Vui lòng nhập số tiền hợp lệ')",
    "\n            Hủy\n": "\n            {t('staff.scheduler.cancel', 'Hủy')}\n",
    "\n            Áp dụng\n": "\n            {t('staff.commission.apply_btn', 'Áp dụng')}\n",
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/AddAdjustmentModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("AddAdjustmentModal translated successfully!")
