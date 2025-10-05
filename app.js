
/* ===== Helpers ===== */
const $=s=>document.querySelector(s);
const toast=t=>{const el=$('#toast'); el.textContent=t; el.style.display='block'; setTimeout(()=>el.style.display='none',2500);};
const NOMI_S=q=>`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=7&q=${encodeURIComponent(q)}`;
const NOMI_R=(la,lo)=>`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${la}&lon=${lo}`;
const kmfmt=m=>m>=1000?(m/1000).toFixed(1).replace('.',',')+' km':Math.max(1,Math.round(m))+' m';
const durfmt=s=>{const h=Math.floor(s/3600),m=Math.round((s%3600)/60);return h?`${h} h ${m} min`:`${m} min`;};
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(id).classList.add('active'); setTimeout(()=>{if(id==='#home')mapHome.invalidateSize(); if(id==='#preview')mapPreview.invalidateSize(); if(id==='#nav')mapNav.invalidateSize();},100);}
function speak(t){try{const u=new SpeechSynthesisUtterance(t); u.lang='pt-BR'; u.rate=1; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch{}}
function hav(a,b){const R=6371000,t=Math.PI/180,dl=(b.lat-a.lat)*t,do_=(b.lng-a.lng)*t,la1=a.lat*t,la2=b.lat*t,x=Math.sin(dl/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(do_/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));}

/* ===== Maps ===== */
let mapHome,mapPreview,mapNav;
function buildMaps(){
  mapHome=L.map('mapHome',{zoomControl:false}).setView([-15.78,-47.93],5);
  mapPreview=L.map('mapPreview',{zoomControl:false}).setView([-15.78,-47.93],13);
  mapNav=L.map('mapNav',{zoomControl:false}).setView([-15.78,-47.93],15);
  const tiles='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  [mapHome,mapPreview,mapNav].forEach(m=>L.tileLayer(tiles,{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m));
}

/* ===== App State ===== */
let originLL=null, originLabel='Seu local', destLL=null, destLabel='—';
let navCoords=[], navSteps=[], navIdx=0, navDist=0, navTime=0;
let watchId=null, demoTimer=null;

/* ===== Init ===== */
window.addEventListener('load',()=>{
  if(!window.L){ toast('Falha ao carregar mapas.'); return; }
  buildMaps();

  // HOME UI
  $('#openSearch').addEventListener('click',()=>{ $('#homeSheet').style.display='block'; $('#homeInput').focus(); });
  document.querySelectorAll('.chip').forEach(ch=>ch.addEventListener('click',()=>{ $('#homeInput').value=ch.dataset.q; $('#btnCalcHome').click(); }));

  // Recentes
  const recentList=$('#recentList');
  function loadRecent(){const arr=JSON.parse(localStorage.getItem('recentDest')||'[]');
    recentList.innerHTML=arr.slice(0,5).map(txt=>`<li class="itemRow"><div>${txt}</div><small>recente</small></li>`).join('');
    recentList.querySelectorAll('.itemRow').forEach(li=>li.addEventListener('click',()=>{ $('#homeInput').value=li.firstChild.textContent; $('#btnCalcHome').click(); }));
  }
  function addRecent(txt){let arr=JSON.parse(localStorage.getItem('recentDest')||'[]'); arr=[txt, ...arr.filter(x=>x!==txt)]; localStorage.setItem('recentDest', JSON.stringify(arr.slice(0,10))); loadRecent();}
  loadRecent();

  // Geolocalização inicial
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(async p=>{
      originLL=L.latLng(p.coords.latitude,p.coords.longitude);
      mapHome.setView(originLL,15);
      try{const j=await fetch(NOMI_R(originLL.lat,originLL.lng)).then(r=>r.json()); originLabel=j.display_name?.split(',')[0]||'Seu local'; $('#chipHome')?.textContent=originLabel;}catch{}
    },()=>{}, {enableHighAccuracy:true,timeout:8000,maximumAge:1000});
  }

  // Autocomplete
  const homeInput=$('#homeInput'), homeSug=$('#homeSug'); let lastRes=[], tt=null;
  homeInput.addEventListener('input', ()=>{
    const q=homeInput.value.trim(); if(tt) clearTimeout(tt);
    if(!q){ homeSug.style.display='none'; return; }
    tt=setTimeout(async ()=>{
      try{
        const arr=await fetch(NOMI_S(q),{headers:{'Accept-Language':'pt-BR'}}).then(r=>r.json());
        lastRes=arr.map(o=>({label:o.display_name,lat:+o.lat,lon:+o.lon}));
        homeSug.innerHTML=lastRes.map((o,i)=>`<div class="item" data-i="${i}"><b>${o.label.split(',')[0]}</b><div style="color:#7b86a6;font-size:12px">${o.label.split(',').slice(1).join(', ')}</div></div>`).join('');
        homeSug.style.display=lastRes.length?'block':'none';
      }catch{ homeSug.style.display='none'; }
    },250);
  });
  homeSug.addEventListener('click', e=>{
    const n=e.target.closest('.item'); if(!n) return;
    const i=+n.dataset.i, pick=lastRes[i];
    homeInput.value=pick.label; homeSug.style.display='none';
    destLL=L.latLng(pick.lat,pick.lon); destLabel=pick.label; addRecent(destLabel); goPreview();
  });
  homeInput.addEventListener('keydown', e=>{ if(e.key==='Enter') $('#btnCalcHome').click(); });
  $('#btnLoc').addEventListener('click', ()=>{
    if(!navigator.geolocation) return alert('Ative/permita a Localização.');
    navigator.geolocation.getCurrentPosition(async p=>{
      originLL=L.latLng(p.coords.latitude,p.coords.longitude);
      mapHome.setView(originLL,16);
      try{const j=await fetch(NOMI_R(originLL.lat,originLL.lng)).then(r=>r.json()); originLabel=j.display_name?.split(',')[0]||'Seu local'; toast('Origem: '+originLabel);}catch{}
    },()=>alert('Permita acesso ao GPS.'),{enableHighAccuracy:true,timeout:10000,maximumAge:1000});
  });
  $('#btnCalcHome').addEventListener('click', async ()=>{
    const q=homeInput.value.trim(); if(!q) return alert('Digite um destino.');
    if(!destLL){
      const arr=await fetch(NOMI_S(q)).then(r=>r.json()).catch(()=>[]);
      if(!arr[0]) return alert('Endereço não encontrado.');
      destLL=L.latLng(+arr[0].lat,+arr[0].lon); destLabel=arr[0].display_name; addRecent(destLabel);
    }
    goPreview();
  });

  // PREVIEW
  const routing=L.Routing.control({ router:L.Routing.osrmv1({serviceUrl:'https://router.project-osrm.org/route/v1'}), waypoints:[], show:false, lineOptions:{addWaypoints:false, styles:[{color:'#6c3cff',weight:7,opacity:.95}]} }).addTo(mapPreview);
  function goPreview(){
    if(!originLL) originLL=mapHome.getCenter();
    show('#preview'); $('#pvTitle').textContent=`${originLabel} → ${destLabel.split(',')[0]}`;
    $('#pvLoading').style.display='block'; routing.setWaypoints([originLL,destLL]);
  }
  routing.on('routesfound', e=>{
    $('#pvLoading').style.display='none';
    const r=e.routes[0];
    $('#pvMiniTime').textContent=durfmt(r.summary.totalTime||0);
    $('#pvMiniDist').textContent=kmfmt(r.summary.totalDistance||0);
    $('#pvTime').textContent=durfmt(r.summary.totalTime||0);
    $('#pvVia').textContent=r.instructions?.[0]?.road || r.instructions?.[0]?.text?.split(',')[0] || 'Melhor rota';
    mapPreview.fitBounds(L.latLngBounds(r.coordinates),{padding:[40,40]});
  });
  routing.on('routingerror', ()=>{ $('#pvLoading').style.display='none'; alert('Não foi possível calcular a rota.'); show('#home'); });
  $('#backHome').addEventListener('click', ()=>show('#home'));
  $('#btnLater').addEventListener('click', ()=>alert('Agendar depois (exemplo).'));
  $('#btnGo').addEventListener('click', ()=>{ show('#nav'); routingNav.setWaypoints([originLL,destLL]); setTimeout(()=>mapNav.invalidateSize(),100); });

  // NAV
  const routingNav=L.Routing.control({ router:L.Routing.osrmv1({serviceUrl:'https://router.project-osrm.org/route/v1'}), waypoints:[], show:false, lineOptions:{addWaypoints:false, styles:[{color:'#6c3cff',weight:7,opacity:.95}]} }).addTo(mapNav);
  let lastInstructionSpoken = -1;
  routingNav.on('routesfound', e=>{
    const r=e.routes[0];
    navCoords=r.coordinates||[]; navSteps=r.instructions||[]; navIdx=0;
    navDist=r.summary.totalDistance||0; navTime=r.summary.totalTime||0; updateHUD();
    mapNav.fitBounds(L.latLngBounds(navCoords),{padding:[40,40]});
    if(navigator.geolocation && !watchId){
      watchId=navigator.geolocation.watchPosition(onGPS,()=>{}, {enableHighAccuracy:true,maximumAge:1000,timeout:8000});
    }
    // fala inicial
    speak('Navegação iniciada.');
    lastInstructionSpoken = -1;
  });

  function updateHUD(){
    const cur=navSteps[navIdx], nxt=navSteps[navIdx+1];
    $('#nvNextDist').textContent=cur?kmfmt(cur.distance):'—';
    $('#nvNextStreet').textContent=cur?.road || cur?.text?.split(',')[0] || '—';
    if(nxt){ $('#nvUpRow').style.display='flex'; $('#nvUpText').textContent=nxt.road || nxt.text.split(',')[0] || '—'; } else $('#nvUpRow').style.display='none';
    $('#nvMiniTime').textContent=durfmt(navTime);
    $('#nvMiniEta').textContent=new Date(Date.now()+navTime*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    $('#nvMiniDist').textContent=kmfmt(navDist);
  }

  function onGPS(pos){
    const {latitude,longitude,speed}=pos.coords; const here=L.latLng(latitude,longitude);
    mapNav.panTo(here,{animate:true,duration:0.25});
    $('#nvSpd').textContent=Math.max(0,Math.round((speed||0)*3.6));

    // atualizar tempo/dist
    const end=navCoords[navCoords.length-1]; navDist=hav(here,end);
    const v=(typeof speed==='number'&&speed>1)?speed:16.6; navTime=Math.round(navDist/v);
    updateHUD();

    // avançar passo quando perto do alvo da instrução
    const cur=navSteps[navIdx];
    if(cur){
      const tgt=navCoords[Math.min(cur.index||0,navCoords.length-1)];
      if(hav(here,tgt)<25 && navIdx<navSteps.length-1){
        navIdx++; updateHUD();
      }
      // fala
      if(navIdx!==lastInstructionSpoken){
        const text = navSteps[navIdx]?.text || '';
        if(text){ speak(text.replace(/\s*\(.*?\)/g,'')); lastInstructionSpoken = navIdx; }
      }
    }
    if(navDist<30){ speak('Destino alcançado.'); alert('Destino alcançado.'); if(watchId){ navigator.geolocation.clearWatch(watchId); watchId=null;} }
  }

  // Controles
  $('#btnRecenter').addEventListener('click',()=>{ if(originLL) mapNav.panTo(originLL); });
  $('#btnVoice').addEventListener('click',()=>{ const cur=navSteps[navIdx]; if(cur) speak((cur.text||'').replace(/\s*\(.*?\)/g,'')); });
  $('#btnStop').addEventListener('click',()=>{ if(watchId){navigator.geolocation.clearWatch(watchId); watchId=null;} if(demoTimer){clearInterval(demoTimer); demoTimer=null;} toast('Navegação pausada'); });

  // Demo (anima o carrinho ao longo da rota caso esteja parado)
  $('#btnSim').addEventListener('click',()=>{
    if(!navCoords.length){ toast('Calcule a rota primeiro.'); return; }
    let i=0; if(demoTimer){ clearInterval(demoTimer); }
    demoTimer=setInterval(()=>{
      if(i>=navCoords.length-1){ clearInterval(demoTimer); demoTimer=null; return; }
      const here=navCoords[i++]; mapNav.panTo(here,{animate:true,duration:0.25});
      navDist=hav(here, navCoords[navCoords.length-1]); navTime=Math.round(navDist/16.6); updateHUD();
    }, 500);
  });
});
