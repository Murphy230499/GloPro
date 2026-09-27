import re

with open('src/components/staff/CommissionMatrix.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    # Toasts and errors
    "'Lỗi tải danh mục cấu hình hoa hồng:'": "t('staff.commission.load_error', 'Lỗi tải danh mục cấu hình hoa hồng:')",
    "'Đã lưu cấu hình khung giờ thành công!'": "t('staff.commission.save_time_success', 'Đã lưu cấu hình khung giờ thành công!')",
    "'Lỗi khi lưu cấu hình: '": "t('staff.commission.save_error', 'Lỗi khi lưu cấu hình: ')",
    "'Cập nhật hoa hồng nhóm thành công!'": "t('staff.commission.group_update_success', 'Cập nhật hoa hồng nhóm thành công!')",
    "'Sao chép hoa hồng thành công!'": "t('staff.commission.copy_success', 'Sao chép hoa hồng thành công!')",
    
    # UI Text
    "Cài đặt nhóm": "{t('staff.commission.group_settings', 'Cài đặt nhóm')}",
    "Sao chép": "{t('staff.commission.copy', 'Sao chép')}",
    
    # Need to be careful with "Lưu" which is on line 696 inside a span or button. 
    # Let's target exactly `>Lưu<` or `Lưu` with surrounding whitespaces
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Fix search placeholders
content = content.replace("'tìm kiếm dịch vụ...'", "t('staff.commission.search_service', 'tìm kiếm dịch vụ...')")
content = content.replace("`tìm kiếm ${TABS.find(t => t.id === activeTab).label.toLowerCase()}...`", "t('staff.commission.search_dynamic', 'tìm kiếm {tab}...').replace('{tab}', TABS.find(t => t.id === activeTab).label.toLowerCase())")
content = content.replace("'tìm kiếm...'", "t('staff.commission.search_generic', 'tìm kiếm...')")

# Fix Lưu button (line 696)
content = content.replace("\n                Lưu\n", "\n                {t('staff.scheduler.save', 'Lưu')}\n")
content = content.replace("\n                  Lưu\n", "\n                  {t('staff.scheduler.save', 'Lưu')}\n")
content = content.replace(">Lưu<", ">{t('staff.scheduler.save', 'Lưu')}<")

with open('src/components/staff/CommissionMatrix.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.commission.load_error': 'Lỗi tải danh mục cấu hình hoa hồng:',
    'staff.commission.save_time_success': 'Đã lưu cấu hình khung giờ thành công!',
    'staff.commission.save_error': 'Lỗi khi lưu cấu hình: ',
    'staff.commission.group_update_success': 'Cập nhật hoa hồng nhóm thành công!',
    'staff.commission.copy_success': 'Sao chép hoa hồng thành công!',
    'staff.commission.group_settings': 'Cài đặt nhóm',
    'staff.commission.copy': 'Sao chép',
    'staff.commission.search_service': 'Tìm kiếm dịch vụ...',
    'staff.commission.search_dynamic': 'Tìm kiếm {tab}...',
    'staff.commission.search_generic': 'Tìm kiếm...',
"""

new_keys_en = """
    'staff.commission.load_error': 'Error loading commission config:',
    'staff.commission.save_time_success': 'Time slot config saved successfully!',
    'staff.commission.save_error': 'Error saving config: ',
    'staff.commission.group_update_success': 'Group commission updated successfully!',
    'staff.commission.copy_success': 'Commission copied successfully!',
    'staff.commission.group_settings': 'Group Settings',
    'staff.commission.copy': 'Copy',
    'staff.commission.search_service': 'Search service...',
    'staff.commission.search_dynamic': 'Search {tab}...',
    'staff.commission.search_generic': 'Search...',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("CommissionMatrix translated successfully!")
