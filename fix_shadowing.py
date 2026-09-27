import re

with open('src/components/staff/ShiftTemplateManager.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace templates.map((t) => { with templates.map((tpl) => {
content = content.replace("templates.map((t) => {", "templates.map((tpl) => {")

# We must be careful to replace only the t variable inside the map, 
# but a regex might be tricky if we don't know the exact bounds.
# Let's see the bounds. The map is from line 189 to line 251.

lines = content.split('\n')
in_map = False
for i in range(len(lines)):
    if "templates.map((tpl) => {" in lines[i]:
        in_map = True
    elif in_map and lines[i].strip() == "})}":
        in_map = False
    
    if in_map:
        # replace t. with tpl.
        lines[i] = re.sub(r'\bt\.', 'tpl.', lines[i])
        # replace edit(t) with edit(tpl)
        lines[i] = re.sub(r'edit\(t\)', 'edit(tpl)', lines[i])

content = '\n'.join(lines)

with open('src/components/staff/ShiftTemplateManager.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Shadowing fixed!")
