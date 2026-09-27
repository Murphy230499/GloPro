import re

with open('src/views/Services.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\nimport { useT } from '@/lib/i18n';")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function Services\(\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    "{ v: 'service', l: 'Dịch vụ', i: Scissors, grp: 'service' }": "{ v: 'service', l: t('catalog.tab_services', 'Dịch vụ'), i: Scissors, grp: 'service' }",
    "{ v: 'product', l: 'Sản phẩm', i: Package, grp: 'product' }": "{ v: 'product', l: t('catalog.tab_products', 'Sản phẩm'), i: Package, grp: 'product' }",
    "{ v: 'package', l: 'Gói dịch vụ', i: Gift, grp: 'package' }": "{ v: 'package', l: t('catalog.tab_packages', 'Gói dịch vụ'), i: Gift, grp: 'package' }",
    "{ v: 'treatment', l: 'Liệu trình', i: Sparkles, grp: 'treatment' }": "{ v: 'treatment', l: t('catalog.tab_treatments', 'Liệu trình'), i: Sparkles, grp: 'treatment' }",
    "{ v: 'service_combo', l: 'Combo dịch vụ', i: Layers, grp: null }": "{ v: 'service_combo', l: t('catalog.tab_service_combos', 'Combo dịch vụ'), i: Layers, grp: null }",
    "{ v: 'product_combo', l: 'Combo sản phẩm', i: Boxes, grp: null }": "{ v: 'product_combo', l: t('catalog.tab_product_combos', 'Combo sản phẩm'), i: Boxes, grp: null }",
    "{ v: 'prepaid_card', l: 'Thẻ tiền mặt', i: CreditCard, grp: null }": "{ v: 'prepaid_card', l: t('catalog.tab_prepaid_cards', 'Thẻ tiền mặt'), i: CreditCard, grp: null }",
    "const ADD_LABEL = { service: 'dịch vụ', product: 'sản phẩm', package: 'gói dịch vụ', treatment: 'liệu trình', service_combo: 'combo dịch vụ', product_combo: 'combo sản phẩm', prepaid_card: 'thẻ tiền mặt' };": "const ADD_LABEL = { service: t('catalog.add_label_service', 'dịch vụ'), product: t('catalog.add_label_product', 'sản phẩm'), package: t('catalog.add_label_package', 'gói dịch vụ'), treatment: t('catalog.add_label_treatment', 'liệu trình'), service_combo: t('catalog.add_label_service_combo', 'combo dịch vụ'), product_combo: t('catalog.add_label_product_combo', 'combo sản phẩm'), prepaid_card: t('catalog.add_label_prepaid_card', 'thẻ tiền mặt') };",
    "const GROUP_LABEL = { service: 'dịch vụ', product: 'sản phẩm', package: 'gói dịch vụ', treatment: 'liệu trình' };": "const GROUP_LABEL = { service: t('catalog.group_label_service', 'dịch vụ'), product: t('catalog.group_label_product', 'sản phẩm'), package: t('catalog.group_label_package', 'gói dịch vụ'), treatment: t('catalog.group_label_treatment', 'liệu trình') };",
    "Quản lý nhóm": "{t('catalog.manage_groups', 'Quản lý nhóm')}",
    "Thêm": "{t('catalog.add_new', 'Thêm')}",
    ">Tên<": ">{t('catalog.col_name', 'Tên')}<",
    ">Phân loại<": ">{t('catalog.col_category', 'Phân loại')}<",
    ">Thời lượng<": ">{t('catalog.col_duration', 'Thời lượng')}<",
    ">Giá<": ">{t('catalog.col_price', 'Giá')}<",
    ">Tồn kho<": ">{t('catalog.col_stock', 'Tồn kho')}<",
    ">Trạng thái<": ">{t('catalog.col_status', 'Trạng thái')}<",
    ">Chưa có": ">{t('catalog.empty_state_1', 'Chưa có')} {TABS.find(t => t.v === tab)?.l?.toLowerCase() || ''} {t('catalog.empty_state_2', 'nào trong hệ thống')}",
    "Bấm Thêm mới để tạo ngay.": "{t('catalog.empty_state_sub', 'Bấm Thêm mới để tạo ngay.')}",
    ">Hoạt động<": ">{t('catalog.status_active', 'Hoạt động')}<",
    ">Tạm ngưng<": ">{t('catalog.status_inactive', 'Tạm ngưng')}<",
    "Bạn có chắc chắn muốn xoá": "{t('catalog.confirm_delete_1', 'Bạn có chắc chắn muốn xoá')} {ENTITY_MAP[tab]} {t('catalog.confirm_delete_2', 'này không?')}"
}

for old, new in replacements.items():
    content = content.replace(old, new)

# We need to replace TABS dynamically inside the component so it uses `t` hook properly.
# Actually, TABS is declared outside component. We need to move it inside, or wrap it in a useMemo.
# Let's fix TABS declaration.
tabs_decl = """const TABS = [
{ v: 'service', l: 'Dịch vụ', i: Scissors, grp: 'service' },
{ v: 'product', l: 'Sản phẩm', i: Package, grp: 'product' },
{ v: 'package', l: 'Gói dịch vụ', i: Gift, grp: 'package' },
{ v: 'treatment', l: 'Liệu trình', i: Sparkles, grp: 'treatment' },
{ v: 'service_combo', l: 'Combo dịch vụ', i: Layers, grp: null },
{ v: 'product_combo', l: 'Combo sản phẩm', i: Boxes, grp: null },
{ v: 'prepaid_card', l: 'Thẻ tiền mặt', i: CreditCard, grp: null }];"""

if tabs_decl in content:
    content = content.replace(tabs_decl, "")
    
    new_tabs_decl = """  const TABS = [
  { v: 'service', l: t('catalog.tab_services', 'Dịch vụ'), i: Scissors, grp: 'service' },
  { v: 'product', l: t('catalog.tab_products', 'Sản phẩm'), i: Package, grp: 'product' },
  { v: 'package', l: t('catalog.tab_packages', 'Gói dịch vụ'), i: Gift, grp: 'package' },
  { v: 'treatment', l: t('catalog.tab_treatments', 'Liệu trình'), i: Sparkles, grp: 'treatment' },
  { v: 'service_combo', l: t('catalog.tab_service_combos', 'Combo dịch vụ'), i: Layers, grp: null },
  { v: 'product_combo', l: t('catalog.tab_product_combos', 'Combo sản phẩm'), i: Boxes, grp: null },
  { v: 'prepaid_card', l: t('catalog.tab_prepaid_cards', 'Thẻ tiền mặt'), i: CreditCard, grp: null }];"""
    
    content = content.replace("const [tab, setTab] = useState('service');", f"const [tab, setTab] = useState('service');\n{new_tabs_decl}")

labels_decl = """const ADD_LABEL = { service: 'dịch vụ', product: 'sản phẩm', package: 'gói dịch vụ', treatment: 'liệu trình', service_combo: 'combo dịch vụ', product_combo: 'combo sản phẩm', prepaid_card: 'thẻ tiền mặt' };
const GROUP_LABEL = { service: 'dịch vụ', product: 'sản phẩm', package: 'gói dịch vụ', treatment: 'liệu trình' };"""

if labels_decl in content:
    content = content.replace(labels_decl, "")
    new_labels_decl = """  const ADD_LABEL = { service: t('catalog.add_label_service', 'dịch vụ'), product: t('catalog.add_label_product', 'sản phẩm'), package: t('catalog.add_label_package', 'gói dịch vụ'), treatment: t('catalog.add_label_treatment', 'liệu trình'), service_combo: t('catalog.add_label_service_combo', 'combo dịch vụ'), product_combo: t('catalog.add_label_product_combo', 'combo sản phẩm'), prepaid_card: t('catalog.add_label_prepaid_card', 'thẻ tiền mặt') };
  const GROUP_LABEL = { service: t('catalog.group_label_service', 'dịch vụ'), product: t('catalog.group_label_product', 'sản phẩm'), package: t('catalog.group_label_package', 'gói dịch vụ'), treatment: t('catalog.group_label_treatment', 'liệu trình') };"""
    content = content.replace("const [tab, setTab] = useState('service');", f"const [tab, setTab] = useState('service');\n{new_labels_decl}")

# Ensure "Chưa có" is fixed if the above didn't catch it
content = re.sub(r"Chưa có \{TABS\.find\([^)]+\)\?\.l\?\.toLowerCase\(\) \|\| ''\} nào trong hệ thống", 
                 r"{t('catalog.empty_state_1', 'Chưa có')} {TABS.find(t_ => t_.v === tab)?.l?.toLowerCase() || ''} {t('catalog.empty_state_2', 'nào trong hệ thống')}", content)

with open('src/views/Services.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Services.jsx translated")
