from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import sys

ROOT = Path(__file__).resolve().parent.parent
HTML = list(ROOT.glob('*.html'))
ids = {}
refs = []

class Parser(HTMLParser):
    def __init__(self, file):
        super().__init__(); self.file=file; self.page_ids=set()
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.page_ids.add(a['id'])
        for key in ('href','src'):
            if a.get(key): refs.append((self.file,tag,key,a[key]))

for page in HTML:
    p=Parser(page); p.feed(page.read_text(encoding='utf-8', errors='ignore')); ids[page.name]=p.page_ids

errors=[]
for page, tag, key, raw in refs:
    if raw.startswith(('#','mailto:','tel:','javascript:','data:')):
        if raw.startswith('#') and raw!='#' and raw[1:] not in ids.get(page.name,set()): errors.append(f'{page.name}: missing anchor {raw}')
        continue
    u=urlparse(raw)
    if u.scheme or u.netloc: continue
    path=unquote(u.path)
    if not path: target=page
    else: target=(page.parent/path).resolve()
    try: target.relative_to(ROOT.resolve())
    except ValueError: continue
    if not target.exists(): errors.append(f'{page.name}: {key} -> missing {raw}')
    elif u.fragment and target.suffix.lower()=='.html':
        target_ids=ids.get(target.name,set())
        if u.fragment not in target_ids: errors.append(f'{page.name}: href -> {raw} (missing #{u.fragment})')

if errors:
    print('SITE CHECK FAILED')
    for e in errors: print(' -',e)
    sys.exit(1)
print(f'Site check passed: {len(HTML)} HTML pages, {len(refs)} internal/resource references checked.')
