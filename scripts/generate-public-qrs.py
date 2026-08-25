from pathlib import Path
import qrcode
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'qrs'; OUT.mkdir(parents=True,exist_ok=True)
BASE='https://aalbertsberg-dotcom.github.io/SelfieSign'
for n in range(1,121):
    slot=f'{n:03d}'
    qrcode.make(f'{BASE}/guest.html?event=demo&slot={slot}').save(OUT/f'slot-{slot}.png')
qrcode.make(f'{BASE}/share.html?event=demo').save(OUT/'event-share.png')
print(f'Public QR codes now point to {BASE}')
