import re

with open('src/components/services/GroupManager.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "import { useT }" not in content:
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useT } from '@/lib/i18n';")

if "const { t } = useT();" not in content:
    content = re.sub(r"export default function GroupManager\([^)]+\) {", lambda m: m.group(0) + "\n  const { t } = useT();", content)

replacements = {
    "'Nhập tên nhóm'": "t('catalog.err_enter_group_name', 'Nhập tên nhóm')",
    "'Đã cập nhật nhóm'": "t('catalog.msg_group_updated', 'Đã cập nhật nhóm')",
    "'Đã thêm nhóm'": "t('catalog.msg_group_added', 'Đã thêm nhóm')",
    "'Lỗi: '": "t('catalog.err_prefix', 'Lỗi: ')",
    "'Xoá nhóm này? Các mục thuộc nhóm này sẽ không còn nhóm.'": "t('catalog.confirm_delete_group', 'Xoá nhóm này? Các mục thuộc nhóm này sẽ không còn nhóm.')",
    "'Đã xoá nhóm'": "t('catalog.msg_group_deleted', 'Đã xoá nhóm')",
    ">Quản lý nhóm {type === 'service' ? 'dịch vụ' : type === 'product' ? 'sản phẩm' : type === 'package' ? 'gói dịch vụ' : 'liệu trình'}<": ">{t('catalog.manage_groups', 'Quản lý nhóm')} {type === 'service' ? t('catalog.add_label_service', 'dịch vụ') : type === 'product' ? t('catalog.add_label_product', 'sản phẩm') : type === 'package' ? t('catalog.add_label_package', 'gói dịch vụ') : t('catalog.add_label_treatment', 'liệu trình')}<",
    "placeholder=\"Tên nhóm\"": "placeholder={t('catalog.group_name_placeholder', 'Tên nhóm')}",
    ">Cập nhật nhóm<": ">{t('catalog.btn_update_group', 'Cập nhật nhóm')}<",
    ">Thêm nhóm<": ">{t('catalog.btn_add_group', 'Thêm nhóm')}<",
    ">Huỷ chỉnh sửa<": ">{t('catalog.btn_cancel_edit', 'Huỷ chỉnh sửa')}<",
    ">Đang tải...<": ">{t('catalog.loading', 'Đang tải...')}<",
    ">Chưa có nhóm nào<": ">{t('catalog.empty_groups', 'Chưa có nhóm nào')}<"
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Special case for "Thêm nhóm" that might be a ternary
content = content.replace("{editingId ? 'Cập nhật nhóm' : 'Thêm nhóm'}", "{editingId ? t('catalog.btn_update_group', 'Cập nhật nhóm') : t('catalog.btn_add_group', 'Thêm nhóm')}")

with open('src/components/services/GroupManager.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("GroupManager.jsx translated")
