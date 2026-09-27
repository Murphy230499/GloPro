import re

with open('src/views/Staff.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update useState for scheduleSubTab
old_state = "const [scheduleSubTab, setScheduleSubTab] = useState('grid');"
new_state = "const urlSubTab = searchParams?.get('sub');\n  const [scheduleSubTab, setScheduleSubTab] = useState(urlSubTab || 'grid');"
content = content.replace(old_state, new_state)

# 2. Update onClick for scheduleSubTab
old_onclick = "onClick={() => setScheduleSubTab(t.id)}"
new_onclick = "onClick={() => { setScheduleSubTab(t.id); window.history.replaceState(null, '', '?tab=' + mainTab + '&sub=' + t.id); }}"
content = content.replace(old_onclick, new_onclick)

with open('src/views/Staff.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated sub tab reload logic")
