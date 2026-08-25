let allEntries=[],signatureEntries=[],eventEntries=[],entries=[],index=0,settings={};
let bookOpts={size:'10',cover:'linen',theme:'classic',layout:'signature',includeMessage:true,includeExtras:true,includeEventPhotos:true,eventPhotoPlacement:'interleave'};
const $=id=>document.getElementById(id);
const coverStyles={linen:'linear-gradient(135deg,#d8d2c8,#f7f3eb)',leather:'linear-gradient(135deg,#3b2922,#76503c)',photo:'url(assets/img/party-selfie-1.jpg) center/cover',velvet:'linear-gradient(135deg,#29152f,#7b3c72)'};
function esc(v){return SSS.escapeHtml(v||'')}
function isGallery(e){return SSS.isGallery(e)}
function sourceName(e){return e.source==='kiosk'?'Flash Station':'Flash Share'}
function composeEntries(){
  if(!bookOpts.includeEventPhotos){entries=[...signatureEntries];return}
  if(bookOpts.eventPhotoPlacement==='after'){entries=[...signatureEntries,...eventEntries];return}
  const out=[],gallery=[...eventEntries];let g=0;
  signatureEntries.forEach((e,i)=>{out.push(e);if((i+1)%3===0&&g<gallery.length)out.push(gallery[g++])});
  while(g<gallery.length)out.push(gallery[g++]);
  entries=out;
}
function signatureSpread(e){
 const photo=SSS.primaryPhoto(e),photos=(e.selfies||[]).slice(0,bookOpts.includeExtras?3:1),msg=bookOpts.includeMessage&&e.message?`<p class="book-message">“${esc(e.message)}”</p>`:'',sig=e.signature?`<img class="book-signature" src="${e.signature}" alt="Signature">`:`<div class="book-signature-missing">Signature pending</div>`;
 if(bookOpts.layout==='card')return `<div class="spread theme-${bookOpts.theme} layout-card"><div class="book-page photo-page"><img class="book-photo" src="${photo||''}" alt="${esc(e.names||'Guest')}"></div><div class="book-page card-page"><p class="eyebrow">MEMORY ${esc(e.slot)}</p><h2 class="book-name">${esc(e.names||'Our people')}</h2><div class="full-card-art">${e.signature?`<img src="${e.signature}" alt="Signed card">`:'<span>Signed card not captured</span>'}</div>${msg}</div></div>`;
 if(bookOpts.layout==='full')return `<div class="spread theme-${bookOpts.theme} layout-full"><div class="book-page full-photo-page"><img class="book-photo" src="${photo||''}" alt="${esc(e.names||'Guest')}"><div class="full-photo-copy"><p class="eyebrow">${esc(e.names||'Our people')}</p>${msg}${sig}</div></div><div class="book-page quote-page"><span class="book-quote-mark">“</span><h2>${esc(e.names||'A favorite moment')}</h2><p>Captured at ${esc(settings.couple||'the event')}.</p></div></div>`;
 if(bookOpts.layout==='gallery'){const imgs=photos.length?photos:[photo].filter(Boolean);return `<div class="spread theme-${bookOpts.theme} layout-gallery"><div class="book-page gallery-page"><div class="gallery-book-grid count-${Math.min(imgs.length,3)}">${imgs.slice(0,3).map(x=>`<img src="${x}" alt="Guest photo">`).join('')}</div></div><div class="book-page"><p class="eyebrow">MEMORY ${esc(e.slot)}</p><h2 class="book-name">${esc(e.names||'Our people')}</h2>${msg}${sig}</div></div>`}
 return `<div class="spread theme-${bookOpts.theme} layout-signature"><div class="book-page photo-page"><img class="book-photo" src="${photo||''}" alt="${esc(e.names||'Guest')}"></div><div class="book-page"><p class="eyebrow">MEMORY ${esc(e.slot)}</p><h2 class="book-name">${esc(e.names||'Our people')}</h2>${msg}${sig}</div></div>`;
}
function eventPhotoSpread(e){
 const photos=(e.selfies||[]).filter(Boolean).slice(0,4),src=sourceName(e),sourceClass=e.source==='kiosk'?'kiosk':'share';
 const title=esc(e.names|| (e.source==='kiosk'?'Flash Station':'From everyone’s point of view'));
 const msg=e.message?`<p>“${esc(e.message)}”</p>`:'';
 return `<div class="spread theme-${bookOpts.theme} layout-event-gallery"><div class="book-page event-gallery-page"><div class="gallery-book-grid count-${Math.max(1,photos.length)}">${photos.map(x=>`<img src="${x}" alt="Event photo">`).join('')}</div></div><div class="book-page event-gallery-copy"><span class="gallery-source-badge ${sourceClass}">${src}</span><span class="event-photo-label">EVENT PHOTO</span><h2>${title}</h2>${msg}<small>${photos.length} ${photos.length===1?'photo':'photos'} from ${src}</small></div></div>`;
}
function entrySpread(e){return isGallery(e)?eventPhotoSpread(e):signatureSpread(e)}
function coverSpread(){const title=esc($('coverTitle').value||settings.title||settings.couple),sub=esc($('coverSubtitle').value||'');return `<div class="spread print-cover theme-${bookOpts.theme}"><div class="book-page cover-page-inner" style="background:${coverStyles[bookOpts.cover]}"><span>INK & FLASH</span><h1>${title}</h1><p>${sub}</p><small>Sign. Selfie. Send.</small></div><div class="book-page inside-cover"><span>${esc(settings.couple||'')}</span></div></div>`}
function renderFilmstrip(){const el=$('bookFilmstrip');el.innerHTML=entries.map((e,i)=>{const gallery=isGallery(e);return `<button class="filmstrip-memory ${gallery?'gallery-memory':''} ${i===index?'active':''}" data-index="${i}"><img src="${SSS.primaryPhoto(e)||''}" alt=""><span><b><i class="kind-dot"></i>${esc(e.names||(gallery?sourceName(e):`Spot ${e.slot}`))}</b><small>${gallery?sourceName(e):`Signature spot ${esc(e.slot)}`}</small></span></button>`}).join('');el.querySelectorAll('button').forEach(b=>b.onclick=()=>{index=Number(b.dataset.index);show()})}
function renderCover(){const sw=$('coverSwatch');sw.style.background=coverStyles[bookOpts.cover]||coverStyles.linen;sw.style.color=['leather','velvet','photo'].includes(bookOpts.cover)?'#fff':'#211b23';sw.querySelector('b').textContent=($('coverTitle').value||settings.title||settings.couple||'Our Guest Book').toUpperCase();sw.querySelector('small').textContent=$('coverSubtitle').value||''}
function renderPrintBook(){$('printBookPages').innerHTML=coverSpread()+entries.map(entrySpread).join('')}
function updateCounts(){$('memoryCount').textContent=entries.length}
function show(){
 composeEntries();updateCounts();
 if(!entries.length){$('stage').innerHTML='<div class="empty">No approved memories yet.<br><br><a class="btn" href="review.html">Review & approve entries</a></div>';$('counter').textContent='0 / 0';$('bookFilmstrip').innerHTML='';renderCover();renderPrintBook();return}
 if(index>=entries.length)index=Math.max(0,entries.length-1);
 $('counter').textContent=`${index+1} / ${entries.length}`;$('stage').dataset.size=bookOpts.size;$('stage').dataset.layout=isGallery(entries[index])?'event-gallery':bookOpts.layout;$('stage').dataset.theme=bookOpts.theme;$('stage').innerHTML=entrySpread(entries[index]);renderFilmstrip();renderCover();renderPrintBook()
}
function activateOption(group,value){if(!value)return;const wrap=document.querySelector(`[data-option-group="${group}"]`);const btn=wrap?.querySelector(`[data-value="${CSS.escape(value)}"]`);if(!btn)return;wrap.querySelectorAll('button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');bookOpts[group]=value}
function applyUrlOptions(){const q=new URLSearchParams(location.search);activateOption('theme',q.get('theme'));activateOption('cover',q.get('cover'));activateOption('size',q.get('size'));activateOption('layout',q.get('layout'))}
async function load(){
 settings=await SSS.getSettings();$('coverTitle').value=settings.title||settings.couple||'Our Guest Book';$('coverSubtitle').placeholder=`${settings.couple||'Your event'} · ${settings.date||''}`;
 allEntries=await SSS.getEntries();
 signatureEntries=allEntries.filter(e=>SSS.isSignature(e)&&e.selfies?.length&&!e.hiddenFromBook&&e.reviewStatus==='approved').sort((a,b)=>a.slot.localeCompare(b.slot));
 eventEntries=allEntries.filter(e=>SSS.isGallery(e)&&e.selfies?.length&&!e.hiddenFromBook&&e.reviewStatus==='approved').sort((a,b)=>(a.createdAt||a.submittedAt||'').localeCompare(b.createdAt||b.submittedAt||''));
 applyUrlOptions();show()
}
$('prev').onclick=()=>{if(entries.length){index=(index-1+entries.length)%entries.length;show()}};$('next').onclick=()=>{if(entries.length){index=(index+1)%entries.length;show()}};
$('printBook').onclick=()=>{renderPrintBook();window.print()};
$('autoBuild').onclick=()=>{bookOpts.layout='signature';bookOpts.includeEventPhotos=true;bookOpts.eventPhotoPlacement='interleave';$('includeEventPhotos').checked=true;$('eventPhotoPlacement').value='interleave';document.querySelectorAll('[data-option-group="layout"] button').forEach(b=>b.classList.toggle('active',b.dataset.value==='signature'));index=0;show();SSS.toast('Book rebuilt from approved memories')};
$('orderBook').onclick=()=>SSS.toast('Printed-book checkout will open here');
['coverTitle','coverSubtitle'].forEach(id=>$(id).addEventListener('input',()=>{renderCover();renderPrintBook()}));
$('includeMessage').onchange=()=>{bookOpts.includeMessage=$('includeMessage').checked;show()};
$('includeExtras').onchange=()=>{bookOpts.includeExtras=$('includeExtras').checked;show()};
$('includeEventPhotos').onchange=()=>{bookOpts.includeEventPhotos=$('includeEventPhotos').checked;index=0;show()};
$('eventPhotoPlacement').onchange=()=>{bookOpts.eventPhotoPlacement=$('eventPhotoPlacement').value;index=0;show()};
document.querySelectorAll('[data-option-group]').forEach(group=>group.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;group.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');bookOpts[group.dataset.optionGroup]=b.dataset.value;show()}));
load();
