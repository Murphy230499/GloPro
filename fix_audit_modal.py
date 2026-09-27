with open('src/components/staff/AuditLogModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('placeholder="tìm kiếm lịch sử..."', 'placeholder={t("staff.commission.search_audit", "tìm kiếm lịch sử...")}')
content = content.replace('\n              Chưa ghi nhận hoạt động thao tác hoa hồng nào.\n', '\n              {t("staff.commission.no_audit_log", "Chưa ghi nhận hoạt động thao tác hoa hồng nào.")}\n')

with open('src/components/staff/AuditLogModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("AuditLogModal fixed!")
