import re

with open('src/components/staff/SchedulerGrid.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "— Chọn nhân sự nguồn —": "{t('staff.scheduler.select_src_staff', '— Chọn nhân sự nguồn —')}",
    "Nhân sự đích (Chọn các nhân sự dán lịch đến)": "{t('staff.scheduler.dest_staff_label', 'Nhân sự đích (Chọn các nhân sự dán lịch đến)')}",
    "Chọn nhân sự nguồn trước": "{t('staff.scheduler.select_src_first', 'Chọn nhân sự nguồn trước')}",
    "— Chọn ngày nguồn —": "{t('staff.scheduler.select_src_day', '— Chọn ngày nguồn —')}",
    "Ngày đích (Chọn các ngày dán lịch đến)": "{t('staff.scheduler.dest_day_label', 'Ngày đích (Chọn các ngày dán lịch đến)')}",
    "Chọn ngày nguồn trước": "{t('staff.scheduler.select_day_first', 'Chọn ngày nguồn trước')}",
    "Chọn ngày đổi ca": "{t('staff.scheduler.select_swap_day_label', 'Chọn ngày đổi ca')}",
    "— Chọn ngày đổi ca —": "{t('staff.scheduler.select_swap_day', '— Chọn ngày đổi ca —')}",
    ">Nhân sự A<": ">{t('staff.scheduler.staff_a', 'Nhân sự A')}<",
    "— Chọn nhân sự A —": "{t('staff.scheduler.select_staff_a', '— Chọn nhân sự A —')}",
    ">Nhân sự B<": ">{t('staff.scheduler.staff_b', 'Nhân sự B')}<",
    "— Chọn nhân sự B —": "{t('staff.scheduler.select_staff_b', '— Chọn nhân sự B —')}",
    ">Xác nhận đổi ca<": ">{t('staff.scheduler.confirm_swap', 'Xác nhận đổi ca')}<",
    ">Xếp lịch làm việc<": ">{t('staff.scheduler.assign_modal_title', 'Xếp lịch làm việc')}<",
    ">Nhân viên:<": ">{t('staff.scheduler.employee_label', 'Nhân viên:')}<",
    ">Thời gian làm việc<": ">{t('staff.scheduler.work_time', 'Thời gian làm việc')}<",
    ">Thêm<": ">{t('staff.scheduler.add_action', 'Thêm')}<",
    ">Chưa định nghĩa ca làm việc nào. Hãy định nghĩa ca trước.<": ">{t('staff.scheduler.no_templates', 'Chưa định nghĩa ca làm việc nào. Hãy định nghĩa ca trước.')}<",
    ">Đăng ký nghỉ ngày này<": ">{t('staff.scheduler.register_off', 'Đăng ký nghỉ ngày này')}<",
    ">Lý do nghỉ:<": ">{t('staff.scheduler.off_reason_label', 'Lý do nghỉ:')}<",
    ">Khác<": ">{t('staff.scheduler.off_other', 'Khác')}<",
    ">Hủy<": ">{t('staff.scheduler.cancel', 'Hủy')}<",
    ">Lưu<": ">{t('staff.scheduler.save', 'Lưu')}<",
    ">Vui lòng chờ trong giây lát...<": ">{t('staff.scheduler.please_wait', 'Vui lòng chờ trong giây lát...')}<",
    "Vui lòng chọn nhân sự nguồn và ít nhất một nhân sự đích": "t('staff.scheduler.error_select_src_dest', 'Vui lòng chọn nhân sự nguồn và ít nhất một nhân sự đích')"
}

for old, new in replacements.items():
    if old.startswith(">"):
        content = content.replace(old, new)
    elif old == "Vui lòng chọn nhân sự nguồn và ít nhất một nhân sự đích":
        content = content.replace(f"'{old}'", new)
    else:
        # replace occurrences that are inside <option> or labels, etc.
        content = content.replace(f">{old}<", f">{{{new}}}<")
        content = content.replace(old, new)

# Wait, `content.replace(old, new)` might cause issues if I already wrapped them.
# Let's write a safer replace loop
