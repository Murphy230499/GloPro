import re

with open('src/lib/i18n.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the `vi` object and `en` object
# They look like: `const vi = { ... }` and `const en = { ... }`

new_keys_vi = """
    // Staff Module
    'staff.roles.manager': 'Quản lý',
    'staff.roles.receptionist': 'Lễ tân',
    'staff.roles.stylist': 'Kỹ thuật viên tóc',
    'staff.roles.barber': 'Barber',
    'staff.roles.therapist': 'Chuyên viên Spa',
    'staff.roles.nail_tech': 'Nail tech',
    'staff.roles.technician': 'Kỹ thuật viên',
    'staff.roles.cashier': 'Thu ngân',
    'staff.commission.roles.primary': 'Thợ chính',
    'staff.commission.roles.assistant': 'Thợ phụ',
    'staff.commission.roles.technician': 'Kỹ thuật viên',
    'staff.commission.roles.cashier': 'Thu ngân',
    'staff.commission.roles.manager': 'Quản lý',
    'staff.commission.roles.partner': 'Đối tác',
    'staff.commission.roles.default': 'Nhân viên',
    
    'staff.tabs.manage': 'Quản lý Nhân viên',
    'staff.tabs.schedule': 'Lịch làm việc',
    'staff.tabs.attendance': 'Chấm công',
    'staff.tabs.commission': 'Hoa hồng Nhân viên',
    'staff.tabs.payroll': 'Bảng tính lương',
    'staff.tabs.schedule.grid': 'Bảng xếp ca tuần',
    'staff.tabs.schedule.templates': 'Quản lý ca làm việc',
    
    'staff.attendance.on_time': 'Đúng giờ',
    'staff.attendance.late': 'Đi trễ',
    'staff.attendance.early_leave': 'Về sớm',
    'staff.attendance.late_and_early': 'Trễ & Sớm',
    'staff.attendance.missing_in': 'Chưa chấm vào',
    'staff.attendance.missing_out': 'Chưa chấm ra',
    'staff.attendance.no_attendance': 'Chưa chấm công',
    'staff.attendance.absent': 'Nghỉ làm',
    
    'staff.commission.tabs.service': 'Dịch vụ',
    'staff.commission.tabs.product': 'Sản phẩm',
    'staff.commission.tabs.package': 'Gói dịch vụ',
    'staff.commission.tabs.treatment': 'Liệu trình',
    'staff.commission.tabs.service_combo': 'Combo dịch vụ',
    'staff.commission.tabs.product_combo': 'Combo sản phẩm',
    'staff.commission.tabs.prepaid_card': 'Thẻ tiền mặt',
    'staff.commission.tabs.customer_req': 'Khách yêu cầu',
    'staff.commission.tabs.overtime': 'Theo khung giờ',
    'staff.commission.tabs.revenue': 'Doanh thu',
"""

new_keys_en = """
    // Staff Module
    'staff.roles.manager': 'Manager',
    'staff.roles.receptionist': 'Receptionist',
    'staff.roles.stylist': 'Hair Stylist',
    'staff.roles.barber': 'Barber',
    'staff.roles.therapist': 'Spa Therapist',
    'staff.roles.nail_tech': 'Nail Tech',
    'staff.roles.technician': 'Technician',
    'staff.roles.cashier': 'Cashier',
    'staff.commission.roles.primary': 'Main Tech',
    'staff.commission.roles.assistant': 'Assistant',
    'staff.commission.roles.technician': 'Technician',
    'staff.commission.roles.cashier': 'Cashier',
    'staff.commission.roles.manager': 'Manager',
    'staff.commission.roles.partner': 'Partner',
    'staff.commission.roles.default': 'Staff',
    
    'staff.tabs.manage': 'Manage Staff',
    'staff.tabs.schedule': 'Work Schedule',
    'staff.tabs.attendance': 'Attendance',
    'staff.tabs.commission': 'Staff Commission',
    'staff.tabs.payroll': 'Payroll',
    'staff.tabs.schedule.grid': 'Weekly Roster',
    'staff.tabs.schedule.templates': 'Shift Management',
    
    'staff.attendance.on_time': 'On time',
    'staff.attendance.late': 'Late',
    'staff.attendance.early_leave': 'Early leave',
    'staff.attendance.late_and_early': 'Late & Early',
    'staff.attendance.missing_in': 'Missing check-in',
    'staff.attendance.missing_out': 'Missing check-out',
    'staff.attendance.no_attendance': 'No attendance',
    'staff.attendance.absent': 'Absent',
    
    'staff.commission.tabs.service': 'Service',
    'staff.commission.tabs.product': 'Product',
    'staff.commission.tabs.package': 'Service Package',
    'staff.commission.tabs.treatment': 'Treatment',
    'staff.commission.tabs.service_combo': 'Service Combo',
    'staff.commission.tabs.product_combo': 'Product Combo',
    'staff.commission.tabs.prepaid_card': 'Prepaid Card',
    'staff.commission.tabs.customer_req': 'Customer Request',
    'staff.commission.tabs.overtime': 'Overtime',
    'staff.commission.tabs.revenue': 'Revenue',
"""

# Insert into vi
content = re.sub(r'(const vi = {)', r'\1\n' + new_keys_vi, content)
# Insert into en
content = re.sub(r'(const en = {)', r'\1\n' + new_keys_en, content)

with open('src/lib/i18n.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Translations added successfully!")
