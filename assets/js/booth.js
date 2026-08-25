let stream=null,captured=null,usingFallback=true,settings=SSS.settings(),resetTimer=null,currentFilter='Glam',cameraStarting=false;
const filterMap={Natural:'none',Warm:'sepia(.16) saturate(1.18) contrast(1.03)',Mono:'grayscale(1) contrast(1.08)',Film:'sepia(.30) contrast(1.09) saturate(.88)',Glam:'brightness(1.07) saturate(1.25) contrast(1.02)'};
const themeNames={Natural:'Classic',Warm:'Golden hour',Mono:'Black & white',Film:'Disposable film',Glam:'Party glow'};
const $=id=>document.getElementById(id),video=$('boothVideo'),canvas=$('boothCanvas'),fallback=$('boothFallback'),overlay=$('boothOverlay'),countdown=$('countdown');
function filterCss(){return filterMap[currentFilter]||'none'}
function apply(){video.style.filter=filterCss();fallback.style.filter=filterCss()}
function showReady(){ $('boothReady').hidden=false; $('boothResult').hidden=true; }
function showResult(){ $('boothReady').hidden=true; $('boothResult').hidden=false; }
function hideControls(){ $('boothReady').hidden=true; $('boothResult').hidden=true; }
function digits(v){return String(v||'').replace(/\D/g,'')}
function validPhone(v){const d=digits(v);return d.length>=10&&d.length<=15}
function formatPhone(v){
  const d=digits(v).slice(0,15);
  if(d.length<=10){
    if(d.length<4)return d;
    if(d.length<7)return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
  }
  return `+${d}`;
}
async function startCamera(){
  if(cameraStarting)return;
  if(stream){
    overlay.hidden=true; usingFallback=false; video.hidden=false; fallback.hidden=true; canvas.hidden=true;
    try{await video.play()}catch{}
    return;
  }
  cameraStarting=true;
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
    video.srcObject=stream; await video.play(); usingFallback=false; video.hidden=false; fallback.hidden=true; canvas.hidden=true; overlay.hidden=true; apply();
  }catch{
    usingFallback=true; fallback.hidden=false; video.hidden=true; canvas.hidden=true; overlay.hidden=true;
    SSS.toast('Camera unavailable — using the station preview image');
  }finally{cameraStarting=false}
}
$('startBooth').onclick=startCamera;
async function tick(){
  $('boothCapture').disabled=true;
  for(let n=3;n>0;n--){countdown.hidden=false;countdown.textContent=n;await new Promise(r=>setTimeout(r,850))}
  countdown.textContent='✦';await new Promise(r=>setTimeout(r,260));countdown.hidden=true;$('boothCapture').disabled=false;
}
$('boothCapture').onclick=async()=>{
  if(!stream&&!usingFallback){await startCamera();return}
  overlay.hidden=true; await tick();
  const source=usingFallback?fallback:video,w=usingFallback?(fallback.naturalWidth||900):(video.videoWidth||900),h=usingFallback?(fallback.naturalHeight||1200):(video.videoHeight||1200);
  canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.filter=filterCss();
  if(!usingFallback){ctx.translate(w,0);ctx.scale(-1,1)}
  ctx.drawImage(source,0,0,w,h);captured=canvas.toDataURL('image/jpeg',.9);canvas.hidden=false;video.hidden=true;fallback.hidden=true;showResult()
};
function reset(){
  clearTimeout(resetTimer);captured=null;canvas.hidden=true;$('boothThanks').hidden=true;overlay.hidden=true;$('boothPhone').value='';$('boothSend').textContent='Done · next guest →';showReady();
  if(stream){usingFallback=false;video.hidden=false;fallback.hidden=true;video.play().catch(()=>{})}else{fallback.hidden=false;usingFallback=true}
}
$('boothPhone').addEventListener('input',e=>{e.target.value=formatPhone(e.target.value);$('boothSend').textContent=digits(e.target.value)?'Text it & done →':'Done · next guest →'});
$('boothPhone').addEventListener('keydown',e=>{if(e.key==='Enter'){$('boothSend').click()}});
$('boothSend').onclick=async()=>{
  if(!captured)return SSS.toast('Take a selfie first');
  const phone=$('boothPhone').value.trim();
  if(phone&&!validPhone(phone))return SSS.toast('Enter a full mobile number or leave it blank');
  const entries=await SSS.getEntries();const slot=SSS.nextGallerySlot(entries);
  await SSS.upsertEntry({kind:'gallery',slot,names:'Selfie Station',message:'',selfies:[captured],primarySelfie:0,filter:currentFilter,phone,albumOptIn:Boolean(phone)&&settings.smsAlbum!==false,source:'kiosk',reviewStatus:settings.wallModeration?'pending':'approved'});
  canvas.hidden=true;hideControls();$('boothThanks').hidden=false;
  const local=location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.protocol==='file:'||location.hostname.endsWith('github.io');
  if(phone){
    $('boothThanksText').textContent=local?'Saved. Texting turns on with the production backend. Next guest, you’re up.': 'Saved. Check your phone. Next guest, you’re up.';
  }else{
    $('boothThanksText').textContent='Saved to the event. Next guest, you’re up.';
  }
  resetTimer=setTimeout(reset,1900)
};
(async()=>{
  settings=await SSS.getSettings();currentFilter=settings.kioskLook||'Glam';if(!filterMap[currentFilter])currentFilter='Glam';
  $('boothThemeName').textContent=themeNames[currentFilter]||'Party glow';
  $('boothPhoneHelp').textContent=settings.smsAlbum!==false?"Optional — enter it to get this selfie now and the event album when it’s published.":"Optional — enter it if you want this selfie texted to you.";
  const preview=location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.protocol==='file:'||location.hostname.endsWith('github.io');
  if(preview)$('localSmsBadge').hidden=false;
  apply();showReady();
  // Kiosk setup should already have camera permission. Start immediately so guests only see selfie → phone number → done.
  await startCamera();
})();
