import re

with open('src/components/staff/RevenueConfigTab.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Inject useT if not exists
if "import { useT }" not in content:
    content = content.replace("import React", "import { useT } from '@/lib/i18n';\nimport React")

if "const { t } = useT();" not in content:
    search_pattern = r"export default function RevenueConfigTab\([^)]*\) {"
    content = re.sub(search_pattern, lambda m: m.group(0) + "\n  const { t } = useT();", content)

# Revert translateRole to not use t()
role_replacements = {
    "return t('staff.commission.roles.primary', 'Thợ chính');": "return 'Thợ chính';",
    "return t('staff.commission.roles.assistant', 'Thợ phụ');": "return 'Thợ phụ';",
    "return t('staff.commission.roles.technician', 'Kỹ thuật viên');": "return 'Kỹ thuật viên';",
    "return t('staff.commission.roles.cashier', 'Thu ngân');": "return 'Thu ngân';",
    "return t('staff.commission.roles.manager', 'Quản lý');": "return 'Quản lý';",
    "return t('staff.commission.roles.partner', 'Đối tác');": "return 'Đối tác';",
    "return t('staff.commission.roles.default', 'Nhân viên');": "return 'Nhân viên';"
}
for old, new in role_replacements.items():
    content = content.replace(old, new)

# Do NOT translate "Chưa phân nhóm", "Combo dịch vụ", "Combo sản phẩm", "Thẻ tiền mặt" in getGroupedItems
# Because these are service categories!

# Strings replacements
replacements = {
    '<h2 className="font-bold text-slate-800 text-sm">Hoa hồng theo doanh thu</h2>': '<h2 className="font-bold text-slate-800 text-sm">{t("staff.commission.revenue_title", "Hoa hồng theo doanh thu")}</h2>',
    '<p className="text-[10px] text-slate-400 mt-1">Nhân viên sẽ được nhận hoa hồng khi tổng doanh thu kỳ lương đạt mức đã cài đặt</p>': '<p className="text-[10px] text-slate-400 mt-1">{t("staff.commission.revenue_subtitle", "Nhân viên sẽ được nhận hoa hồng khi tổng doanh thu kỳ lương đạt mức đã cài đặt")}</p>',
    ">Cập nhật<": ">{t('staff.commission.update_btn', 'Cập nhật')}<",
    ">Tên cấu hình hoa hồng<": ">{t('staff.commission.rule_name', 'Tên cấu hình hoa hồng')}<",
    'placeholder="nhập tên cấu hình hoa hồng"': 'placeholder={t("staff.commission.rule_name_placeholder", "nhập tên cấu hình hoa hồng")}',
    "> Nhân viên áp dụng<": "> {t('staff.commission.apply_staff', 'Nhân viên áp dụng')}<",
    "'chọn nhân viên áp dụng'": "t('staff.commission.select_staff_empty', 'chọn nhân viên áp dụng')",
    "`đã chọn ${rule.item_ids.length} mục`": "`đã chọn ${rule.item_ids.length} ${t('staff.commission.items', 'mục')}`",
    'placeholder="tìm kiếm nhân viên..."': 'placeholder={t("staff.commission.search_staff", "tìm kiếm nhân viên...")}',
    ">Tất cả nhân viên<": ">{t('staff.commission.all_staff', 'Tất cả nhân viên')}<",
    "> Danh mục áp dụng<": "> {t('staff.commission.apply_catalog', 'Danh mục áp dụng')}<",
    "'chọn dịch vụ / sản phẩm áp dụng'": "t('staff.commission.select_catalog_empty', 'chọn dịch vụ / sản phẩm áp dụng')",
    "'Tìm kiếm dịch vụ...'": "t('staff.commission.search_service', 'Tìm kiếm dịch vụ...')",
    "'Tìm kiếm sản phẩm...'": "t('staff.commission.search_product', 'Tìm kiếm sản phẩm...')",
    "'Tìm kiếm gói dịch vụ...'": "t('staff.commission.search_package', 'Tìm kiếm gói dịch vụ...')",
    "'Tìm kiếm liệu trình...'": "t('staff.commission.search_treatment', 'Tìm kiếm liệu trình...')",
    "'Tìm kiếm thẻ tiền mặt...'": "t('staff.commission.search_card', 'Tìm kiếm thẻ tiền mặt...')",
    "'Tìm kiếm...'": "t('staff.common.search', 'Tìm kiếm...')",
    "label: 'Dịch vụ'": "label: t('staff.commission.item_service', 'Dịch vụ')",
    "label: 'Sản phẩm'": "label: t('staff.commission.item_product', 'Sản phẩm')",
    "label: 'Gói dịch vụ'": "label: t('staff.commission.item_package', 'Gói dịch vụ')",
    "label: 'Liệu trình'": "label: t('staff.commission.item_treatment', 'Liệu trình')",
    "label: 'Thẻ tiền mặt'": "label: t('staff.commission.item_prepaid_card', 'Thẻ tiền mặt')",
    "label: 'Combo DV'": "label: t('staff.commission.item_service_combo', 'Combo dịch vụ')",
    "label: 'Combo SP'": "label: t('staff.commission.item_product_combo', 'Combo sản phẩm')",
    ">Chọn tất cả<": ">{t('staff.commission.select_all', 'Chọn tất cả')}<",
    "\n                                                  Dịch vụ đã được cài đặt\n": "\n                                                  {t('staff.commission.item_configured', 'Dịch vụ đã được cài đặt')}\n",
    "\n                        Huỷ\n": "\n                        {t('staff.scheduler.cancel', 'Huỷ')}\n",
    "\n                        Áp dụng\n": "\n                        {t('staff.commission.apply_btn', 'Áp dụng')}\n",
    ">Cài đặt tỉ lệ hoa hồng<": ">{t('staff.commission.rate_setting', 'Cài đặt tỉ lệ hoa hồng')}<",
    ">Mốc doanh thu<": ">{t('staff.commission.mech_threshold', 'Mốc doanh thu')}<",
    "\n                    Mốc doanh thu\n": "\n                    {t('staff.commission.mech_threshold', 'Mốc doanh thu')}\n",
    ">Bậc thang<": ">{t('staff.commission.mech_tiered', 'Bậc thang')}<",
    "\n                    Bậc thang\n": "\n                    {t('staff.commission.mech_tiered', 'Bậc thang')}\n",
    ">Mức doanh thu<": ">{t('staff.commission.revenue_level', 'Mức doanh thu')}<",
    ">Tỉ lệ hoa hồng<": ">{t('staff.commission.revenue_rate', 'Tỉ lệ hoa hồng')}<",
    ">Từ<": ">{t('staff.commission.from', 'Từ')}<",
    ">Đến<": ">{t('staff.commission.to', 'Đến')}<",
    'placeholder="nhập giá trị"': 'placeholder={t("staff.commission.enter_value", "nhập giá trị")}',
    "\n                    Thêm mới\n": "\n                    {t('staff.commission.add_new', 'Thêm mới')}\n",
    "\n        Thêm tùy chọn hoa hồng\n": "\n        {t('staff.commission.add_revenue_option', 'Thêm tùy chọn hoa hồng')}\n",
    "'Cập nhật cấu hình hoa hồng doanh thu thành công!'": "t('staff.commission.save_revenue_success', 'Cập nhật cấu hình hoa hồng doanh thu thành công!')",
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/RevenueConfigTab.jsx', 'w', encoding='utf-8') as f:
    f.write(content)


# Update i18n
with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    i18n = f.read()

new_keys_vi = """
    'staff.commission.revenue_title': 'Hoa hồng theo doanh thu',
    'staff.commission.revenue_subtitle': 'Nhân viên sẽ được nhận hoa hồng khi tổng doanh thu kỳ lương đạt mức đã cài đặt',
    'staff.commission.update_btn': 'Cập nhật',
    'staff.commission.rule_name': 'Tên cấu hình hoa hồng',
    'staff.commission.rule_name_placeholder': 'nhập tên cấu hình hoa hồng',
    'staff.commission.apply_staff': 'Nhân viên áp dụng',
    'staff.commission.select_staff_empty': 'chọn nhân viên áp dụng',
    'staff.commission.items': 'mục',
    'staff.commission.search_staff': 'tìm kiếm nhân viên...',
    'staff.commission.all_staff': 'Tất cả nhân viên',
    'staff.commission.apply_catalog': 'Danh mục áp dụng',
    'staff.commission.select_catalog_empty': 'chọn dịch vụ / sản phẩm áp dụng',
    'staff.commission.search_service': 'Tìm kiếm dịch vụ...',
    'staff.commission.search_product': 'Tìm kiếm sản phẩm...',
    'staff.commission.search_package': 'Tìm kiếm gói dịch vụ...',
    'staff.commission.search_treatment': 'Tìm kiếm liệu trình...',
    'staff.commission.search_card': 'Tìm kiếm thẻ tiền mặt...',
    'staff.commission.select_all': 'Chọn tất cả',
    'staff.commission.item_configured': 'Dịch vụ đã được cài đặt',
    'staff.commission.apply_btn': 'Áp dụng',
    'staff.commission.rate_setting': 'Cài đặt tỉ lệ hoa hồng',
    'staff.commission.mech_threshold': 'Mốc doanh thu',
    'staff.commission.mech_tiered': 'Bậc thang',
    'staff.commission.revenue_level': 'Mức doanh thu',
    'staff.commission.revenue_rate': 'Tỉ lệ hoa hồng',
    'staff.commission.enter_value': 'nhập giá trị',
    'staff.commission.add_revenue_option': 'Thêm tùy chọn hoa hồng',
    'staff.commission.save_revenue_success': 'Cập nhật cấu hình hoa hồng doanh thu thành công!',
"""

new_keys_en = """
    'staff.commission.revenue_title': 'Revenue Commission',
    'staff.commission.revenue_subtitle': 'Staff will receive commission when total revenue in pay period reaches configured threshold',
    'staff.commission.update_btn': 'Update',
    'staff.commission.rule_name': 'Commission rule name',
    'staff.commission.rule_name_placeholder': 'enter commission rule name',
    'staff.commission.apply_staff': 'Applicable Staff',
    'staff.commission.select_staff_empty': 'select applicable staff',
    'staff.commission.items': 'items',
    'staff.commission.search_staff': 'search staff...',
    'staff.commission.all_staff': 'All staff',
    'staff.commission.apply_catalog': 'Applicable Catalog',
    'staff.commission.select_catalog_empty': 'select applicable services / products',
    'staff.commission.search_service': 'Search services...',
    'staff.commission.search_product': 'Search products...',
    'staff.commission.search_package': 'Search packages...',
    'staff.commission.search_treatment': 'Search treatments...',
    'staff.commission.search_card': 'Search prepaid cards...',
    'staff.commission.select_all': 'Select all',
    'staff.commission.item_configured': 'Item is already configured',
    'staff.commission.apply_btn': 'Apply',
    'staff.commission.rate_setting': 'Commission Rate Settings',
    'staff.commission.mech_threshold': 'Revenue Threshold',
    'staff.commission.mech_tiered': 'Tiered Revenue',
    'staff.commission.revenue_level': 'Revenue Level',
    'staff.commission.revenue_rate': 'Commission Rate',
    'staff.commission.enter_value': 'enter value',
    'staff.commission.add_revenue_option': 'Add Commission Option',
    'staff.commission.save_revenue_success': 'Revenue commission config updated successfully!',
"""

i18n = re.sub(r'(\n  vi: {\n)', r'\1' + new_keys_vi + '\n', i18n)
i18n = re.sub(r'(\n  en: {\n)', r'\1' + new_keys_en + '\n', i18n)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(i18n)

print("Revenue tab translated successfully!")
