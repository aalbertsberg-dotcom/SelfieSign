const SSS = (() => {
  const params = new URLSearchParams(location.search);
  const EVENT_ID = params.get('event') || 'demo';
  const API = '/api';
  const STATIC_ONLY = location.protocol === 'file:' || location.hostname.endsWith('github.io');
  const key = `sss_entries_${EVENT_ID}`;
  const settingsKey = `sss_event_${EVENT_ID}`;
  const defaultSettings = {
    eventId: EVENT_ID,
    eventCode: EVENT_ID === 'demo' ? 'EVENT' : EVENT_ID.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10),
    couple: 'Mia & Jordan',
    date: 'October 18, 2026',
    title: 'Our Guest Book',
    slots: 48,
    photoLimit: 3,
    filters: true,
    messages: true,
    signatureProduct: 'cards',
    printFormat: 'deck',
    guestSignatureBackup: false,
    liveWall: true,
    wallModeration: false,
    shareEnabled: true,
    shareHeadline: 'Share the smiles.',
    sharePrompt: 'Add your favorite photos from tonight.',
    shareUploadLimit: 12,
    kioskEnabled: false,
    kioskHardware: 'own',
    smsPhoto: true,
    smsAlbum: true,
    albumPublished: false,
    albumPrivacy: 'private-link'
  };

  function settings(){
    try { return {...defaultSettings, ...JSON.parse(localStorage.getItem(settingsKey) || '{}')}; }
    catch { return {...defaultSettings}; }
  }
  function cacheSettings(v){ localStorage.setItem(settingsKey, JSON.stringify({...settings(), ...v})); }
  async function apiOk(){
    if (STATIC_ONLY) return false;
    try { const r = await fetch(`${API}/health`, {cache:'no-store'}); return r.ok; }
    catch { return false; }
  }
  async function getSettings(){
    if (await apiOk()) {
      try {
        const r = await fetch(`${API}/event?event=${encodeURIComponent(EVENT_ID)}`, {cache:'no-store'});
        if (r.ok) { const v = {...defaultSettings, ...(await r.json())}; cacheSettings(v); return v; }
      } catch {}
    }
    return settings();
  }
  async function saveSettings(v){
    const merged = {...settings(), ...v, eventId:EVENT_ID};
    cacheSettings(merged);
    if (await apiOk()) {
      try { await fetch(`${API}/event`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(merged)}); } catch {}
    }
    return merged;
  }
  function normalizeEntry(entry){
    const e = {...entry};
    if (!Array.isArray(e.selfies)) e.selfies = e.selfie ? [e.selfie] : [];
    e.selfies = e.selfies.filter(Boolean);
    e.primarySelfie = Math.min(Math.max(Number(e.primarySelfie || 0), 0), Math.max(0, e.selfies.length - 1));
    e.kind = e.kind || (/^G\d+$/i.test(String(e.slot||'')) ? 'gallery' : 'signature');
    e.reviewStatus = e.reviewStatus || (e.kind === 'gallery' ? 'approved' : 'pending');
    e.hiddenFromBook = Boolean(e.hiddenFromBook);
    e.hiddenFromWall = Boolean(e.hiddenFromWall);
    return e;
  }
  function localEntries(){
    try { return JSON.parse(localStorage.getItem(key) || '[]').map(normalizeEntry); }
    catch { return []; }
  }
  function saveLocal(entries){ localStorage.setItem(key, JSON.stringify(entries)); }
  async function getEntries(){
    if (await apiOk()) {
      try {
        const r = await fetch(`${API}/entries?event=${encodeURIComponent(EVENT_ID)}`, {cache:'no-store'});
        if (r.ok) return (await r.json()).map(normalizeEntry);
      } catch {}
    }
    return localEntries();
  }
  async function upsertEntry(entry){
    entry = normalizeEntry({...entry, event:EVENT_ID, updatedAt:new Date().toISOString()});
    if (!entry.createdAt) entry.createdAt = entry.updatedAt;
    if (await apiOk()) {
      try {
        const r = await fetch(`${API}/entries`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry)});
        if (r.ok) return normalizeEntry(await r.json());
      } catch {}
    }
    const all = localEntries();
    const i = all.findIndex(x => x.slot === entry.slot);
    if (i >= 0) all[i] = normalizeEntry({...all[i], ...entry}); else all.push(entry);
    saveLocal(all);
    return entry;
  }
  async function seed(){
    const existing = await getEntries();
    const demo = [
      {kind:'signature',slot:'001',names:'Avery & Chris',message:'We love you both. Best night ever!',filter:'Warm',selfies:['assets/img/party-selfie-1.jpg','assets/img/phone-selfie.jpg'],primarySelfie:0,signature:'assets/img/sign-1.svg',reviewStatus:'approved'},
      {kind:'signature',slot:'002',names:'The Parkers',message:'Here’s to a lifetime of adventures.',filter:'Mono',selfies:['assets/img/party-selfie-2.jpg'],signature:'assets/img/sign-2.svg',reviewStatus:'approved'},
      {kind:'signature',slot:'003',names:'Taylor',message:'Could not be happier for you!',filter:'Film',selfies:['assets/img/phone-selfie.jpg'],signature:null,reviewStatus:'pending'},
      {kind:'signature',slot:'005',names:'Jamie & Pat',message:'The dance floor is waiting for you.',filter:'Natural',selfies:['assets/img/guest-signing.jpg'],signature:null,reviewStatus:'pending'},
      {kind:'signature',slot:'006',names:'Jordan’s Family',message:'We would not miss this for the world.',filter:'Glam',selfies:['assets/img/guest-book-action.jpg','assets/img/party-selfie-1.jpg','assets/img/party-selfie-2.jpg'],primarySelfie:1,signature:null,reviewStatus:'needs-review'},
      {kind:'gallery',slot:'G001',names:'Dance floor',message:'Caught this right before the song ended.',selfies:['assets/img/booth-action.jpg'],reviewStatus:'approved'},
      {kind:'gallery',slot:'G002',names:'Table 7',message:'Our point of view ✨',selfies:['assets/img/party-selfie-2.jpg'],reviewStatus:'approved'}
    ];
    for (const d of demo) if (!existing.some(x => x.slot === d.slot)) await upsertEntry(d);
    return await getEntries();
  }
  function slot(n){ return String(n).padStart(3,'0'); }
  function nextGallerySlot(entries=[]){
    let max=0;
    entries.forEach(e=>{const m=String(e.slot||'').match(/^G(\d+)$/i);if(m)max=Math.max(max,Number(m[1]))});
    return `G${String(max+1).padStart(3,'0')}`;
  }
  function primaryPhoto(e){ e = normalizeEntry(e); return e.selfies[e.primarySelfie] || e.selfies[0] || null; }
  function shortCode(slotId, s=settings()){ return `${(s.eventCode || 'EVENT').toUpperCase()}-${slotId}`; }
  function isSignature(e){ return normalizeEntry(e).kind === 'signature'; }
  function isGallery(e){ return normalizeEntry(e).kind === 'gallery'; }
  function toast(msg){ const t=document.getElementById('toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
  function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  return {EVENT_ID,settings,getSettings,saveSettings,getEntries,upsertEntry,seed,slot,nextGallerySlot,primaryPhoto,shortCode,isSignature,isGallery,toast,escapeHtml,normalizeEntry};
})();
