const form = document.getElementById('eventBuilder');
const qs = new URLSearchParams(location.search);
const product = qs.get('product');
const kioskQuery = qs.get('kiosk');
const hardwareQuery = qs.get('hardware');
const $ = id => document.getElementById(id);

function prettyDate(value){
  if(!value) return 'Choose your date';
  const d=new Date(value+'T12:00:00');
  return d.toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'});
}
function cleanCode(v){return (v||'EVENT').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10)||'EVENT'}
function syncVisibility(){
  $('shareOptions').hidden=!$('shareEnabled').checked;
  $('posterPreviewHeadline').textContent=$('shareHeadline').value;
  $('posterPreviewKicker').textContent=cleanCode($('eventCode').value)==='EVENT'?($('couple').value.trim()||'YOUR EVENT').toUpperCase():cleanCode($('eventCode').value);
  const kiosk=$('kioskEnabled').checked;$('kioskOptions').hidden=!kiosk;$('smsAlbumWrap').hidden=!kiosk;
}
function syncSummary(){
  $('summaryName').textContent=$('couple').value.trim()||'Your event';
  $('summaryDate').textContent=prettyDate($('date').value);
  $('summarySlots').textContent=$('slots').value;
  $('summaryPhotos').textContent=$('photoLimit').value;
  $('summaryShare').textContent=$('shareEnabled').checked?'On':'Off';
  $('summaryKiosk').textContent=$('kioskEnabled').checked?'On':'Off';
  syncVisibility();
}
async function init(){
  const s=await SSS.getSettings();
  $('couple').value=s.couple||'';
  $('title').value=s.title||'';
  $('eventCode').value=s.eventCode||'';
  $('slots').value=String(s.slots||48);
  $('photoLimit').value=String(s.photoLimit||3);
  $('filters').checked=s.filters!==false;
  $('messages').checked=s.messages!==false;
  $('signatureBackup').checked=Boolean(s.guestSignatureBackup);
  $('liveWall').checked=s.liveWall!==false;
  $('shareEnabled').checked=s.shareEnabled!==false;
  $('shareUploadLimit').value=String(s.shareUploadLimit||12);
  const headline=[...$('shareHeadline').options].some(o=>o.value===s.shareHeadline)?s.shareHeadline:'Share the smiles.';$('shareHeadline').value=headline;
  $('kioskEnabled').checked=kioskQuery==='1'?true:Boolean(s.kioskEnabled);
  $('kioskHardware').value=hardwareQuery||s.kioskHardware||'own';
  $('kioskLook').value=s.kioskLook||'Glam';
  $('smsAlbum').checked=s.smsAlbum!==false;
  $('albumPrivacy').value=s.albumPrivacy||'private-link';
  if(s.printFormat) $('printFormat').value=s.printFormat;
  if(s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date)) $('date').value=s.date;
  const currentProduct=product||s.signatureProduct||'cards';
  const p=document.querySelector(`[name="signatureProduct"][value="${currentProduct}"]`);if(p)p.checked=true;
  syncSummary();
}
form.addEventListener('input',syncSummary);form.addEventListener('change',syncSummary);
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const dateRaw=$('date').value;
  const settings={
    couple:$('couple').value.trim()||'Your Event',
    date:dateRaw||'Event date',
    title:$('title').value.trim()||'Our Guest Book',
    eventCode:cleanCode($('eventCode').value),
    slots:Number($('slots').value)||48,
    photoLimit:Number($('photoLimit').value)||3,
    filters:$('filters').checked,
    messages:$('messages').checked,
    guestSignatureBackup:$('signatureBackup').checked,
    signatureMode:$('signatureBackup').checked?'both':'host',
    liveWall:$('liveWall').checked,
    signatureProduct:document.querySelector('[name="signatureProduct"]:checked')?.value||'cards',
    printFormat:$('printFormat').value,
    shareEnabled:$('shareEnabled').checked,
    shareHeadline:$('shareHeadline').value,
    sharePrompt:'Add your favorite photos from tonight.',
    shareUploadLimit:Number($('shareUploadLimit').value)||12,
    kioskEnabled:$('kioskEnabled').checked,
    kioskHardware:$('kioskHardware').value,
    smsPhoto:true,
    kioskLook:$('kioskLook').value,
    smsAlbum:$('smsAlbum').checked,
    albumPrivacy:$('albumPrivacy').value
  };
  await SSS.saveSettings(settings); SSS.toast('Event saved'); setTimeout(()=>location.href='dashboard.html',450);
});
init();
