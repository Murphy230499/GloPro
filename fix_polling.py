with open('src/views/Appointments.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("setInterval(load, 15000)", "setInterval(load, 300000)")

with open('src/views/Appointments.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/GlobalNotificationProvider.jsx', 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace("setInterval(pollDatabase, 15000)", "setInterval(pollDatabase, 300000)")

with open('src/components/GlobalNotificationProvider.jsx', 'w', encoding='utf-8') as f:
    f.write(content2)

print("Fixed polling intervals")
