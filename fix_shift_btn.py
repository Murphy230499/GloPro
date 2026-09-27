with open('src/components/staff/ShiftTemplateManager.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("<Plus className=\"w-4 h-4\" /> Thêm ca làm việc", "<Plus className=\"w-4 h-4\" /> {t('staff.scheduler.add_shift_btn', 'Thêm ca làm việc')}")
content = content.replace("Chưa có ca làm việc nào. Chọn \"Thêm ca làm việc\" để bắt đầu.", "{t(\"staff.scheduler.empty_shifts\", 'Chưa có ca làm việc nào. Chọn \"Thêm ca làm việc\" để bắt đầu.')}")

with open('src/components/staff/ShiftTemplateManager.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Button translated successfully!")
