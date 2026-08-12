# Project Plan: Translate Catalog Module

## Goal
Translate the Catalog module (Danh mục) into English to support the application's i18n capabilities. This includes the main view, list displays, group management, and all creation popups for various catalog items.

## Scope of Work

The translation will cover the following components:

### Main View
1. `src/views/Services.jsx` (Catalog container view, tabs, headers)

### Forms & Popups (Các popup tạo)
2. `src/components/services/ServiceForm.jsx` (Dịch vụ)
3. `src/components/services/ProductForm.jsx` (Sản phẩm)
4. `src/components/services/PackageForm.jsx` (Gói dịch vụ)
5. `src/components/services/TreatmentForm.jsx` (Liệu trình)
6. `src/components/services/ComboForm.jsx` (Combo dịch vụ)
7. `src/components/services/ProductComboForm.jsx` (Combo sản phẩm)
8. `src/components/services/PrepaidCardForm.jsx` (Thẻ tiền mặt)

### Group & Configuration (Nhóm của từng loại)
9. `src/components/services/GroupManager.jsx` (Quản lý nhóm)

### Other Components
10. `src/components/PrepaidCardView.jsx` (if applicable for display)

### Language Registry
11. `src/lib/i18n.jsx` (Add all new English keys and Vietnamese fallbacks)

## Task Breakdown

- [x] **Phase 1: i18n Setup**: Extract all hardcoded Vietnamese strings from the listed files and categorize them by entity type (e.g., `catalog.service.*`, `catalog.product.*`).
- [x] **Phase 2: Translation Engine Update**: Update `src/lib/i18n.jsx` with the comprehensive list of mapped translation keys in both `vi` and `en`.
- [x] **Phase 3: Inject Translation Logic**: Modify all 10 component files to import `useT` and replace hardcoded text with `t('key', 'default')`.
- [x] **Phase 4: Verification**: Test the catalog UI in English mode to ensure no text overlaps, missing translations, or broken layouts.

## Open Questions

None at this stage. The request is a direct continuation of previous i18n translation work.

## Verification Checklist
- Are all catalog tabs translated?
- Are all fields in the "Create Service/Product/etc" modals translated?
- Does the "Group Manager" modal render correctly in English?
- Are action buttons (Edit, Delete, Save) properly translated?
