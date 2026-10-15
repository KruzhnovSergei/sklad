/* Склад и касса — подключение к Firebase.
   Даёт программе то же окружение, что и в Claude (window.claude.use: db, user, downloads),
   поэтому основной код index.html одинаков для обеих версий. */
(function(){
  const CFG=window.SK_CONFIG||{};
  window.SK_SERVER=true;
  firebase.initializeApp(CFG.firebase);
  const auth=firebase.auth();
  const fs=firebase.firestore();
  try{fs.settings({ignoreUndefinedProperties:true,merge:true})}catch(e){}
  fs.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  const OWNER=String(CFG.owner||'').trim().toLowerCase();

  /* ---------- экран входа ---------- */
  let box=null;
  function showLogin(msg){
    if(!box){box=document.createElement('div');box.id='skLogin';
      box.style.cssText='position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:16px;background:var(--bg,#ECF0EE)';
      document.body.appendChild(box)}
    box.innerHTML=`<div class="pane stack" style="max-width:420px;width:100%;text-align:center;padding:28px">
      <div class="brand" style="justify-content:center"><i aria-hidden="true"></i>Склад и касса</div>
      <p class="muted">Войдите через Google-аккаунт. Сотрудник после первого входа появится у владельца в «Настройках», и тот выдаст ему права.</p>
      <button class="btn big" id="skLoginBtn">Войти через Google</button>
      <p class="err" id="skLoginErr">${msg||''}</p></div>`;
    box.hidden=false;
    box.querySelector('#skLoginBtn').onclick=async()=>{
      const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
      try{await auth.signInWithPopup(p)}
      catch(e){
        if(e&&(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'))return auth.signInWithRedirect(p);
        if(e&&e.code==='auth/popup-closed-by-user')return;
        box.querySelector('#skLoginErr').textContent='Не удалось войти: '+(e&&e.message||e)}};
  }

  let resolveUser;const ready=new Promise(r=>resolveUser=r);let started=false;
  auth.getRedirectResult().catch(e=>showLogin('Не удалось войти: '+(e&&e.message||e)));
  auth.onAuthStateChanged(u=>{
    if(u){if(box)box.hidden=true;if(!started){started=true;resolveUser(u)}else location.reload()}
    else{if(started)location.reload();else showLogin()}});

  window.SK_SIGNOUT=()=>auth.signOut().then(()=>location.reload());

  /* ---------- пользователь и роли ---------- */
  let staffP=null;
  const isOwnerU=u=>!!u&&u.emailVerified&&String(u.email||'').toLowerCase()===OWNER;
  async function staffOf(u){if(!staffP)staffP=fs.doc('staff/'+u.uid).get().then(s=>s.exists?s.data():null).catch(()=>null);return staffP}
  const seenAll=()=>{try{return typeof S!=='undefined'&&S.seenL?S.seenL:[]}catch(e){return []}};
  const label=x=>x?(x.name||x.email||'')+(x.name&&x.email?' · '+x.email:''):'';

  function userApi(u){return{
    id:async()=>u.uid,
    isOwner:async()=>isOwnerU(u),
    canEdit:async()=>{if(isOwnerU(u))return true;const s=await staffOf(u);return !!s&&!s.off&&s.lvl==='admin'},
    can:async k=>{if(k!=='data.write')return true;if(isOwnerU(u))return true;const s=await staffOf(u);return !(s&&s.lvl==='view')},
    me:async()=>({name:u.displayName||u.email||'',email:u.email||''}),
    profiles:async ids=>{const out={};const L=seenAll();for(const id of ids){if(id===u.uid){out[id]={name:u.displayName||u.email,isMe:true};continue}const x=L.find(y=>y.id===id);if(x)out[id]={name:x.name||x.email||''}}return out},
    search:async q=>{q=String(q||'').trim().toLowerCase();return seenAll().filter(x=>x.id!==u.uid&&(!q||label(x).toLowerCase().includes(q))).map(x=>({id:x.id,name:label(x)||'Без имени'}))}
  }}

  /* ---------- скачивание файлов ---------- */
  const downloads={save:async({filename,data})=>{
    const blob=data instanceof Blob?data:new Blob([data]);const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);return{status:'saved'}}};

  window.claude={use:async name=>{const u=await ready;
    if(name==='db')return fs;
    if(name==='user')return userApi(u);
    if(name==='downloads')return downloads;
    return null}};
})();
