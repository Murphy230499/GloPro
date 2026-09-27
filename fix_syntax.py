with open('src/components/staff/SchedulerGrid.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(")}", "}")

with open('src/components/staff/SchedulerGrid.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Syntax fixed")
