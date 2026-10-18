/* Bestcomp — готовые сборки: карточки, список и страница компьютера.
   Данные: sitecat/pcs (список с обложками), pcphotos/{sn} (все фото одной сборки). */
window.BCPC=(function(){
  const NF=new Intl.NumberFormat('ru-RU');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>NF.format(v)+' сом';
  const kind=x=>{const t=(x.n+' '+(x.cfg||'')+' '+(x.parts||[]).join(' ')).toLowerCase();
    return /rtx|gtx|radeon|rx\s?\d{4}|arc a|arc b|игров|gaming/.test(t)?'Игровой':/офис|office/.test(t)?'Офисный':'Компьютер'};
  const buy=x=>'https://wa.me/996707198806?text='+encodeURIComponent('Здравствуйте! Хочу купить готовый компьютер с сайта: '+x.n+(x.cfg?' ('+x.cfg+')':'')+', S/N '+x.sn+', цена '+money(x.p)+'. Он ещё в наличии?');
  const ph='<div class="pc-ph" aria-hidden="true"><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="16" r="2.5"/><path d="M9 6h6M9 9h6"/></svg></div>';
  function card(x){
    return `<a class="pc pc-card" href="pc.html?sn=${encodeURIComponent(x.sn)}">
      <div class="pc-img">${x.th?`<img src="${x.th}" alt="${esc(x.n)}" loading="lazy">`:ph}<span class="pc-kind">${kind(x)}</span></div>
      <div class="pc-body"><h3>${esc(x.n)}</h3>${x.cfg?`<p class="pc-cfg">${esc(x.cfg)}</p>`:''}
      <div class="pc-foot"><span class="pc-price">${money(x.p)}</span><span class="pc-more-link">Подробнее →</span></div></div></a>`}
  async function load(){try{if(!firebase.apps.length)firebase.initializeApp(window.SK_CONFIG.firebase)}catch(e){}
    const d=await firebase.firestore().doc('sitecat/pcs').get();return d.exists?(d.data().rows||[]):[]}
  async function photos(sn){const d=await firebase.firestore().doc('pcphotos/'+sn).get();return d.exists?d.data():null}
  return {NF,esc,money,kind,buy,card,load,photos,ph};
})();
