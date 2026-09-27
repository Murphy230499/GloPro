import re

with open('src/components/staff/SchedulerGrid.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    # Toolbars
    "<span>Tuần:": "<span>{t('staff.scheduler.week', 'Tuần:')}",
    ">Tự động lập lịch<": ">{t('staff.scheduler.auto_schedule', 'Tự động lập lịch')}<",
    ">Sao chép tuần sau<": ">{t('staff.scheduler.copy_next_week', 'Sao chép tuần sau')}<",
    ">Sao chép nhân sự<": ">{t('staff.scheduler.copy_staff', 'Sao chép nhân sự')}<",
    ">Sao chép ca ngày<": ">{t('staff.scheduler.copy_day', 'Sao chép ca ngày')}<",
    ">Đổi ca nhân sự<": ">{t('staff.scheduler.swap_staff', 'Đổi ca nhân sự')}<",
    ">Xóa lịch tuần này<": ">{t('staff.scheduler.clear_week', 'Xóa lịch tuần này')}<",
    
    # Headers
    ">Nhân sự<": ">{t('staff.scheduler.staff_column', 'Nhân sự')}<",
    "Sao chép lịch nhân sự": "{t('staff.scheduler.copy_staff', 'Sao chép lịch nhân sự')}",
    "Nhân sự nguồn (Sao chép từ)": "{t('staff.scheduler.src_staff', 'Nhân sự nguồn (Sao chép từ)')}",
    "Sao chép ca ngày</h3>": "{t('staff.scheduler.copy_day', 'Sao chép ca ngày')}</h3>",
    "Ngày nguồn (Sao chép từ)": "{t('staff.scheduler.src_day', 'Ngày nguồn (Sao chép từ)')}",
    ">Bắt đầu sao chép<": ">{t('staff.scheduler.start_copy', 'Bắt đầu sao chép')}<",
    ">Đang tải lịch...<": ">{t('staff.scheduler.loading', 'Đang tải lịch...')}<",
    ">Chưa có nhân viên nào trong danh sách. Hãy thêm nhân viên trước.<": ">{t('staff.scheduler.empty_staff', 'Chưa có nhân viên nào trong danh sách. Hãy thêm nhân viên trước.')}<",
    ">Thêm nhân viên ngay<": ">{t('staff.scheduler.add_staff_now', 'Thêm nhân viên ngay')}<",
    ">Chưa có mẫu ca làm việc nào. Hãy thêm ít nhất 1 mẫu ca làm việc trong mục Quản lý ca làm việc.<": ">{t('staff.scheduler.empty_template', 'Chưa có mẫu ca làm việc nào. Hãy thêm ít nhất 1 mẫu ca làm việc trong mục Quản lý ca làm việc.')}<",
    
    # Assignment Modal
    "Phân ca cho {assignModalCell.staff.full_name}": "{t('staff.scheduler.assign_title', 'Phân ca cho {name}').replace('{name}', assignModalCell.staff.full_name)}",
    ">Trạng thái: Đi làm<": ">{t('staff.scheduler.status_work', 'Trạng thái: Đi làm')}<",
    ">Trạng thái: Nghỉ ngơi<": ">{t('staff.scheduler.status_off', 'Trạng thái: Nghỉ ngơi')}<",
    ">Ca làm việc<": ">{t('staff.scheduler.shift_label', 'Ca làm việc')}<",
    "Chọn ca cho nhân viên này": "{t('staff.scheduler.shift_placeholder', 'Chọn ca cho nhân viên này')}",
    ">Lý do nghỉ<": ">{t('staff.scheduler.off_reason', 'Lý do nghỉ')}<",
    "Nghỉ phép": "{t('staff.scheduler.off_vacation', 'Nghỉ phép')}",
    "Nghỉ ốm": "{t('staff.scheduler.off_sick', 'Nghỉ ốm')}",
    "Việc bận": "{t('staff.scheduler.off_personal', 'Việc bận')}",
    ">Lưu lịch xếp<": ">{t('staff.scheduler.save_schedule', 'Lưu lịch xếp')}<",
    ">Đang lưu...<": ">{t('staff.scheduler.saving', 'Đang lưu...')}<",
    
    # Toast messages logic
    "'Đã BẬT tự động sao chép lịch tuần mới'": "t('staff.scheduler.msg_auto_copy_on', 'Đã BẬT tự động sao chép lịch tuần mới')",
    "'Đã TẮT tự động sao chép lịch tuần mới'": "t('staff.scheduler.msg_auto_copy_off', 'Đã TẮT tự động sao chép lịch tuần mới')",
    "`Đã tự động sao chép ${createPayloads.length} ca xếp từ tuần trước sang tuần này`": "t('staff.scheduler.msg_auto_copy_success', 'Đã tự động sao chép {n} ca xếp từ tuần trước sang tuần này').replace('{n}', createPayloads.length)",
    "'Sao chép toàn bộ lịch xếp ca của tuần hiện tại sang tuần tiếp theo?'": "t('staff.scheduler.msg_copy_week_confirm', 'Sao chép toàn bộ lịch xếp ca của tuần hiện tại sang tuần tiếp theo?')",
    "'Đang sao chép lịch sang tuần tiếp theo...'": "t('staff.scheduler.msg_copy_week_processing', 'Đang sao chép lịch sang tuần tiếp theo...')",
    "`Đã sao chép thành công ${createPayloads.length} ca xếp sang tuần tiếp theo`": "t('staff.scheduler.msg_copy_week_success', 'Đã sao chép thành công {n} ca xếp sang tuần tiếp theo').replace('{n}', createPayloads.length)",
    "'Lỗi khi sao chép lịch: '": "t('staff.scheduler.msg_copy_err', 'Lỗi khi sao chép lịch: ')",
    "'Đang sao chép lịch nhân sự...'": "t('staff.scheduler.msg_copy_staff_processing', 'Đang sao chép lịch nhân sự...')",
    "'Đã sao chép lịch làm việc thành công'": "t('staff.scheduler.msg_copy_staff_success', 'Đã sao chép lịch làm việc thành công')",
    "'Lỗi sao chép: '": "t('staff.scheduler.msg_copy_err', 'Lỗi sao chép: ')",
    "`Ngày nguồn (${formatDateHeader(srcDay)}) chưa có lịch làm việc nào để sao chép`": "t('staff.scheduler.msg_copy_day_empty', 'Ngày nguồn ({date}) chưa có lịch làm việc nào để sao chép').replace('{date}', formatDateHeader(srcDay))",
    "'Đang sao chép ca ngày...'": "t('staff.scheduler.msg_copy_day_processing', 'Đang sao chép ca ngày...')",
    "`Đã sao chép ${srcScheds.length} ca từ ${formatDateHeader(srcDay)} sang ${destDays.length} ngày`": "t('staff.scheduler.msg_copy_day_success', 'Đã sao chép {n1} ca từ {d1} sang {n2} ngày').replace('{n1}', srcScheds.length).replace('{d1}', formatDateHeader(srcDay)).replace('{n2}', destDays.length)",
    "'Lỗi sao chép ngày: '": "t('staff.scheduler.msg_copy_err', 'Lỗi sao chép ngày: ')",
    
    "`Xác nhận đổi lịch của ${sA.full_name} và ${sB.full_name} trong ngày ${formatDateHeader(swapDay)}?`": "t('staff.scheduler.swap_confirm', 'Xác nhận đổi lịch của {n1} và {n2} trong ngày {date}?').replace('{n1}', sA.full_name).replace('{n2}', sB.full_name).replace('{date}', formatDateHeader(swapDay))",
    "'Đang đổi ca...'": "t('staff.scheduler.swap_processing', 'Đang đổi ca...')",
    "'Đổi ca thành công!'": "t('staff.scheduler.swap_success', 'Đổi ca thành công!')",
    
    "'Xác nhận xóa TOÀN BỘ lịch làm việc của TẤT CẢ nhân viên trong tuần này?'": "t('staff.scheduler.clear_confirm', 'Xác nhận xóa TOÀN BỘ lịch làm việc của TẤT CẢ nhân viên trong tuần này?')",
    "'Đang xóa lịch...'": "t('staff.scheduler.clear_processing', 'Đang xóa lịch...')",
    "'Đã xóa toàn bộ lịch tuần này'": "t('staff.scheduler.clear_success', 'Đã xóa toàn bộ lịch tuần này')"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/SchedulerGrid.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SchedulerGrid.jsx translated successfully!")
