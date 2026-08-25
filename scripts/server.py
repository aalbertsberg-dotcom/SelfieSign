import argparse, base64, json, mimetypes, os, re, socket
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'; UPLOADS=DATA/'uploads'; DB=DATA/'entries.json'; EVENTS=DATA/'events.json'
DATA.mkdir(exist_ok=True); UPLOADS.mkdir(exist_ok=True)

def load_json(path, default):
    try:return json.loads(path.read_text('utf-8'))
    except:return default

def save_json(path, value): path.write_text(json.dumps(value,indent=2),'utf-8')
def load_db(): return load_json(DB, [])
def save_db(v): save_json(DB,v)
def load_events(): return load_json(EVENTS,{})
def save_events(v): save_json(EVENTS,v)

def save_data_url(data,event,slot,kind):
    if not data or not isinstance(data,str) or not data.startswith('data:'): return data
    m=re.match(r'data:([^;]+);base64,(.+)',data,re.S)
    if not m:return data
    mime,b64=m.groups(); ext=mimetypes.guess_extension(mime) or '.jpg'
    folder=UPLOADS/event; folder.mkdir(parents=True,exist_ok=True)
    name=f'{slot}-{kind}{ext}'; (folder/name).write_bytes(base64.b64decode(b64))
    return f'data/uploads/{event}/{name}'

def persist_media(entry):
    event=entry.get('event','current'); slot=entry.get('slot','000')
    selfies=entry.get('selfies')
    if isinstance(selfies,list):
        entry['selfies']=[save_data_url(v,event,slot,f'selfie-{i+1}') for i,v in enumerate(selfies)]
    if isinstance(entry.get('selfie'),str) and entry['selfie'].startswith('data:'):
        entry['selfie']=save_data_url(entry['selfie'],event,slot,'selfie')
    if isinstance(entry.get('signature'),str) and entry['signature'].startswith('data:'):
        entry['signature']=save_data_url(entry['signature'],event,slot,'signature')
    return entry

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        p=urlparse(path).path.lstrip('/'); return str(ROOT/p)
    def send_json(self,obj,status=200):
        body=json.dumps(obj).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Cache-Control','no-store'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        u=urlparse(self.path); q=parse_qs(u.query)
        if u.path=='/api/health': return self.send_json({'ok':True})
        if u.path=='/api/entries':
            event=q.get('event',['current'])[0]; return self.send_json([x for x in load_db() if x.get('event')==event])
        if u.path=='/api/event':
            event=q.get('event',['current'])[0]; events=load_events(); return self.send_json(events.get(event,{'eventId':event}))
        return super().do_GET()
    def do_POST(self):
        u=urlparse(self.path)
        try:
            n=int(self.headers.get('Content-Length','0')); payload=json.loads(self.rfile.read(n) or b'{}')
            if u.path=='/api/entries':
                entry=persist_media(payload); event=entry.get('event','current'); slot=entry.get('slot','000')
                db=load_db(); i=next((i for i,x in enumerate(db) if x.get('event')==event and x.get('slot')==slot),None)
                if i is None: db.append(entry)
                else: db[i].update(entry); entry=db[i]
                save_db(db); return self.send_json(entry)
            if u.path=='/api/event':
                event=payload.get('eventId') or payload.get('event') or 'current'; events=load_events(); events[event]=payload; save_events(events); return self.send_json(payload)
            return self.send_error(404)
        except Exception as e: return self.send_json({'error':str(e)},500)

def lan_ip():
    s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
    try:s.connect(('8.8.8.8',80)); return s.getsockname()[0]
    except:return '127.0.0.1'
    finally:s.close()

def generate_qrs(base,slots=120):
    try: import qrcode
    except ImportError:
        print('QR package missing. Run: python -m pip install -r requirements.txt'); return
    out=ROOT/'assets/qrs'; out.mkdir(parents=True,exist_ok=True)
    for n in range(1,slots+1):
        slot=f'{n:03d}'; url=f'{base}/guest.html?slot={slot}'; qrcode.make(url).save(out/f'slot-{slot}.png')
    qrcode.make(f'{base}/share.html').save(out/'event-share.png')

if __name__=='__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('--port',type=int,default=5500); ap.add_argument('--host',default='0.0.0.0'); a=ap.parse_args()
    ip=lan_ip(); base=f'http://{ip}:{a.port}'; generate_qrs(base); os.chdir(ROOT)
    print('\nInk & Flash local site')
    print('Desktop: http://localhost:%s'%a.port)
    print('Phone:   %s'%base)
    print('QR cards and print templates now point to the phone URL above.\n')
    ThreadingHTTPServer((a.host,a.port),Handler).serve_forever()
