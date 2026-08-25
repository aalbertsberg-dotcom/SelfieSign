let stream=null,captured=null,settings=SSS.settings(),resetTimer=null,currentFilter='Glam',cameraStarting=false,cameraReady=false;
let cameraDevices=[],activeCameraId=null,lastCameraError=null;
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
function stopStream(){if(stream){stream.getTracks?.().forEach(t=>t.stop());stream=null}cameraReady=false;activeCameraId=null}
function cameraMessage(title,copy,button=false,buttonText='Try camera again'){
  $('cameraGateTitle').textContent=title;$('cameraGateCopy').textContent=copy;$('startBooth').hidden=!button;$('startBooth').textContent=buttonText;gate.hidden=false;
}
function cameraLive(){cameraReady=true;gate.hidden=true;video.hidden=false;canvas.hidden=true;$('boothCapture').disabled=false;$('cameraStatus').textContent='Tap when you’re ready.';updateCameraSwitch()}
function explainCameraError(err){
  const name=err?.name||'';
  if(name==='NotAllowedError'||name==='SecurityError')return {title:'Camera access is blocked',copy:'Allow camera access for this site in your browser settings, then reload or tap Try camera again.',status:'Camera permission blocked',button:'Try camera again'};
  if(name==='NotFoundError'||name==='DevicesNotFoundError')return {title:'No camera found',copy:'Connect a camera, then tap Try camera again.',status:'No camera detected',button:'Try camera again'};
  if(name==='NotReadableError'||name==='TrackStartError')return {title:'Camera is busy',copy:'Another app or browser tab may be using the camera. Close Teams, Zoom, Camera, or another camera tab, then try again.',status:'Camera is already in use',button:'Try camera again'};
  if(name==='OverconstrainedError'||name==='ConstraintNotSatisfiedError')return {title:'That camera could not start',copy:'Ink & Flash will try another available camera or a simpler camera mode.',status:'Trying another camera…',button:'Try another camera'};
  if(name==='AbortError')return {title:'Camera start was interrupted',copy:'Tap Try camera again.',status:'Camera start interrupted',button:'Try camera again'};
  return {title:'Camera could not start',copy:`Your browser returned ${name||'an unknown camera error'}. Try another camera or check browser and Windows camera privacy settings.`,status:'Camera unavailable',button:'Try camera again'};
}
async function refreshDevices(){
  try{const devices=await navigator.mediaDevices.enumerateDevices();cameraDevices=devices.filter(d=>d.kind==='videoinput');}catch{cameraDevices=[]}
  updateCameraSwitch();return cameraDevices;
}
function updateCameraSwitch(){
  const btn=$('switchCamera');if(!btn)return;
  btn.hidden=cameraDevices.length<2||!cameraReady;
}
async function attachStream(nextStream){
  stopStream();stream=nextStream;
  const track=stream.getVideoTracks?.()[0];activeCameraId=track?.getSettings?.().deviceId||null;
  video.srcObject=stream;
  await new Promise((resolve,reject)=>{if(video.readyState>=2)return resolve();const timer=setTimeout(resolve,3000);video.onloadedmetadata=()=>{clearTimeout(timer);resolve()};video.onerror=e=>{clearTimeout(timer);reject(e)}});
  await video.play();apply();await refreshDevices();cameraLive();
}
async function requestWith(constraints){return navigator.mediaDevices.getUserMedia({video:constraints,audio:false})}
async function tryCameraChain(preferredDeviceId=null){
  // 1) Explicit selected device when cycling cameras.
  if(preferredDeviceId){return attachStream(await requestWith({deviceId:{exact:preferredDeviceId}}))}
  // 2) Prefer the selfie/front camera without requiring it.
  try{return await attachStream(await requestWith({facingMode:'user'}))}catch(err){lastCameraError=err}
  // 3) Fall back to the browser's default camera with no constraints.
  try{return await attachStream(await requestWith(true))}catch(err){lastCameraError=err}
  // 4) If devices are enumerable, try each one explicitly.
  await refreshDevices();
  for(const device of cameraDevices){
    try{return await attachStream(await requestWith({deviceId:{exact:device.deviceId}}))}catch(err){lastCameraError=err}
  }
  throw lastCameraError||new Error('Camera could not start');
}
async function startCamera(deviceId=null){
  if(cameraStarting)return;
  if(!navigator.mediaDevices?.getUserMedia){cameraMessage('Camera not supported','Open Flash Station in a current browser on HTTPS or localhost.');$('cameraStatus').textContent='Camera unavailable';return}
  cameraStarting=true;$('boothCapture').disabled=true;$('cameraStatus').textContent='Starting camera…';cameraMessage('Starting camera…','Allow camera access when your browser asks.');
  try{stopStream();await tryCameraChain(deviceId)}catch(err){
    lastCameraError=err;cameraReady=false;video.hidden=true;$('boothCapture').disabled=true;
    const info=explainCameraError(err);$('cameraStatus').textContent=info.status;cameraMessage(info.title,info.copy,true,info.button);await refreshDevices();
  }finally{cameraStarting=false}
}
$('startBooth').onclick=()=>startCamera();
$('switchCamera')?.addEventListener('click',async()=>{
  await refreshDevices();if(cameraDevices.length<2)return;
  let idx=cameraDevices.findIndex(d=>d.deviceId===activeCameraId);idx=(idx+1)%cameraDevices.length;
  await startCamera(cameraDevices[idx].deviceId);
});
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
window.addEventListener('pagehide',stopStream);
(async()=>{
  // Clean up legacy preview URLs without changing the event itself.
  const url=new URL(location.href);if(url.searchParams.get('event')==='demo'){url.searchParams.delete('event');history.replaceState({},'',url.pathname+(url.search||'')+url.hash)}
  settings=await SSS.getSettings();currentFilter=settings.kioskLook||'Glam';if(!filterMap[currentFilter])currentFilter='Glam';
  $('boothThemeName').textContent=themeNames[currentFilter]||'Party glow';
  $('boothPhoneHelp').textContent=settings.smsAlbum!==false?'Optional — enter it to receive this photo and, when enabled, the event album link.':'Optional — enter it if you want this photo sent to you.';
  apply();showReady();await startCamera();
})();
