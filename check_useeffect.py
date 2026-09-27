import os
import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find useEffect blocks
    # A simple regex to find useEffect(() => { ... }, [dependencies])
    matches = re.finditer(r'useEffect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*(,\s*\[([^\]]*)\])?\s*\)', content)
    for m in matches:
        body = m.group(1)
        deps_group = m.group(2)
        deps = m.group(3)

        has_fetch = 'base44.entities' in body or 'supabase' in body or 'fetch(' in body
        
        if has_fetch:
            if not deps_group:
                print(f"[NO DEPS] {filepath}")
            elif deps and len(deps.strip()) > 0:
                # Check if state updated in body is in deps
                set_states = re.findall(r'set([A-Z]\w+)\(', body)
                dep_list = [d.strip() for d in deps.split(',')]
                for s in set_states:
                    state_name = s[0].lower() + s[1:]
                    if state_name in dep_list or s in dep_list:
                        print(f"[POTENTIAL INFINITE LOOP] {filepath} - Updates '{s}' and depends on it.")

for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith('.jsx') or f.endswith('.js'):
            check_file(os.path.join(root, f))

print("Scan complete.")
