import re

with open('src/components/staff/AttendanceLog.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update formatDateHeader to use t
old_formatDateHeader = """const formatDateHeader = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${days[d.getDay()]} - ${dayNum}/${monthNum}`;
};"""

new_formatDateHeader = """const formatDateHeader = (dateStr, t) => {
  const d = new Date(dateStr);
  const days = [
    t('common.sunday', 'Chủ nhật'), 
    t('common.monday', 'Thứ 2'), 
    t('common.tuesday', 'Thứ 3'), 
    t('common.wednesday', 'Thứ 4'), 
    t('common.thursday', 'Thứ 5'), 
    t('common.friday', 'Thứ 6'), 
    t('common.saturday', 'Thứ 7')
  ];
  const dayNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${days[d.getDay()]} - ${dayNum}/${monthNum}`;
};"""
content = content.replace(old_formatDateHeader, new_formatDateHeader)

# Fix formatDateHeader calls
content = re.sub(r'formatDateHeader\(([^,)]+)\)', r'formatDateHeader(\1, t)', content)

# 2. Hardcoded texts in the UI
replacements = {
    ">Tuần:<": ">{t('staff.scheduler.week', 'Tuần:')}<",
    ">Tuần: ": ">{t('staff.scheduler.week', 'Tuần:')} ",
    "<span>Tuần: ": "<span>{t('staff.scheduler.week', 'Tuần:')} ",
    "Lỗi khi tải dữ liệu chấm công:": "t('staff.attendance.load_error', 'Lỗi khi tải dữ liệu chấm công:')",
    "Đã điều chỉnh công thành công": "t('staff.attendance.update_success', 'Đã điều chỉnh công thành công')",
    ">Nhân sự<": ">{t('staff.scheduler.staff_column', 'Nhân sự')}<",
    ">Không xếp ca<": ">{t('staff.attendance.no_shift', 'Không xếp ca')}<",
    ">Đúng giờ<": ">{t('staff.attendance.on_time', 'Đúng giờ')}<",
    ">Đi trễ / Về sớm<": ">{t('staff.attendance.late_early', 'Đi trễ / Về sớm')}<",
    ">Chưa chấm công<": ">{t('staff.attendance.no_attendance', 'Chưa chấm công')}<",
    ">Chấm công thiếu<": ">{t('staff.attendance.missing_punch', 'Chấm công thiếu')}<",
    ">Nghỉ làm<": ">{t('staff.attendance.absent', 'Nghỉ làm')}<",
    ">Cập nhật chấm công<": ">{t('staff.attendance.update_modal_title', 'Cập nhật chấm công')}<",
    ">Ca làm việc:<": ">{t('staff.scheduler.shift_label', 'Ca làm việc:')}<",
    ">Trạng thái:<": ">{t('staff.attendance.status_label', 'Trạng thái:')}<",
    ">Nghỉ làm ngày này<": ">{t('staff.attendance.mark_absent', 'Nghỉ làm ngày này')}<",
    ">Giờ vào:<": ">{t('staff.attendance.check_in_label', 'Giờ vào:')}<",
    ">Giờ ra:<": ">{t('staff.attendance.check_out_label', 'Giờ ra:')}<",
    ">Hủy<": ">{t('staff.scheduler.cancel', 'Hủy')}<",
    ">Xác nhận điều chỉnh<": ">{t('staff.attendance.confirm_update', 'Xác nhận điều chỉnh')}<",
    "title=\"Chỉnh sửa chấm công\"": "title={t('staff.attendance.edit_tooltip', 'Chỉnh sửa chấm công')}"
}

for old, new in replacements.items():
    if old.startswith(">"):
        content = content.replace(old, new)
    elif old.startswith("<span>"):
        content = content.replace(old, new)
    elif "title=" in old:
        content = content.replace(old, new)
    else:
        content = content.replace(f"'{old}'", new)

with open('src/components/staff/AttendanceLog.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Attendance translated successfully!")
