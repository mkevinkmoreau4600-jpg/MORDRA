window.addEventListener('error', function(e){
  try{
    const app = document.getElementById('app');
    if(app){
      app.innerHTML = `<div class="screen"><div class="card"><h1>⚠️ MORDRA</h1><p class="small">Une erreur a été détectée, mais le jeu reste accessible.</p><button class="btn" onclick="location.reload()">Relancer</button><button class="btn secondary" onclick="try{home()}catch(e){location.reload()}">Menu</button></div></div>`;
    }
  }catch(_){}
});


const app = document.getElementById("app");
const saveKey = "mordra2_stats";
const historyKey = "mordra2_history";
const settingsKey = "mordra2_settings";
let state = { players: [], game: null, timers: [] };


/* =========================================================
   MORDRA Test 4.00 — Audio menu principal
   Musique continue : DÉMARRER → Chargement → Menu principal
========================================================= */
const audioSettingsKey = "mordra_400_audio_settings";
let menuMusic = null;
let menuMusicFadeTimer = null;
let menuMusicUnlocked = false;
let menuMusicStarted = false;

let uiSfx = {};
let lastUiSfx = { key:null, time:0 };
function ensureUiSfx(){
  if(uiSfx.click) return uiSfx;
  uiSfx = {
    start: new Audio("assets/ui-start.mp3"),
    click: new Audio("assets/ui-click.mp3"),
    back: new Audio("assets/ui-back.mp3"),
    locked: new Audio("assets/ui-locked.mp3")
  };
  Object.values(uiSfx).forEach(a=>{ a.preload = "auto"; a.volume = .8; });
  return uiSfx;
}
function playUiSfx(kind="click"){
  try{
    const cfg = getAudioSettings();
    if(!cfg.sfxEnabled || (cfg.sfxVolume ?? 0) <= 0) return;
    const now = performance.now();
    if(lastUiSfx.key === kind && now - lastUiSfx.time < 90) return;
    lastUiSfx = { key: kind, time: now };
    const bank = ensureUiSfx();
    const a = bank[kind] || bank.click;
    a.pause();
    a.currentTime = 0;
    a.volume = Math.max(0, Math.min(1, cfg.sfxVolume ?? .8));
    const p = a.play();
    if(p && p.catch) p.catch(()=>{});
  }catch(e){}
}
function lockedFeedback(el, message="Disponible dans une prochaine mise à jour."){
  try{ playUiSfx("locked"); }catch(e){}
  try{
    const card = el?.closest?.("button,.mode-choice-card,.shop-item,.pass-tier,.achievement-card,.listitem") || el;
    if(card){
      card.classList.remove("locked-shake");
      void card.offsetWidth;
      card.classList.add("locked-shake");
      setTimeout(()=>card.classList.remove("locked-shake"), 380);
    }
  }catch(e){}
  toast(message);
}

function getAudioSettings(){
  const cfg = loadJSON(audioSettingsKey, { musicEnabled:true, musicVolume:.65, sfxEnabled:true, sfxVolume:.8, vibrationsEnabled:true });
  // Migration douce : les anciennes versions n'avaient pas toujours les curseurs.
  if(typeof cfg.musicVolume !== "number") cfg.musicVolume = .65;
  if(typeof cfg.sfxVolume !== "number") cfg.sfxVolume = .8;
  if(typeof cfg.vibrationsEnabled !== "boolean") cfg.vibrationsEnabled = true;
  return cfg;
}
function setAudioSettings(v){ localStorage.setItem(audioSettingsKey, JSON.stringify(v)); }
function ensureMenuMusic(){
  if(menuMusic) return menuMusic;
  menuMusic = new Audio("assets/Black Glass Hall.mp3");
  menuMusic.loop = true;
  menuMusic.preload = "auto";
  menuMusic.volume = 0;
  return menuMusic;
}
function fadeMenuMusic(target=1, duration=650){
  const cfg = getAudioSettings();
  const music = ensureMenuMusic();
  target = cfg.musicEnabled ? Math.max(0, Math.min(1, target * (cfg.musicVolume ?? 1))) : 0;
  clearInterval(menuMusicFadeTimer);
  const start = music.volume || 0;
  const startTime = performance.now();
  if(cfg.musicEnabled && music.paused){
    const p = music.play();
    if(p && p.catch) p.catch(()=>{});
  }
  menuMusicFadeTimer = setInterval(()=>{
    const t = Math.min(1, (performance.now()-startTime)/duration);
    music.volume = start + (target-start)*t;
    if(t >= 1){
      clearInterval(menuMusicFadeTimer);
      if(target <= 0.001 && !cfg.musicEnabled) music.pause();
    }
  }, 30);
}
function startMenuMusic(target=1){
  const cfg = getAudioSettings();
  const music = ensureMenuMusic();
  if(!cfg.musicEnabled) return;
  const p = music.play();
  menuMusicStarted = true;
  if(p && p.catch) p.catch(()=>{});
  fadeMenuMusic(target, 900);
}
function lowerMenuMusicForLoading(){ fadeMenuMusic(.85, 900); }
function restoreMenuMusic(){ fadeMenuMusic(1, 900); updateMusicToggleIcon(); }
function stopMenuMusicForGame(){ fadeMenuMusic(0, 1600); }
function toggleMenuMusic(){
  const cfg = getAudioSettings();
  cfg.musicEnabled = !cfg.musicEnabled;
  setAudioSettings(cfg);
  if(cfg.musicEnabled) startMenuMusic(1); else fadeMenuMusic(0, 500);
  updateMusicToggleIcon();
}
function setMusicVolume(value){
  const cfg = getAudioSettings();
  cfg.musicVolume = Math.max(0, Math.min(1, Number(value) / 100));
  cfg.musicEnabled = cfg.musicVolume > 0;
  setAudioSettings(cfg);
  const label = document.getElementById("musicVolumeLabel");
  if(label) label.textContent = Math.round(cfg.musicVolume * 100) + "%";
  updateMusicToggleIcon();
  if(cfg.musicEnabled) fadeMenuMusic(1, 120); else fadeMenuMusic(0, 250);
}
function setSfxVolume(value){
  const cfg = getAudioSettings();
  cfg.sfxVolume = Math.max(0, Math.min(1, Number(value) / 100));
  cfg.sfxEnabled = cfg.sfxVolume > 0;
  setAudioSettings(cfg);
  const label = document.getElementById("sfxVolumeLabel");
  if(label) label.textContent = Math.round(cfg.sfxVolume * 100) + "%";
  updateMusicToggleIcon();
}
function toggleVibrationsSetting(){
  const cfg = getAudioSettings();
  cfg.vibrationsEnabled = !cfg.vibrationsEnabled;
  setAudioSettings(cfg);
  settings();
}
function updateMusicToggleIcon(){
  const btn = document.getElementById("musicToggleBtn");
  if(!btn) return;
  const on = !!getAudioSettings().musicEnabled;
  btn.textContent = on ? "🔊" : "🔇";
  btn.setAttribute("aria-label", on ? "Couper la musique" : "Activer la musique");
  btn.classList.toggle("muted", !on);
}
function playStartWhoosh(){
  try{
    const cfg = getAudioSettings();
    if(!cfg.sfxEnabled) return;
    const a = new (window.AudioContext||window.webkitAudioContext)();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(95, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(34, a.currentTime + .55);
    g.gain.setValueAtTime(.0001, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.08 * (cfg.sfxVolume ?? 1), a.currentTime + .05);
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .62);
    o.connect(g); g.connect(a.destination); o.start();
    setTimeout(()=>{ try{o.stop();a.close()}catch{} }, 720);
  }catch(e){}
}
window.addEventListener("pointerdown", ()=>{
  if(menuMusicUnlocked) return;
  menuMusicUnlocked = true;
  if(document.getElementById("mordraStartScreen")) startMenuMusic(1);
}, {once:true});

document.addEventListener("click", (e)=>{
  try{
    const el = e.target.closest("button,.btn,.listitem,.tab,.mini-btn,input[type='range']");
    if(!el) return;
    if(el.classList.contains("splash-start-hitbox")) return; // son spécial joué par startButtonTransition
    if(el.classList.contains("mode-choice-card") && el.classList.contains("is-soon")) return;
    if(el.disabled || el.getAttribute("aria-disabled") === "true" || el.classList.contains("locked")){
      lockedFeedback(el);
      return;
    }
    if(el.classList.contains("top-back") || el.classList.contains("mode-back-btn") || el.classList.contains("ng-back") || /Retour/i.test(el.textContent || "")) playUiSfx("back");
    else playUiSfx("click");
  }catch(_e){}
}, true);

const words = [
["Pizza","Calzone"],["Lion","Tigre"],["Voiture","Moto"],["Café","Thé"],["Plage","Piscine"],["Zombie","Vampire"],["Ferrari","Lamborghini"],["Minecraft","Roblox"],["Paris","Londres"],["Soleil","Lune"],["Chien","Loup"],["Chat","Renard"],["Cinéma","Théâtre"],["Football","Rugby"],["Riz","Pâtes"],["Glace","Sorbet"],["Avion","Hélicoptère"],["Train","Métro"],["Hôpital","Clinique"],["Policier","Gendarme"],["Forêt","Jungle"],["Dragon","Dinosaure"],["Requin","Orque"],["Piano","Guitare"],["Téléphone","Tablette"],["Netflix","YouTube"],["Burger","Kebab"],["Tacos","Burrito"],["Crêpe","Gaufre"],["Bateau","Sous-marin"],["Prison","Commissariat"],["Banque","Coffre"],["Fantôme","Esprit"],["Serpent","Python"],["Aigle","Faucon"],["Volcan","Montagne"],["Neige","Glace"],["Orage","Tempête"],["Bougie","Lampe"],["Couteau","Épée"]
];

const shopItems = [
{type:"banner",id:"banner_shadow",name:"Ombre",rarity:"Commun",price:0,icon:"🖼️",css:"linear-gradient(135deg,#101018,#3b0010)"},
{type:"banner",id:"banner_blood",name:"Sang",rarity:"Rare",price:1600,icon:"🩸",css:"linear-gradient(135deg,#250008,#d01f3c)"},
{type:"banner",id:"banner_ice",name:"Glace",rarity:"Rare",price:2200,icon:"❄️",css:"linear-gradient(135deg,#071827,#7d9cff)"},
{type:"banner",id:"banner_neon",name:"Néon Rouge",rarity:"Épique",price:8000,icon:"⚡",css:"linear-gradient(135deg,#050509,#ff0048,#28000d)"},
{type:"banner",id:"banner_galaxy",name:"Galaxy",rarity:"Légendaire",price:30000,icon:"🌌",css:"linear-gradient(135deg,#120024,#2d0b6e,#d01f3c)"},
{type:"banner",id:"banner_void",name:"Vide Noir",rarity:"Mythique",price:90000,icon:"🕳️",css:"linear-gradient(135deg,#000,#16001f,#42004f)"},
{type:"badge",id:"badge_eye",name:"Œil",rarity:"Commun",price:400,icon:"👁️"},
{type:"badge",id:"badge_target",name:"Cible",rarity:"Commun",price:500,icon:"🎯"},
{type:"badge",id:"badge_knife",name:"Lame",rarity:"Rare",price:1000,icon:"🔪"},
{type:"badge",id:"badge_shield",name:"Bouclier",rarity:"Rare",price:1000,icon:"🛡️"},
{type:"badge",id:"badge_skull",name:"Crâne",rarity:"Épique",price:4500,icon:"💀"},
{type:"badge",id:"badge_ghost",name:"Fantôme",rarity:"Épique",price:5200,icon:"👻"},
{type:"badge",id:"badge_crown",name:"Couronne",rarity:"Légendaire",price:14000,icon:"👑"},
{type:"badge",id:"badge_blackheart",name:"Cœur Noir",rarity:"Mythique",price:65000,icon:"🖤"},
{type:"frame",id:"frame_bronze",name:"Cadre Bronze",rarity:"Commun",price:700,icon:"🟫"},
{type:"frame",id:"frame_silver",name:"Cadre Argent",rarity:"Rare",price:2500,icon:"⬜"},
{type:"frame",id:"frame_gold",name:"Cadre Or",rarity:"Épique",price:8000,icon:"🟨"},
{type:"frame",id:"frame_diamond",name:"Cadre Diamant",rarity:"Légendaire",price:26000,icon:"💎"},
{type:"frame",id:"frame_void",name:"Cadre Néant",rarity:"Mythique",price:90000,icon:"🕳️"},
{type:"title",id:"title_survivor",name:"Le Survivant",rarity:"Commun",price:600,icon:"⭐"},
{type:"title",id:"title_shadow",name:"L'Ombre",rarity:"Rare",price:2500,icon:"🌑"},
{type:"title",id:"title_predator",name:"Le Prédateur",rarity:"Épique",price:8500,icon:"🐺"},
{type:"title",id:"title_reaper",name:"Le Faucheur",rarity:"Légendaire",price:26000,icon:"💀"},
{type:"title",id:"title_lord",name:"Seigneur du Sang",rarity:"Mythique",price:120000,icon:"🩸"}
];

function screen(html){ app.innerHTML = `<div class="screen">${html}</div>`; }
function back(action="home()"){ return `<button type="button" class="top-back" onclick="${action}">← Retour</button>`; }
function loadJSON(k,def){ try{return JSON.parse(localStorage.getItem(k))||def}catch{return def} }
function saveJSON(k,v){ localStorage.setItem(k,JSON.stringify(v)); toast(); }
function loadStats(){ return loadJSON(saveKey,{}); }
function saveStats(v){ saveJSON(saveKey,v); }
function loadHistory(){ return loadJSON(historyKey,[]); }
function saveHistory(v){ saveJSON(historyKey,v); }
function toast(t="Sauvegardé ✅"){ let el=document.getElementById("saveToast"); if(!el){el=document.createElement("div");el.id="saveToast";document.body.appendChild(el)} el.className="save-toast show"; el.textContent=t; setTimeout(()=>el.className="save-toast",1200); }
function sound(type="click"){
  const map = {
    click:"click", menu:"click", level:"click", good:"click", vote:"click", reveal:"click", tick:"click",
    bad:"locked", locked:"locked", start:"start", back:"back"
  };
  playUiSfx(map[type] || "click");
}
function levelXP(l){return 100+Math.floor(l*l*45)}
function levelFromXP(xp){let l=1, r=xp||0; while(r>=levelXP(l)&&l<100){r-=levelXP(l);l++} return l}
function xpProgress(xp){let l=1,r=xp||0; while(r>=levelXP(l)&&l<100){r-=levelXP(l);l++} return {l,cur:r,next:levelXP(l),pct:Math.min(100,Math.round(r/levelXP(l)*100))}}
function xpcard(xp,label,icon){const p=xpProgress(xp); return `<div class="level-card"><div class="level-head"><div><span class="small">${label}</span><b>${icon} Niveau ${p.l}</b></div><span class="badge">${xp||0} XP</span></div><div class="level-bar"><div style="width:${p.pct}%"></div></div><div class="small">${p.cur}/${p.next} XP avant niveau ${p.l+1}</div></div>`}
function defaultPlayer(name){ return {name,games:0,wins:0,losses:0,streak:0,bestStreak:0,totalXP:0,wallet:{shards:0},survivor:{games:0,wins:0,xp:0,goodVotes:0,badVotes:0,bestStreak:0,streak:0},killer:{games:0,wins:0,xp:0,votesReceived:0,bestStreak:0,streak:0},inv:{banners:["banner_shadow"],badges:[],frames:[],titles:[]},eq:{banner:"banner_shadow",badges:[],frame:null,title:null},passClaimed:[]};}
function normalize(p){ let d=defaultPlayer(p?.name||"Joueur"); p={...d,...p}; p.wallet={...d.wallet,...p.wallet}; p.survivor={...d.survivor,...p.survivor}; p.killer={...d.killer,...p.killer}; p.inv={...d.inv,...p.inv}; p.eq={...d.eq,...p.eq}; p.inv.banners ||= ["banner_shadow"]; p.inv.badges ||= []; p.inv.frames ||= []; p.inv.titles ||= []; p.eq.badges ||= []; return p; }
function getPlayer(name){ const s=loadStats(); const k=Object.keys(s).find(x=>x.toLowerCase()===String(name).toLowerCase()); return k?normalize(s[k]):null; }
function savePlayer(p){ const s=loadStats(); s[p.name]=normalize(p); saveStats(s); }
function createPlayer(name){ name=String(name||"").trim(); if(!name) throw Error("Entre un nom."); if(getPlayer(name)) throw Error("Ce joueur existe déjà."); const p=defaultPlayer(name); savePlayer(p); return p; }
function allPlayers(){ const s=loadStats(); return Object.values(s).map(normalize).sort((a,b)=>a.name.localeCompare(b.name));}
function item(type,id){return shopItems.find(i=>i.type===type&&i.id===id)}
function owned(p,it){ const key={banner:"banners",badge:"badges",frame:"frames",title:"titles"}[it.type]; return p.inv[key]?.includes(it.id)}
function give(p,it){ const key={banner:"banners",badge:"badges",frame:"frames",title:"titles"}[it.type]; if(key&&!p.inv[key].includes(it.id)) p.inv[key].push(it.id); return p;}
function mvp(){const p=allPlayers().sort((a,b)=>b.totalXP-a.totalXP)[0]; return p&&p.totalXP>0?p:null}
function isMVP(n){const m=mvp(); return m&&m.name===n}
function mvpBadge(n){return isMVP(n)?`<div class="mvp-badge">👑 MVP</div>`:""}
function bannerCSS(p){return item("banner",p.eq.banner)?.css || item("banner","banner_shadow").css}
function playerCard(p){
  p=normalize(p);
  const banner=item("banner",p.eq.banner)||item("banner","banner_shadow");
  const frame=item("frame",p.eq.frame);
  const title=item("title",p.eq.title);
  const badges=p.eq.badges.map(id=>item("badge",id)).filter(Boolean);
  const frameClass=frame?("visual-frame-"+frame.id.replace("frame_","")):"";
  return `<div class="player-card visual-profile ${isMVP(p.name)?"mvp-card":""} ${frameClass}" style="background:${isMVP(p.name)?"linear-gradient(135deg,#3b2a00,#f7c75d,#7a4200)":banner.css}">
    <div class="visual-overlay"></div>
    ${mvpBadge(p.name)}
    ${frame?`<div class="visual-frame-name">${frame.icon} ${frame.name}</div>`:""}
    <h1>${p.name}</h1>
    <div class="visual-title">${title?title.icon+" "+title.name:"Sans titre"}</div>
    <div class="small">⭐ Niveau ${levelFromXP(p.totalXP)} • 🩸 ${p.wallet.shards}</div>
    <div class="profile-badges">${badges.length?badges.map(b=>`<span>${b.icon}</span>`).join(""):"<span>🩸</span>"}</div>
    <div class="visual-banner-name">${banner.icon} ${banner.name}</div>
  </div>`;
}
function intro(){
  // Écran de pré-lancement rapide : on garde l'accueil officiel avant le menu.
  startScreen();
}

function officialLoading(nextAction){
  lowerMenuMusicForLoading();
  screen(`<div class="mordra-loading-screen" id="officialLoadingScreen">
    <div class="loading-case-bg" aria-hidden="true"></div>
    <div class="loading-smoke smoke-left" aria-hidden="true"></div>
    <div class="loading-smoke smoke-right" aria-hidden="true"></div>
    <div class="loading-smoke smoke-center" aria-hidden="true"></div>
    <div class="loading-red-particles" aria-hidden="true">
      <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
    </div>
    <div class="loading-breath-glow" aria-hidden="true"></div>
    <div class="loading-ui-mask" aria-hidden="true"></div>
    <div class="loading-final-flash" aria-hidden="true"></div>
    <div class="loading-ui-premium">
      <h1>PRÉPARATION DE L’ENQUÊTE...</h1>
      <div class="premium-progress-line">
        <div class="premium-progress-fill" id="premiumLoadingFill"></div>
        <div class="premium-progress-star" id="premiumLoadingStar"></div>
      </div>
      <div class="premium-percent" id="premiumLoadingPercent">0%</div>
      <div class="premium-status-box">
        <span class="premium-search-icon">⌕</span>
        <span id="premiumLoadingStatus">OUVERTURE DU DOSSIER...</span>
      </div>
      <div class="premium-tip">
        <b>CONSEIL :</b>
        <span>Le joueur le plus calme n’est pas toujours <em>innocent</em>.</span>
      </div>
    </div>
  </div>`);

  const states = [
    { at: 0, text: "OUVERTURE DU DOSSIER..." },
    { at: 18, text: "ANALYSE DES SUSPECTS..." },
    { at: 38, text: "VÉRIFICATION DES RÔLES..." },
    { at: 58, text: "RECHERCHE DES INDICES..." },
    { at: 75, text: "PRÉPARATION DE L’ENQUÊTE..." },
    { at: 91, text: "VALIDATION DU DOSSIER..." },
    { at: 99, text: "L’ENQUÊTE COMMENCE..." }
  ];

  const minDuration = 11800; // durée cinéma : presque 12 secondes pour profiter de l'écran
  const start = performance.now();
  let displayed = 0;

  function cinematicProgress(t){
    const x = Math.min(1, Math.max(0, t / minDuration));
    let p;
    if(x < 0.14) p = 8 + (x / 0.14) * 12;                         // 8 -> 20
    else if(x < 0.34) p = 20 + ((x - 0.14) / 0.20) * 18;            // 20 -> 38
    else if(x < 0.43) p = 38 + ((x - 0.34) / 0.09) * 3;             // pause visible 38 -> 41
    else if(x < 0.62) p = 41 + ((x - 0.43) / 0.19) * 24;            // 41 -> 65
    else if(x < 0.72) p = 65 + ((x - 0.62) / 0.10) * 5;             // pause visible 65 -> 70
    else if(x < 0.88) p = 70 + ((x - 0.72) / 0.16) * 20;            // 70 -> 90
    else if(x < 0.96) p = 90 + ((x - 0.88) / 0.08) * 5;             // pause visible 90 -> 95
    else p = 95 + ((x - 0.96) / 0.04) * 5;                          // 95 -> 100
    return Math.min(100, Math.floor(p));
  }

  function updateLoading(){
    const elapsed = performance.now() - start;
    let p = cinematicProgress(elapsed);
    if(p < displayed) p = displayed;
    displayed = p;

    const fill = document.getElementById("premiumLoadingFill");
    const star = document.getElementById("premiumLoadingStar");
    const pct = document.getElementById("premiumLoadingPercent");
    const status = document.getElementById("premiumLoadingStatus");
    const loadingScreen = document.getElementById("officialLoadingScreen");

    if(fill) fill.style.width = p + "%";
    if(star) star.style.left = `calc(${p}% - 9px)`;
    if(pct) pct.textContent = p + "%";
    if(status){
      let current = states[0].text;
      for(const item of states){ if(p >= item.at) current = item.text; }
      status.textContent = current;
    }
    if(loadingScreen){
      loadingScreen.style.setProperty("--loading-progress", p / 100);
      if(p >= 90) loadingScreen.classList.add("loading-almost-done");
    }

    if(elapsed < minDuration || p < 100){
      requestAnimationFrame(updateLoading);
      return;
    }

    if(loadingScreen){
      loadingScreen.classList.add("loading-complete");
      setTimeout(()=>loadingScreen.classList.add("loading-fadeout"), 650);
    }

    setTimeout(()=>{
      try{ (nextAction || home)(); }catch(e){ home(); }
      setTimeout(()=>{
        const app = document.getElementById("app");
        if(app) app.classList.add("menu-soft-enter");
        setTimeout(()=>{ if(app) app.classList.remove("menu-soft-enter"); }, 900);
      }, 20);
    }, 1250);
  }

  requestAnimationFrame(updateLoading);
}

function startScreen(){
  screen(`<div class="mordra-splash-screen" id="mordraStartScreen">
    <div class="splash-frame">
      <div class="splash-bg" aria-hidden="true"></div>
      <div class="splash-fog fog-a" aria-hidden="true"></div>
      <div class="splash-fog fog-b" aria-hidden="true"></div>
      <div class="splash-fog fog-c" aria-hidden="true"></div>
      <div class="splash-transition-smoke" aria-hidden="true"></div>
      <div class="splash-particles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="splash-glow" aria-hidden="true"></div>
      <div class="splash-click-flash" aria-hidden="true"></div>
      <button class="splash-start-hitbox" onclick="startButtonTransition()" aria-label="Démarrer MORDRA"></button>
    </div>
  </div>`)
  setTimeout(()=>startMenuMusic(1), 120);
}

function startButtonTransition(){
  const splash=document.getElementById("mordraStartScreen");
  if(!splash) return officialLoading();
  if(splash.dataset.busy==="1") return;
  splash.dataset.busy="1";
  splash.classList.add("start-clicked");
  startMenuMusic(1);
  setTimeout(()=>lowerMenuMusicForLoading(), 260);
  playUiSfx("start");
  playStartWhoosh();
  setTimeout(()=>{ officialLoading(); }, 1450);
}
function home(){
  restoreMenuMusic();
  try{
    if(state.championship && state.championship.pending && !state.championship.active){
      state.championship.pending=false;
      try{localStorage.removeItem("mordra_400_championship")}catch(_e){}
    }
    clearDiscussionTimer()
  }catch(e){}
  const menuItems=[
    {label:"Nouvelle partie", icon:"✥", action:"modeSelect()", primary:true},
    {label:"Mode Championnat", icon:"♛", action:"championshipMenu400()", primary:true},
    {label:"Progression", icon:"▥", action:"progression()"},
    {label:"Statistiques", icon:"◔", action:"statsList()"},
    {label:"Succès", icon:"✪", action:"achievementsMenu()"},
    {label:"Collection", icon:"▣", action:"collectionSelect()"},
    {label:"Boutique", icon:"🛒", action:"shopHub()"},
    {label:"Paramètres", icon:"⚙", action:"settings()"}
  ];
  screen(`<div class="main-menu-premium screen">
    <div class="menu-red-vignette" aria-hidden="true"></div>
    <div class="menu-smoke menu-smoke-a" aria-hidden="true"></div>
    <div class="menu-smoke menu-smoke-b" aria-hidden="true"></div>
    <div class="menu-sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <section class="menu-phone-frame">
      <div class="menu-board-bg" aria-hidden="true">
        <span class="case-note note-left">DISPARITION<br><small>Aucune piste.</small></span>
        <span class="case-note note-right">SUSPECTS<br><small>Qui ment ?</small></span>
        <span class="case-thread t1"></span><span class="case-thread t2"></span><span class="case-thread t3"></span>
      </div>
      <header class="premium-menu-header">
<div class="premium-logo"><span>M</span><em>◈</em><span>RDRA</span></div>
        <p>Menu principal <b>•</b> Version Test 4.00</p>
      </header>
      <nav class="premium-menu-buttons" aria-label="Menu principal MORDRA">
        ${menuItems.map((item,index)=>`<button class="premium-menu-btn ${item.primary?"primary":""}" onclick="${item.action}" style="--i:${index}">
          <span class="premium-btn-icon">${item.icon}</span>
          <span class="premium-btn-label">${item.label}</span>
        </button>`).join("")}
      </nav>
    </section>
  </div>`);
}

function progression(){screen(`<div class="card">${back()}<h1>🏆 Progression</h1><button class="btn secondary" onclick="leaderboard()">🏆 Classement</button><button class="btn secondary" onclick="hall()">🏛️ Hall of Fame</button><button class="btn secondary" onclick="historyList()">📜 Historique</button></div>`)}
function statsList(){ const ps=allPlayers(); screen(`<div class="card">${back()}<h1>📊 Statistiques</h1><button class="btn" onclick="newPlayer()">➕ Nouveau joueur</button>${ps.length?ps.map(p=>`<div class="listitem" onclick="playerStats('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">${p.games} parties • ${p.totalXP} XP • 🩸 ${p.wallet.shards}</span></div><span>›</span></div>`).join(""):`<p class="small">Aucun joueur.</p>`}</div>`)}
function newPlayer(){screen(`<div class="card">${back("statsList()")}<h1>➕ Nouveau joueur</h1><input class="input" id="np" placeholder="Nom du joueur"><div id="msg"></div><button class="btn" onclick="saveNewPlayer()">Créer le joueur</button><button class="btn ghost" onclick="statsList()">Retour</button></div>`); setTimeout(()=>document.getElementById("np")?.focus(),100)}
function saveNewPlayer(){try{createPlayer(document.getElementById("np").value); sound("level"); document.getElementById("msg").className="success-box"; document.getElementById("msg").textContent="Joueur créé ✅"; setTimeout(statsList,350)}catch(e){document.getElementById("msg").className="error-box";document.getElementById("msg").textContent=e.message}}
function playerStats(n){const p=getPlayer(n); if(!p)return statsList(); screen(`<div class="card">${back("statsList()")}${playerCard(p)}${xpcard(p.totalXP,"Niveau général","⭐")}${xpcard(p.survivor.xp,"Niveau Survivant","🛡️")}${xpcard(p.killer.xp,"Niveau Tueur","🔪")}<div class="statbox"><div><b>${p.games}</b><span>Parties</span></div><div><b>${p.wins}</b><span>Victoires</span></div><div><b>${p.losses}</b><span>Défaites</span></div><div><b>${p.bestStreak}</b><span>Record série</span></div><div><b>${p.wallet.shards}</b><span>Éclats</span></div><div><b>${levelFromXP(p.totalXP)}</b><span>Niveau</span></div></div></div>`)}
function leaderboard(){const ps=allPlayers().sort((a,b)=>b.totalXP-a.totalXP); const m=mvp(); screen(`<div class="card">${back("progression()")}<h1>🏆 Classement</h1>${m?`<div class="player-card mvp-card" style="background:linear-gradient(135deg,#3b2a00,#f7c75d,#7a4200)"><div class="mvp-badge">👑 MVP</div><h1>${m.name}</h1><div class="xp">${m.totalXP} XP</div></div>`:""}${ps.map((p,i)=>`<div class="listitem ${isMVP(p.name)?"mvp-card":""}" onclick="playerStats('${p.name.replaceAll("'","\\'")}')"><div><b>${i+1}. ${isMVP(p.name)?"👑 ":""}${p.name}</b><br><span class="small">Niv. ${levelFromXP(p.totalXP)} • ${p.games} parties</span></div><span class="badge">${p.totalXP} XP</span></div>`).join("")||"<p class='small'>Aucun joueur.</p>"}</div>`)}
function hall(){const ps=allPlayers(); const m=mvp(); const wins=[...ps].sort((a,b)=>b.wins-a.wins)[0]; const games=[...ps].sort((a,b)=>b.games-a.games)[0]; screen(`<div class="card">${back("progression()")}<h1>🏛️ Hall of Fame</h1>${m?playerCard(m):"<p class='small'>Aucun MVP.</p>"}<h2>Records</h2><div class="listitem"><b>🏆 Victoires</b><span>${wins?wins.name+" • "+wins.wins:0}</span></div><div class="listitem"><b>🎮 Parties</b><span>${games?games.name+" • "+games.games:0}</span></div></div>`)}
function historyList(){const h=loadHistory().slice().reverse(); screen(`<div class="card">${back("progression()")}<h1>📜 Historique</h1>${h.map(x=>`<div class="listitem"><div><b>${new Date(x.date).toLocaleDateString()}</b><br><span class="small">${x.winner==="killers"?"Tueurs":"Survivants"} gagnent • ${x.players.length} joueurs</span></div></div>`).join("")||"<p class='small'>Aucune partie.</p>"}</div>`)}



/* =========================================================
   MORDRA 3.3.2 — SHADOW MODES
   Choix du mode avant la partie.
========================================================= */

const mordraModes = {
  classic:{
    id:"classic",
    icon:"🔪",
    name:"Classique",
    desc:"Mode imposteur pur : les Survivants ont un mot, le Tueur n’a pas de mot.",
    roleMode:"visible",
    minutes:null,
    soon:false
  },
  mystery:{
    id:"mystery",
    icon:"🌑",
    name:"Mystère",
    desc:"Personne ne voit son rôle. Tout le monde voit seulement son mot.",
    roleMode:"hidden",
    minutes:null,
    soon:false
  },
  blitz:{
    id:"blitz",
    icon:"⚡",
    name:"Blitz",
    desc:"Parties rapides. Comme le Classique, le Tueur n’a pas de mot. Discussion à 1 minute.",
    roleMode:"visible",
    minutes:1,
    soon:false
  },
  double:{
    id:"double",
    icon:"👥",
    name:"Double Tueur",
    desc:"Deux tueurs travaillent ensemble. Arrive bientôt.",
    soon:true
  },
  paranormal:{
    id:"paranormal",
    icon:"👻",
    name:"Paranormal",
    desc:"Des événements aléatoires changent les règles. Arrive bientôt.",
    soon:true
  },
  detective:{
    id:"detective",
    icon:"🕵️",
    name:"Détective",
    desc:"Un survivant reçoit un indice secret. Arrive bientôt.",
    soon:true
  }
};

function modeSelect(){
  try{ sound("menu"); }catch(e){}
  const modes = Object.values(mordraModes);
  const iconMap = {
    classic:"✦",
    mystery:"◉",
    blitz:"ϟ",
    double:"♟",
    paranormal:"☁",
    detective:"⌕"
  };
  screen(`<div class="mode-select-premium screen">
    <div class="mode-bg-orb orb-one" aria-hidden="true"></div>
    <div class="mode-bg-orb orb-two" aria-hidden="true"></div>
    <div class="mode-castle" aria-hidden="true"></div>
    <div class="mode-particles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <button class="mode-back-btn" onclick="home()" aria-label="Retour">← <span>Retour</span></button>
    <div class="mode-top-symbol" aria-hidden="true">☷</div>
    <header class="mode-header-premium">
      <h1>Choisis un mode</h1>
      <p>Sélectionne le style de partie avant de choisir les joueurs.</p>
    </header>
    <div class="mode-separator" aria-hidden="true"><span></span><b>◇</b><span></span></div>
    <section class="mode-card-list" aria-label="Modes de jeu MORDRA">
      ${modes.map(m=>`
        <button type="button" class="mode-choice-card ${m.soon?"is-soon":"is-ready"}" ${m.soon?`aria-disabled="true" onclick="modeSoon(this, '${m.name.replaceAll("'","\'")}')"`:`onclick="selectMode('${m.id}')"`}>
          <span class="mode-choice-icon" aria-hidden="true"><em>${iconMap[m.id]||m.icon}</em></span>
          <span class="mode-choice-content">
            <span class="mode-choice-title">${m.name}${m.soon?'<strong class="mode-soon-badge">Bientôt</strong>':""}</span>
            <span class="mode-choice-desc">${m.desc}</span>
          </span>
          <span class="mode-choice-arrow" aria-hidden="true">›</span>
        </button>
      `).join("")}
    </section>
  </div>`);
}
function modeSoon(el, name){
  lockedFeedback(el, `${name} arrive dans une prochaine mise à jour.`);
}

function selectMode(id){
  state.selectedMode = mordraModes[id] || mordraModes.classic;
  setup();
}

function setup(){
  try{ clearDiscussionTimer() }catch(e){}
  state.players=[];
  const mode = state.selectedMode || mordraModes.classic;
  const isMystery = mode.roleMode === "hidden";
  const defaultMinutes = mode.minutes || 3;
  const ruleText = isMystery ? "Mystère : mot seulement" : (mode.id === "blitz" ? "Blitz : discussion à 1 minute" : "Classique : Tueur sans mot");
  const modeIcon = mode.id === "mystery" ? "🔮" : (mode.id === "blitz" ? "⚡" : "⚔️");
  screen(`<div class="newgame-premium">
    <div class="ng-fog ng-fog-a" aria-hidden="true"></div>
    <div class="ng-fog ng-fog-b" aria-hidden="true"></div>
    <div class="ng-particles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <button type="button" class="ng-back" onclick="modeSelect()">← <span>Retour</span></button>
    <header class="ng-title-wrap">
      <div class="ng-title-icon" aria-hidden="true">🎮</div>
      <h1>Nouvelle partie</h1>
    </header>
    <section class="ng-mode-card">
      <div class="ng-mode-head"><span class="ng-mode-symbol">${modeIcon}</span><strong>Mode sélectionné : ${mode.name}</strong></div>
      <p>${mode.desc}</p>
      <h2>${ruleText}</h2>
      <button type="button" class="ng-change-btn" onclick="modeSelect()">Changer</button>
    </section>

    <section class="ng-settings" aria-label="Réglages de partie">
      ${setupStepperHTML('count','👥','Joueurs',4,3,12)}
      ${setupStepperHTML('killers','🗡️','Tueurs',1,1,3)}
      ${setupStepperHTML('minutes','🕒','Temps discussion/vote (minutes)',defaultMinutes,1,20)}
    </section>

    <button type="button" class="ng-continue" onclick="selectPlayers()"><span>Continuer</span></button>
    <div class="ng-footer-mark" aria-hidden="true">MORDRA</div>
  </div>`);
}

function setupStepperHTML(id, icon, label, value, min, max){
  return `<div class="ng-stepper" data-stepper="${id}">
    <div class="ng-step-icon" aria-hidden="true">${icon}</div>
    <div class="ng-step-main">
      <label for="${id}">${label}</label>
      <input id="${id}" class="ng-value-input" type="number" min="${min}" max="${max}" value="${value}" readonly aria-label="${label}">
    </div>
    <div class="ng-step-controls">
      <button type="button" onclick="adjustSetupValue('${id}',1)">⌃</button>
      <button type="button" onclick="adjustSetupValue('${id}',-1)">⌄</button>
    </div>
  </div>`;
}

function adjustSetupValue(id, delta){
  const el = document.getElementById(id);
  if(!el) return;
  const min = Number(el.min || 0);
  const max = Number(el.max || 99);
  let value = Number(el.value || min) + delta;
  value = Math.max(min, Math.min(max, value));
  el.value = value;
  try{ sound('click') }catch(e){}
}

function selectPlayers(){
  const count=+document.getElementById("count").value;
  const killers=+document.getElementById("killers").value;
  const mode=state.selectedMode||mordraModes.classic; const chosenMinutes=mode.minutes||(+document.getElementById("minutes").value); state.setup={count,killers,minutes:chosenMinutes,roleMode:mode.roleMode||"visible",gameMode:mode.id};
  state.players=[];
  const ps=allPlayers();
  screen(`<div class="card">${back("setup()")}<h1>Joueurs de la partie</h1>
    <p class="small">Sélectionne ${count} joueurs. Les joueurs sélectionnés apparaissent juste en dessous.</p>
    <button class="btn secondary" onclick="quickAddPlayer()">➕ Nouveau joueur</button>
    <div id="selectionMessage" class="hidden"></div><h2>✅ Sélectionnés</h2>
    <div id="selectedList" class="selected-list"><p class="small">Aucun joueur sélectionné.</p></div>
    <p class="small" id="chosen">0/${count}</p>
    <h2>Joueurs enregistrés</h2>
    <div id="sel">${ps.map(p=>`<button id="pick_${p.name.replaceAll(" ","_")}" class="btn secondary" onclick="toggleSelect('${p.name.replaceAll("'","\\'")}')">${p.name}</button>`).join("")||"<p class='small'>Aucun joueur. Ajoute un joueur.</p>"}</div>
    <button class="btn" onclick="launchGame()">▶️ Lancer partie</button>
  </div>`);
  renderSelectedPlayers();
}
function quickAddPlayer(){const n=prompt("Nom du joueur"); if(!n)return; try{createPlayer(n); selectPlayers()}catch(e){alert(e.message)}}
function renderSelectedPlayers(){
  const box=document.getElementById("selectedList");
  const chosen=document.getElementById("chosen");
  if(chosen) chosen.textContent=state.players.length+"/"+state.setup.count;
  document.querySelectorAll("#sel button").forEach(b=>b.classList.remove("selected-pick"));
  state.players.forEach(n=>{
    const btn=document.getElementById("pick_"+n.replaceAll(" ","_"));
    if(btn) btn.classList.add("selected-pick");
  });
  if(!box) return;
  if(!state.players.length){
    box.innerHTML=`<p class="small">Aucun joueur sélectionné.</p>`;
    return;
  }
  box.innerHTML=state.players.map((n,i)=>`<div class="selected-player"><div><b>Joueur ${i+1}</b><br><span class="small">${n}</span></div><button class="mini-btn" onclick="toggleSelect('${n.replaceAll("'","\\'")}')">Retirer</button></div>`).join("");
}

function toggleSelect(n){
  const i=state.players.indexOf(n);
  if(i>=0){
    state.players.splice(i,1);
    sound("click");
  }else{
    if(state.players.length>=state.setup.count) return alert("Toutes les places sont déjà prises.");
    state.players.push(n);
    sound("click");
  }
  renderSelectedPlayers();
}
function launchGame(){ if(state.players.length!==state.setup.count)return alert("Sélectionne tous les joueurs."); stopMenuMusicForGame(); const pair=words[Math.floor(Math.random()*words.length)]; let ids=state.players.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,state.setup.killers); state.game={id:Date.now(),pair,round:0,winner:null,votes:{},starter:null,roleMode:state.setup?.roleMode||"visible",gameMode:state.setup?.gameMode||"classic",gameModeName:(state.selectedMode||mordraModes.classic).name,discussionMinutes:state.setup?.minutes||3,players:state.players.map((n,i)=>({name:n,role:ids.includes(i)?"killer":"survivor",alive:true}))}; state.game.starter=state.game.players[Math.floor(Math.random()*state.game.players.length)].name; revealPass(0)}
function revealPass(i){
  try{
    if(!state.game || !state.game.players){
      home();
      return;
    }

    if(i >= state.game.players.length){
      if(!state.game.starter && state.game.players.length){
        const alivePlayers = state.game.players.filter(p=>p.alive!==false);
        const pool = alivePlayers.length ? alivePlayers : state.game.players;
        state.game.starter = pool[Math.floor(Math.random()*pool.length)].name;
      }
      discussion();
      return;
    }

    const gp = state.game.players[i];
    screen(`<div class="card mobile-center-card">${playerCard(getPlayer(gp.name)||defaultPlayer(gp.name))}
      <p class="small">Passe le téléphone à ${gp.name}. Cache bien l'écran.</p>
      <p class="small">${state.game.roleMode==="hidden"?"Mode mystère activé : seul le mot sera affiché.":"Mode classique : rôle + mot seront affichés."}</p>
      <button class="btn" onclick="revealWord(${i})">Dévoiler</button>
    </div>`);
  }catch(err){
    console.error("revealPass error", err);
    screen(`<div class="card mobile-center-card"><h1>⏳ Discussion</h1><div class="mode-mini-badge">${state.game.gameModeName||"Classique"}</div>
      <p class="small">La révélation est terminée. Vous pouvez discuter puis voter.</p>
      <button class="btn" onclick="discussion()">Continuer</button>
      <button class="btn secondary" onclick="home()">Menu</button>
    </div>`);
  }
}
function discussion(){
  try{
    if(!state.game || !state.game.players){
      home();
      return;
    }

    const alivePlayers = state.game.players.filter(p=>p.alive!==false);
    const pool = alivePlayers.length ? alivePlayers : state.game.players;
    const starter = state.game.starter || pool[Math.floor(Math.random()*pool.length)].name;
    state.game.starter = starter;

    const modeText = state.game.roleMode==="hidden"
      ? "Mode mystère : personne ne connaît officiellement son rôle. Observez les mots et les réactions."
      : "Débattez, puis passez au vote.";

    screen(`<div class="card mobile-center-card"><h1>⏳ Discussion</h1>
      <div class="result-line"><b>🎙️ ${starter} commence à parler</b><br><span class="small">Ensuite, chacun peut répondre et se défendre.</span></div>
      <p class="small">${modeText}</p>
      <button class="btn" onclick="votePass(0)">Voter</button>
    </div>`);
  }catch(err){
    console.error("discussion error", err);
    screen(`<div class="card mobile-center-card"><h1>⏳ Discussion</h1>
      <p class="small">Vous pouvez discuter puis lancer le vote.</p>
      <button class="btn" onclick="votePass(0)">Voter</button>
      <button class="btn secondary" onclick="home()">Menu</button>
    </div>`);
  }
}
function votePass(i){
  const alive=state.game.players.map((p,idx)=>({...p,idx})).filter(p=>p.alive);
  if(i>=alive.length)return resolveVote();
  const p=alive[i];

  screen(`<div class="card mobile-center-card vote-turn-card">
    <div class="vote-pulse">🗳️</div>
    <h1>À ${p.name} de voter</h1>
    <p class="small">Passe le téléphone à ${p.name}. Il doit voter en secret.</p>
    <button class="btn" onclick="sound('click'); voteChoice(${i})">Voter</button>
  </div>`);
}

function voteChoice(i){
  const alive=state.game.players.map((p,idx)=>({...p,idx})).filter(p=>p.alive);
  const p=alive[i];
  if(!p)return resolveVote();

  screen(`<div class="card mobile-center-card">
    ${playerCard(getPlayer(p.name)||defaultPlayer(p.name))}
    <h1>${p.name} vote</h1>
    <p class="small">Choisis la personne que tu veux éliminer.</p>
    ${alive.filter(x=>x.idx!==p.idx).map(t=>`<button class="btn secondary" onclick="confirmVote(${p.idx},${t.idx},${i})">${t.name}</button>`).join("")}
  </div>`);
}

function confirmVote(voterIdx,targetIdx,i){
  sound("good");
  state.game.votes[voterIdx]=targetIdx;
  const voter=state.game.players[voterIdx];
  const target=state.game.players[targetIdx];
  const alive=state.game.players.filter(p=>p.alive);
  const nextAlive=alive[i+1];

  screen(`<div class="card mobile-center-card vote-confirm-card">
    <div class="vote-check">✅</div>
    <h1>Vote enregistré</h1>
    <p class="small">${voter.name} a voté.</p>
    <div class="result-line"><b>Prochain joueur</b><br><span class="xp">${nextAlive ? nextAlive.name : "Résultat du vote"}</span></div>
  </div>`);

  setTimeout(()=>{
    votePass(i+1);
  }, 1200);
}

function resolveVote(){let counts={}; Object.values(state.game.votes).forEach(v=>counts[v]=(counts[v]||0)+1); const vals=Object.entries(counts).sort((a,b)=>b[1]-a[1]); if(vals.length>1&&vals[0][1]===vals[1][1]) return showVerdictResultThen(()=>screen(`<div class="card mobile-center-card"><h1>Égalité</h1><p class="small">Aucun éliminé. Nouveau vote.</p><button class="btn" onclick="state.game.votes={}; votePass(0)">Revoter</button></div>`)); const elim=+vals[0][0]; state.game.players[elim].alive=false; const aliveKillers=state.game.players.filter(p=>p.alive&&p.role==="killer").length; const aliveSurv=state.game.players.filter(p=>p.alive&&p.role==="survivor").length; if(aliveKillers===0)state.game.winner="survivors"; else if(aliveKillers>=aliveSurv)state.game.winner="killers"; if(state.game.winner)return showVerdictResultThen(()=>endGame()); showVerdictResultThen(()=>screen(`<div class="card mobile-center-card"><h1>${state.game.players[elim].name} éliminé</h1><p class="small">Il reste encore un tueur.</p><button class="btn" onclick="state.game.votes={}; discussion()">Continuer</button></div>`))}
function endGame(){screen(`<div class="card mobile-center-card"><h1>${state.game.winner==="killers"?"🔪 LES TUEURS GAGNENT":"🛡️ LES SURVIVANTS GAGNENT"}</h1><button class="btn" onclick="saveGame()">Valider et enregistrer</button></div>`)}
function saveGame(){
  const stats=loadStats();
  const hist=loadHistory();
  if(hist.find(h=>h.id===state.game.id))return alert("Déjà enregistré.");
  const oldM=mvp()?.name;
  const rewards=[];
  state.game.players.forEach((gp,i)=>{
    let p=getPlayer(gp.name)||defaultPlayer(gp.name);
    const beforeLevel=levelFromXP(p.totalXP);
    const win=(gp.role==="killer"&&state.game.winner==="killers")||(gp.role==="survivor"&&state.game.winner==="survivors");
    const xp=win?160:70;
    const shards=win?65:20;
    p.games++;
    p.totalXP+=xp;
    p.wallet.shards+=shards;
    if(win){p.wins++;p.streak++}else{p.losses++;p.streak=0}
    p.bestStreak=Math.max(p.bestStreak,p.streak);
    const r=gp.role==="killer"?p.killer:p.survivor;
    r.games++;
    r.xp+=xp;
    if(win){r.wins++;r.streak=(r.streak||0)+1}else r.streak=0;
    r.bestStreak=Math.max(r.bestStreak||0,r.streak||0);
    const afterLevel=levelFromXP(p.totalXP);
    rewards.push({name:gp.name,win,xp,shards,beforeLevel,afterLevel,role:gp.role});
    savePlayer(p);
  });
  hist.push({id:state.game.id,date:new Date().toISOString(),winner:state.game.winner,players:state.game.players,pair:state.game.pair});
  saveHistory(hist); try{achCheckAll305();}catch(e){console.warn(e)}
  sound("level");
  const newM=mvp()?.name;
  const rewardHtml=rewards.map(r=>`<div class="result-line"><b>${r.win?"🏆":"🎮"} ${r.name}</b><br><span class="small">${r.role==="killer"?"Tueur":"Survivant"} • ${r.win?"Victoire":"Participation"}</span><br><span class="xp">+${r.xp} XP • +${r.shards} 🩸</span>${r.afterLevel>r.beforeLevel?`<br><span class="xp">✨ Niveau ${r.beforeLevel} ➜ ${r.afterLevel}</span>`:""}</div>`).join("");
  if(state.championship && state.championship.active){
    championshipAfterSavedGame400(rewards, rewardHtml, oldM, newM);
    return;
  }
  screen(`<div class="card"><h1>Récompenses obtenues 🎁</h1><p class="small">Tout est sauvegardé automatiquement.</p>${rewardHtml}${oldM&&newM&&oldM!==newM?`<div class="mvp-card player-card"><div class="mvp-badge">👑 Nouveau MVP</div><h1>${newM}</h1></div>`:""}<button class="btn" onclick="showVictoryChest()">🎁 Ouvrir le coffre de victoire</button><button class="btn secondary" onclick="leaderboard()">Classement</button><button class="btn ghost" onclick="home()">Menu</button></div>`);
}


function shopHub(){
  screen(`<div class="card">${back()}<h1>🛒 Boutique</h1>
    <p class="small">Tout ce qui concerne les récompenses, objets, cosmétiques et progression de boutique est rangé ici.</p>

    <button class="btn" onclick="marketSelect()">🩸 Blood Market</button>
    <button class="btn secondary" onclick="shopDirectSelect()">🛒 Boutique tournante</button>
    <button class="btn secondary" onclick="passSelect()">🛡️ Passe des Ombres</button>
    <button class="btn secondary" onclick="collectionSelect()">🎁 Collection</button>

    <div class="result-line">
      <b>🩸 Blood Market</b><br>
      <span class="small">Choisis un joueur, achète des objets, équipe tes récompenses et récupère tes paliers.</span>
    </div>
  </div>`);
}

function shopDirectSelect(){
  const ps=allPlayers();
  screen(`<div class="card">${back("shopHub()")}<h1>🛒 Boutique tournante</h1>
    <p class="small">Choisis le joueur qui va entrer dans la boutique.</p>
    ${ps.map(p=>`<div class="listitem" onclick="shop('${p.name.replaceAll("'","\\'")}','all')"><div><b>${p.name}</b><br><span class="small">🩸 ${p.wallet.shards}</span></div><span>›</span></div>`).join("")||"<p class='small'>Crée un joueur dans Statistiques.</p>"}
  </div>`);
}

function passSelect(){
  const ps=allPlayers();
  screen(`<div class="card">${back("shopHub()")}<h1>🛡️ Passe des Ombres</h1>
    <p class="small">Choisis le joueur pour consulter ses 100 paliers.</p>
    ${ps.map(p=>`<div class="listitem" onclick="pass('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">Palier selon son XP</span></div><span>›</span></div>`).join("")||"<p class='small'>Crée un joueur dans Statistiques.</p>"}
  </div>`);
}

function marketSelect(){ const ps=allPlayers(); screen(`<div class="card">${back("shopHub()")}<h1>🩸 Blood Market</h1>${ps.map(p=>`<div class="listitem" onclick="market('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">🩸 ${p.wallet.shards}</span></div><span>›</span></div>`).join("")||"<p class='small'>Crée un joueur dans Statistiques.</p>"}</div>`)}
function market(n){const p=getPlayer(n); screen(`<div class="card">${back("marketSelect()")}<h1>🩸 Blood Market</h1><div class="badge">🩸 ${p.wallet.shards}</div><button class="btn" onclick="shop('${n}','all')">🛒 Boutique</button><button class="btn secondary" onclick="pass('${n}')">🛡️ Passe des Ombres</button><button class="btn secondary" onclick="collection('${n}')">🎁 Collection</button></div>`)}
function hourKey(){return Math.floor(Date.now()/3600000)}
function shopResetText(){
  const next=(hourKey()+1)*3600000;
  const diff=Math.max(0,next-Date.now());
  const m=String(Math.floor(diff/60000)).padStart(2,"0");
  const s=String(Math.floor((diff%60000)/1000)).padStart(2,"0");
  return `${m}:${s}`;
} function rand(s){let x=Math.sin(s)*10000; return x-Math.floor(x)} function deal(){const pool=shopItems.filter(i=>i.price>0); return pool[Math.floor(rand(hourKey()*777)*pool.length)]}
function shop(n,type="all"){const p=getPlayer(n); const tabs=["all","banner","badge","frame","title"]; const d=deal(); const pool=shopItems.filter(i=>type==="all"||i.type===type).map((it,i)=>({it,score:rand(hourKey()*999+i*31)})).sort((a,b)=>a.score-b.score).slice(0,8).map(x=>x.it); screen(`<div class="card shop-screen">${back(`market('${n.replaceAll("'","\\'")}')`)}
  <div class="shop-wallet"><span>${p.name}</span><b>🩸 ${p.wallet.shards}</b></div>
  <h1>🛒 Boutique</h1>
  <div class="result-line"><b>⏳ Réinitialisation boutique</b><br><span class="xp">${shopResetText()}</span><br><span class="small">La sélection change toutes les heures.</span></div>
  <div class="tabs">${tabs.map(t=>`<button class="tab ${type===t?"active":""}" onclick="shop('${n.replaceAll("'","\\'")}','${t}')">${t}</button>`).join("")}</div>${type==="all"?shopLine(p,d,n,true):""}${pool.map(it=>shopLine(p,it,n,false)).join("")}</div>`)}
function shopLine(p,it,n,isDeal){const price=isDeal?Math.floor(it.price*.65):it.price; const own=owned(p,it); return `<div class="shop-item ${isDeal?"deal":""}"><div class="shop-icon">${it.icon}</div><div class="shop-info"><b>${isDeal?"🔥 ":""}${it.name}</b><br><span class="small">${it.rarity} • ${it.type}</span><br><span class="xp">🩸 ${price}</span></div><button class="mini-btn" ${own?"disabled":""} onclick="buy('${n.replaceAll("'","\\'")}','${it.id}',${price})">${own?"Déjà":"Acheter"}</button></div>`}
function buy(n,id,price){let p=getPlayer(n); const it=shopItems.find(x=>x.id===id); if(!it)return; if(owned(p,it))return alert("Déjà possédé."); if(p.wallet.shards<price)return alert("Pas assez d'Éclats."); if(!confirm(`Acheter ${it.name} ?`))return; p.wallet.shards-=price; give(p,it); savePlayer(p); sound("level"); collection(n)}
function collectionSelect(){const ps=allPlayers(); screen(`<div class="card">${back("shopHub()")}<h1>🎁 Collection</h1>${ps.map(p=>`<div class="listitem" onclick="collection('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">Bannières, badges, cadres, titres</span></div><span>›</span></div>`).join("")||"<p class='small'>Aucun joueur.</p>"}</div>`)}
function collection(n){const p=getPlayer(n); const sec=(type,title)=>`<h2>${title}</h2>`+shopItems.filter(i=>i.type===type).map(it=>{const own=owned(p,it); const eq=type==="banner"?p.eq.banner===it.id:type==="frame"?p.eq.frame===it.id:type==="title"?p.eq.title===it.id:p.eq.badges.includes(it.id); return `<div class="shop-item ${own?"":"locked"} ${eq?"equipped":""}"><div class="shop-icon">${it.icon}</div><div class="shop-info"><b>${it.name} ${eq?"✅":own?"":"🔒"}</b><br><span class="small">${it.rarity}</span></div><button class="mini-btn" ${own?"":"disabled"} onclick="equip('${n.replaceAll("'","\\'")}','${it.id}')">${eq?"Équipé":"Équiper"}</button></div>`}).join(""); screen(`<div class="card">${back("collectionSelect()")}<h1>🎁 Collection</h1>${playerCard(p)}${sec("banner","🖼️ Bannières")}${sec("badge","🏅 Badges")}${sec("frame","👑 Cadres")}${sec("title","⭐ Titres")}</div>`)}
function equip(n,id){let p=getPlayer(n); const it=shopItems.find(x=>x.id===id); if(!it||!owned(p,it))return; if(it.type==="banner")p.eq.banner=id; if(it.type==="frame")p.eq.frame=p.eq.frame===id?null:id; if(it.type==="title")p.eq.title=p.eq.title===id?null:id; if(it.type==="badge"){ if(p.eq.badges.includes(id))p.eq.badges=p.eq.badges.filter(x=>x!==id); else{ if(p.eq.badges.length>=3)p.eq.badges.shift(); p.eq.badges.push(id)}} savePlayer(p); sound('click'); collection(n)}
function pass(n){const p=getPlayer(n); const xp=Math.floor(p.totalXP/2)+p.games*35; const lvl=Math.min(100,Math.floor(xp/250)+1); const prog=xp%250; const tiers=Array.from({length:100},(_,i)=>i+1).map(i=>{const unlocked=i<=lvl, claimed=p.passClaimed.includes(i); return `<div class="pass-tier ${claimed?"equipped":unlocked?"deal":"locked"}"><div class="shop-info"><b>Palier ${i}</b><br><span class="small">${i%10===0?"Objet cosmétique":"Éclats de Sang"}</span><br><span class="xp">+${80+i*8} 🩸</span></div><button class="mini-btn" ${!unlocked||claimed?"disabled":""} onclick="claimPass('${n.replaceAll("'","\\'")}',${i})">${claimed?"Pris":unlocked?"Récupérer":"Bloqué"}</button></div>`}).join(""); screen(`<div class="card">${back(`market('${n.replaceAll("'","\\'")}')`)}<h1>🛡️ Passe des Ombres</h1><p class="xp">Se termine dans 30 jours</p><div class="level-card"><div class="level-head"><b>Palier ${lvl}/100</b><span class="badge">${xp} XP</span></div><div class="level-bar"><div style="width:${Math.round(prog/250*100)}%"></div></div></div>${tiers}</div>`)}
function claimPass(n,l){let p=getPlayer(n); if(p.passClaimed.includes(l))return; const xp=Math.floor(p.totalXP/2)+p.games*35; if(l>Math.min(100,Math.floor(xp/250)+1))return; p.wallet.shards+=80+l*8; p.passClaimed.push(l); if(l%10===0){const pool=shopItems.filter(i=>!owned(p,i)); if(pool.length)give(p,pool[Math.floor(Math.random()*pool.length)])} savePlayer(p); pass(n)}


/* =========================================================
   MORDRA 3.3.2 — ACHIEVEMENTS STABLE
   Succès uniquement. Ne touche pas au lancement ni aux parties.
========================================================= */

const ACH_SAVE_KEY_305 = "mordra_305_achievements";

function achLoad305(){
  return loadJSON(ACH_SAVE_KEY_305,{});
}

function achSave305(data){
  saveJSON(ACH_SAVE_KEY_305,data);
}

function achRewardPlayer305(playerName, amount){
  const p = getPlayer(playerName);
  if(!p) return;
  p.wallet.shards += amount;
  savePlayer(p);
}

function achCollectionCount305(p){
  p = normalize(p);
  return (p.inv?.banners?.length||0) + (p.inv?.badges?.length||0) + (p.inv?.frames?.length||0) + (p.inv?.titles?.length||0);
}

function achDefs305(){
  const defs=[];
  const add=(id,cat,name,desc,rarity,goal,value,reward,secret=false)=>{
    defs.push({id,cat,name,desc,rarity,goal,value,reward,secret});
  };

  const tiers = [
    [1,"Commun",100],
    [5,"Commun",150],
    [10,"Rare",250],
    [25,"Rare",500],
    [50,"Épique",1000],
    [100,"Épique",2200],
    [250,"Légendaire",6000],
    [500,"Légendaire",12000],
    [1000,"Mythique",30000]
  ];

  tiers.forEach(([n,r,rew])=>{
    add("games_"+n,"Parties",n===1?"Première partie":`${n} parties`,`Jouer ${n} partie${n>1?"s":""}.`,r,n,p=>p.games||0,rew);
  });

  [[1,"Commun",150],[5,"Rare",350],[10,"Rare",700],[25,"Épique",1600],[50,"Épique",3500],[100,"Légendaire",9000],[250,"Mythique",24000]].forEach(([n,r,rew])=>{
    add("wins_"+n,"Victoires",n===1?"Première victoire":`${n} victoires`,`Gagner ${n} partie${n>1?"s":""}.`,r,n,p=>p.wins||0,rew);
  });

  [3,5,10,15,20,30].forEach((n,i)=>{
    add("streak_"+n,"Séries",`${n} victoires d'affilée`,`Atteindre une série de ${n} victoires.`,["Rare","Rare","Épique","Épique","Légendaire","Mythique"][i],n,p=>p.bestStreak||0,500+n*250);
  });

  [1,5,10,25,50,100].forEach((n,i)=>{
    add("killer_"+n,"Tueur",n===1?"Premier massacre":`${n} victoires Tueur`,`Gagner ${n} fois en tant que Tueur.`,["Commun","Rare","Rare","Épique","Légendaire","Mythique"][i],n,p=>p.killer?.wins||0,200+n*120);
  });

  [1,5,10,25,50,100].forEach((n,i)=>{
    add("survivor_"+n,"Survivant",n===1?"Premier sauvetage":`${n} victoires Survivant`,`Gagner ${n} fois en tant que Survivant.`,["Commun","Rare","Rare","Épique","Légendaire","Mythique"][i],n,p=>p.survivor?.wins||0,200+n*120);
  });

  [5,10,20,30,40,50,75,100].forEach((n,i)=>{
    add("level_"+n,"Niveaux",`Niveau ${n}`,`Atteindre le niveau général ${n}.`,["Commun","Rare","Rare","Épique","Épique","Légendaire","Légendaire","Mythique"][i],n,p=>levelFromXP(p.totalXP||0),300+n*100);
  });

  [500,1000,2500,5000,10000,25000,50000,100000].forEach((n,i)=>{
    add("shards_"+n,"Éclats",`${n} Éclats de Sang`,`Posséder ${n} Éclats de Sang.`,["Commun","Rare","Rare","Épique","Épique","Légendaire","Légendaire","Mythique"][i],n,p=>p.wallet?.shards||0,Math.floor(n/5));
  });

  [1,3,5,10,15,20,30,50].forEach((n,i)=>{
    add("collection_"+n,"Collection",`${n} objets débloqués`,`Posséder ${n} objet${n>1?"s":""} cosmétique${n>1?"s":""}.`,["Commun","Commun","Rare","Rare","Épique","Épique","Légendaire","Mythique"][i],n,p=>achCollectionCount305(p),250+n*150);
  });

  add("mvp_first","MVP","Première couronne","Être MVP au classement général.","Épique",1,p=>isMVP(p.name)?1:0,2500);
  add("vote_good_1","Votes","Premier bon vote","Trouver un Tueur avec ton vote.","Commun",1,p=>p.survivor?.goodVotes||0,200);
  add("vote_good_10","Votes","Détective","Faire 10 bons votes.","Rare",10,p=>p.survivor?.goodVotes||0,900);
  add("vote_good_50","Votes","Œil de MORDRA","Faire 50 bons votes.","Épique",50,p=>p.survivor?.goodVotes||0,4500);

  add("secret_zero","Secrets","???","Succès secret.","Secret",1,p=>(p.wallet?.shards||0)===0?1:0,1200,true);
  add("secret_collector","Secrets","???","Succès secret.","Secret",1,p=>achCollectionCount305(p)>=10?1:0,2000,true);

  add("legend_games","Légendes","Légende de MORDRA","Jouer 1000 parties.","Mythique",1000,p=>p.games||0,30000);
  add("legend_level","Légendes","Roi éternel","Atteindre le niveau 100.","Mythique",100,p=>levelFromXP(p.totalXP||0),40000);
  add("legend_wins","Légendes","Invincible","Gagner 250 parties.","Mythique",250,p=>p.wins||0,50000);

  return defs;
}

function achCheckPlayer305(playerName){
  const p = getPlayer(playerName);
  if(!p) return [];
  const store = achLoad305();
  store[p.name] ||= {};
  const unlocked=[];

  achDefs305().forEach(def=>{
    const val = Math.min(def.goal, def.value(p)||0);
    if(val >= def.goal && !store[p.name][def.id]){
      store[p.name][def.id] = {date:new Date().toISOString(), reward:def.reward};
      unlocked.push(def);
    }
  });

  if(unlocked.length){
    unlocked.forEach(d=>achRewardPlayer305(p.name,d.reward||0));
    achSave305(store);
  }
  return unlocked;
}

function achCheckAll305(){
  const packs=[];
  allPlayers().forEach(p=>{
    const u=achCheckPlayer305(p.name);
    if(u.length)packs.push({name:p.name,items:u});
  });
  return packs;
}

function achRarityClass305(r){
  return "ach-rarity-"+String(r||"Commun").toLowerCase().replace("é","e").replace("è","e").replace(" ","-");
}

function achievementsMenu(){
  const players = allPlayers();
  if(!players.length){
    screen(`<div class="card">${back()}<h1>🏅 Succès</h1>
      <p class="small">Crée d'abord un joueur dans Statistiques.</p>
      <button class="btn" onclick="statsList()">Créer un joueur</button>
    </div>`);
    return;
  }

  const total=achDefs305().length;
  const store=achLoad305();

  screen(`<div class="card">${back()}<h1>🏅 Succès</h1>
    <p class="small">Choisis un joueur pour voir tous ses défis, raretés, progression et récompenses.</p>
    ${players.map(p=>{
      achCheckPlayer305(p.name);
      const current=achLoad305()[p.name]||{};
      const done=Object.keys(current).length;
      return `<div class="listitem" onclick="achievementsPlayer('${p.name.replaceAll("'","\\'")}','Tous')">
        <div><b>${p.name}</b><br><span class="small">${done}/${total} succès débloqués</span></div>
        <span class="badge">${Math.round(done/total*100)}%</span>
      </div>`;
    }).join("")}
  </div>`);
}

function achievementsPlayer(name,cat="Tous"){
  const p=getPlayer(name);
  if(!p)return achievementsMenu();

  achCheckPlayer305(name);
  const defs=achDefs305();
  const store=achLoad305()[name]||{};
  const total=defs.length;
  const done=Object.keys(store).length;
  const cats=["Tous",...Array.from(new Set(defs.map(d=>d.cat)))];
  const filtered=defs.filter(d=>cat==="Tous"||d.cat===cat);

  let tabs="";
  for(let i=0;i<cats.length;i+=3){
    tabs += `<div class="tabs">${cats.slice(i,i+3).map(c=>`<button class="tab ${cat===c?"active":""}" onclick="achievementsPlayer('${name.replaceAll("'","\\'")}','${c}')">${c}</button>`).join("")}</div>`;
  }

  screen(`<div class="card">${back("achievementsMenu()")}<h1>🏅 ${name}</h1>
    <div class="level-card">
      <div class="level-head"><div><span class="small">Progression succès</span><b>${done}/${total}</b></div><span class="badge">${Math.round(done/total*100)}%</span></div>
      <div class="level-bar"><div style="width:${Math.round(done/total*100)}%"></div></div>
    </div>
    ${tabs}
    ${filtered.map(def=>{
      const unlocked=!!store[def.id];
      const val=Math.min(def.goal,def.value(p)||0);
      const pct=Math.min(100,Math.round(val/def.goal*100));
      const title=def.secret&&!unlocked?"???":def.name;
      const desc=def.secret&&!unlocked?"Succès secret. Continue à jouer pour le découvrir.":def.desc;
      return `<div class="achievement-card ${achRarityClass305(def.rarity)} ${unlocked?"unlocked":"locked"}">
        <div class="achievement-head"><b>${unlocked?"✅":"🔒"} ${title}</b><span>${def.rarity}</span></div>
        <p class="small">${desc}</p>
        <div class="level-bar"><div style="width:${pct}%"></div></div>
        <div class="small">${val}/${def.goal} • Récompense : <span class="xp">${def.reward} 🩸</span></div>
      </div>`;
    }).join("")}
  </div>`);
}

function achievements(){
  return achievementsMenu();
}

function settings(){
  const cfg=getAudioSettings();
  const musicPct = Math.round((cfg.musicVolume ?? .65) * 100);
  const sfxPct = Math.round((cfg.sfxVolume ?? .8) * 100);
  screen(`<div class="card settings-premium">${back()}<h1>⚙️ Paramètres</h1>
    <h2>Audio</h2>
    <div class="audio-setting-card">
      <div class="audio-setting-head"><span>🎵 Musique</span><b id="musicVolumeLabel">${musicPct}%</b></div>
      <input class="mordra-slider" type="range" min="0" max="100" value="${musicPct}" oninput="setMusicVolume(this.value)">
      <button class="btn secondary" onclick="toggleMenuMusic(); settings()">${cfg.musicEnabled?"🔊 Musique activée":"🔇 Musique coupée"}</button>
    </div>
    <div class="audio-setting-card">
      <div class="audio-setting-head"><span>🔔 Effets sonores</span><b id="sfxVolumeLabel">${sfxPct}%</b></div>
      <input class="mordra-slider" type="range" min="0" max="100" value="${sfxPct}" oninput="setSfxVolume(this.value)">
      <button class="btn secondary" onclick="toggleSfxSetting(); settings()">${cfg.sfxEnabled?"🔔 Effets activés":"🔕 Effets coupés"}</button>
    </div>
    <button class="btn secondary" onclick="toggleVibrationsSetting()">${cfg.vibrationsEnabled?"📳 Vibrations activées":"📴 Vibrations coupées"}</button>
    <button class="btn secondary" onclick="dataSettings()">💾 Données</button><button class="btn secondary" onclick="credits()">ℹ️ À propos / Crédits</button></div>`)}
function toggleSfxSetting(){ const cfg=getAudioSettings(); cfg.sfxEnabled=!cfg.sfxEnabled; setAudioSettings(cfg); }

function dataSettings(){screen(`<div class="card">${back("settings()")}<h1>💾 Données</h1><div class="success-box">✅ Sauvegarde automatique activée</div><p class="small">Tout est enregistré automatiquement sur cet appareil.</p><button class="btn secondary" onclick="exportData()">📤 Exporter</button><button class="btn secondary" onclick="importData()">📥 Importer</button><button class="btn danger" onclick="resetData()">🗑️ Réinitialiser</button></div>`)}
function exportData(){const data=JSON.stringify({stats:loadStats(),history:loadHistory()},null,2); navigator.clipboard?.writeText(data).then(()=>alert("Copié ✅")).catch(()=>prompt("Copie tes données :",data))}
function importData(){try{const t=prompt("Colle tes données :"); if(!t)return; const d=JSON.parse(t); if(d.stats)saveStats(d.stats); if(d.history)saveHistory(d.history); home()}catch(e){alert("Import impossible.")}}
function resetData(){if(confirm("Tout effacer ?")&&confirm("Vraiment tout remettre à zéro ?")){localStorage.removeItem(saveKey);localStorage.removeItem(historyKey);home()}}
function credits(){screen(`<div class="card">${back("settings()")}<div class="logo">MORDRA</div><p class="small" style="text-align:center">Version Test 4.00</p><div class="listitem"><div><b>AN ORIGINAL GAME BY</b><br>Kevin Moreau</div></div><div class="listitem"><div><b>DEVELOPED WITH THE ASSISTANCE OF</b><br>ChatGPT</div></div></div>`)}
intro();



/* =========================================================
   MORDRA 3.3.2 — REVEAL BUTTON FIX
   Réparation ciblée du bouton Dévoiler.
========================================================= */

function safeCardPlayerForReveal(name){
  try{
    return playerCard(getPlayer(name)||defaultPlayer(name));
  }catch(e){
    return `<div class="player-card"><h1>${name}</h1></div>`;
  }
}

function revealPass(i){
  try{
    if(!state || !state.game || !state.game.players){
      home();
      return;
    }

    if(i >= state.game.players.length){
      if(!state.game.starter && state.game.players.length){
        const alivePlayers = state.game.players.filter(p=>p.alive!==false);
        const pool = alivePlayers.length ? alivePlayers : state.game.players;
        state.game.starter = pool[Math.floor(Math.random()*pool.length)].name;
      }
      discussion();
      return;
    }

    const gp = state.game.players[i];
    const modeLine = state.game.roleMode === "hidden"
      ? "Mode mystère : seul le mot sera affiché."
      : "Mode classique : rôle + mot seront affichés.";

    screen(`<div class="card mobile-center-card">
      ${safeCardPlayerForReveal(gp.name)}
      <p class="small">Passe le téléphone à ${gp.name}. Cache bien l'écran.</p>
      <p class="small">${modeLine}</p>
      <button class="btn" onclick="revealWord(${i})">Dévoiler</button>
    </div>`);
  }catch(err){
    console.error("revealPass fixed error", err);
    screen(`<div class="card mobile-center-card">
      <h1>Erreur révélation</h1>
      <p class="small">Tu peux continuer vers la discussion.</p>
      <button class="btn" onclick="discussion()">Continuer</button>
      <button class="btn secondary" onclick="home()">Menu</button>
    </div>`);
  }
}

function revealWord(i){
  try{
    if(!state || !state.game || !state.game.players || !state.game.players[i]){
      revealPass(i+1);
      return;
    }

    try{ sound("reveal"); }catch(e){}

    const gp = state.game.players[i];
    const pair = state.game.pair || ["Mot", "Mot"];
    const word = gp.role === "killer" ? pair[1] : pair[0];
    const hiddenMode = state.game.roleMode === "hidden";

    const roleTitle = hiddenMode ? "🎴 Ton mot" : (gp.role === "killer" ? "🔪 Tueur" : "🛡️ Survivant");
    const helper = hiddenMode
      ? "Personne ne voit son rôle dans ce mode. Retenez seulement votre mot."
      : "Retenez bien votre rôle et votre mot.";

    screen(`<div class="card mobile-center-card">
      <h1>${roleTitle}</h1>
      <div class="logo" style="font-size:38px">${word}</div>
      <p class="small">${helper}</p>
      <button class="btn" onclick="revealPass(${i+1})">Cacher et passer</button>
    </div>`);
  }catch(err){
    console.error("revealWord fixed error", err);
    revealPass(i+1);
  }
}

function discussion(){
  try{
    if(!state || !state.game || !state.game.players){
      home();
      return;
    }

    const alivePlayers = state.game.players.filter(p=>p.alive!==false);
    const pool = alivePlayers.length ? alivePlayers : state.game.players;
    const starter = state.game.starter || pool[Math.floor(Math.random()*pool.length)].name;
    state.game.starter = starter;

    const modeText = state.game.roleMode === "hidden"
      ? "Mode mystère : personne ne connaît officiellement son rôle. Observez les mots et les réactions."
      : "Débattez, puis passez au vote.";

    screen(`<div class="card mobile-center-card">
      <h1>⏳ Discussion</h1>
      <div class="result-line"><b>🎙️ ${starter} commence à parler</b><br><span class="small">Ensuite, chacun peut répondre et se défendre.</span></div>
      <p class="small">${modeText}</p>
      <button class="btn" onclick="votePass(0)">Voter</button>
    </div>`);
  }catch(err){
    console.error("discussion fixed error", err);
    screen(`<div class="card mobile-center-card">
      <h1>⏳ Discussion</h1>
      <p class="small">Vous pouvez discuter puis lancer le vote.</p>
      <button class="btn" onclick="votePass(0)">Voter</button>
      <button class="btn secondary" onclick="home()">Menu</button>
    </div>`);
  }
}



/* =========================================================
   MORDRA 3.3.2 — NEW PLAYER FLOW FIX
   Corrige ajout joueur depuis Nouvelle Partie.
========================================================= */

function renderPlayerSelectionList(){
  try{
    const list = document.getElementById("sel");
    if(!list || !state.setup) return;

    const ps = allPlayers();
    list.innerHTML = ps.length
      ? ps.map(p=>`<button id="pick_${p.name.replaceAll(" ","_")}" class="btn secondary" onclick="toggleSelect('${p.name.replaceAll("'","\\'")}')">${p.name}</button>`).join("")
      : "<p class='small'>Aucun joueur. Ajoute un joueur.</p>";

    if(typeof renderSelectedPlayers === "function"){
      renderSelectedPlayers();
    }else{
      const chosen = document.getElementById("chosen");
      if(chosen) chosen.textContent = state.players.length+"/"+state.setup.count;
    }
  }catch(err){
    console.error("renderPlayerSelectionList error", err);
  }
}

function showSelectionMessage(text, good=true){
  let msg = document.getElementById("selectionMessage");
  const card = document.querySelector(".card");
  if(!msg && card){
    msg = document.createElement("div");
    msg.id = "selectionMessage";
    const anchor = document.getElementById("selectedList") || document.getElementById("sel");
    card.insertBefore(msg, anchor || card.children[1]);
  }
  if(!msg) return;
  msg.className = good ? "success-box" : "error-box";
  msg.textContent = text;
  setTimeout(()=>{ if(msg) msg.className="hidden"; }, 1300);
}

function quickAddPlayer(){
  const n = prompt("Nom du joueur");
  if(!n) return;

  try{
    const clean = String(n).trim();
    if(!clean){
      showSelectionMessage("Entre un nom.", false);
      return;
    }

    let existing = getPlayer(clean);
    if(existing){
      if(!state.players.includes(existing.name) && state.players.length < state.setup.count){
        state.players.push(existing.name);
      }
      renderPlayerSelectionList();
      showSelectionMessage(existing.name+" était déjà créé, il est sélectionné ✅", true);
      return;
    }

    const created = createPlayer(clean);

    if(!state.players.includes(created.name) && state.players.length < state.setup.count){
      state.players.push(created.name);
    }

    try{ sound("good"); }catch(e){}
    renderPlayerSelectionList();
    showSelectionMessage(created.name+" créé et sélectionné ✅", true);
  }catch(err){
    console.error("quickAddPlayer error", err);
    showSelectionMessage(err.message || "Impossible de créer le joueur.", false);
    renderPlayerSelectionList();
  }
}



/* =========================================================
   MORDRA 3.3.2 — DISCUSSION TIMER
   Compte à rebours pendant la discussion.
========================================================= */

let discussionTimerInterval = null;

function clearDiscussionTimer(){
  if(discussionTimerInterval){
    clearInterval(discussionTimerInterval);
    discussionTimerInterval = null;
  }
}

function formatDiscussionTime(seconds){
  seconds = Math.max(0, Number(seconds)||0);
  const m = String(Math.floor(seconds/60)).padStart(2,"0");
  const s = String(seconds%60).padStart(2,"0");
  return `${m}:${s}`;
}

function startDiscussionTimer(totalSeconds){
  clearDiscussionTimer();

  let remaining = Math.max(10, Number(totalSeconds)||180);
  let warned = false;

  const display = () => {
    const el = document.getElementById("discussionTimer");
    const sub = document.getElementById("discussionTimerSub");
    const box = document.getElementById("discussionTimerBox");

    if(el) el.textContent = formatDiscussionTime(remaining);

    if(remaining <= 10){
      if(box) box.classList.add("timer-danger");
      if(sub) sub.textContent = "Dernières secondes avant le vote.";
      if(!warned){
        warned = true;
        try{ sound("bad"); }catch(e){}
        if(navigator.vibrate) try{ navigator.vibrate([90,60,90]); }catch(e){}
      }
    }

    if(remaining <= 0){
      clearDiscussionTimer();
      if(sub) sub.textContent = "Temps terminé. Passage au vote...";
      try{ sound("vote"); }catch(e){}
      setTimeout(()=>{ try{ votePass(0); }catch(err){ console.error(err); } }, 650);
      return;
    }

    remaining--;
  };

  display();
  discussionTimerInterval = setInterval(display, 1000);
}

function discussion(){
  try{
    if(!state || !state.game || !state.game.players){
      home();
      return;
    }

    const alivePlayers = state.game.players.filter(p=>p.alive!==false);
    const pool = alivePlayers.length ? alivePlayers : state.game.players;
    const starter = state.game.starter || pool[Math.floor(Math.random()*pool.length)].name;
    state.game.starter = starter;

    const minutes = Number(state.game.discussionMinutes || state.setup?.minutes || 3);
    const totalSeconds = Math.max(1, minutes) * 60;

    const modeText = state.game.roleMode === "hidden"
      ? "Mode mystère : personne ne connaît officiellement son rôle. Observez les mots et les réactions."
      : "Débattez, puis passez au vote.";

    screen(`<div class="card mobile-center-card">
      <h1>⏳ Discussion</h1>

      <div class="discussion-timer-box" id="discussionTimerBox">
        <span class="small">Temps de discussion</span>
        <b id="discussionTimer">${formatDiscussionTime(totalSeconds)}</b>
        <small id="discussionTimerSub">Le vote peut commencer quand vous voulez.</small>
      </div>

      <div class="result-line"><b>🎙️ ${starter} commence à parler</b><br><span class="small">Ensuite, chacun peut répondre et se défendre.</span></div>
      <p class="small">${modeText}</p>
      <button class="btn" onclick="clearDiscussionTimer(); votePass(0)">Voter maintenant</button>
    </div>`);

    startDiscussionTimer(totalSeconds);
  }catch(err){
    console.error("discussion timer error", err);
    screen(`<div class="card mobile-center-card">
      <h1>⏳ Discussion</h1>
      <p class="small">Vous pouvez discuter puis lancer le vote.</p>
      <button class="btn" onclick="votePass(0)">Voter</button>
      <button class="btn secondary" onclick="home()">Menu</button>
    </div>`);
  }
}



/* =========================================================
   MORDRA 3.3.2 — VERDICT CINEMATIC
   Suspense après les votes avant le résultat.
========================================================= */

function verdictSound(type="tick"){
  try{
    if(type==="tick") sound("vote");
    else if(type==="boom") sound("reveal");
    else sound("click");
  }catch(e){}
}

function showVerdictCountdown(nextAction){
  let count = 3;
  const texts = {
    3: "Analyse des votes...",
    2: "Vérification de l'identité...",
    1: "Verdict imminent..."
  };

  const draw = () => {
    verdictSound("tick");
    screen(`<div class="card mobile-center-card verdict-card">
      <div class="verdict-ring">
        <span>${count}</span>
      </div>
      <h1>Analyse des votes</h1>
      <p class="small">${texts[count] || "Verdict..."}</p>
    </div>`);
  };

  draw();

  const interval = setInterval(()=>{
    count--;
    if(count >= 1){
      draw();
    }else{
      clearInterval(interval);
      verdictSound("boom");
      screen(`<div class="card mobile-center-card verdict-card verdict-final">
        <div class="verdict-ring verdict-boom">
          <span>!</span>
        </div>
        <h1>Verdict</h1>
        <p class="small">Le résultat est révélé...</p>
      </div>`);
      setTimeout(()=>{
        try{ nextAction(); }catch(err){ console.error(err); home(); }
      }, 650);
    }
  }, 1000);
}

function showVerdictResultThen(action){
  showVerdictCountdown(action);
}



/* =========================================================
   MORDRA 3.3.2 — VICTORY CHESTS
   Coffre équilibré pour le meilleur joueur gagnant.
========================================================= */

function chestRandom(){
  return Math.random();
}

function chooseChestType(){
  const r = chestRandom();
  if(r < 0.002) return "mythique";
  if(r < 0.020) return "or";
  if(r < 0.100) return "argent";
  return "bronze";
}

function chestInfo(type){
  const infos = {
    bronze:{name:"Coffre Bronze",icon:"📦",min:20,max:50,cosmetic:0.035,cls:"chest-bronze"},
    argent:{name:"Coffre Argent",icon:"🧰",min:60,max:100,cosmetic:0.120,cls:"chest-silver"},
    or:{name:"Coffre Or",icon:"🏆",min:120,max:180,cosmetic:1.000,cls:"chest-gold"},
    mythique:{name:"Coffre Mythique",icon:"💎",min:300,max:500,cosmetic:1.000,cls:"chest-mythic"}
  };
  return infos[type] || infos.bronze;
}

function randomInt(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

function randomChestCosmetic(p, chestType){
  try{
    const pool = shopItems.filter(it=>{
      if(owned(p,it)) return false;
      if(chestType==="bronze") return ["banner","badge","title"].includes(it.type) && !["Mythique","Légendaire"].includes(it.rarity);
      if(chestType==="argent") return !["Mythique"].includes(it.rarity);
      return true;
    });
    if(!pool.length) return null;
    return pool[Math.floor(Math.random()*pool.length)];
  }catch(e){
    return null;
  }
}

function computeChestReward(playerName){
  let p = getPlayer(playerName);
  if(!p) return null;
  p = normalize(p);
  const type = chooseChestType();
  const info = chestInfo(type);
  const shards = randomInt(info.min, info.max);
  const reward = {type, info, shards, cosmetic:null};

  if(Math.random() < info.cosmetic){
    const cos = randomChestCosmetic(p,type);
    if(cos){
      reward.cosmetic = cos;
    }
  }

  p.wallet.shards += shards;
  if(reward.cosmetic){
    give(p,reward.cosmetic);
  }
  savePlayer(p);
  return reward;
}

function bestWinnerForChest(){
  if(!state || !state.game) return null;
  const winners = state.game.players.filter(gp=>{
    return (gp.role==="killer" && state.game.winner==="killers") ||
           (gp.role==="survivor" && state.game.winner==="survivors");
  });
  if(!winners.length) return null;

  const scored = winners.map(gp=>{
    const p = getPlayer(gp.name) || defaultPlayer(gp.name);
    return {name:gp.name, xp:p.totalXP||0, wins:p.wins||0, games:p.games||0};
  });

  scored.sort((a,b)=>(b.xp-a.xp)||(b.wins-a.wins)||(b.games-a.games));
  return scored[0].name;
}


function championshipChestReturnButton400(){
  try{
    const c = ensureChampState400();
    if(c && c.active){
      return `<button class="btn secondary" onclick="championshipRoundResult400()">↩️ Retour au championnat</button>`;
    }
  }catch(e){}
  return `<button class="btn secondary" onclick="leaderboard()">Voir le classement</button>`;
}
function championshipChestAlreadyClaimed400(){
  try{
    const c = ensureChampState400();
    if(!c || !c.active) return false;
    c.chestsClaimed = c.chestsClaimed || {};
    return !!c.chestsClaimed[String(c.currentRound)];
  }catch(e){ return false; }
}
function championshipMarkChestClaimed400(){
  try{
    const c = ensureChampState400();
    if(!c || !c.active) return;
    c.chestsClaimed = c.chestsClaimed || {};
    c.chestsClaimed[String(c.currentRound)] = true;
    champSave400();
  }catch(e){}
}

function showVictoryChest(){
  if(championshipChestAlreadyClaimed400()){
    screen(`<div class="card mobile-center-card chest-screen">
      <h1>✅ Coffre déjà ouvert</h1>
      <p class="small">Le coffre de cette manche a déjà été récupéré. Impossible de le prendre plusieurs fois.</p>
      ${championshipChestReturnButton400()}
      <button class="btn ghost" onclick="home()">Menu</button>
    </div>`);
    return;
  }

  const winnerName = bestWinnerForChest();
  if(!winnerName){
    if(state.championship && state.championship.active) return championshipRoundResult400();
    home();
    return;
  }

  championshipMarkChestClaimed400();
  const reward = computeChestReward(winnerName);
  if(!reward){
    home();
    return;
  }

  const info = reward.info;
  try{ sound("reward"); }catch(e){}

  screen(`<div class="card mobile-center-card chest-screen">
    <h1>🎁 Coffre de Victoire</h1>
    <p class="small">${winnerName} reçoit un coffre pour sa performance.</p>

    <div class="chest-box ${info.cls}" id="chestBox">
      <div class="chest-icon">${info.icon}</div>
      <b>${info.name}</b>
    </div>

    <button class="btn" onclick="openVictoryChest('${winnerName.replaceAll("'","\\'")}', '${reward.type}', ${reward.shards}, '${reward.cosmetic ? reward.cosmetic.id : ""}')">Ouvrir</button>
  </div>`);
}

function openVictoryChest(winnerName,type,shards,cosmeticId){
  const info = chestInfo(type);
  const cosmetic = cosmeticId ? shopItems.find(i=>i.id===cosmeticId) : null;
  try{ sound("level"); }catch(e){}

  screen(`<div class="card mobile-center-card chest-screen chest-opened">
    <h1>${info.icon} ${info.name}</h1>
    <div class="chest-light"></div>

    <div class="result-line">
      <b>${winnerName}</b><br>
      <span class="xp">🩸 +${shards} Éclats de Sang</span>
      ${cosmetic ? `<br><span class="xp">✨ Nouveau cosmétique : ${cosmetic.icon} ${cosmetic.name}</span>` : ""}
    </div>

    <p class="small">Récompense sauvegardée automatiquement.</p>
    ${championshipChestReturnButton400()}
    <button class="btn secondary" onclick="home()">Menu</button>
  </div>`);
}


/* =========================================================
   MORDRA 3.3.2 — WORD BALANCE FIX
   Classique/Blitz : Tueur sans mot + anti-répétition.
========================================================= */

const WORD_HISTORY_KEY_331 = "mordra_331_word_history";
const WORD_HISTORY_LIMIT_331 = 35;

function normalizePairKey331(pair){
  const a = String(pair?.[0] || "").trim().toLowerCase();
  const b = String(pair?.[1] || "").trim().toLowerCase();
  return [a,b].sort().join("::");
}
function exactPairKey331(pair){
  return String(pair?.[0] || "").trim().toLowerCase()+"::"+String(pair?.[1] || "").trim().toLowerCase();
}
function loadWordHistory331(){
  return loadJSON(WORD_HISTORY_KEY_331,[]);
}
function saveWordHistory331(hist){
  saveJSON(WORD_HISTORY_KEY_331,(Array.isArray(hist)?hist:[]).slice(-WORD_HISTORY_LIMIT_331));
}
function wordDistanceScore331(pair){
  const a = String(pair?.[0]||"").toLowerCase();
  const b = String(pair?.[1]||"").toLowerCase();
  let score = 0;
  if(a[0] && a[0] === b[0]) score -= 2;
  if(Math.abs(a.length-b.length) <= 1) score -= 1;
  if(a.includes(b.slice(0,3)) || b.includes(a.slice(0,3))) score -= 2;
  const tooClose = ["glace|sorbet","sorbet|glace","crêpe|gaufre","gaufre|crêpe","riz|pâtes","pâtes|riz","lion|tigre","tigre|lion","chat|renard","renard|chat","chien|loup","loup|chien","café|thé","thé|café"];
  if(tooClose.includes(a+"|"+b)) score -= 6;
  return score;
}
function pickPairBalanced331(){
  const all = Array.isArray(words) ? words.filter(p=>Array.isArray(p) && p.length>=2) : [["Pomme","Banane"]];
  const hist = loadWordHistory331();
  const blocked = new Set(hist.map(h=>h.u));
  let pool = all.filter(p=>!blocked.has(normalizePairKey331(p)));

  if(pool.length < Math.min(10, all.length)){
    const recent = new Set(hist.slice(-10).map(h=>h.u));
    pool = all.filter(p=>!recent.has(normalizePairKey331(p)));
  }
  if(!pool.length) pool = all;

  const weighted = [];
  pool.forEach(p=>{
    const score = wordDistanceScore331(p);
    const weight = score <= -5 ? 1 : score <= -2 ? 2 : 4;
    for(let i=0;i<weight;i++) weighted.push(p);
  });

  const pair = weighted[Math.floor(Math.random()*weighted.length)] || pool[Math.floor(Math.random()*pool.length)] || all[0];
  hist.push({u:normalizePairKey331(pair), e:exactPairKey331(pair), at:Date.now()});
  saveWordHistory331(hist);
  return pair;
}
function killerGetsWord331(){
  const mode = state?.game?.gameMode || state?.setup?.gameMode || "classic";
  const roleMode = state?.game?.roleMode || state?.setup?.roleMode || "visible";
  if(mode === "mystery" || roleMode === "hidden") return true;
  return false;
}
function killerWordText331(){
  return "Tu n'as pas de mot";
}

/* Overrides 3.3.1 */
function launchGame(){
  if(state.players.length!==state.setup.count) return alert("Sélectionne tous les joueurs.");
  const pair = pickPairBalanced331();
  let killerCount = +state.setup.killers || 1;
  if(state.setup.gameMode === "double" && state.players.length >= 6) killerCount = 2;

  const ids = state.players.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,killerCount);
  state.game = {
    id:Date.now(),
    pair,
    round:0,
    winner:null,
    votes:{},
    starter:null,
    roleMode:state.setup?.roleMode||"visible",
    gameMode:state.setup?.gameMode||"classic",
    gameModeName:(state.selectedMode?.name)||"Classique",
    discussionMinutes:state.setup?.minutes||3,
    players:state.players.map((n,i)=>({name:n,role:ids.includes(i)?"killer":"survivor",alive:true}))
  };
  state.game.starter = state.game.players[Math.floor(Math.random()*state.game.players.length)].name;
  revealPass(0);
}

function revealWord(i){
  try{
    if(!state || !state.game || !state.game.players || !state.game.players[i]){
      revealPass(i+1);
      return;
    }
    try{ sound("reveal"); }catch(e){}

    const gp = state.game.players[i];
    const pair = state.game.pair || ["Mot","Mot"];
    const hiddenMode = state.game.roleMode === "hidden";
    const isKiller = gp.role === "killer";
    const killerHasWord = killerGetsWord331();

    let word = pair[0];
    if(isKiller) word = killerHasWord ? pair[1] : killerWordText331();

    const roleTitle = hiddenMode ? "🎴 Ton mot" : (isKiller ? "🔪 Tueur" : "🛡️ Survivant");
    const helper = hiddenMode
      ? "Personne ne voit son rôle dans ce mode. Retenez seulement votre mot."
      : (isKiller && !killerHasWord ? "Tu es l'imposteur. Tu dois deviner le thème avec les indices des autres." : "Retenez bien votre rôle et votre mot.");
    const wordClass = isKiller && !killerHasWord ? "no-word-card" : "";

    screen(`<div class="card mobile-center-card">
      <h1>${roleTitle}</h1>
      <div class="logo ${wordClass}" style="font-size:38px">${word}</div>
      <p class="small">${helper}</p>
      <button class="btn" onclick="revealPass(${i+1})">Cacher et passer</button>
    </div>`);
  }catch(err){
    console.error("revealWord 3.3.1 error", err);
    revealPass(i+1);
  }
}



/* =========================================================
   MORDRA 3.3.2 — RANDOM KILLER FIX
   Tirage vraiment aléatoire du ou des Tueurs.
========================================================= */

function secureShuffle332(list){
  const arr = list.slice();
  const random = () => {
    try{
      if(window.crypto && window.crypto.getRandomValues){
        const x = new Uint32Array(1);
        window.crypto.getRandomValues(x);
        return x[0] / 4294967296;
      }
    }catch(e){}
    return Math.random();
  };
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(random()*(i+1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function pickRandomKillers332(playerNames,killerCount){
  const indexes = playerNames.map((_,i)=>i);
  const shuffled = secureShuffle332(indexes);
  return shuffled.slice(0, Math.max(1, Math.min(killerCount, Math.max(1, playerNames.length-1))));
}

function launchGame(){
  if(state.players.length!==state.setup.count) return alert("Sélectionne tous les joueurs.");

  const pair = (typeof pickPairBalanced331 === "function")
    ? pickPairBalanced331()
    : words[Math.floor(Math.random()*words.length)];

  let killerCount = +state.setup.killers || 1;
  if(state.setup.gameMode === "double" && state.players.length >= 6){
    killerCount = 2;
  }

  // Tirage totalement aléatoire : aucun ordre, aucune rotation.
  const ids = pickRandomKillers332(state.players, killerCount);

  state.game = {
    id:Date.now(),
    pair,
    round:0,
    winner:null,
    votes:{},
    starter:null,
    roleMode:state.setup?.roleMode||"visible",
    gameMode:state.setup?.gameMode||"classic",
    gameModeName:(state.selectedMode?.name)||"Classique",
    discussionMinutes:state.setup?.minutes||3,
    players:state.players.map((n,i)=>({
      name:n,
      role:ids.includes(i) ? "killer" : "survivor",
      alive:true
    }))
  };

  state.game.starter = secureShuffle332(state.game.players)[0].name;
  revealPass(0);
}


/* =========================================================
   MORDRA Test 4.00 — MODE CHAMPIONNAT
   Intégré sur la vraie base 3.3.2 Random Killer Fix.
========================================================= */
const MORDRA_VERSION_400 = "Test 4.00";
const CHAMPIONSHIP_SAVE_KEY_400 = "mordra_400_championship";

function vibrate400(pattern=60){
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}
function champSound400(type="click"){
  try{ sound(type); }catch(e){}
}
function champSave400(){
  try{ localStorage.setItem(CHAMPIONSHIP_SAVE_KEY_400, JSON.stringify(state.championship || null)); }catch(e){}
}
function champClear400(){
  try{ localStorage.removeItem(CHAMPIONSHIP_SAVE_KEY_400); }catch(e){}
}
function champSafeName400(name){
  return String(name||"").replaceAll("'","\\'");
}
function ensureChampState400(){
  if(!state.championship){
    state.championship = {active:false,pending:false,totalRounds:0,currentRound:1,players:[],scores:{},shards:{},setup:null,mode:null,lastRewards:[],chestsClaimed:{}};
  }
  return state.championship;
}
function championshipMenu400(){
  try{ clearDiscussionTimer(); }catch(e){}
  champSound400("menu");
  const existing = ensureChampState400();
  const resume = existing.active ? `<button class="btn" onclick="championshipRoundResult400()">▶️ Reprendre le championnat</button>` : "";
  screen(`<div class="card championship-card">${back("home()")}
    <div class="champion-crown">🏆</div>
    <h1>Mode Championnat</h1>
    <p class="small">Choisis la durée. Les mêmes joueurs, le même mode et les mêmes paramètres restent pendant toutes les manches.</p>
    ${resume}
    <div class="championship-grid">
      <button class="btn" onclick="prepareChampionship400(1)">1 manche</button>
      <button class="btn" onclick="prepareChampionship400(3)">3 manches</button>
      <button class="btn" onclick="prepareChampionship400(5)">5 manches</button>
      <button class="btn" onclick="prepareChampionship400(10)">10 manches</button>
      <button class="btn" onclick="prepareChampionship400(15)">15 manches</button>
    </div>
    <p class="small">Version ${MORDRA_VERSION_400} — système en test.</p>
  </div>`);
}
function prepareChampionship400(rounds){
  state.championship = {active:false,pending:true,totalRounds:rounds,currentRound:1,players:[],scores:{},shards:{},setup:null,mode:null,lastRewards:[],chestsClaimed:{}};
  champSave400();
  champSound400("level");
  vibrate400([70,40,70]);
  modeSelect();
}
function championshipStartFromLaunch400(){
  const c=ensureChampState400();
  if(!c.pending || c.active) return;
  c.active = true;
  c.pending = false;
  c.currentRound = 1;
  c.players = state.players.slice();
  c.setup = {...state.setup};
  c.mode = state.selectedMode ? {...state.selectedMode} : {...mordraModes.classic};
  c.scores = {};
  c.shards = {};
  c.lastRewards = [];
  c.players.forEach(n=>{ c.scores[n]=0; c.shards[n]=0; });
  champSave400();
}
function championshipRanking400(){
  const c=ensureChampState400();
  return (c.players||[]).map(n=>({name:n,score:c.scores?.[n]||0,shards:c.shards?.[n]||0}))
    .sort((a,b)=>b.score-a.score || b.shards-a.shards || a.name.localeCompare(b.name));
}
function championshipAfterSavedGame400(rewards, rewardHtml, oldM, newM){
  const c=ensureChampState400();
  const winnerSide = state.game?.winner;
  c.lastRewards = rewards || [];
  c.players.forEach(n=>{ c.scores[n] ||= 0; c.shards[n] ||= 0; });
  (state.game?.players||[]).forEach(gp=>{
    const win = (gp.role==="killer" && winnerSide==="killers") || (gp.role==="survivor" && winnerSide==="survivors");
    const bonus = gp.role==="killer" ? 5 : 3;
    if(win) c.scores[gp.name] = (c.scores[gp.name]||0) + bonus;
    const r=(rewards||[]).find(x=>x.name===gp.name);
    if(r) c.shards[gp.name] = (c.shards[gp.name]||0) + (r.shards||0);
  });
  champSave400();
  champSound400("level");
  vibrate400([60,30,60]);
  championshipRoundResult400(rewardHtml, oldM, newM);
}
function championshipRoundResult400(rewardHtml="", oldM=null, newM=null){
  const c=ensureChampState400();
  const ranking=championshipRanking400();
  const isFinal = c.currentRound >= c.totalRounds;
  const rows = ranking.map((p,i)=>`<div class="champ-ranking-row" style="animation-delay:${i*0.10}s"><b>${i+1}. ${i===0?"👑 ":""}${p.name}</b><span>${p.score} pts • ${p.shards} 🩸</span></div>`).join("");
  const nextButton = isFinal
    ? `<button class="btn" onclick="championshipFinal400()">Voir le champion</button>`
    : `<button class="btn" onclick="championshipNextRound400()">Manche suivante</button>`;
  screen(`<div class="card championship-card"><h1>🏁 Manche ${c.currentRound} / ${c.totalRounds}</h1>
    <p class="small">Résultat sauvegardé. Le classement du championnat est mis à jour.</p>
    <div class="champ-round-badge">${state.game?.winner==="killers"?"🔪 Victoire des Tueurs":"🛡️ Victoire des Survivants"}</div>
    ${rewardHtml?`<h2>Récompenses de manche</h2>${rewardHtml}`:""}
    ${oldM&&newM&&oldM!==newM?`<div class="mvp-card player-card"><div class="mvp-badge">👑 Nouveau MVP</div><h1>${newM}</h1></div>`:""}
    <h2>Classement championnat</h2>
    <div class="champ-ranking-box">${rows}</div>
    ${nextButton}
    <button class="btn secondary" onclick="showVictoryChest()">${championshipChestAlreadyClaimed400()?"✅ Coffre déjà récupéré":"🎁 Coffre de victoire"}</button>
    <button class="btn danger" onclick="quitChampionship400()">Abandonner le championnat</button>
  </div>`);
}
function championshipNextRound400(){
  const c=ensureChampState400();
  if(!c.active) return championshipMenu400();
  c.currentRound++;
  state.players = c.players.slice();
  state.setup = {...c.setup};
  state.selectedMode = c.mode ? {...c.mode} : mordraModes.classic;
  state.game = null;
  champSave400();
  champSound400("click");
  vibrate400(60);
  launchGame();
}
function championshipFinal400(){
  const c=ensureChampState400();
  const ranking=championshipRanking400();
  const champion=ranking[0];
  c.active=false;
  c.pending=false;
  champSave400();
  champSound400("level");
  vibrate400([100,50,100,50,160]);
  const rows=ranking.map((p,i)=>`<div class="champ-ranking-row" style="animation-delay:${i*0.10}s"><b>${i+1}. ${i===0?"🏆 ":""}${p.name}</b><span>${p.score} pts • ${p.shards} 🩸</span></div>`).join("");
  screen(`<div class="card championship-card champion-final"><div class="champion-crown">🏆</div>
    <h1>Champion de MORDRA</h1>
    <div class="champion-name">${champion ? champion.name : "Aucun champion"}</div>
    <p class="xp">${champion ? `${champion.score} points • ${champion.shards} 🩸 gagnés pendant le championnat` : ""}</p>
    <h2>Classement final</h2>
    <div class="champ-ranking-box">${rows}</div>
    <button class="btn" onclick="restartSameChampionship400()">Rejouer le même championnat</button>
    <button class="btn secondary" onclick="championshipMenu400()">Nouveau championnat</button>
    <button class="btn ghost" onclick="home()">Menu principal</button>
  </div>`);
}
function restartSameChampionship400(){
  const old=ensureChampState400();
  const rounds=old.totalRounds || 3;
  const players=(old.players||[]).slice();
  const setup=old.setup ? {...old.setup} : null;
  const mode=old.mode ? {...old.mode} : mordraModes.classic;
  if(!players.length || !setup) return prepareChampionship400(rounds);
  state.championship = {active:true,pending:false,totalRounds:rounds,currentRound:1,players,scores:{},shards:{},setup,mode,lastRewards:[],chestsClaimed:{}};
  players.forEach(n=>{ state.championship.scores[n]=0; state.championship.shards[n]=0; });
  state.players=players.slice(); state.setup={...setup}; state.selectedMode={...mode}; state.game=null;
  champSave400();
  launchGame();
}
function quitChampionship400(){
  if(!confirm("Abandonner le championnat en cours ?")) return;
  state.championship = {active:false,pending:false,totalRounds:0,currentRound:1,players:[],scores:{},shards:{},setup:null,mode:null,lastRewards:[],chestsClaimed:{}};
  champClear400();
  home();
}

/* Override propre du lancement pour activer le championnat sans casser le random killer fix. */
const launchGame_332_original_for_400 = launchGame;
launchGame = function(){
  championshipStartFromLaunch400();
  launchGame_332_original_for_400();
};

/* Reprise auto si un championnat était en cours sur le même téléphone. */
try{
  const savedChamp400 = JSON.parse(localStorage.getItem(CHAMPIONSHIP_SAVE_KEY_400) || "null");
  if(savedChamp400 && typeof savedChamp400 === "object") state.championship = savedChamp400;
}catch(e){}



/* =========================================================
   MORDRA Test 4.00 — TOUR SUPPLÉMENTAIRE 2 MINUTES
   Si le ou les Tueurs ne sont pas encore trouvés, on ne lance
   pas un vote direct : on relance la même manche avec 2 minutes
   de discussion, puis le vote revient automatiquement.
========================================================= */

function extraRoundDiscussion400(reasonText){
  try{
    clearDiscussionTimer();
    if(!state || !state.game || !state.game.players){
      home();
      return;
    }

    state.game.votes = {};
    state.game.extraTurns = (state.game.extraTurns || 0) + 1;

    const alivePlayers = state.game.players.filter(p=>p.alive!==false);
    const pool = alivePlayers.length ? alivePlayers : state.game.players;
    const starter = pool[Math.floor(Math.random()*pool.length)]?.name || state.game.starter || "Un joueur";
    state.game.starter = starter;

    const totalSeconds = 120;
    try{ sound("vote"); }catch(e){}
    try{ if(navigator.vibrate) navigator.vibrate([80,40,80]); }catch(e){}

    screen(`<div class="card mobile-center-card extra-round-card">
      <h1>🔁 Tour supplémentaire</h1>
      <p class="small">${reasonText || "Le Tueur n'a pas encore été trouvé."}</p>

      <div class="discussion-timer-box" id="discussionTimerBox">
        <span class="small">Temps bonus pour refaire un tour</span>
        <b id="discussionTimer">${formatDiscussionTime(totalSeconds)}</b>
        <small id="discussionTimerSub">Parlez, défendez-vous, puis revotez.</small>
      </div>

      <div class="result-line"><b>🎙️ ${starter} relance le débat</b><br><span class="small">Même manche, mêmes rôles, aucun retour au menu.</span></div>
      <button class="btn" onclick="clearDiscussionTimer(); votePass(0)">Revoter maintenant</button>
    </div>`);

    startDiscussionTimer(totalSeconds);
  }catch(err){
    console.error("extraRoundDiscussion400 error", err);
    screen(`<div class="card mobile-center-card">
      <h1>🔁 Tour supplémentaire</h1>
      <p class="small">Le Tueur n'a pas encore été trouvé. Reprenez le débat puis revotez.</p>
      <button class="btn" onclick="state.game.votes={}; votePass(0)">Revoter</button>
    </div>`);
  }
}

/* Override vote : plus de vote direct ou écran bizarre quand le Tueur n'est pas trouvé. */
resolveVote = function(){
  try{
    const game = state.game;
    if(!game || !game.players) return home();

    const aliveBefore = game.players.filter(p=>p.alive!==false);
    let counts = {};
    Object.values(game.votes || {}).forEach(v=>{
      if(v !== undefined && v !== null) counts[v] = (counts[v] || 0) + 1;
    });

    const vals = Object.entries(counts).sort((a,b)=>b[1]-a[1]);

    if(!vals.length){
      return showVerdictResultThen(()=>extraRoundDiscussion400("Aucun vote n'a été validé. On reprend 2 minutes pour clarifier."));
    }

    if(vals.length > 1 && vals[0][1] === vals[1][1]){
      return showVerdictResultThen(()=>extraRoundDiscussion400("Égalité dans les votes. Aucun joueur n'est éliminé. Vous avez 2 minutes pour refaire un tour."));
    }

    const elim = Number(vals[0][0]);
    if(!game.players[elim]){
      return showVerdictResultThen(()=>extraRoundDiscussion400("Vote invalide. On relance la même manche pendant 2 minutes."));
    }

    game.players[elim].alive = false;

    const aliveKillers = game.players.filter(p=>p.alive!==false && p.role==="killer").length;
    const aliveSurv = game.players.filter(p=>p.alive!==false && p.role==="survivor").length;

    if(aliveKillers === 0) game.winner = "survivors";
    else if(aliveKillers >= aliveSurv) game.winner = "killers";

    if(game.winner){
      return showVerdictResultThen(()=>endGame());
    }

    const eliminated = game.players[elim];
    const reason = eliminated.role === "killer"
      ? `${eliminated.name} était Tueur, mais il en reste encore un. Vous avez 2 minutes pour finir la manche.`
      : `${eliminated.name} n'était pas Tueur. Le vrai Tueur est encore en jeu. Vous avez 2 minutes pour refaire un tour.`;

    showVerdictResultThen(()=>extraRoundDiscussion400(reason));
  }catch(err){
    console.error("resolveVote extra round override error", err);
    try{ extraRoundDiscussion400("Petit problème pendant le vote. On relance proprement la même manche pendant 2 minutes."); }catch(e){ home(); }
  }
};
