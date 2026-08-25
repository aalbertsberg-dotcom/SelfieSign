let stream=null,captured=null,settings=SSS.settings(),resetTimer=null,currentFilter='Glam',cameraStarting=false,cameraReady=false;
const filterMap={Natural:'none',Warm:'sepia(.16) saturate(1.18) contrast(1.03)',Mono:'grayscale(1) contrast(1.08)',Film:'sepia(.30) contrast(1.09) saturate(.88)',Glam:'brightness(1.07) saturate(1.25) contrast(1.02)'};
const themeNames={Natural:'Classic',Warm:'Golden hour',Mono:'Black & white',Film:'Disposable film',Glam:'Party glow'};
const $=id=>document.getElementById(id),video=$('boothVideo'),canvas=$('boothCanvas'),gate=$('cameraGate'),countdown=$('countdown');
function filterCss(){return filterMap[currentFilter]||'none'}
function apply(){video.style.filter=filterCss()}
function showReady(){$('boothReady').hidden=false;$('boothResult').hidden=true}
function showResult(){$('boothReady').hidden=true;$('boothResult').hidden=false}
function hideControls(){$('boothReady').hidden=true;$('boothResult').hidden=true}
function digits(v){return String(v||'').replace(/\D/g,'')}
function validPhone(v){const d=digits(v);return d.length>=10&&d.length<=15}
function formatPhone(v){const d=digits(v).slice(0,15);if(d.length<=10){if(d.length<4)return d;if(d.length<7)return `(${d.slice(0,3)}) ${d.slice(3)}`;return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`}return `+${d}`}
function cameraMessage(title,copy,button=false){
  $('cameraGateTitle').textContent=title;$('cameraGateCopy').textContent=copy;$('startBooth').hidden=!button;gate.hidden=false;
}
function cameraLive(){cameraReady=true;gate.hidden=true;video.hidden=false;canvas.hidden=true;$('boothCapture').disabled=false;$('cameraStatus').textContent='Tap when you’re ready.'}
async function startCamera(){
  if(cameraStarting)return;
  if(!navigator.mediaDevices?.getUserMedia){cameraMessage('Camera not supported','Open Flash Station in a current browser on HTTPS, localhost, or a tablet with camera access.');$('cameraStatus').textContent='Camera unavailable';return}
  if(stream){try{await video.play()}catch{} cameraLive();return}
  cameraStarting=true;$('boothCapture').disabled=true;$('cameraStatus').textContent='Starting camera…';cameraMessage('Starting camera…','Allow camera access when your browser asks.');
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:1920},height:{ideal:1440},aspectRatio:{ideal:4/3}},audio:false});
    video.srcObject=stream;
    await new Promise((resolve,reject)=>{if(video.readyState>=2)return resolve();const timer=setTimeout(resolve,2500);video.onloadedmetadata=()=>{clearTimeout(timer);resolve()};video.onerror=e=>{clearTimeout(timer);reject(e)}});
    await video.play();apply();cameraLive();
  }catch(err){
    cameraReady=false;video.hidden=true;$('boothCapture').disabled=true;$('cameraStatus').textContent='Camera permission needed';
    const denied=err?.name==='NotAllowedError'||err?.name==='SecurityError';
    cameraMessage(denied?'Camera access is blocked':'Camera unavailable',denied?'Allow camera access for this site in your browser settings, then try again.':'Make sure a camera is connected and not being used by another app, then try again.',true);
  }finally{cameraStarting=false}
}
$('startBooth').onclick=startCamera;
async function tick(){
  if(!cameraReady)return;
  $('boothCapture').disabled=true;
  for(let n=3;n>0;n--){countdown.hidden=false;countdown.textContent=n;await new Promise(r=>setTimeout(r,700))}
  countdown.textContent='✦';await new Promise(r=>setTimeout(r,180));countdown.hidden=true;
}
$('boothCapture').onclick=async()=>{
  if(!cameraReady){await startCamera();return}
  await tick();
  const vw=video.videoWidth||1280,vh=video.videoHeight||960;
  canvas.width=vw;canvas.height=vh;
  const ctx=canvas.getContext('2d');ctx.save();ctx.filter=filterCss();ctx.translate(vw,0);ctx.scale(-1,1);ctx.drawImage(video,0,0,vw,vh);ctx.restore();
  captured=canvas.toDataURL('image/jpeg',.9);canvas.hidden=false;video.hidden=true;showResult();$('boothCapture').disabled=false;
};
function reset(){
  clearTimeout(resetTimer);captured=null;canvas.hidden=true;$('boothThanks').hidden=true;$('boothPhone').value='';$('boothSend').textContent='Done · next guest →';showReady();
  if(stream){video.hidden=false;video.play().then(cameraLive).catch(()=>startCamera())}else startCamera();
}
$('boothPhone').addEventListener('input',e=>{e.target.value=formatPhone(e.target.value);$('boothSend').textContent=digits(e.target.value)?'Text it & done →':'Done · next guest →'});
$('boothPhone').addEventListener('keydown',e=>{if(e.key==='Enter')$('boothSend').click()});
$('boothSend').onclick=async()=>{
  if(!captured)return SSS.toast('Take a selfie first');
  const phone=$('boothPhone').value.trim();if(phone&&!validPhone(phone))return SSS.toast('Enter a full mobile number or leave it blank');
  const entries=await SSS.getEntries(),slot=SSS.nextGallerySlot(entries);
  await SSS.upsertEntry({kind:'gallery',slot,names:'Flash Station',message:'',selfies:[captured],primarySelfie:0,filter:currentFilter,phone,albumOptIn:Boolean(phone)&&settings.smsAlbum!==false,source:'kiosk',reviewStatus:settings.wallModeration?'pending':'approved'});
  canvas.hidden=true;hideControls();$('boothThanks').hidden=false;
  $('boothThanksText').textContent=phone?'Saved. Your copy will be sent when photo delivery is connected. Next guest, you’re up.':'Saved to the event. Next guest, you’re up.';
  resetTimer=setTimeout(reset,1700);
};
window.addEventListener('pagehide',()=>{stream?.getTracks?.().forEach(t=>t.stop())});
(async()=>{
  settings=await SSS.getSettings();currentFilter=settings.kioskLook||'Glam';if(!filterMap[currentFilter])currentFilter='Glam';
  $('boothThemeName').textContent=themeNames[currentFilter]||'Party glow';
  $('boothPhoneHelp').textContent=settings.smsAlbum!==false?'Optional — enter it to receive this photo and, when enabled, the event album link.':'Optional — enter it if you want this photo sent to you.';
  apply();showReady();await startCamera();
})();
