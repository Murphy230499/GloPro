import re
import os

files = [
    'src/components/services/ServiceForm.jsx',
    'src/components/services/ProductForm.jsx',
    'src/components/services/PackageForm.jsx',
    'src/components/services/TreatmentForm.jsx',
    'src/components/services/ComboForm.jsx',
    'src/components/services/ProductComboForm.jsx',
    'src/components/services/PrepaidCardForm.jsx'
]

common_replacements = {
    # Buttons
    ">Lưu<": ">{t('catalog.btn_save', 'Lưu')}<",
    ">Cập nhật<": ">{t('catalog.btn_update', 'Cập nhật')}<",
    ">Xóa<": ">{t('catalog.btn_delete', 'Xóa')}<",
    ">Thêm mới<": ">{t('catalog.btn_add_new', 'Thêm mới')}<",
    ">Đóng<": ">{t('catalog.btn_close', 'Đóng')}<",
    ">Huỷ bỏ<": ">{t('catalog.btn_cancel', 'Huỷ bỏ')}<",
    
    # Common labels
    ">Mô tả": ">{t('catalog.label_description', 'Mô tả')}",
    ">Mô tả<": ">{t('catalog.label_description', 'Mô tả')}<",
    "placeholder=\"Nhập mô tả chi tiết\"": "placeholder={t('catalog.ph_description', 'Nhập mô tả chi tiết')}",
    "placeholder=\"Nhập mô tả (không bắt buộc)\"": "placeholder={t('catalog.ph_description_opt', 'Nhập mô tả (không bắt buộc)')}",
    
    ">Giá bán<": ">{t('catalog.label_price', 'Giá bán')}<",
    ">Thời lượng (phút)<": ">{t('catalog.label_duration', 'Thời lượng (phút)')}<",
    ">Tồn kho<": ">{t('catalog.label_stock', 'Tồn kho')}<",
    ">Đơn vị tính<": ">{t('catalog.label_unit', 'Đơn vị tính')}<",
    
    # Image upload
    ">Tải ảnh lên<": ">{t('catalog.upload_image', 'Tải ảnh lên')}<",
    ">Hình ảnh<": ">{t('catalog.label_image', 'Hình ảnh')}<",
    ">Đổi ảnh<": ">{t('catalog.change_image', 'Đổi ảnh')}<",
    ">Xoá ảnh<": ">{t('catalog.delete_image', 'Xoá ảnh')}<",
    
    # Group logic
    "Chưa phân nhóm": "{t('catalog.uncategorized', 'Chưa phân nhóm')}",
    "Chọn nhóm...": "{t('catalog.select_group', 'Chọn nhóm...')}",
    ">Quản lý nhóm<": ">{t('catalog.manage_groups', 'Quản lý nhóm')}<",
    
    # Specific fields
    ">Tên dịch vụ<": ">{t('catalog.label_service_name', 'Tên dịch vụ')}<",
    "placeholder=\"Nhập tên dịch vụ\"": "placeholder={t('catalog.ph_service_name', 'Nhập tên dịch vụ')}",
    ">Tên sản phẩm<": ">{t('catalog.label_product_name', 'Tên sản phẩm')}<",
    "placeholder=\"Nhập tên sản phẩm\"": "placeholder={t('catalog.ph_product_name', 'Nhập tên sản phẩm')}",
    ">Tên gói<": ">{t('catalog.label_package_name', 'Tên gói')}<",
    "placeholder=\"Nhập tên gói\"": "placeholder={t('catalog.ph_package_name', 'Nhập tên gói')}",
    ">Tên liệu trình<": ">{t('catalog.label_treatment_name', 'Tên liệu trình')}<",
    "placeholder=\"Nhập tên liệu trình\"": "placeholder={t('catalog.ph_treatment_name', 'Nhập tên liệu trình')}",
    ">Tên combo<": ">{t('catalog.label_combo_name', 'Tên combo')}<",
    "placeholder=\"Nhập tên combo\"": "placeholder={t('catalog.ph_combo_name', 'Nhập tên combo')}",
    ">Tên thẻ<": ">{t('catalog.label_card_name', 'Tên thẻ')}<",
    "placeholder=\"Nhập tên thẻ\"": "placeholder={t('catalog.ph_card_name', 'Nhập tên thẻ')}",
    
    ">Nhóm dịch vụ<": ">{t('catalog.label_service_group', 'Nhóm dịch vụ')}<",
    ">Nhóm sản phẩm<": ">{t('catalog.label_product_group', 'Nhóm sản phẩm')}<",
    ">Nhóm gói<": ">{t('catalog.label_package_group', 'Nhóm gói')}<",
    ">Nhóm liệu trình<": ">{t('catalog.label_treatment_group', 'Nhóm liệu trình')}<",
    
    # Prepaid card specific
    ">Giá trị thẻ (Số dư được cộng)<": ">{t('catalog.label_card_value', 'Giá trị thẻ (Số dư được cộng)')}<",
    ">Giá bán thẻ (Số tiền khách trả)<": ">{t('catalog.label_card_price', 'Giá bán thẻ (Số tiền khách trả)')}<",
    
    # Combo specific
    ">Các dịch vụ trong Combo<": ">{t('catalog.label_services_in_combo', 'Các dịch vụ trong Combo')}<",
    ">Các sản phẩm trong Combo<": ">{t('catalog.label_products_in_combo', 'Các sản phẩm trong Combo')}<",
    ">Các dịch vụ trong liệu trình<": ">{t('catalog.label_services_in_treatment', 'Các dịch vụ trong liệu trình')}<",
    ">Thêm dịch vụ<": ">{t('catalog.btn_add_service', 'Thêm dịch vụ')}<",
    ">Thêm sản phẩm<": ">{t('catalog.btn_add_product', 'Thêm sản phẩm')}<",
    "Chọn dịch vụ...": "{t('catalog.select_service', 'Chọn dịch vụ...')}",
    "Chọn sản phẩm...": "{t('catalog.select_product', 'Chọn sản phẩm...')}",
    ">Số lượng<": ">{t('catalog.label_quantity', 'Số lượng')}<",
    
    # Validation messages
    "'Vui lòng nhập tên'": "t('catalog.err_enter_name', 'Vui lòng nhập tên')",
    "'Vui lòng nhập tên dịch vụ'": "t('catalog.err_enter_service_name', 'Vui lòng nhập tên dịch vụ')",
    "'Vui lòng chọn ít nhất 1 dịch vụ'": "t('catalog.err_select_at_least_1_service', 'Vui lòng chọn ít nhất 1 dịch vụ')",
    "'Vui lòng chọn ít nhất 1 sản phẩm'": "t('catalog.err_select_at_least_1_product', 'Vui lòng chọn ít nhất 1 sản phẩm')",
    
    # Modals
    ">Thêm dịch vụ mới<": ">{t('catalog.title_add_service', 'Thêm dịch vụ mới')}<",
    ">Sửa dịch vụ<": ">{t('catalog.title_edit_service', 'Sửa dịch vụ')}<",
    ">Thêm sản phẩm mới<": ">{t('catalog.title_add_product', 'Thêm sản phẩm mới')}<",
    ">Sửa sản phẩm<": ">{t('catalog.title_edit_product', 'Sửa sản phẩm')}<",
    ">Thêm gói mới<": ">{t('catalog.title_add_package', 'Thêm gói mới')}<",
    ">Sửa gói<": ">{t('catalog.title_edit_package', 'Sửa gói')}<",
    ">Thêm liệu trình mới<": ">{t('catalog.title_add_treatment', 'Thêm liệu trình mới')}<",
    ">Sửa liệu trình<": ">{t('catalog.title_edit_treatment', 'Sửa liệu trình')}<",
    ">Thêm combo mới<": ">{t('catalog.title_add_combo', 'Thêm combo mới')}<",
    ">Sửa combo<": ">{t('catalog.title_edit_combo', 'Sửa combo')}<",
    ">Thêm thẻ mới<": ">{t('catalog.title_add_card', 'Thêm thẻ mới')}<",
    ">Sửa thẻ<": ">{t('catalog.title_edit_card', 'Sửa thẻ')}<",
}

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add i18n import if missing
    if "import { useT }" not in content:
        # try to insert after standard React imports
        content = re.sub(
            r"(import React.*?from 'react';)", 
            r"\1\nimport { useT } from '@/lib/i18n';", 
            content
        )
        # If it didn't match (e.g. multi-line import), try a broader match
        if "import { useT }" not in content:
             content = re.sub(
                r"(import [^;]+ from 'react';)", 
                r"\1\nimport { useT } from '@/lib/i18n';", 
                content, count=1
             )

    # Inject `const { t } = useT();` into the main component function
    if "const { t } = useT();" not in content:
        content = re.sub(
            r"(export default function \w+\([^)]*\) \{)", 
            r"\1\n  const { t } = useT();", 
            content
        )

    # Apply common replacements
    for old, new in common_replacements.items():
        content = content.replace(old, new)
        
    # Extra fix for any ternary strings that might not have been caught
    content = content.replace("? 'Cập nhật' : 'Thêm mới'", "? t('catalog.btn_update', 'Cập nhật') : t('catalog.btn_add_new', 'Thêm mới')")
    content = content.replace("? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'", "? t('catalog.title_edit_service', 'Sửa dịch vụ') : t('catalog.title_add_service', 'Thêm dịch vụ mới')")
    content = content.replace("? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'", "? t('catalog.title_edit_product', 'Sửa sản phẩm') : t('catalog.title_add_product', 'Thêm sản phẩm mới')")
    content = content.replace("? 'Sửa gói' : 'Thêm gói mới'", "? t('catalog.title_edit_package', 'Sửa gói') : t('catalog.title_add_package', 'Thêm gói mới')")
    content = content.replace("? 'Sửa liệu trình' : 'Thêm liệu trình mới'", "? t('catalog.title_edit_treatment', 'Sửa liệu trình') : t('catalog.title_add_treatment', 'Thêm liệu trình mới')")
    content = content.replace("? 'Sửa combo' : 'Thêm combo mới'", "? t('catalog.title_edit_combo', 'Sửa combo') : t('catalog.title_add_combo', 'Thêm combo mới')")
    content = content.replace("? 'Sửa thẻ' : 'Thêm thẻ mới'", "? t('catalog.title_edit_card', 'Sửa thẻ') : t('catalog.title_add_card', 'Thêm thẻ mới')")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"{file_path} translated")
