import re

with open('src/components/staff/CopyTabCommissionModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Inject useT
if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    search_pattern = r"export default function CopyTabCommissionModal\([^)]*\) {"
    content = re.sub(search_pattern, lambda m: m.group(0) + "\n  const { t } = useT();", content)


# Translate tabLabels
old_tab_labels = """  const tabLabels = {
    service: 'dịch vụ',
    product: 'sản phẩm',
    package: 'gói dịch vụ',
    treatment: 'liệu trình',
    service_combo: 'combo dịch vụ',
    product_combo: 'combo sản phẩm',
    prepaid_card: 'thẻ tiền mặt',
    customer_req: 'theo yêu cầu khách'
  };"""

new_tab_labels = """  const tabLabels = {
    service: t('staff.commission.item_service', 'dịch vụ').toLowerCase(),
    product: t('staff.commission.item_product', 'sản phẩm').toLowerCase(),
    package: t('staff.commission.item_package', 'gói dịch vụ').toLowerCase(),
    treatment: t('staff.commission.item_treatment', 'liệu trình').toLowerCase(),
    service_combo: t('staff.commission.item_service_combo', 'combo dịch vụ').toLowerCase(),
    product_combo: t('staff.commission.item_product_combo', 'combo sản phẩm').toLowerCase(),
    prepaid_card: t('staff.commission.item_prepaid_card', 'thẻ tiền mặt').toLowerCase(),
    customer_req: t('staff.commission.item_customer_req', 'theo yêu cầu khách').toLowerCase()
  };"""

content = content.replace(old_tab_labels, new_tab_labels)

# Translate strings
replacements = {
    ">Sao chép hoa hồng<": ">{t('staff.commission.copy_tab_title', 'Sao chép hoa hồng')}<",
    ">Sao chép hoa hồng ({currentTabName}) cho nhiều nhân viên<": ">{t('staff.commission.copy_tab_subtitle', 'Sao chép hoa hồng ({tab}) cho nhiều nhân viên').replace('{tab}', currentTabName)}<",
    ">1. Nhân viên nguồn (Sao chép từ)<": ">{t('staff.commission.step_1_source', '1. Nhân viên nguồn (Sao chép từ)')}<",
    ">Chọn nhân viên nguồn...<": ">{t('staff.commission.select_source', 'Chọn nhân viên nguồn...')}<",
    "'tìm kiếm nhân viên nguồn...'": "t('staff.commission.search_source', 'tìm kiếm nhân viên nguồn...')",
    ">2. Nhân viên nhận (Sao chép cho)<": ">{t('staff.commission.step_2_target', '2. Nhân viên nhận (Sao chép cho)')}<",
    ">Chọn nhân viên nhận...<": ">{t('staff.commission.select_target', 'Chọn nhân viên nhận...')}<",
    "'tìm kiếm nhân viên nhận...'": "t('staff.commission.search_target', 'tìm kiếm nhân viên nhận...')",
    "\n                Hủy\n": "\n                {t('staff.scheduler.cancel', 'Hủy')}\n",
    "\n                Xác nhận sao chép\n": "\n                {t('staff.commission.confirm_copy', 'Xác nhận sao chép')}\n",
    "'Vui lòng chọn nhân viên nguồn và ít nhất 1 nhân viên nhận!'": "t('staff.commission.copy_tab_validation_error', 'Vui lòng chọn nhân viên nguồn và ít nhất 1 nhân viên nhận!')"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/CopyTabCommissionModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Update i18n
with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.commission.item_customer_req': 'Theo yêu cầu khách',
    'staff.commission.copy_tab_title': 'Sao chép hoa hồng',
    'staff.commission.copy_tab_subtitle': 'Sao chép hoa hồng ({tab}) cho nhiều nhân viên',
    'staff.commission.search_source': 'tìm kiếm nhân viên nguồn...',
    'staff.commission.search_target': 'tìm kiếm nhân viên nhận...',
    'staff.commission.copy_tab_validation_error': 'Vui lòng chọn nhân viên nguồn và ít nhất 1 nhân viên nhận!',
"""

new_keys_en = """
    'staff.commission.item_customer_req': 'Customer Request',
    'staff.commission.copy_tab_title': 'Copy Commission',
    'staff.commission.copy_tab_subtitle': 'Copy commission ({tab}) for multiple staff',
    'staff.commission.search_source': 'search source staff...',
    'staff.commission.search_target': 'search target staff...',
    'staff.commission.copy_tab_validation_error': 'Please select a source staff and at least 1 target staff!',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("CopyTabCommissionModal translated successfully!")
