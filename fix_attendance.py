with open('src/components/staff/AttendanceLog.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("let statusKey = 'no_show';", "let statusKey = 'no_attendance';")
content = content.replace("STATUS_CONFIG.no_show", "STATUS_CONFIG.no_attendance")

with open('src/components/staff/AttendanceLog.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Attendance bug fixed!")
