const filterMap={Natural:'none',Warm:'sepia(.16) saturate(1.13) contrast(1.03)',Mono:'grayscale(1) contrast(1.08)',Film:'sepia(.28) contrast(1.08) saturate(.9)',Glam:'brightness(1.08) saturate(1.12) contrast(.96)'};
const params=new URLSearchParams(location.search), slot=params.get('slot')||'001';
let settings=SSS.settings(), photos=[], selectedIndex=0, replaceIndex=null, signatureData=null, existingEntry=null;
const $=id=>document.getElementById(id);

async function readFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function activePhoto(){return photos[selectedIndex]||null}
function applyPreview(){
  const p=activePhoto(),img=$('previewImage'),empty=$('captureEmpty');
  if(!p){img.hidden=true;empty.hidden=false;img.removeAttribute('src');$('editPhotoActions').hidden=true;return;}
  img.src=p.src; img.style.filter=filterMap[p.filter]||'none';img.hidden=false;empty.hidden=true;$('editPhotoActions').hidden=false;
  document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===p.filter));
}
function renderPhotos(){
  const limit=Number(settings.photoLimit||3); $('photoCounter').textContent=photos.length?`Photo ${selectedIndex+1} of ${photos.length} saved · up to ${limit}`:`Add 1 photo · up to ${limit}`;
  $('photoThumbs').innerHTML=photos.map((p,i)=>`<button type="button" class="photo-thumb-v3 ${i===selectedIndex?'active':''}" data-i="${i}"><img src="${p.src}" style="filter:${filterMap[p.filter]||'none'}"><span>${i===0?'BOOK PHOTO':`PHOTO ${i+1}`}</span></button>`).join('');
  $('photoThumbs').querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedIndex=Number(b.dataset.i);renderPhotos();applyPreview()});
  $('addPhoto').hidden=photos.length===0||photos.length>=limit;
  $('cameraButtonText').textContent=photos.length?'Retake selected':'Take selfie';
  applyPreview();
}
async function addOrReplace(file){
  if(!file)return; const src=await readFile(file); const item={src,filter:activePhoto()?.filter||'Natural'};
  if(replaceIndex!==null && photos[replaceIndex]){photos[replaceIndex]=item;selectedIndex=replaceIndex;replaceIndex=null;}
  else if(photos.length<Number(settings.photoLimit||3)){photos.push(item);selectedIndex=photos.length-1;}
  renderPhotos();
}
function triggerNew(input){replaceIndex=null;input.value='';input.click()}
function triggerReplace(input){if(!photos.length){triggerNew(input);return}replaceIndex=selectedIndex;input.value='';input.click()}

$('selfieInput').addEventListener('change',()=>addOrReplace($('selfieInput').files?.[0]));
$('galleryInput').addEventListener('change',()=>addOrReplace($('galleryInput').files?.[0]));
$('addPhoto').onclick=()=>triggerNew($('selfieInput'));
$('retakePhoto').onclick=()=>triggerReplace($('selfieInput'));
$('removePhoto').onclick=()=>{if(!photos.length)return;photos.splice(selectedIndex,1);selectedIndex=Math.max(0,Math.min(selectedIndex,photos.length-1));renderPhotos()};

document.querySelectorAll('.guest-camera-btn').forEach(l=>l.addEventListener('click',e=>{if(e.target.tagName==='INPUT')return;if(photos.length){e.preventDefault();triggerReplace($('selfieInput'))}}));
document.querySelectorAll('.guest-upload-btn').forEach(l=>l.addEventListener('click',e=>{if(e.target.tagName==='INPUT')return;if(photos.length>=Number(settings.photoLimit||3)){e.preventDefault();SSS.toast(`Up to ${settings.photoLimit} photos for this event`)}else{replaceIndex=null}}));
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{if(!photos.length){SSS.toast('Take a photo first');return}photos[selectedIndex].filter=b.dataset.filter;renderPhotos()}));

$('signatureInput').addEventListener('change',async()=>{const f=$('signatureInput').files?.[0];if(!f)return;signatureData=await readFile(f);$('signaturePreview').src=signatureData;$('signaturePreviewWrap').hidden=false;$('removeSignature').hidden=false});
$('removeSignature').onclick=()=>{signatureData=null;$('signaturePreviewWrap').hidden=true;$('removeSignature').hidden=true;$('signatureInput').value=''};

async function filteredDataUrl(photo){
  if(!photo?.src)return null; if((photo.filter||'Natural')==='Natural' && !photo.src.startsWith('data:')) return photo.src;
  const source=new Image();source.src=photo.src;await source.decode();const max=1400,scale=Math.min(1,max/source.width),c=document.createElement('canvas');c.width=Math.round(source.width*scale);c.height=Math.round(source.height*scale);const ctx=c.getContext('2d');ctx.filter=filterMap[photo.filter]||'none';ctx.drawImage(source,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.88)
}
async function submit(){
  if(!photos.length){SSS.toast('Take at least one selfie first');return}
  const btn=$('submitGuest');btn.disabled=true;btn.textContent='Sending…';
  try{
    const selfies=[];for(const p of photos)selfies.push(await filteredDataUrl(p));
    const entry={...(existingEntry||{}),kind:'signature',slot,names:$('names').value.trim(),message:$('message').value.trim(),selfies,primarySelfie:Math.min(selectedIndex,selfies.length-1),photoFilters:photos.map(p=>p.filter),filter:photos[0]?.filter||'Natural',signature:signatureData||existingEntry?.signature||null,reviewStatus:existingEntry?.reviewStatus||'pending',submittedAt:new Date().toISOString()};
    existingEntry=await SSS.upsertEntry(entry);$('guestForm').hidden=true;$('done').hidden=false;$('donePhotos').innerHTML=selfies.map((src,i)=>`<img src="${src}" alt="Submitted photo ${i+1}">`).join('');window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){console.error(e);SSS.toast('Could not send. Try again.')}finally{btn.disabled=false;btn.textContent='Send my memory →'}
}
$('submitGuest').onclick=submit;$('editAfterSend').onclick=()=>{$('done').hidden=true;$('guestForm').hidden=false;window.scrollTo({top:0,behavior:'smooth'})};

async function init(){
  settings=await SSS.getSettings();$('slotLabel').textContent=`Spot ${slot} · ${SSS.shortCode(slot,settings)}`;$('eventName').textContent=settings.couple;$('eventDate').textContent=settings.date;
  $('filterArea').hidden=settings.filters===false;$('messageField').hidden=settings.messages===false;
  const sigOn=Boolean(settings.guestSignatureBackup);$('signatureCapture').hidden=!sigOn;$('signatureOptional').textContent='OPTIONAL BACKUP';
  const entries=await SSS.getEntries();existingEntry=entries.find(e=>e.slot===slot)||null;
  if(existingEntry?.selfies?.length){$('usedNotice').hidden=false;photos=existingEntry.selfies.map((src,i)=>({src,filter:existingEntry.photoFilters?.[i]||existingEntry.filter||'Natural'}));selectedIndex=existingEntry.primarySelfie||0;$('names').value=existingEntry.names||'';$('message').value=existingEntry.message||'';signatureData=existingEntry.signature||null;if(signatureData){$('signaturePreview').src=signatureData;$('signaturePreviewWrap').hidden=false;$('removeSignature').hidden=false;}}
  const loose=settings.signatureProduct==='cards'||(settings.signatureProduct==='print'&&['business','deck','fourbysix'].includes(settings.printFormat));$('returnCardNote').hidden=!loose;
  renderPhotos();
}
init();
