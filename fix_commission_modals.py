import re

def ensure_useT(content, component_name):
    if "import { useT }" not in content:
        content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")
    
    if "const { t } = useT();" not in content:
        search_pattern = rf"export default function {component_name}\([^)]*\) {{"
        replace_pattern = search_pattern + "\n  const { t } = useT();"
        content = re.sub(search_pattern, lambda m: m.group(0) + "\n  const { t } = useT();", content)
    return content

# 1. AdvancedConfigModal.jsx
with open('src/components/staff/AdvancedConfigModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = ensure_useT(content, "AdvancedConfigModal")

content = content.replace(">Cài đặt nâng cao<", ">{t('staff.commission.advanced_settings', 'Cài đặt nâng cao')}<")
content = content.replace(">Thiết lập này áp dụng toàn hệ thống khi tính toán hoa hồng nhân viên cho các đơn thanh toán tại POS.<", ">{t('staff.commission.advanced_settings_warning', 'Thiết lập này áp dụng toàn hệ thống khi tính toán hoa hồng nhân viên cho các đơn thanh toán tại POS.')}<")
content = content.replace(">Trước giảm giá<", ">{t('staff.commission.before_discount', 'Trước giảm giá')}<")
content = content.replace(">Sau giảm giá<", ">{t('staff.commission.after_discount', 'Sau giảm giá')}<")
content = content.replace("\n                Hủy\n", "\n                {t('staff.scheduler.cancel', 'Hủy')}\n")
content = content.replace("\n                Lưu cài đặt\n", "\n                {t('staff.commission.save_settings', 'Lưu cài đặt')}\n")
content = content.replace("'Cập nhật cấu hình hoa hồng nâng cao thành công!'", "t('staff.commission.advanced_update_success', 'Cập nhật cấu hình hoa hồng nâng cao thành công!')")

# Replace item.label with translation in JSX
content = content.replace(">{item.label}<", ">{t('staff.commission.item_' + item.id, item.label)}<")

with open('src/components/staff/AdvancedConfigModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# 2. AuditLogModal.jsx
with open('src/components/staff/AuditLogModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = ensure_useT(content, "AuditLogModal")

content = content.replace(">Lịch sử thao tác<", ">{t('staff.commission.audit_log', 'Lịch sử thao tác')}<")
content = content.replace("'tìm kiếm lịch sử...'", "t('staff.commission.search_audit', 'tìm kiếm lịch sử...')")
content = content.replace(">Chưa ghi nhận hoạt động thao tác hoa hồng nào.<", ">{t('staff.commission.no_audit_log', 'Chưa ghi nhận hoạt động thao tác hoa hồng nào.')}<")

with open('src/components/staff/AuditLogModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# 3. GroupCommissionModal.jsx
with open('src/components/staff/GroupCommissionModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = ensure_useT(content, "GroupCommissionModal")

content = content.replace(">Cài đặt hoa hồng nhóm<", ">{t('staff.commission.group_settings_title', 'Cài đặt hoa hồng nhóm')}<")
content = content.replace(">1. Chọn nhân viên áp dụng<", ">{t('staff.commission.step_1_staff', '1. Chọn nhân viên áp dụng')}<")
content = content.replace("'Chọn nhân viên áp dụng'", "t('staff.commission.select_staff', 'Chọn nhân viên áp dụng')")
content = content.replace(">2. Chọn dịch vụ<", ">{t('staff.commission.step_2_item', '2. Chọn dịch vụ')}<")
content = content.replace("'Chọn dịch vụ áp dụng'", "t('staff.commission.select_item', 'Chọn dịch vụ áp dụng')")
content = content.replace(">3. Thiết lập mức hoa hồng<", ">{t('staff.commission.step_3_amount', '3. Thiết lập mức hoa hồng')}<")
content = content.replace("\n            Hủy\n", "\n            {t('staff.scheduler.cancel', 'Hủy')}\n")
content = content.replace("\n            Lưu\n", "\n            {t('staff.scheduler.save', 'Lưu')}\n")

with open('src/components/staff/GroupCommissionModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# 4. CopyCommissionModal.jsx
with open('src/components/staff/CopyCommissionModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = ensure_useT(content, "CopyCommissionModal")

content = content.replace(">Sao chép hoa hồng chung<", ">{t('staff.commission.copy_title', 'Sao chép hoa hồng chung')}<")
content = content.replace(">Sao chép cấu hình hoa hồng TẤT CẢ các tab<", ">{t('staff.commission.copy_subtitle', 'Sao chép cấu hình hoa hồng TẤT CẢ các tab')}<")
content = content.replace(">1. Nhân viên nguồn (Sao chép từ)<", ">{t('staff.commission.step_1_source', '1. Nhân viên nguồn (Sao chép từ)')}<")
content = content.replace("'Chọn nhân viên nguồn...'", "t('staff.commission.select_source', 'Chọn nhân viên nguồn...')")
content = content.replace(">2. Nhân viên nhận (Sao chép cho)<", ">{t('staff.commission.step_2_target', '2. Nhân viên nhận (Sao chép cho)')}<")
content = content.replace("'Chọn nhân viên nhận...'", "t('staff.commission.select_target', 'Chọn nhân viên nhận...')")
content = content.replace("\n            Hủy\n", "\n            {t('staff.scheduler.cancel', 'Hủy')}\n")
content = content.replace("\n            Xác nhận sao chép\n", "\n            {t('staff.commission.confirm_copy', 'Xác nhận sao chép')}\n")
content = content.replace("'Vui lòng chọn nhân viên nguồn và đích!'", "t('staff.commission.copy_validation_error', 'Vui lòng chọn nhân viên nguồn và đích!')")

with open('src/components/staff/CopyCommissionModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)


# i18n
with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.commission.advanced_settings': 'Cài đặt nâng cao',
    'staff.commission.advanced_settings_warning': 'Thiết lập này áp dụng toàn hệ thống khi tính toán hoa hồng nhân viên cho các đơn thanh toán tại POS.',
    'staff.commission.before_discount': 'Trước giảm giá',
    'staff.commission.after_discount': 'Sau giảm giá',
    'staff.commission.save_settings': 'Lưu cài đặt',
    'staff.commission.advanced_update_success': 'Cập nhật cấu hình hoa hồng nâng cao thành công!',
    'staff.commission.item_service': 'Dịch vụ',
    'staff.commission.item_product': 'Sản phẩm',
    'staff.commission.item_package': 'Gói dịch vụ',
    'staff.commission.item_treatment': 'Liệu trình',
    'staff.commission.item_service_combo': 'Combo dịch vụ',
    'staff.commission.item_product_combo': 'Combo sản phẩm',
    'staff.commission.item_prepaid_card': 'Thẻ tiền mặt',
    'staff.commission.audit_log': 'Lịch sử thao tác',
    'staff.commission.search_audit': 'tìm kiếm lịch sử...',
    'staff.commission.no_audit_log': 'Chưa ghi nhận hoạt động thao tác hoa hồng nào.',
    'staff.commission.group_settings_title': 'Cài đặt hoa hồng nhóm',
    'staff.commission.step_1_staff': '1. Chọn nhân viên áp dụng',
    'staff.commission.select_staff': 'Chọn nhân viên áp dụng',
    'staff.commission.step_2_item': '2. Chọn dịch vụ',
    'staff.commission.select_item': 'Chọn dịch vụ áp dụng',
    'staff.commission.step_3_amount': '3. Thiết lập mức hoa hồng',
    'staff.commission.copy_title': 'Sao chép hoa hồng chung',
    'staff.commission.copy_subtitle': 'Sao chép cấu hình hoa hồng TẤT CẢ các tab',
    'staff.commission.step_1_source': '1. Nhân viên nguồn (Sao chép từ)',
    'staff.commission.select_source': 'Chọn nhân viên nguồn...',
    'staff.commission.step_2_target': '2. Nhân viên nhận (Sao chép cho)',
    'staff.commission.select_target': 'Chọn nhân viên nhận...',
    'staff.commission.confirm_copy': 'Xác nhận sao chép',
    'staff.commission.copy_validation_error': 'Vui lòng chọn nhân viên nguồn và đích!',
"""

new_keys_en = """
    'staff.commission.advanced_settings': 'Advanced Settings',
    'staff.commission.advanced_settings_warning': 'This setting applies system-wide when calculating staff commissions for POS transactions.',
    'staff.commission.before_discount': 'Before discount',
    'staff.commission.after_discount': 'After discount',
    'staff.commission.save_settings': 'Save settings',
    'staff.commission.advanced_update_success': 'Advanced commission configuration updated successfully!',
    'staff.commission.item_service': 'Service',
    'staff.commission.item_product': 'Product',
    'staff.commission.item_package': 'Service Package',
    'staff.commission.item_treatment': 'Treatment',
    'staff.commission.item_service_combo': 'Service Combo',
    'staff.commission.item_product_combo': 'Product Combo',
    'staff.commission.item_prepaid_card': 'Prepaid Card',
    'staff.commission.audit_log': 'Audit Log',
    'staff.commission.search_audit': 'Search logs...',
    'staff.commission.no_audit_log': 'No commission audit log recorded yet.',
    'staff.commission.group_settings_title': 'Group Commission Settings',
    'staff.commission.step_1_staff': '1. Select staff',
    'staff.commission.select_staff': 'Select staff to apply',
    'staff.commission.step_2_item': '2. Select items',
    'staff.commission.select_item': 'Select items to apply',
    'staff.commission.step_3_amount': '3. Set commission amount',
    'staff.commission.copy_title': 'Copy Commission',
    'staff.commission.copy_subtitle': 'Copy commission configuration for ALL tabs',
    'staff.commission.step_1_source': '1. Source Staff (Copy from)',
    'staff.commission.select_source': 'Select source staff...',
    'staff.commission.step_2_target': '2. Target Staff (Copy to)',
    'staff.commission.select_target': 'Select target staff...',
    'staff.commission.confirm_copy': 'Confirm copy',
    'staff.commission.copy_validation_error': 'Please select both source and target staff!',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("Modals translated successfully!")
