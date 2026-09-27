import re

with open('src/components/staff/SchedulerGrid.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "Tự động lặp lịch": "{t('staff.scheduler.auto_schedule', 'Tự động lập lịch')}",
    "Sao chép tuần sau": "{t('staff.scheduler.copy_next_week', 'Sao chép tuần sau')}",
    "Sao chép nhân sự": "{t('staff.scheduler.copy_staff', 'Sao chép nhân sự')}",
    "Sao chép ca ngày": "{t('staff.scheduler.copy_day', 'Sao chép ca ngày')}",
    "Đổi ca nhân sự": "{t('staff.scheduler.swap_staff', 'Đổi ca nhân sự')}",
    "Xóa lịch tuần này": "{t('staff.scheduler.clear_week', 'Xóa lịch tuần này')}"
}

# The previous replacements for modal headers worked because they were inside <h3>
# e.g. "<h3>Sao chép nhân sự</h3>" was translated, but "/> Sao chép nhân sự" was not.

for old, new in replacements.items():
    # Only replace occurrences that are NOT already inside a t(...) call
    # A simple way is to use regex with negative lookbehind, or just a simple replace 
    # and then fix double replacements if any.
    # Actually, simpler: just find specific button texts.
    content = content.replace("/> " + old, "/> {" + new.replace("{t", "t") + "}")
    content = content.replace("> " + old, "> {" + new.replace("{t", "t") + "}")
    content = content.replace(">" + old + "<", ">" + new + "<")

with open('src/components/staff/SchedulerGrid.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Toolbar buttons translated!")
