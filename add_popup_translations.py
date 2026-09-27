import re

with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_keys_vi = """
    'staff.scheduler.select_src_staff': '— Chọn nhân sự nguồn —',
    'staff.scheduler.dest_staff_label': 'Nhân sự đích (Chọn các nhân sự dán lịch đến)',
    'staff.scheduler.select_src_first': 'Chọn nhân sự nguồn trước',
    'staff.scheduler.select_src_day': '— Chọn ngày nguồn —',
    'staff.scheduler.dest_day_label': 'Ngày đích (Chọn các ngày dán lịch đến)',
    'staff.scheduler.select_day_first': 'Chọn ngày nguồn trước',
    'staff.scheduler.select_swap_day_label': 'Chọn ngày đổi ca',
    'staff.scheduler.select_swap_day': '— Chọn ngày đổi ca —',
    'staff.scheduler.staff_a': 'Nhân sự A',
    'staff.scheduler.select_staff_a': '— Chọn nhân sự A —',
    'staff.scheduler.staff_b': 'Nhân sự B',
    'staff.scheduler.select_staff_b': '— Chọn nhân sự B —',
    'staff.scheduler.confirm_swap': 'Xác nhận đổi ca',
    'staff.scheduler.assign_modal_title': 'Xếp lịch làm việc',
    'staff.scheduler.employee_label': 'Nhân viên:',
    'staff.scheduler.work_time': 'Thời gian làm việc',
    'staff.scheduler.add_action': 'Thêm',
    'staff.scheduler.no_templates': 'Chưa định nghĩa ca làm việc nào. Hãy định nghĩa ca trước.',
    'staff.scheduler.register_off': 'Đăng ký nghỉ ngày này',
    'staff.scheduler.off_reason_label': 'Lý do nghỉ:',
    'staff.scheduler.off_other': 'Khác',
    'staff.scheduler.cancel': 'Hủy',
    'staff.scheduler.save': 'Lưu',
    'staff.scheduler.please_wait': 'Vui lòng chờ trong giây lát...',
"""

new_keys_en = """
    'staff.scheduler.select_src_staff': '— Select source staff —',
    'staff.scheduler.dest_staff_label': 'Destination staff (Select staff to paste to)',
    'staff.scheduler.select_src_first': 'Select source staff first',
    'staff.scheduler.select_src_day': '— Select source day —',
    'staff.scheduler.dest_day_label': 'Destination days (Select days to paste to)',
    'staff.scheduler.select_day_first': 'Select source day first',
    'staff.scheduler.select_swap_day_label': 'Select day to swap',
    'staff.scheduler.select_swap_day': '— Select day to swap —',
    'staff.scheduler.staff_a': 'Staff A',
    'staff.scheduler.select_staff_a': '— Select Staff A —',
    'staff.scheduler.staff_b': 'Staff B',
    'staff.scheduler.select_staff_b': '— Select Staff B —',
    'staff.scheduler.confirm_swap': 'Confirm swap',
    'staff.scheduler.assign_modal_title': 'Assign Schedule',
    'staff.scheduler.employee_label': 'Employee:',
    'staff.scheduler.work_time': 'Working hours',
    'staff.scheduler.add_action': 'Add',
    'staff.scheduler.no_templates': 'No shift templates defined. Please define a shift first.',
    'staff.scheduler.register_off': 'Register day off',
    'staff.scheduler.off_reason_label': 'Reason for leave:',
    'staff.scheduler.off_other': 'Other',
    'staff.scheduler.cancel': 'Cancel',
    'staff.scheduler.save': 'Save',
    'staff.scheduler.please_wait': 'Please wait a moment...',
"""

# Insert into vi
content = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', content)
# Insert into en
content = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', content)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Popup translations added to i18n!")
