with open('src/views/Staff.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_onclick = "onClick={() => setMainTab(tab.id)}"
good_onclick = "onClick={() => { setMainTab(tab.id); window.history.replaceState(null, '', '?tab=' + tab.id); }}"

content = content.replace(bad_onclick, good_onclick)

with open('src/views/Staff.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated tab reload logic")
