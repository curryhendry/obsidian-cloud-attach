import re

with open('src/main.js', 'r') as f:
    content = f.read()

lines = content.split('\n')
result = []
seen_en = False
key = 'notice.delete_webdav_forbidden'

for line in lines:
    stripped = line.strip()
    if key in stripped:
        if '\u6b64\u670d\u52a1\u5668\u4e0d\u652f\u6301\u901a\u8fc7 WebDAV' in stripped:
            # Chinese version - keep only first
            if 'delete_webdav_forbidden' in stripped and stripped.startswith("'{}'".format(key)):
                result.append(line)
            # else skip duplicate
        elif 'This' in stripped:
            # English version - keep only first
            if not seen_en:
                result.append(line)
                seen_en = True
        else:
            result.append(line)
    else:
        result.append(line)

with open('src/main.js', 'w') as f:
    f.write('\n'.join(result))

with open('src/main.js', 'r') as f:
    lines = f.readlines()

count = 0
for line in lines:
    if key in line:
        count += 1
        print(repr(line.rstrip()))

print(f"Total: {count}")
