let allEntries=[],signatureEntries=[],eventEntries=[],entries=[],settings={};
let currentIndex=-1; // -1 = cover
let pageLayouts={};
const $=id=>document.getElementById(id);
const productCatalog={
  hardcover:{label:'Hardcover',help:'Versatile and durable',sizes:['8×8','8×11','10×10','11×8','12×12'],covers:['Matte photo cover','Glossy photo cover','Linen cover'],pages:['Premium matte','Lustre photo','Heavy uncoated']},
  layflat:{label:'Layflat',help:'Pages open nearly flat for wide spreads',sizes:['8×8','10×10','12×12'],covers:['Matte hardcover','Glossy hardcover','Linen cover'],pages:['Layflat matte','Layflat lustre']},
  premium:{label:'Premium Layflat',help:'Thicker pages and premium cover choices',sizes:['10×10','12×12'],covers:['Premium linen','Premium leather','Velvet','Photo wrap'],pages:['Deluxe layflat matte','Deluxe layflat lustre']},
  softcover:{label:'Softcover',help:'A lighter, flexible extra copy',sizes:['8×8','8×11','10×10'],covers:['Softcover matte','Softcover glossy'],pages:['Premium matte','Lustre photo']}
};
let bookOpts={product:'hardcover',size:'10×10',cover:'Matte photo cover',pageType:'Premium matte',theme:'classic',includeMessage:true,includeExtras:true,includeEventPhotos:true,eventPhotoPlacement:'interleave'};
const coverStyles={
 'Matte photo cover':'url(assets/img/party-selfie-1.jpg) center/cover','Glossy photo cover':'url(assets/img/party-selfie-1.jpg) center/cover','Photo wrap':'url(assets/img/party-selfie-1.jpg) center/cover',
 'Linen cover':'linear-gradient(135deg,#d8d2c8,#f7f3eb)','Premium linen':'linear-gradient(135deg,#cfc7b9,#f6efe4)','Premium leather':'linear-gradient(135deg,#3b2922,#76503c)','Velvet':'linear-gradient(135deg,#29152f,#7b3c72)',
 'Matte hardcover':'linear-gradient(135deg,#ebe7e0,#faf8f3)','Glossy hardcover':'linear-gradient(135deg,#f6f2ed,#fff)','Softcover matte':'linear-gradient(135deg,#ded9d2,#f9f6f0)','Softcover glossy':'linear-gradient(135deg,#f1ece6,#fff)'
};
function esc(v){return SSS.escapeHtml(v||'')}
function isGallery(e){return SSS.isGallery(e)}
function sourceName(e){return e.source==='kiosk'?'Flash Station':'Flash Share'}
function layoutFor(e){return pageLayouts[e.slot]||'signature'}
function composeEntries(){
  if(!bookOpts.includeEventPhotos){entries=[...signatureEntries];return}
  if(bookOpts.eventPhotoPlacement==='after'){entries=[...signatureEntries,...eventEntries];return}
  const out=[],gallery=[...eventEntries];let g=0;
  signatureEntries.forEach((e,i)=>{out.push(e);if((i+1)%3===0&&g<gallery.length)out.push(gallery[g++])});
  while(g<gallery.length)out.push(gallery[g++]);entries=out;
}
function signatureSpread(e,forceLayout){
 const layout=forceLayout||layoutFor(e),photo=SSS.primaryPhoto(e),photos=(e.selfies||[]).slice(0,bookOpts.includeExtras?3:1),msg=bookOpts.includeMessage&&e.message?`<p class="book-message">“${esc(e.message)}”</p>`:'',sig=e.signature?`<img class="book-signature" src="${e.signature}" alt="Signature">`:`<div class="book-signature-missing">Signature pending</div>`;
 if(layout==='card')return `<div class="spread theme-${bookOpts.theme} layout-card"><div class="book-page photo-page"><img class="book-photo" src="${photo||''}" alt="${esc(e.names||'Guest')}"></div><div class="book-page card-page"><p class="eyebrow">MEMORY ${esc(e.slot)}</p><h2 class="book-name">${esc(e.names||'Our people')}</h2><div class="full-card-art">${e.signature?`<img src="${e.signature}" alt="Signed card">`:'<span>Signed card not captured</span>'}</div>${msg}</div></div>`;
 if(layout==='full')return `<div class="spread theme-${bookOpts.theme} layout-full"><div class="book-page full-photo-page"><img class="book-photo" src="${photo||''}" alt="${esc(e.names||'Guest')}"><div class="full-photo-copy"><p class="eyebrow">${esc(e.names||'Our people')}</p>${msg}${sig}</div></div><div class="book-page quote-page"><span class="book-quote-mark">“</span><h2>${esc(e.names||'A favorite moment')}</h2><p>${esc(settings.couple||'Your event')}</p></div></div>`;
 if(layout==='gallery'){const imgs=photos.length?photos:[photo].filter(Boolean);return `<div class="spread theme-${bookOpts.theme} layout-gallery"><div class="book-page gallery-page"><div class="gallery-book-grid count-${Math.min(imgs.length,3)}">${imgs.slice(0,3).map(x=>`<img src="${x}" alt="Guest photo">`).join('')}</div></div><div class="book-page"><p class="eyebrow">MEMORY ${esc(e.slot)}</p><h2 class="book-name">${esc(e.names||'Our people')}</h2>${msg}${sig}</div></div>`}
 return `<div class="spread theme-${bookOpts.theme} layout-signature"><div class="book-page photo-page"><img class="book-photo" src="${photo||''}" alt="${esc(e.names||'Guest')}"></div><div class="book-page"><p class="eyebrow">MEMORY ${esc(e.slot)}</p><h2 class="book-name">${esc(e.names||'Our people')}</h2>${msg}${sig}</div></div>`;
}
function eventPhotoSpread(e){
 const photos=(e.selfies||[]).filter(Boolean).slice(0,4),src=sourceName(e),sourceClass=e.source==='kiosk'?'kiosk':'share',title=esc(e.names||(e.source==='kiosk'?'Flash Station':'From everyone’s point of view')),msg=e.message?`<p>“${esc(e.message)}”</p>`:'';
 return `<div class="spread theme-${bookOpts.theme} layout-event-gallery"><div class="book-page event-gallery-page"><div class="gallery-book-grid count-${Math.max(1,photos.length)}">${photos.map(x=>`<img src="${x}" alt="Event photo">`).join('')}</div></div><div class="book-page event-gallery-copy"><span class="gallery-source-badge ${sourceClass}">${src}</span><span class="event-photo-label">EVENT PHOTO</span><h2>${title}</h2>${msg}<small>${photos.length} ${photos.length===1?'photo':'photos'} from ${src}</small></div></div>`;
}
function entrySpread(e){return isGallery(e)?eventPhotoSpread(e):signatureSpread(e)}
function coverBackground(){return coverStyles[bookOpts.cover]||coverStyles['Matte photo cover']}
function coverSpread(){const title=esc($('coverTitle').value||settings.title||settings.couple),sub=esc($('coverSubtitle').value||'');return `<div class="spread print-cover theme-${bookOpts.theme}"><div class="book-page cover-page-inner" style="background:${coverBackground()}"><span>INK & FLASH</span><h1>${title}</h1><p>${sub}</p><small>Sign. Selfie. Send.</small></div><div class="book-page inside-cover"><span>${esc(settings.couple||'')}</span></div></div>`}
function coverStage(){const ink=/photo|leather|velvet/i.test(bookOpts.cover)?'#fff':'#211b23';return `<div class="book-object-preview product-${bookOpts.product}"><div class="book-object-shadow"></div><div class="book-object-cover" style="background:${coverBackground()};color:${ink}"><span>INK & FLASH</span><h2>${esc($('coverTitle').value||settings.title||settings.couple||'Our Guest Book')}</h2><p>${esc($('coverSubtitle').value||'')}</p><small>${productCatalog[bookOpts.product].label} · ${esc(bookOpts.size)}</small></div><div class="book-object-pages"></div></div>`}
function renderFilmstrip(){
 const el=$('bookFilmstrip');let html=`<button class="filmstrip-memory cover-memory ${currentIndex===-1?'active':''}" data-index="-1"><span class="cover-thumb" style="background:${coverBackground()}">IF</span><span><b>Front cover</b><small>${esc(productCatalog[bookOpts.product].label)} · ${esc(bookOpts.size)}</small></span></button>`;
 html+=entries.map((e,i)=>{const gallery=isGallery(e);return `<button class="filmstrip-memory ${gallery?'gallery-memory':''} ${i===currentIndex?'active':''}" data-index="${i}"><img src="${SSS.primaryPhoto(e)||''}" alt=""><span><b><i class="kind-dot"></i>${esc(e.names||(gallery?sourceName(e):`Spot ${e.slot}`))}</b><small>${gallery?sourceName(e):`Signature spot ${esc(e.slot)}`}</small></span></button>`}).join('');
 el.innerHTML=html;el.querySelectorAll('button').forEach(b=>b.onclick=()=>{currentIndex=Number(b.dataset.index);show()})
}
function renderCover(){const sw=$('coverSwatch');sw.style.background=coverBackground();sw.style.color=/leather|velvet|photo/i.test(bookOpts.cover)?'#fff':'#211b23';sw.querySelector('b').textContent=($('coverTitle').value||settings.title||settings.couple||'Our Guest Book').toUpperCase();sw.querySelector('small').textContent=$('coverSubtitle').value||''}
function renderPrintBook(){$('printBookPages').innerHTML=coverSpread()+entries.map(entrySpread).join('')}
function updateSummary(){
 const copies=$('copies').value,pageCount=$('pageCount').value;
 $('summaryProduct').textContent=`${productCatalog[bookOpts.product].label} · ${bookOpts.size}`;
 $('summaryDetails').textContent=`${bookOpts.cover} · ${bookOpts.pageType} · ${pageCount} pages · ${copies} ${Number(copies)===1?'copy':'copies'}`;
}
function updateLayoutControls(){
 const sec=$('spreadLayoutSection'),help=$('spreadLayoutHelp');
 if(currentIndex<0||!entries[currentIndex]||isGallery(entries[currentIndex])){sec.classList.add('disabled-section');help.textContent=currentIndex<0?'Choose a memory page to change its layout':'Event photo spread uses a gallery layout';return}
 sec.classList.remove('disabled-section');help.textContent='Change only this memory';const active=layoutFor(entries[currentIndex]);sec.querySelectorAll('.layout-choice').forEach(b=>b.classList.toggle('active',b.dataset.value===active));
}
function show(){
 composeEntries();$('memoryCount').textContent=entries.length;
 if(currentIndex>=entries.length)currentIndex=entries.length-1;
 if(currentIndex<-1)currentIndex=-1;
 if(currentIndex===-1){$('counter').textContent='Cover';$('currentPageType').textContent='Front cover';$('stage').dataset.size=bookOpts.size.replace('×','x');$('stage').dataset.theme=bookOpts.theme;$('stage').innerHTML=coverStage();}
 else if(entries[currentIndex]){const e=entries[currentIndex];$('counter').textContent=`${currentIndex+1} / ${entries.length}`;$('currentPageType').textContent=isGallery(e)?sourceName(e):`${e.names||`Spot ${e.slot}`} · ${layoutFor(e).replace(/-/g,' ')}`;$('stage').dataset.size=bookOpts.size.replace('×','x');$('stage').dataset.layout=isGallery(e)?'event-gallery':layoutFor(e);$('stage').dataset.theme=bookOpts.theme;$('stage').innerHTML=entrySpread(e);}
 renderFilmstrip();renderCover();renderPrintBook();updateLayoutControls();updateSummary();
}
function fillSelect(el,values,selected){el.innerHTML=values.map(v=>`<option ${v===selected?'selected':''}>${esc(v)}</option>`).join('')}
function setProduct(product,keep=false){
 if(!productCatalog[product])product='hardcover';bookOpts.product=product;const p=productCatalog[product];
 $('productHelp').textContent=`${p.label} · ${p.help}`;document.querySelectorAll('[data-option-group="product"] .book-product-tab').forEach(b=>b.classList.toggle('active',b.dataset.value===product));
 const size=keep&&p.sizes.includes(bookOpts.size)?bookOpts.size:(p.sizes.includes(bookOpts.size)?bookOpts.size:p.sizes[Math.min(2,p.sizes.length-1)]);
 const cover=keep&&p.covers.includes(bookOpts.cover)?bookOpts.cover:p.covers[0];const page=keep&&p.pages.includes(bookOpts.pageType)?bookOpts.pageType:p.pages[0];
 bookOpts.size=size;bookOpts.cover=cover;bookOpts.pageType=page;fillSelect($('bookSize'),p.sizes,size);fillSelect($('bookCover'),p.covers,cover);fillSelect($('pageType'),p.pages,page);show();
}
function applyUrlOptions(){
 const q=new URLSearchParams(location.search),product=q.get('product'),theme=q.get('theme'),size=q.get('size'),cover=q.get('cover');
 if(product&&productCatalog[product])bookOpts.product=product;if(theme&&['classic','modern','editorial','film'].includes(theme))bookOpts.theme=theme;
 setProduct(bookOpts.product,true);if(size&&productCatalog[bookOpts.product].sizes.includes(size)){bookOpts.size=size;$('bookSize').value=size}if(cover&&productCatalog[bookOpts.product].covers.includes(cover)){bookOpts.cover=cover;$('bookCover').value=cover}
 document.querySelectorAll('[data-option-group="theme"] .style-choice').forEach(b=>b.classList.toggle('active',b.dataset.value===bookOpts.theme));show();
}
function buildOrderSummary(){
 const signatureCount=signatureEntries.length,eventCount=bookOpts.includeEventPhotos?eventEntries.length:0;
 return `<div><span>Book</span><b>${esc(productCatalog[bookOpts.product].label)} · ${esc(bookOpts.size)}</b></div><div><span>Cover</span><b>${esc(bookOpts.cover)}</b></div><div><span>Pages</span><b>${esc(bookOpts.pageType)} · ${esc($('pageCount').value)} pages</b></div><div><span>Design</span><b>${esc(bookOpts.theme[0].toUpperCase()+bookOpts.theme.slice(1))}</b></div><div><span>Memories</span><b>${signatureCount} matched ${signatureCount===1?'memory':'memories'} + ${eventCount} event ${eventCount===1?'spread':'spreads'}</b></div><div><span>Copies</span><b>${esc($('copies').value)}</b></div>`;
}
function openOrder(){ $('orderSummary').innerHTML=buildOrderSummary();$('orderModal').hidden=false;document.body.classList.add('modal-open') }
function closeOrder(){ $('orderModal').hidden=true;document.body.classList.remove('modal-open') }
async function load(){
 settings=await SSS.getSettings();$('coverTitle').value=settings.title||settings.couple||'Our Guest Book';$('coverSubtitle').placeholder=`${settings.couple||'Your event'} · ${settings.date||''}`;
 allEntries=await SSS.getEntries();signatureEntries=allEntries.filter(e=>SSS.isSignature(e)&&e.selfies?.length&&!e.hiddenFromBook&&e.reviewStatus==='approved').sort((a,b)=>a.slot.localeCompare(b.slot));eventEntries=allEntries.filter(e=>SSS.isGallery(e)&&e.selfies?.length&&!e.hiddenFromBook&&e.reviewStatus==='approved').sort((a,b)=>(a.createdAt||a.submittedAt||'').localeCompare(b.createdAt||b.submittedAt||''));
 signatureEntries.forEach(e=>{if(!pageLayouts[e.slot])pageLayouts[e.slot]='signature'});applyUrlOptions();show();
}
$('prev').onclick=()=>{composeEntries();if(currentIndex===-1)currentIndex=entries.length?entries.length-1:-1;else currentIndex--;show()};
$('next').onclick=()=>{composeEntries();if(!entries.length){currentIndex=-1}else if(currentIndex===entries.length-1)currentIndex=-1;else currentIndex++;show()};
$('printBook').onclick=()=>{renderPrintBook();window.print()};
$('autoBuild').onclick=()=>{signatureEntries.forEach(e=>pageLayouts[e.slot]='signature');bookOpts.includeEventPhotos=true;bookOpts.eventPhotoPlacement='interleave';$('includeEventPhotos').checked=true;$('eventPhotoPlacement').value='interleave';currentIndex=signatureEntries.length?0:-1;show();SSS.toast('Book layout refreshed')};
['coverTitle','coverSubtitle'].forEach(id=>$(id).addEventListener('input',show));
$('includeMessage').onchange=()=>{bookOpts.includeMessage=$('includeMessage').checked;show()};$('includeExtras').onchange=()=>{bookOpts.includeExtras=$('includeExtras').checked;show()};$('includeEventPhotos').onchange=()=>{bookOpts.includeEventPhotos=$('includeEventPhotos').checked;currentIndex=-1;show()};$('eventPhotoPlacement').onchange=()=>{bookOpts.eventPhotoPlacement=$('eventPhotoPlacement').value;currentIndex=-1;show()};
$('bookSize').onchange=()=>{bookOpts.size=$('bookSize').value;show()};$('bookCover').onchange=()=>{bookOpts.cover=$('bookCover').value;show()};$('pageType').onchange=()=>{bookOpts.pageType=$('pageType').value;show()};$('copies').onchange=updateSummary;$('pageCount').onchange=updateSummary;
document.querySelector('[data-option-group="product"]').addEventListener('click',e=>{const b=e.target.closest('button[data-value]');if(b)setProduct(b.dataset.value)});
document.querySelector('[data-option-group="theme"]').addEventListener('click',e=>{const b=e.target.closest('button[data-value]');if(!b)return;bookOpts.theme=b.dataset.value;document.querySelectorAll('[data-option-group="theme"] .style-choice').forEach(x=>x.classList.toggle('active',x===b));show()});
document.querySelector('[data-option-group="layout"]').addEventListener('click',e=>{const b=e.target.closest('button[data-value]');if(!b||currentIndex<0||!entries[currentIndex]||isGallery(entries[currentIndex]))return;pageLayouts[entries[currentIndex].slot]=b.dataset.value;show()});
$('orderBook').onclick=openOrder;$('reviewOrderBottom').onclick=openOrder;$('closeOrder').onclick=closeOrder;$('backToEdit').onclick=closeOrder;$('orderModal').addEventListener('click',e=>{if(e.target===$('orderModal'))closeOrder()});
$('continueCheckout').onclick=()=>SSS.toast('Checkout will connect to the print-fulfillment backend');
load();
