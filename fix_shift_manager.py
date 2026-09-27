import re

with open('src/components/staff/ShiftTemplateManager.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function ShiftTemplateManager\([^)]*\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    ">Danh sách ca làm việc ({templates.length})<": ">{t('staff.scheduler.shift_list_title', 'Danh sách ca làm việc')} ({templates.length})<",
    ">Quản lý định nghĩa ca trực và thời gian check in/out của nhân sự<": ">{t('staff.scheduler.shift_list_desc', 'Quản lý định nghĩa ca trực và thời gian check in/out của nhân sự')}<",
    "> Thêm ca làm việc<": "> {t('staff.scheduler.add_shift_btn', 'Thêm ca làm việc')}<",
    ">Đang tải danh sách ca...<": ">{t('staff.scheduler.loading_shifts', 'Đang tải danh sách ca...')}<",
    '>Chưa có ca làm việc nào. Chọn "Thêm ca làm việc" để bắt đầu.<': '>{t("staff.scheduler.empty_shifts", \'Chưa có ca làm việc nào. Chọn "Thêm ca làm việc" để bắt đầu.\')}<',
    "'Hoạt động' : 'Tạm dừng'": "t('staff.scheduler.status_active', 'Hoạt động') : t('staff.scheduler.status_inactive', 'Tạm dừng')",
    ">Ca mặc định tự gán<": ">{t('staff.scheduler.shift_default', 'Ca mặc định tự gán')}<",
    "Thời gian: ": "{t('staff.scheduler.time_label', 'Thời gian:')} ",
    "🏢 Chi nhánh: ": "🏢 {t('staff.scheduler.branch_label', 'Chi nhánh:')} ",
    "\n                    Chỉnh sửa\n": "\n                    {t('staff.scheduler.edit_btn', 'Chỉnh sửa')}\n",
    "editingId ? 'Sửa ca làm việc' : 'Thêm mới ca làm việc'": "editingId ? t('staff.scheduler.edit_shift', 'Sửa ca làm việc') : t('staff.scheduler.add_shift', 'Thêm mới ca làm việc')",
    ">Tên ca *<": ">{t('staff.scheduler.shift_name', 'Tên ca *')}<",
    'placeholder="Nhập tên ca làm việc"': 'placeholder={t("staff.scheduler.shift_name_placeholder", "Nhập tên ca làm việc")}',
    ">Chi nhánh áp dụng *<": ">{t('staff.scheduler.apply_branch', 'Chi nhánh áp dụng *')}<",
    ">— Chọn chi nhánh —<": ">{t('staff.scheduler.select_branch', '— Chọn chi nhánh —')}<",
    ">Giờ check in<": ">{t('staff.scheduler.checkin_time', 'Giờ check in')}<",
    ">Giờ check out<": ">{t('staff.scheduler.checkout_time', 'Giờ check out')}<",
    ">Được phép đi muộn<": ">{t('staff.scheduler.allow_late', 'Được phép đi muộn')}<",
    ">Được phép về sớm<": ">{t('staff.scheduler.allow_early', 'Được phép về sớm')}<",
    ">Tính giờ làm thêm sau giờ check out.<": ">{t('staff.scheduler.calc_overtime', 'Tính giờ làm thêm sau giờ check out.')}<",
    ">Cài đặt màu ca làm<": ">{t('staff.scheduler.shift_color', 'Cài đặt màu ca làm')}<",
    ">Phút<": ">{t('staff.scheduler.minutes', 'Phút')}<",
    ">Ghi chú<": ">{t('staff.scheduler.note', 'Ghi chú')}<",
    'placeholder="Nhập ghi chú ca làm việc"': 'placeholder={t("staff.scheduler.note_placeholder", "Nhập ghi chú ca làm việc")}',
    ">Đang hoạt động<": ">{t('staff.scheduler.active', 'Đang hoạt động')}<",
    "\n                Huỷ bỏ\n": "\n                {t('staff.scheduler.cancel', 'Huỷ bỏ')}\n",
    "editingId ? 'Lưu' : 'Tạo'": "editingId ? t('staff.scheduler.save', 'Lưu') : t('staff.scheduler.create', 'Tạo')",
    "'Đã xoá ca làm việc'": "t('staff.scheduler.delete_shift_success', 'Đã xoá ca làm việc')",
    "'Nhập tên ca làm việc'": "t('staff.scheduler.err_name', 'Nhập tên ca làm việc')",
    "'Chọn chi nhánh áp dụng'": "t('staff.scheduler.err_branch', 'Chọn chi nhánh áp dụng')",
    "'Nhập giờ check in và check out'": "t('staff.scheduler.err_time', 'Nhập giờ check in và check out')",
    "'Đã cập nhật ca làm việc'": "t('staff.scheduler.update_shift_success', 'Đã cập nhật ca làm việc')",
    "'Đã thêm ca làm việc mới'": "t('staff.scheduler.create_shift_success', 'Đã thêm ca làm việc mới')",
    "'Xoá ca làm việc này? Lịch xếp ca hiện tại có thể bị ảnh hưởng.'": "t('staff.scheduler.delete_shift_confirm', 'Xoá ca làm việc này? Lịch xếp ca hiện tại có thể bị ảnh hưởng.')"
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Fix duplicate (offline) messages in toasts
content = content.replace("t('staff.scheduler.update_shift_success', 'Đã cập nhật ca làm việc') (offline)", "t('staff.scheduler.update_shift_success_offline', 'Đã cập nhật ca làm việc (offline)')")
content = content.replace("t('staff.scheduler.create_shift_success', 'Đã thêm ca làm việc mới') (offline)", "t('staff.scheduler.create_shift_success_offline', 'Đã thêm ca làm việc mới (offline)')")


with open('src/components/staff/ShiftTemplateManager.jsx', 'w', encoding='utf-8') as f:
    f.write(content)


# Update i18n
with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.scheduler.shift_list_title': 'Danh sách ca làm việc',
    'staff.scheduler.shift_list_desc': 'Quản lý định nghĩa ca trực và thời gian check in/out của nhân sự',
    'staff.scheduler.add_shift_btn': 'Thêm ca làm việc',
    'staff.scheduler.loading_shifts': 'Đang tải danh sách ca...',
    'staff.scheduler.empty_shifts': 'Chưa có ca làm việc nào. Chọn "Thêm ca làm việc" để bắt đầu.',
    'staff.scheduler.status_active': 'Hoạt động',
    'staff.scheduler.status_inactive': 'Tạm dừng',
    'staff.scheduler.shift_default': 'Ca mặc định tự gán',
    'staff.scheduler.time_label': 'Thời gian:',
    'staff.scheduler.branch_label': 'Chi nhánh:',
    'staff.scheduler.edit_btn': 'Chỉnh sửa',
    'staff.scheduler.edit_shift': 'Sửa ca làm việc',
    'staff.scheduler.add_shift': 'Thêm mới ca làm việc',
    'staff.scheduler.shift_name': 'Tên ca *',
    'staff.scheduler.shift_name_placeholder': 'Nhập tên ca làm việc',
    'staff.scheduler.apply_branch': 'Chi nhánh áp dụng *',
    'staff.scheduler.select_branch': '— Chọn chi nhánh —',
    'staff.scheduler.checkin_time': 'Giờ check in',
    'staff.scheduler.checkout_time': 'Giờ check out',
    'staff.scheduler.allow_late': 'Được phép đi muộn',
    'staff.scheduler.allow_early': 'Được phép về sớm',
    'staff.scheduler.calc_overtime': 'Tính giờ làm thêm sau giờ check out.',
    'staff.scheduler.shift_color': 'Cài đặt màu ca làm',
    'staff.scheduler.minutes': 'Phút',
    'staff.scheduler.note': 'Ghi chú',
    'staff.scheduler.note_placeholder': 'Nhập ghi chú ca làm việc',
    'staff.scheduler.active': 'Đang hoạt động',
    'staff.scheduler.cancel': 'Huỷ bỏ',
    'staff.scheduler.save': 'Lưu',
    'staff.scheduler.create': 'Tạo',
    'staff.scheduler.delete_shift_success': 'Đã xoá ca làm việc',
    'staff.scheduler.err_name': 'Nhập tên ca làm việc',
    'staff.scheduler.err_branch': 'Chọn chi nhánh áp dụng',
    'staff.scheduler.err_time': 'Nhập giờ check in và check out',
    'staff.scheduler.update_shift_success': 'Đã cập nhật ca làm việc',
    'staff.scheduler.create_shift_success': 'Đã thêm ca làm việc mới',
    'staff.scheduler.update_shift_success_offline': 'Đã cập nhật ca làm việc (offline)',
    'staff.scheduler.create_shift_success_offline': 'Đã thêm ca làm việc mới (offline)',
    'staff.scheduler.delete_shift_confirm': 'Xoá ca làm việc này? Lịch xếp ca hiện tại có thể bị ảnh hưởng.',
"""

new_keys_en = """
    'staff.scheduler.shift_list_title': 'Shift List',
    'staff.scheduler.shift_list_desc': 'Manage shift definitions and staff check-in/out times',
    'staff.scheduler.add_shift_btn': 'Add Shift',
    'staff.scheduler.loading_shifts': 'Loading shifts...',
    'staff.scheduler.empty_shifts': 'No shifts available. Click "Add Shift" to start.',
    'staff.scheduler.status_active': 'Active',
    'staff.scheduler.status_inactive': 'Paused',
    'staff.scheduler.shift_default': 'Default auto-assigned shift',
    'staff.scheduler.time_label': 'Time:',
    'staff.scheduler.branch_label': 'Branch:',
    'staff.scheduler.edit_btn': 'Edit',
    'staff.scheduler.edit_shift': 'Edit Shift',
    'staff.scheduler.add_shift': 'Add New Shift',
    'staff.scheduler.shift_name': 'Shift Name *',
    'staff.scheduler.shift_name_placeholder': 'Enter shift name',
    'staff.scheduler.apply_branch': 'Applicable Branch *',
    'staff.scheduler.select_branch': '— Select branch —',
    'staff.scheduler.checkin_time': 'Check-in Time',
    'staff.scheduler.checkout_time': 'Check-out Time',
    'staff.scheduler.allow_late': 'Allow late arrival',
    'staff.scheduler.allow_early': 'Allow early leave',
    'staff.scheduler.calc_overtime': 'Calculate overtime after check-out',
    'staff.scheduler.shift_color': 'Shift Color Settings',
    'staff.scheduler.minutes': 'Minutes',
    'staff.scheduler.note': 'Note',
    'staff.scheduler.note_placeholder': 'Enter shift note',
    'staff.scheduler.active': 'Active',
    'staff.scheduler.cancel': 'Cancel',
    'staff.scheduler.save': 'Save',
    'staff.scheduler.create': 'Create',
    'staff.scheduler.delete_shift_success': 'Shift deleted successfully',
    'staff.scheduler.err_name': 'Please enter shift name',
    'staff.scheduler.err_branch': 'Please select applicable branch',
    'staff.scheduler.err_time': 'Please enter check-in and check-out times',
    'staff.scheduler.update_shift_success': 'Shift updated successfully',
    'staff.scheduler.create_shift_success': 'New shift added successfully',
    'staff.scheduler.update_shift_success_offline': 'Shift updated successfully (offline)',
    'staff.scheduler.create_shift_success_offline': 'New shift added successfully (offline)',
    'staff.scheduler.delete_shift_confirm': 'Delete this shift? Current schedules might be affected.',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("ShiftTemplateManager translated successfully!")
