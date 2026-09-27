import re

with open('src/components/staff/StaffForm.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Inject useT
if "import { useT }" not in content:
    content = content.replace("import React,", "import { useT } from '@/lib/i18n';\nimport React,")
if "const { t } = useT();" not in content:
    content = content.replace("const [f, setF] = useState", "const { t } = useT();\n  const [f, setF] = useState")

# Move ROLES inside component
roles_str = """const ROLES = {
  manager: { label: 'Quản lý', color: '#FF6B9D' },
  receptionist: { label: 'Lễ tân', color: '#60A5FA' },
  stylist: { label: 'Kỹ thuật viên tóc', color: '#A78BFA' },
  barber: { label: 'Barber', color: '#34D399' },
  therapist: { label: 'Chuyên viên Spa', color: '#FBBF24' },
  nail_tech: { label: 'Nail tech', color: '#F472B6' },
  technician: { label: 'Kỹ thuật viên', color: '#F97316' },
  cashier: { label: 'Thu ngân', color: '#94A3B8' },
};"""

translated_roles_str = """const ROLES = {
    manager: { label: t('staff.roles.manager', 'Quản lý'), color: '#FF6B9D' },
    receptionist: { label: t('staff.roles.receptionist', 'Lễ tân'), color: '#60A5FA' },
    stylist: { label: t('staff.roles.stylist', 'Kỹ thuật viên tóc'), color: '#A78BFA' },
    barber: { label: t('staff.roles.barber', 'Barber'), color: '#34D399' },
    therapist: { label: t('staff.roles.therapist', 'Chuyên viên Spa'), color: '#FBBF24' },
    nail_tech: { label: t('staff.roles.nail_tech', 'Nail tech'), color: '#F472B6' },
    technician: { label: t('staff.roles.technician', 'Kỹ thuật viên'), color: '#F97316' },
    cashier: { label: t('staff.roles.cashier', 'Thu ngân'), color: '#94A3B8' },
  };"""

if roles_str in content:
    content = content.replace(roles_str, "")
    content = content.replace("const { t } = useT();", "const { t } = useT();\n  " + translated_roles_str)


# String replacements
replacements = {
    "toast.error('Nhập họ tên nhân viên');": "toast.error(t('staff.form.err_name', 'Nhập họ tên nhân viên'));",
    "toast.error('Vui lòng chọn chi nhánh');": "toast.error(t('staff.form.err_branch', 'Chọn chi nhánh'));",
    "{staff.id ? 'Sửa hồ sơ nhân viên' : 'Thêm nhân viên'}": "{staff.id ? t('staff.form.edit_title', 'Sửa hồ sơ nhân viên') : t('staff.form.title', 'Thêm nhân viên')}",
    "Thông tin cơ bản": "{t('staff.form.basic_info', 'THÔNG TIN CƠ BẢN')}",
    "Họ tên *": "{t('staff.form.fullname', 'Họ tên')} *",
    'placeholder="Họ tên nhân viên..."': 'placeholder={t("staff.form.fullname_placeholder", "Họ tên nhân viên...")}',
    ">Số điện thoại<": ">{t('staff.form.phone', 'Số điện thoại')}<",
    'placeholder="Số điện thoại..."': 'placeholder={t("staff.form.phone_placeholder", "Số điện thoại...")}',
    ">Chi nhánh *<": ">{t('staff.form.branch', 'Chi nhánh')} *<",
    ">— Chọn chi nhánh —<": ">{t('staff.form.select_branch', '— Chọn chi nhánh —')}<",
    ">Vai trò<": ">{t('staff.form.role', 'Vai trò')}<",
    ">Lương cơ bản (VNĐ/tháng)<": ">{t('staff.form.base_salary', 'Lương cơ bản (VNĐ/tháng)')}<",
    'placeholder="Lương cơ bản..."': 'placeholder={t("staff.form.base_salary_placeholder", "Lương cơ bản...")}',
    ">Màu đại diện<": ">{t('staff.form.avatar_color', 'Màu đại diện')}<",
    ">Ghi chú<": ">{t('common.note', 'Ghi chú')}<",
    'placeholder="Ghi chú về nhân viên..."': 'placeholder={t("staff.form.note_placeholder", "Ghi chú về nhân viên...")}',
    'label="Ảnh chân dung nhân sự"': 'label={t("staff.form.avatar", "Ảnh chân dung nhân sự")}',
    ">Chuyên môn dịch vụ<": ">{t('staff.form.service_expertise', 'Chuyên môn dịch vụ')}<",
    'placeholder={f.service_ids.length === 0 ? "Chọn dịch vụ chuyên môn" : `Đã chọn ${f.service_ids.length} dịch vụ`}': 'placeholder={f.service_ids.length === 0 ? t("staff.form.service_select", "Chọn dịch vụ chuyên môn") : t("staff.form.service_selected", "Đã chọn {n} dịch vụ").replace("{n}", f.service_ids.length)}',
    ">Đang tải danh sách dịch vụ...<": ">{t('staff.form.loading_services', 'Đang tải danh sách dịch vụ...')}<",
    ">Không tìm thấy dịch vụ nào<": ">{t('staff.form.no_services', 'Không tìm thấy dịch vụ nào')}<",
    "<span>Tất cả</span>": "<span className=\"truncate\">{t('common.all', 'Tất cả')}</span>",
    "Cấu hình Đặt lịch hẹn": "{t('staff.form.booking_config', 'Cấu hình Đặt lịch hẹn')}",
    ">Cho phép nhận lịch hẹn<": ">{t('staff.form.allow_booking', 'Cho phép nhận lịch hẹn')}<",
    ">Hiển thị nhân viên này trong danh sách đặt lịch hẹn<": ">{t('staff.form.allow_booking_desc', 'Hiển thị nhân viên này trong danh sách đặt lịch hẹn')}<",
    ">Số lịch hẹn nhận đồng thời:<": ">{t('staff.form.max_concurrent', 'Số lịch hẹn nhận đồng thời:')}<",
    ">Thường đặt là 1. Nếu cho phép đặt trùng ca để phục vụ nhiều khách cùng lúc (ví dụ: làm móng hoặc ủ tóc), hãy tăng chỉ số này.<": ">{t('staff.form.max_concurrent_desc', 'Thường đặt là 1. Nếu cho phép đặt trùng ca để phục vụ nhiều khách cùng lúc (ví dụ: làm móng hoặc ủ tóc), hãy tăng chỉ số này.')}<",
    ">Trạng thái hoạt động<": ">{t('staff.form.status', 'Trạng thái hoạt động')}<",
    ">Nếu tắt, nhân viên sẽ tạm thời bị vô hiệu hoá trên hệ thống<": ">{t('staff.form.status_desc', 'Nếu tắt, nhân viên sẽ tạm thời bị vô hiệu hoá trên hệ thống')}<",
    ">Hủy<": ">{t('common.cancel', 'Hủy')}<",
    ">Lưu<": ">{t('common.save', 'Lưu')}<"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/staff/StaffForm.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("StaffForm.jsx fixed and translated!")
