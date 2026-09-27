import re

with open('src/components/staff/SchedulerGrid.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace these one by one manually, strictly targeting the JSX parts or Toast messages.

# 1. Toasts (these are inside quotes, replace the string entirely)
content = content.replace(
    "'Đã BẬT tự động sao chép lịch tuần mới'", 
    "t('staff.scheduler.msg_auto_copy_on', 'Đã BẬT tự động sao chép lịch tuần mới')"
)
content = content.replace(
    "'Đã TẮT tự động sao chép lịch tuần mới'", 
    "t('staff.scheduler.msg_auto_copy_off', 'Đã TẮT tự động sao chép lịch tuần mới')"
)
content = content.replace(
    "`Đã tự động sao chép ${createPayloads.length} ca xếp từ tuần trước sang tuần này`", 
    "t('staff.scheduler.msg_auto_copy_success', 'Đã tự động sao chép {n} ca xếp từ tuần trước sang tuần này').replace('{n}', createPayloads.length)"
)
content = content.replace(
    "'Sao chép toàn bộ lịch xếp ca của tuần hiện tại sang tuần tiếp theo?'", 
    "t('staff.scheduler.msg_copy_week_confirm', 'Sao chép toàn bộ lịch xếp ca của tuần hiện tại sang tuần tiếp theo?')"
)
content = content.replace(
    "'Đang sao chép lịch sang tuần tiếp theo...'", 
    "t('staff.scheduler.msg_copy_week_processing', 'Đang sao chép lịch sang tuần tiếp theo...')"
)
content = content.replace(
    "`Đã sao chép thành công ${createPayloads.length} ca xếp sang tuần tiếp theo`", 
    "t('staff.scheduler.msg_copy_week_success', 'Đã sao chép thành công {n} ca xếp sang tuần tiếp theo').replace('{n}', createPayloads.length)"
)
content = content.replace(
    "'Lỗi khi sao chép lịch: '", 
    "t('staff.scheduler.msg_copy_err', 'Lỗi khi sao chép lịch: ')"
)
content = content.replace(
    "'Đang sao chép lịch nhân sự...'", 
    "t('staff.scheduler.msg_copy_staff_processing', 'Đang sao chép lịch nhân sự...')"
)
content = content.replace(
    "'Đã sao chép lịch làm việc thành công'", 
    "t('staff.scheduler.msg_copy_staff_success', 'Đã sao chép lịch làm việc thành công')"
)
content = content.replace(
    "'Lỗi sao chép: '", 
    "t('staff.scheduler.msg_copy_err', 'Lỗi sao chép: ')"
)
content = content.replace(
    "`Ngày nguồn (${formatDateHeader(srcDay)}) chưa có lịch làm việc nào để sao chép`", 
    "t('staff.scheduler.msg_copy_day_empty', 'Ngày nguồn ({date}) chưa có lịch làm việc nào để sao chép').replace('{date}', formatDateHeader(srcDay))"
)
content = content.replace(
    "'Đang sao chép ca ngày...'", 
    "t('staff.scheduler.msg_copy_day_processing', 'Đang sao chép ca ngày...')"
)
content = content.replace(
    "`Đã sao chép ${srcScheds.length} ca từ ${formatDateHeader(srcDay)} sang ${destDays.length} ngày`", 
    "t('staff.scheduler.msg_copy_day_success', 'Đã sao chép {n1} ca từ {d1} sang {n2} ngày').replace('{n1}', srcScheds.length).replace('{d1}', formatDateHeader(srcDay)).replace('{n2}', destDays.length)"
)
content = content.replace(
    "'Lỗi sao chép ngày: '", 
    "t('staff.scheduler.msg_copy_err', 'Lỗi sao chép ngày: ')"
)
content = content.replace(
    "`Xác nhận đổi lịch của ${sA.full_name} và ${sB.full_name} trong ngày ${formatDateHeader(swapDay)}?`", 
    "t('staff.scheduler.swap_confirm', 'Xác nhận đổi lịch của {n1} và {n2} trong ngày {date}?').replace('{n1}', sA.full_name).replace('{n2}', sB.full_name).replace('{date}', formatDateHeader(swapDay))"
)
content = content.replace(
    "'Đang đổi ca...'", 
    "t('staff.scheduler.swap_processing', 'Đang đổi ca...')"
)
content = content.replace(
    "'Đổi ca thành công!'", 
    "t('staff.scheduler.swap_success', 'Đổi ca thành công!')"
)
content = content.replace(
    "'Xác nhận xóa TOÀN BỘ lịch làm việc của TẤT CẢ nhân viên trong tuần này?'", 
    "t('staff.scheduler.clear_confirm', 'Xác nhận xóa TOÀN BỘ lịch làm việc của TẤT CẢ nhân viên trong tuần này?')"
)
content = content.replace(
    "'Đang xóa lịch...'", 
    "t('staff.scheduler.clear_processing', 'Đang xóa lịch...')"
)
content = content.replace(
    "'Đã xóa toàn bộ lịch tuần này'", 
    "t('staff.scheduler.clear_success', 'Đã xóa toàn bộ lịch tuần này')"
)
content = content.replace(
    "'Vui lòng chọn nhân sự nguồn và ít nhất một nhân sự đích'", 
    "t('staff.scheduler.error_select_src_dest', 'Vui lòng chọn nhân sự nguồn và ít nhất một nhân sự đích')"
)


# 2. Toolbar buttons (text immediately follows an Icon component or is inside span)
content = content.replace(
    "<span>Tuần: ", 
    "<span>{t('staff.scheduler.week', 'Tuần:')} "
)
content = content.replace(
    ">Tự động lặp lịch<", 
    ">{t('staff.scheduler.auto_schedule', 'Tự động lập lịch')}<"
)
content = content.replace(
    "/> Sao chép tuần sau", 
    "/> {t('staff.scheduler.copy_next_week', 'Sao chép tuần sau')}"
)
content = content.replace(
    "/> Sao chép nhân sự", 
    "/> {t('staff.scheduler.copy_staff', 'Sao chép nhân sự')}"
)
content = content.replace(
    "/> Sao chép ca ngày", 
    "/> {t('staff.scheduler.copy_day', 'Sao chép ca ngày')}"
)
content = content.replace(
    "/> Đổi ca nhân sự", 
    "/> {t('staff.scheduler.swap_staff', 'Đổi ca nhân sự')}"
)
content = content.replace(
    "/> Xóa lịch tuần này", 
    "/> {t('staff.scheduler.clear_week', 'Xóa lịch tuần này')}"
)


# 3. Headers and specific tags
content = content.replace(">Nhân sự<", ">{t('staff.scheduler.staff_column', 'Nhân sự')}<")
content = content.replace(">Chưa có nhân viên nào trong danh sách. Hãy thêm nhân viên trước.<", ">{t('staff.scheduler.empty_staff', 'Chưa có nhân viên nào trong danh sách. Hãy thêm nhân viên trước.')}<")
content = content.replace(">Thêm nhân viên ngay<", ">{t('staff.scheduler.add_staff_now', 'Thêm nhân viên ngay')}<")
content = content.replace(">Chưa có mẫu ca làm việc nào. Hãy thêm ít nhất 1 mẫu ca làm việc trong mục Quản lý ca làm việc.<", ">{t('staff.scheduler.empty_template', 'Chưa có mẫu ca làm việc nào. Hãy thêm ít nhất 1 mẫu ca làm việc trong mục Quản lý ca làm việc.')}<")


# 4. Popups (Copy Staff)
content = content.replace(
    ">Sao chép lịch nhân sự<", 
    ">{t('staff.scheduler.copy_staff', 'Sao chép lịch nhân sự')}<"
)
content = content.replace(
    ">Nhân sự nguồn (Sao chép từ)<", 
    ">{t('staff.scheduler.src_staff', 'Nhân sự nguồn (Sao chép từ)')}<"
)
content = content.replace(
    ">— Chọn nhân sự nguồn —<", 
    ">{t('staff.scheduler.select_src_staff', '— Chọn nhân sự nguồn —')}<"
)
content = content.replace(
    ">Nhân sự đích (Chọn các nhân sự dán lịch đến)<", 
    ">{t('staff.scheduler.dest_staff_label', 'Nhân sự đích (Chọn các nhân sự dán lịch đến)')}<"
)
content = content.replace(
    ">Chọn nhân sự nguồn trước<", 
    ">{t('staff.scheduler.select_src_first', 'Chọn nhân sự nguồn trước')}<"
)
content = content.replace(
    ">Bắt đầu sao chép<", 
    ">{t('staff.scheduler.start_copy', 'Bắt đầu sao chép')}<"
)


# 5. Popups (Copy Day)
content = content.replace(
    ">Sao chép ca ngày<", 
    ">{t('staff.scheduler.copy_day', 'Sao chép ca ngày')}<"
)
content = content.replace(
    ">Ngày nguồn (Sao chép từ)<", 
    ">{t('staff.scheduler.src_day', 'Ngày nguồn (Sao chép từ)')}<"
)
content = content.replace(
    ">— Chọn ngày nguồn —<", 
    ">{t('staff.scheduler.select_src_day', '— Chọn ngày nguồn —')}<"
)
content = content.replace(
    ">Ngày đích (Chọn các ngày dán lịch đến)<", 
    ">{t('staff.scheduler.dest_day_label', 'Ngày đích (Chọn các ngày dán lịch đến)')}<"
)
content = content.replace(
    ">Chọn ngày nguồn trước<", 
    ">{t('staff.scheduler.select_day_first', 'Chọn ngày nguồn trước')}<"
)


# 6. Popups (Swap Shifts)
content = content.replace(
    ">Đổi ca nhân sự<", 
    ">{t('staff.scheduler.swap_staff', 'Đổi ca nhân sự')}<"
)
content = content.replace(
    ">Chọn ngày đổi ca<", 
    ">{t('staff.scheduler.select_swap_day_label', 'Chọn ngày đổi ca')}<"
)
content = content.replace(
    ">— Chọn ngày đổi ca —<", 
    ">{t('staff.scheduler.select_swap_day', '— Chọn ngày đổi ca —')}<"
)
content = content.replace(
    ">Nhân sự A<", 
    ">{t('staff.scheduler.staff_a', 'Nhân sự A')}<"
)
content = content.replace(
    ">— Chọn nhân sự A —<", 
    ">{t('staff.scheduler.select_staff_a', '— Chọn nhân sự A —')}<"
)
content = content.replace(
    ">Nhân sự B<", 
    ">{t('staff.scheduler.staff_b', 'Nhân sự B')}<"
)
content = content.replace(
    ">— Chọn nhân sự B —<", 
    ">{t('staff.scheduler.select_staff_b', '— Chọn nhân sự B —')}<"
)
content = content.replace(
    ">Xác nhận đổi ca<", 
    ">{t('staff.scheduler.confirm_swap', 'Xác nhận đổi ca')}<"
)


# 7. Assign Modal
content = content.replace(
    "Xếp lịch làm việc", 
    "{t('staff.scheduler.assign_modal_title', 'Xếp lịch làm việc')}"
)
content = content.replace(
    ">Nhân viên:<", 
    ">{t('staff.scheduler.employee_label', 'Nhân viên:')}<"
)
content = content.replace(
    ">Ca làm việc<", 
    ">{t('staff.scheduler.shift_label', 'Ca làm việc')}<"
)
content = content.replace(
    ">Thời gian làm việc<", 
    ">{t('staff.scheduler.work_time', 'Thời gian làm việc')}<"
)
content = content.replace(
    ">Thêm<", 
    ">{t('staff.scheduler.add_action', 'Thêm')}<"
)
content = content.replace(
    ">Chưa định nghĩa ca làm việc nào. Hãy định nghĩa ca trước.<", 
    ">{t('staff.scheduler.no_templates', 'Chưa định nghĩa ca làm việc nào. Hãy định nghĩa ca trước.')}<"
)
content = content.replace(
    ">Đăng ký nghỉ ngày này<", 
    ">{t('staff.scheduler.register_off', 'Đăng ký nghỉ ngày này')}<"
)
content = content.replace(
    ">Lý do nghỉ:<", 
    ">{t('staff.scheduler.off_reason_label', 'Lý do nghỉ:')}<"
)
content = content.replace(
    ">Nghỉ phép<", 
    ">{t('staff.scheduler.off_vacation', 'Nghỉ phép')}<"
)
content = content.replace(
    ">Nghỉ ốm<", 
    ">{t('staff.scheduler.off_sick', 'Nghỉ ốm')}<"
)
content = content.replace(
    ">Khác<", 
    ">{t('staff.scheduler.off_other', 'Khác')}<"
)
content = content.replace(
    ">Hủy<", 
    ">{t('staff.scheduler.cancel', 'Hủy')}<"
)
content = content.replace(
    ">Lưu<", 
    ">{t('staff.scheduler.save', 'Lưu')}<"
)


# 8. Loading Overlay
content = content.replace(
    ">Vui lòng chờ trong giây lát...<", 
    ">{t('staff.scheduler.please_wait', 'Vui lòng chờ trong giây lát...')}<"
)

# Need to update date format helpers too:
new_full_date_fn = """const formatVietnameseDate = (dateStr, t) => {
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
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return t('common.full_date', '{day} ngày {dd} tháng {mm} năm {yyyy}')
    .replace('{day}', dayLabel)
    .replace('{dd}', dateNum)
    .replace('{mm}', monthNum)
    .replace('{yyyy}', year);
};"""

old_full_date_fn = """const formatVietnameseDate = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${dayLabel} ngày ${dateNum} tháng ${monthNum} năm ${year}`;
};"""

new_short_date_fn = """const formatDateHeader = (dateStr, t) => {
  const d = new Date(dateStr);
  const days = [
    t('common.sun', 'CN'), 
    t('common.mon', 'T2'), 
    t('common.tue', 'T3'), 
    t('common.wed', 'T4'), 
    t('common.thu', 'T5'), 
    t('common.fri', 'T6'), 
    t('common.sat', 'T7')
  ];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayLabel} ${dateNum}/${monthNum}`;
};"""

old_short_date_fn = """const formatDateHeader = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayLabel} ${dateNum}/${monthNum}`;
};"""

content = content.replace(old_full_date_fn, new_full_date_fn)
content = content.replace(old_short_date_fn, new_short_date_fn)
content = re.sub(r'formatVietnameseDate\(([^,)]+)\)', r'formatVietnameseDate(\1, t)', content)
content = re.sub(r'formatDateHeader\(([^,)]+)\)', r'formatDateHeader(\1, t)', content)

# Check for 'formatDateHeader(' usage without 't' inside string interpolations
content = content.replace('formatDateHeader(srcDay)}', 'formatDateHeader(srcDay, t)}')
content = content.replace('formatDateHeader(swapDay)}', 'formatDateHeader(swapDay, t)}')


with open('src/components/staff/SchedulerGrid.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Safe translation applied!")
