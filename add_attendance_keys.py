import re

with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_keys_vi = """
    'staff.attendance.load_error': 'Lỗi khi tải dữ liệu chấm công:',
    'staff.attendance.update_success': 'Đã điều chỉnh công thành công',
    'staff.attendance.no_shift': 'Không xếp ca',
    'staff.attendance.on_time': 'Đúng giờ',
    'staff.attendance.late': 'Đi trễ',
    'staff.attendance.early_leave': 'Về sớm',
    'staff.attendance.late_and_early': 'Trễ & Sớm',
    'staff.attendance.late_early': 'Đi trễ / Về sớm',
    'staff.attendance.missing_in': 'Chưa chấm vào',
    'staff.attendance.missing_out': 'Chưa chấm ra',
    'staff.attendance.missing_punch': 'Chấm công thiếu',
    'staff.attendance.no_attendance': 'Chưa chấm công',
    'staff.attendance.absent': 'Nghỉ làm',
    'staff.attendance.update_modal_title': 'Cập nhật chấm công',
    'staff.attendance.status_label': 'Trạng thái:',
    'staff.attendance.mark_absent': 'Nghỉ làm ngày này',
    'staff.attendance.check_in_label': 'Giờ vào:',
    'staff.attendance.check_out_label': 'Giờ ra:',
    'staff.attendance.confirm_update': 'Xác nhận điều chỉnh',
    'staff.attendance.edit_tooltip': 'Chỉnh sửa chấm công',
"""

new_keys_en = """
    'staff.attendance.load_error': 'Error loading attendance data:',
    'staff.attendance.update_success': 'Attendance updated successfully',
    'staff.attendance.no_shift': 'No shift',
    'staff.attendance.on_time': 'On time',
    'staff.attendance.late': 'Late',
    'staff.attendance.early_leave': 'Early leave',
    'staff.attendance.late_and_early': 'Late & Early',
    'staff.attendance.late_early': 'Late / Early',
    'staff.attendance.missing_in': 'Missing check-in',
    'staff.attendance.missing_out': 'Missing check-out',
    'staff.attendance.missing_punch': 'Missing punch',
    'staff.attendance.no_attendance': 'No attendance',
    'staff.attendance.absent': 'Absent',
    'staff.attendance.update_modal_title': 'Update Attendance',
    'staff.attendance.status_label': 'Status:',
    'staff.attendance.mark_absent': 'Mark as absent',
    'staff.attendance.check_in_label': 'Check-in:',
    'staff.attendance.check_out_label': 'Check-out:',
    'staff.attendance.confirm_update': 'Confirm update',
    'staff.attendance.edit_tooltip': 'Edit attendance',
"""

content = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', content)
content = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', content)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Attendance keys added to i18n!")
