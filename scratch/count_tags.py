import re

with open('app/milk-collection/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

open_tags = len(re.findall(r'<View', content))
close_tags = len(re.findall(r'</View>', content))

print(f"Open: {open_tags}")
print(f"Close: {close_tags}")
