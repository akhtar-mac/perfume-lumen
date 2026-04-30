import re

with open('src/data/products.ts', 'r') as f:
    content = f.read()

content = content.replace('image: string;', 'images: string[];\n  videoUrl?: string;')
content = re.sub(r"image: ('.*?')", r"images: [\1, \1, '', '']", content)

with open('src/data/products.ts', 'w') as f:
    f.write(content)
