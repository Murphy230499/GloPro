import re

with open('src/components/staff/SchedulerGrid.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add appearance-none to all 5 selects
content = content.replace("outline-none focus:border-orange-400", "appearance-none outline-none focus:border-orange-400")

# Wrap them in <div className="relative"> and add icon
def wrap_select(match):
    select_tag = match.group(0)
    return f'''<div className="relative">
                  {select_tag}
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>'''

content = re.sub(r'<select[^>]+>.*?</select>', wrap_select, content, flags=re.DOTALL)

with open('src/components/staff/SchedulerGrid.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Selects wrapped!")
