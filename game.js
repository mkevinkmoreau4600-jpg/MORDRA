
const app = document.getElementById("app");

const pairs = window.MORDRA_WORD_PAIRS || [];

let state = {
  playersCount: 4,
  killersCount: 1,
  timerMinutes: 3,
  playerNames: [],
  current: 0,
  game: null,
  timerInterval: null
};

const GAME_VERSION = "Alpha 1.1.8 — Full Full Collection Fix";
const saveKey = "mordra_v03_stats";
const historyKey = "mordra_v03_history";

const cosmetics = {
  banners: [
    {id:"default", name:"Ombre", css:"linear-gradient(135deg,rgba(255,255,255,.08),rgba(208,31,60,.12))"},
    {id:"blood", name:"Sang", css:"linear-gradient(135deg,#3b000b,#d01f3c)"},
    {id:"gold", name:"Or", css:"linear-gradient(135deg,#3b2a00,#f7c75d)"},
    {id:"ice", name:"Glace", css:"linear-gradient(135deg,#09233d,#7d9cff)"},
    {id:"forest", name:"Forêt", css:"linear-gradient(135deg,#061f14,#2aaa68)"},
    {id:"galaxy", name:"Galaxy", css:"linear-gradient(135deg,#120024,#2d0b6e,#d01f3c)"},
    {id:"obsidian", name:"Obsidienne", css:"linear-gradient(135deg,#050505,#2b2b38)"},
    {id:"halloween", name:"Halloween", css:"linear-gradient(135deg,#1d0c00,#ff7a18)"},
    {id:"storm", name:"Tempête", css:"linear-gradient(135deg,#101827,#8aa0bd)"},
    {id:"royal", name:"Royal", css:"linear-gradient(135deg,#19002e,#ad7dff)"}
  ],
  badges: [
    {id:"knife", name:"Lame", icon:"🔪"},
    {id:"shield", name:"Bouclier", icon:"🛡️"},
    {id:"eye", name:"Œil", icon:"👁️"},
    {id:"skull", name:"Crâne", icon:"💀"},
    {id:"crown", name:"Couronne", icon:"👑"},
    {id:"target", name:"Cible", icon:"🎯"},
    {id:"fire", name:"Feu", icon:"🔥"},
    {id:"ghost", name:"Fantôme", icon:"👻"},
    {id:"wolf", name:"Loup", icon:"🐺"},
    {id:"trophy", name:"Trophée", icon:"🏆"}
  ]
};

const achievements = [
  {id:"first_game", name:"Première nuit", desc:"Jouer ta première partie.", cat:"Général", reward:{banner:"default", badge:"eye", shards:25}, test:p=>p.games>=1},
  {id:"games_10", name:"Habitué du noir", desc:"Jouer 10 parties.", cat:"Général", reward:{badge:"fire", shards:50}, test:p=>p.games>=10},
  {id:"games_50", name:"Marathon de l'ombre", desc:"Jouer 50 parties.", cat:"Général", reward:{banner:"storm", shards:120}, test:p=>p.games>=50},
  {id:"games_100", name:"Cent nuits", desc:"Jouer 100 parties.", cat:"Général", reward:{badge:"trophy", shards:250}, test:p=>p.games>=100},
  {id:"wins_10", name:"Instinct de survie", desc:"Gagner 10 parties.", cat:"Général", reward:{badge:"crown", shards:80}, test:p=>p.wins>=10},
  {id:"wins_50", name:"Dominateur", desc:"Gagner 50 parties.", cat:"Général", reward:{banner:"gold", shards:200}, test:p=>p.wins>=50},
  {id:"streak_3", name:"Série sanglante", desc:"Gagner 3 parties d'affilée.", cat:"Général", reward:{badge:"fire", shards:60}, test:p=>p.bestStreak>=3},
  {id:"streak_7", name:"Invincible", desc:"Gagner 7 parties d'affilée.", cat:"Général", reward:{banner:"royal", shards:180}, test:p=>p.bestStreak>=7},
  {id:"lvl_10", name:"Niveau 10", desc:"Atteindre le niveau général 10.", cat:"Progression", reward:{banner:"ice", shards:100}, test:p=>levelFromXP(p.totalXP)>=10},
  {id:"lvl_25", name:"Ascension", desc:"Atteindre le niveau général 25.", cat:"Progression", reward:{banner:"galaxy", shards:300}, test:p=>levelFromXP(p.totalXP)>=25},

  {id:"surv_first", name:"Premier survivant", desc:"Gagner une partie en Survivant.", cat:"Survivant", reward:{badge:"shield", shards:40}, test:p=>p.survivor.wins>=1},
  {id:"surv_10", name:"Protecteur", desc:"Gagner 10 parties en Survivant.", cat:"Survivant", reward:{banner:"forest", shards:100}, test:p=>p.survivor.wins>=10},
  {id:"surv_50", name:"Mur vivant", desc:"Gagner 50 parties en Survivant.", cat:"Survivant", reward:{badge:"trophy", shards:250}, test:p=>p.survivor.wins>=50},
  {id:"find_1", name:"Premier Tueur trouvé", desc:"Trouver ton premier Tueur.", cat:"Votes", reward:{badge:"target", shards:40}, test:p=>p.survivor.killersFound>=1},
  {id:"find_25", name:"Œil de lynx", desc:"Trouver 25 Tueurs.", cat:"Votes", reward:{badge:"eye", shards:160}, test:p=>p.survivor.killersFound>=25},
  {id:"good_votes_50", name:"Détective", desc:"Faire 50 bons votes.", cat:"Votes", reward:{banner:"ice", shards:180}, test:p=>p.survivor.goodVotes>=50},
  {id:"surv_streak_5", name:"Gardien", desc:"Gagner 5 parties Survivant d'affilée.", cat:"Survivant", reward:{banner:"forest", shards:160}, test:p=>p.survivor.bestStreak>=5},

  {id:"killer_first", name:"Première chasse", desc:"Gagner une partie en Tueur.", cat:"Tueur", reward:{badge:"knife", shards:60}, test:p=>p.killer.wins>=1},
  {id:"killer_10", name:"Prédateur", desc:"Gagner 10 parties en Tueur.", cat:"Tueur", reward:{banner:"blood", shards:140}, test:p=>p.killer.wins>=10},
  {id:"killer_50", name:"Faucheur", desc:"Gagner 50 parties en Tueur.", cat:"Tueur", reward:{badge:"skull", shards:300}, test:p=>p.killer.wins>=50},
  {id:"no_vote_5", name:"Fantôme", desc:"Faire 5 parties Tueur avec zéro vote reçu.", cat:"Tueur", reward:{badge:"ghost", shards:120}, test:p=>p.killer.zeroVoteWins>=5},
  {id:"manip_10", name:"Manipulateur", desc:"Réussir 10 manipulations en Tueur.", cat:"Tueur", reward:{badge:"wolf", shards:180}, test:p=>p.killer.manips>=10},
  {id:"killer_streak_5", name:"Ombre parfaite", desc:"Gagner 5 parties Tueur d'affilée.", cat:"Tueur", reward:{banner:"obsidian", shards:220}, test:p=>p.killer.bestStreak>=5}
];

// Ajoute automatiquement des succès de progression pour donner une grosse collection dès la 1.0 alpha.
for(let n=5;n<=100;n+=5){
  achievements.push({
    id:`auto_general_level_${n}`,
    name:`Niveau général ${n}`,
    desc:`Atteindre le niveau général ${n}.`,
    cat:"Progression",
    reward:{shards:n*5, badge:n%25===0?"crown":null, banner:n%50===0?"galaxy":null},
    test:p=>levelFromXP(p.totalXP)>=n
  });
}
for(let n=5;n<=100;n+=5){
  achievements.push({
    id:`auto_survivor_wins_${n}`,
    name:`${n} victoires Survivant`,
    desc:`Gagner ${n} parties en Survivant.`,
    cat:"Survivant",
    reward:{shards:n*4, badge:n%25===0?"shield":null},
    test:p=>p.survivor.wins>=n
  });
  achievements.push({
    id:`auto_killer_wins_${n}`,
    name:`${n} victoires Tueur`,
    desc:`Gagner ${n} parties en Tueur.`,
    cat:"Tueur",
    reward:{shards:n*5, badge:n%25===0?"knife":null},
    test:p=>p.killer.wins>=n
  });
}

function getUnlockedAchievements(p){
  p = normalizePlayerStats(p);
  return achievements.filter(a=>{
    try{return a.test(p)}catch(e){return false}
  });
}
function getUnlockedRewards(p){
  const unlocked = getUnlockedAchievements(p);
  const banners = new Set(["default"]);
  const badges = new Set([]);
  let shards = 0;
  unlocked.forEach(a=>{
    if(a.reward?.banner) banners.add(a.reward.banner);
    if(a.reward?.badge) badges.add(a.reward.badge);
    if(a.reward?.shards) shards += a.reward.shards;
  });
  return {unlocked, banners:[...banners], badges:[...badges], shards};
}
function getBanner(id){
  return cosmetics.banners.find(b=>b.id===id) || cosmetics.banners[0];
}
function getBadge(id){
  return cosmetics.badges.find(b=>b.id===id);
}
function ensureCosmetics(p){
  p.cosmetics ??= {};
  p.cosmetics.banner ??= "default";
  p.cosmetics.badges ??= [];
  return p;
}


function loadStats(){ return JSON.parse(localStorage.getItem(saveKey) || "{}"); }
function saveStats(s){ localStorage.setItem(saveKey, JSON.stringify(s)); }
function loadHistory(){ return JSON.parse(localStorage.getItem(historyKey) || "[]"); }
function saveHistory(h){ localStorage.setItem(historyKey, JSON.stringify(h)); }
function getMVPPlayer(){
  const stats = loadStats();
  const players = Object.values(stats).map(p=>{
    try{return normalizePlayerStats(p)}catch(e){return p}
  }).filter(p=>p && p.name);
  if(!players.length) return null;
  players.sort((a,b)=>(b.totalXP||0)-(a.totalXP||0));
  return players[0];
}

function isMVPName(name){
  const mvp = getMVPPlayer();
  return !!mvp && String(mvp.name).toLowerCase() === String(name).toLowerCase() && (mvp.totalXP||0) > 0;
}

function mvpBadge(name){
  return isMVPName(name) ? `<div class="mvp-badge">👑 MVP</div>` : "";
}

function mvpClass(name){
  return isMVPName(name) ? "mvp-card" : "";
}

function migratePlayerWallet(p){
  p = normalizePlayerStats(p);

  // Compatibilité anciennes versions :
  // si une ancienne sauvegarde avait des éclats ailleurs, on les récupère.
  const possibleValues = [
    p.wallet?.shards,
    p.shards,
    p.bloodShards,
    p.eclats,
    p.earnedShards
  ].filter(v => typeof v === "number" && !Number.isNaN(v));

  const best = possibleValues.length ? Math.max(...possibleValues) : 0;
  p.wallet.shards = Math.max(p.wallet.shards || 0, best);

  // Nettoyage pour éviter que différents écrans lisent des valeurs différentes.
  p.shards = p.wallet.shards;
  p.bloodShards = p.wallet.shards;

  return p;
}

function migrateAllWallets(){
  const stats = loadStats();
  let changed = false;
  Object.keys(stats).forEach(name=>{
    const before = JSON.stringify(stats[name]?.wallet || {});
    stats[name] = migratePlayerWallet(stats[name]);
    const after = JSON.stringify(stats[name]?.wallet || {});
    if(before !== after) changed = true;
  });
  if(changed) saveStats(stats);
  return stats;
}

function getPlayerByName(name){
  const stats = migrateAllWallets();
  const key = Object.keys(stats).find(n => n.toLowerCase() === String(name).toLowerCase());
  if(!key) return null;
  return migratePlayerWallet(stats[key]);
}

function savePlayerByName(name, player){
  const stats = migrateAllWallets();
  const key = Object.keys(stats).find(n => n.toLowerCase() === String(name).toLowerCase()) || name;
  stats[key] = migratePlayerWallet(player);
  saveStats(stats);
}



function ensurePlayer(stats, name){
  if(!stats[name]){
    stats[name] = {
      name, totalXP:0, games:0, wins:0, losses:0, streak:0, bestStreak:0,
      survivor:{xp:0,games:0,wins:0,losses:0,goodVotes:0,badVotes:0,killersFound:0,currentStreak:0,bestStreak:0},
      killer:{xp:0,games:0,wins:0,losses:0,manips:0,zeroVoteWins:0,votesReceived:0,currentStreak:0,bestStreak:0}
    };
  }
  return normalizePlayerStats(stats[name]);
}

function normalizePlayerStats(p){
  if(!p.survivor) p.survivor = {};
  if(!p.killer) p.killer = {};
  p.totalXP ??= 0; p.games ??= 0; p.wins ??= 0; p.losses ??= 0; p.streak ??= 0; p.bestStreak ??= 0;
  ["xp","games","wins","losses","goodVotes","badVotes","killersFound","currentStreak","bestStreak"].forEach(k=>p.survivor[k] ??= 0);
  ["xp","games","wins","losses","manips","zeroVoteWins","votesReceived","currentStreak","bestStreak"].forEach(k=>p.killer[k] ??= 0);
  ensureCosmetics(p);
  return p;
}

function levelFromXP(xp){ return Math.floor(Math.sqrt(xp/140))+1; }
function xpForLevel(level){ return Math.pow(Math.max(1, level - 1), 2) * 140; }
function survivorRank(lv){ if(lv>=50)return"Légende Survivante"; if(lv>=35)return"Gardien"; if(lv>=20)return"Protecteur"; if(lv>=10)return"Enquêteur"; if(lv>=5)return"Éclaireur"; return"Recrue"; }
function killerRank(lv){ if(lv>=50)return"Légende du Chaos"; if(lv>=35)return"Bourreau"; if(lv>=20)return"Assassin"; if(lv>=10)return"Chasseur"; if(lv>=5)return"Prédateur"; return"Suspect"; }

function playTone(ctx, freq, start, duration, volume=.045, type="sine"){
  const o = ctx.createOscillator(); const g = ctx.createGain(); const filter = ctx.createBiquadFilter();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  filter.type = "lowpass"; filter.frequency.setValueAtTime(2800, start); filter.frequency.exponentialRampToValueAtTime(900, start + duration);
  g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(volume, start + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  o.connect(filter); filter.connect(g); g.connect(ctx.destination); o.start(start); o.stop(start + duration + 0.02);
}
function sound(type="tap"){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)(); const now = ctx.currentTime;
    if(type==="menu"||type==="tap"||type==="reveal"){ playTone(ctx,420,now,.055,.022,"triangle"); playTone(ctx,760,now+.015,.045,.014,"sine"); }
    else if(type==="vote"){ playTone(ctx,160,now,.08,.035,"triangle"); playTone(ctx,310,now+.018,.06,.018,"sine"); }
    else if(type==="good"){ playTone(ctx,520,now,.08,.035,"sine"); playTone(ctx,780,now+.055,.09,.03,"sine"); }
    else if(type==="bad"){ playTone(ctx,180,now,.12,.035,"triangle"); playTone(ctx,120,now+.055,.12,.025,"sawtooth"); }
    else if(type==="timer"){ playTone(ctx,900,now,.045,.018,"sine"); }
    else if(type==="end"){ playTone(ctx,70,now,.24,.055,"sawtooth"); playTone(ctx,110,now+.05,.22,.035,"triangle"); }
    else if(type==="levelup"){ [392,523,659,784,1046].forEach((f,i)=>{playTone(ctx,f,now+i*.075,.16,.045,"sine"); playTone(ctx,f*1.5,now+i*.075+.025,.11,.018,"triangle");}); }
  }catch(e){}
  if(navigator.vibrate){
    const vib = type==="levelup" ? [40,40,60,40,100] : type==="end" ? [80,50,120] : type==="timer" ? 15 : 18;
    navigator.vibrate(vib);
  }
}
document.addEventListener("click", e=>{ if(e.target.closest("button,.listitem,.tab")) sound("menu"); });

function screen(html){ app.innerHTML = `<div class="screen">${html}</div>`; }

function topBack(action="home()", label="Retour"){
  return `<button class="top-back" onclick="${action}">← ${label}</button>`;
}

function playerShowcaseCard(name){
  const p = normalizePlayerStats(loadStats()[name] || {name});
  const banner = getBanner(p.cosmetics?.banner || "default");
  const badges = (p.cosmetics?.badges || []).slice(0,3);
  const frame = getFrame(p.cosmetics?.frame);
  const title = getTitle(p.cosmetics?.title);
  return `
    <div class="pass-player-card" style="background:${banner.css}">
      <div class="pass-player-glow"></div>
      <div class="pass-player-frame ${frame ? "has-frame" : ""}">${frame ? frame.icon : ""}</div>
      ${mvpBadge(name)}<div class="pass-player-name">${name}</div>
      <div class="pass-player-title">${title ? "⭐ "+title.name : "Sans titre"}</div>
      <div class="pass-player-level">⭐ Niveau ${levelFromXP(p.totalXP || 0)} • 🩸 ${p.wallet?.shards || 0}</div>
      <div class="profile-badges">
        ${badges.length ? badges.map(id=>`<span>${getBadge(id)?.icon || "🏅"}</span>`).join("") : `<span>🩸</span>`}
      </div>
      <div class="small">${banner.name}</div>
    </div>
  `;
}
function showError(message){ const box=document.getElementById("setupError"); if(box){box.textContent=message; box.classList.remove("hidden");} else alert(message); }
function clearTimer(){ if(state.timerInterval){ clearInterval(state.timerInterval); state.timerInterval=null; } }
function formatTime(sec){ const m=Math.floor(sec/60).toString().padStart(2,"0"); const s=Math.floor(sec%60).toString().padStart(2,"0"); return `${m}:${s}`; }

function xpCard(xp, label, icon, rank=""){
  const level = levelFromXP(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level+1);
  const progress = next>current ? Math.round(((xp-current)/(next-current))*100) : 0;
  const remaining = Math.max(0,next-xp);
  return `
    <div class="level-card">
      <div class="level-head">
        <div><span class="small">${icon} ${label}</span><b>${rank ? rank+" — " : ""}Niveau ${level}</b></div>
        <span class="badge">${xp} XP</span>
      </div>
      <div class="level-bar"><div style="width:${Math.max(0,Math.min(100,progress))}%"></div></div>
      <div class="xp-line"><b>${xp} / ${next} XP</b></div>
      <div class="small">${progress}% du niveau • ${remaining} XP avant niveau ${level+1}</div>
    </div>`;
}
function playerLevelCard(name){ const p=loadStats()[name]; return xpCard(p ? p.totalXP : 0, "Niveau général", "⭐"); }

function weightedPair(){
  const roll=Math.random();
  const target=roll<.4?"Très proche":roll<.8?"Proche":"Piégeux";
  const pool=pairs.filter(p=>p.level===target);
  return (pool.length?pool:pairs)[Math.floor(Math.random()*(pool.length?pool:pairs).length)];
}
function recommendedKillers(n){ return n>=13?3:n>=7?2:1; }
function alivePlayers(){ return state.game.players.filter(p=>p.alive); }
function aliveKillers(){ return state.game.players.filter(p=>p.alive && p.role==="killer"); }
function isKillerIndex(idx){ return state.game.players[idx]?.role === "killer"; }
function playerByIndex(idx){ return state.game.players[idx]; }
function addLog(text){ state.game.log.push({round:state.game.round, text, time:new Date().toISOString()}); }



let introTimers = [];

function clearIntroTimers(){
  introTimers.forEach(t => { clearTimeout(t); clearInterval(t); });
  introTimers = [];
}

function goToStartScreen(){
  clearIntroTimers();
  sessionStorage.setItem("mordra_intro_seen", "1");
  startScreen();
}

function goToMainMenu(){
  clearIntroTimers();
  sessionStorage.setItem("mordra_intro_seen", "1");
  home();
}

function startScreen(){
  clearTimer();
  screen(`
    <div class="start-screen">
      <div class="intro-fog"></div>
      <div class="start-logo-wrap">
        <div class="start-logo">MORDRA</div>
        <div class="start-subtitle">Full Collection Fix</div>
        <div class="start-pulse"></div>
        <button class="btn start-btn" onclick="goToMainMenu()">Démarrer</button>
        <p class="small">Ne fais confiance à personne. Remets tout en question. Survis.</p>
      </div>
    </div>
  `);
  sound("reveal");
}

function introScreen(){
  clearTimer();
  clearIntroTimers();

  screen(`
    <div class="intro-screen premium-loading">
      <div class="intro-fog"></div>

      <div class="premium-load-center">
        <div class="premium-load-logo">MORDRA</div>
        <div class="premium-load-sub">Chargement...</div>

        <div class="loading-box premium-loading-box">
          <div class="loading-text" id="loadingText">Chargement des survivants...</div>
          <div class="loading-bar premium-bar"><div id="loadingFill"></div></div>
          <div class="loading-percent" id="loadingPercent">0%</div>
        </div>
      </div>

      <div class="premium-credit-bottom">
        <span>A game imagined by</span>
        <b>Kevin Moreau</b>
        <small>Developed with the assistance of ChatGPT</small>
      </div>
    </div>
  `);

  sound("reveal");

  const texts = [
    "Chargement des survivants...",
    "Préparation des tueurs...",
    "Synchronisation des profils...",
    "Ouverture du Blood Market...",
    "Chargement du Passe des Ombres...",
    "Vérification des succès...",
    "Bienvenue dans MORDRA..."
  ];

  let progress = 0;
  let step = 0;

  const interval = setInterval(()=>{
    progress += Math.floor(2 + Math.random()*5);
    if(progress > 100) progress = 100;

    const fill = document.getElementById("loadingFill");
    const percent = document.getElementById("loadingPercent");
    const text = document.getElementById("loadingText");

    if(fill) fill.style.width = progress + "%";
    if(percent) percent.textContent = progress + "%";

    const nextStep = Math.min(texts.length-1, Math.floor(progress / 16));
    if(text && nextStep !== step){
      step = nextStep;
      text.textContent = texts[step];
    }

    if(progress >= 100){
      clearInterval(interval);
      sound("levelup");
      introTimers.push(setTimeout(()=>{
        goToStartScreen();
      }, 850));
    }
  }, 210);

  introTimers.push(interval);
}

function home(){
  clearIntroTimers();
  clearTimer();
  screen(`
    <div class="logo">MORDRA</div>
    <div class="tagline">Alpha 1.1.8 — Full Full Collection Fix</div>
    <div class="card">
      <button class="btn" onclick="newGame()">▶️ Nouvelle partie</button>
      <button class="btn secondary" onclick="leaderboard()">🏆 Classement</button>
      <button class="btn secondary" onclick="hallOfFame()">🏛️ Hall of Fame</button>
      <button class="btn secondary" onclick="statsList()">📊 Statistiques</button>
      <button class="btn secondary" onclick="achievementsList()">🏅 Succès</button>
      <button class="btn secondary" onclick="collectionList()">🎁 Collection</button>
      <button class="btn secondary" onclick="bmSelectPlayer()">🩸 Armurerie</button>
      <button class="btn ghost" onclick="settings()">⚙️ Paramètres</button>
      <p class="small">Moteur refait : joueurs vivants/éliminés, plusieurs Tueurs, manches qui continuent, mêmes mots jusqu'à la fin.</p>
    </div>`);
}

function newGame(){
  clearTimer();
  state={playersCount:4,killersCount:1,timerMinutes:3,playerNames:[],current:0,game:null,timerInterval:null};
  setupPlayersCount();
}
function setupPlayersCount(){
  screen(`<div class="card"><h1>Nouvelle partie</h1><p class="small">Choisis le nombre de joueurs.</p>
    <div class="counter"><button class="round" onclick="state.playersCount=Math.max(3,state.playersCount-1);setupPlayersCount()">−</button><strong>${state.playersCount}</strong><button class="round" onclick="state.playersCount=Math.min(20,state.playersCount+1);setupPlayersCount()">+</button></div>
    <button class="btn" onclick="setupKillers()">Continuer</button><button class="btn ghost" onclick="home()">Retour</button></div>`);
}
function setupKillers(){
  const rec=recommendedKillers(state.playersCount);
  state.killersCount=Math.min(state.killersCount,state.playersCount-2,3);
  screen(`<div class="card"><h1>Nombre de Tueurs</h1><p class="small">Recommandé : ${rec} Tueur${rec>1?"s":""}.</p>
    <div class="counter"><button class="round" onclick="state.killersCount=Math.max(1,state.killersCount-1);setupKillers()">−</button><strong>${state.killersCount}</strong><button class="round" onclick="state.killersCount=Math.min(3,state.playersCount-2,state.killersCount+1);setupKillers()">+</button></div>
    <button class="btn" onclick="setupTimer()">Continuer</button><button class="btn ghost" onclick="setupPlayersCount()">Retour</button></div>`);
}
function setupTimer(){
  const presets=[1,2,3,5,10];
  screen(`<div class="card"><h1>Compte à rebours</h1><p class="small">Temps de discussion avant chaque vote.</p>
    <div class="timer-preview">${state.timerMinutes}:00</div>
    <div class="vote-grid">${presets.map(m=>`<button class="btn ${state.timerMinutes===m?"":"secondary"}" onclick="state.timerMinutes=${m};setupTimer()">${m} min</button>`).join("")}</div>
    <input class="input" type="number" min="1" max="60" value="${state.timerMinutes}" onchange="state.timerMinutes=Math.max(1,Math.min(60,parseInt(this.value||3)));setupTimer()">
    <button class="btn" onclick="setupNames()">Continuer</button><button class="btn ghost" onclick="setupKillers()">Retour</button></div>`);
}
function setupNames(){
  if(state.playerNames.length!==state.playersCount) state.playerNames=Array.from({length:state.playersCount},(_,i)=>state.playerNames[i]||"");
  const savedPlayers=Object.keys(loadStats()).sort((a,b)=>a.localeCompare(b));
  const selectedLower=state.playerNames.filter(Boolean).map(n=>n.toLowerCase());
  const slots=state.playerNames.map((n,i)=>`<div class="player-slot"><div><b>Joueur ${i+1}</b><br><span class="small">${n||"Aucun joueur sélectionné"}</span></div>${n?`<button class="mini-btn" onclick="state.playerNames[${i}]='';setupNames()">Retirer</button>`:""}</div>`).join("");
  const savedList=savedPlayers.length?savedPlayers.map(name=>{const already=selectedLower.includes(name.toLowerCase()); return `<button class="btn ${already?"ghost":"secondary"}" ${already?"disabled":""} onclick="selectSavedPlayer('${name.replaceAll("'","\\'")}')">${already?"✅":"👤"} ${name}</button>`}).join(""):`<p class="small">Aucun joueur enregistré. Ajoute des nouveaux joueurs.</p>`;
  screen(`<div class="card"><h1>Joueurs de la partie</h1><p class="small">Sélectionne les joueurs enregistrés ou ajoute un nouveau joueur.</p>
    <h3>Places</h3>${slots}<h3>Joueurs enregistrés</h3>${savedList}
    <h3>Nouveau joueur</h3><input class="input" id="newPlayerName" placeholder="Nom du nouveau joueur"><button class="btn secondary" onclick="addNewPlayerFromInput()">Ajouter ce joueur</button>
    <div id="setupError" class="error-box hidden"></div>
    <button class="btn" onclick="startGame()">▶️ Lancer la partie</button><button class="btn ghost" onclick="setupTimer()">Retour</button></div>`);
}
function firstEmptyPlayerSlot(){ return state.playerNames.findIndex(n=>!n); }
function selectSavedPlayer(name){ const slot=firstEmptyPlayerSlot(); if(slot===-1)return alert("Toutes les places sont remplies."); if(state.playerNames.map(n=>n.toLowerCase()).includes(name.toLowerCase()))return alert("Déjà dans la partie."); state.playerNames[slot]=name; setupNames(); }
function addNewPlayerFromInput(){ const name=(document.getElementById("newPlayerName")?.value||"").trim(); if(!name)return alert("Entre un nom."); const slot=firstEmptyPlayerSlot(); if(slot===-1)return alert("Toutes les places sont remplies."); if(state.playerNames.map(n=>n.toLowerCase()).includes(name.toLowerCase()))return alert("Déjà dans la partie."); const stats=loadStats(); ensurePlayer(stats,name); saveStats(stats); state.playerNames[slot]=name; setupNames(); }

function startGame(){
  try{
    const names=state.playerNames.map(n=>String(n||"").trim());
    if(names.length!==state.playersCount || names.some(n=>!n)) return showError("Il manque un joueur.");
    if(new Set(names.map(n=>n.toLowerCase())).size!==names.length) return showError("Deux joueurs ont le même nom.");
    const stats=loadStats(); names.forEach(n=>ensurePlayer(stats,n)); saveStats(stats);
    const pair=weightedPair();
    const shuffled=names.map((_,i)=>i).sort(()=>Math.random()-.5);
    const killerIndexes=shuffled.slice(0,state.killersCount);
    state.game={
      id:"MORDRA_"+Date.now()+"_"+Math.floor(Math.random()*9999),
      pair, round:1, tieCount:0, timerSeconds:state.timerMinutes*60,
      players:names.map((name,i)=>({name,index:i,role:killerIndexes.includes(i)?"killer":"survivor",alive:true,eliminatedRound:null})),
      votes:{}, eliminatedThisRound:null, winner:null, saved:false, log:[]
    };
    addLog(`Partie lancée avec ${names.length} joueurs et ${state.killersCount} Tueur(s).`);
    state.current=0; revealPass();
  }catch(err){ console.error(err); showError("Erreur : "+err.message); }
}

function aliveIndexList(){ return state.game.players.map((p,i)=>p.alive?i:null).filter(i=>i!==null); }

function revealPass(){
  const alive=aliveIndexList();
  if(state.current>=alive.length){ discussion(); return; }
  const idx=alive[state.current]; const p=playerByIndex(idx);
  screen(`<div class="card"><h1>Passe le téléphone</h1><p class="small">Donne le téléphone à :</p>${bmPlayerShowcase(p.name)}${playerLevelCard(p.name)}<p class="small">Cache bien l'écran avant d'appuyer.</p><button class="btn" onclick="showRole()">Voir mon rôle</button></div>`);
}
function showRole(){
  sound("reveal"); // même son pour Tueur et Survivant
  const idx=aliveIndexList()[state.current]; const p=playerByIndex(idx);
  const killer=p.role==="killer"; const word=killer?state.game.pair.k:state.game.pair.s;
  screen(`<div class="rolecard ${killer?"killer":"survivor"}"><div class="role-icon">${killer?"🔪":"🛡️"}</div><div class="role-title">${killer?"TU ES LE TUEUR":"TU ES SURVIVANT"}</div><div class="small">Ton mot secret</div><div class="word">${word}</div><p class="small">${killer?"Mens. Observe. Survis.":"Trouve tous les Tueurs."}</p></div><button class="btn" onclick="hideRole()">Cacher et passer</button>`);
}
function hideRole(){ state.current++; revealPass(); }

function discussion(){
  clearTimer();
  const living=alivePlayers(), killersLeft=aliveKillers().length;
  state.game.timerSeconds=Math.max(30, state.game.timerSeconds || state.timerMinutes*60);
  screen(`<div class="card timer-card"><div class="round-title"><h1>Tour ${state.game.round}</h1><span class="badge">🔪 ${killersLeft} Tueur${killersLeft>1?"s":""} restant${killersLeft>1?"s":""}</span></div>
    <p class="small">Même mot, même manche. Seuls les joueurs vivants parlent.</p>
    <div class="result-line">${living.map(p=>`<span class="alive">●</span> ${p.name}`).join("<br>")}</div>
    <div class="countdown" id="countdown">${formatTime(state.game.timerSeconds)}</div><div class="timer-bar"><div id="timerFill"></div></div>
    <button class="btn" onclick="startVote()">Lancer le vote maintenant</button></div>`);
  const total=state.game.timerSeconds;
  state.timerInterval=setInterval(()=>{
    state.game.timerSeconds--;
    const cd=document.getElementById("countdown"), fill=document.getElementById("timerFill");
    if(cd) cd.textContent=formatTime(Math.max(0,state.game.timerSeconds));
    if(fill) fill.style.width=`${Math.max(0,(state.game.timerSeconds/total)*100)}%`;
    if(state.game.timerSeconds<=10 && state.game.timerSeconds>0){ sound("timer"); if(cd) cd.classList.add("danger"); }
    if(state.game.timerSeconds<=0){ clearTimer(); sound("end"); startVote(); }
  },1000);
}
function startVote(){ clearTimer(); state.current=0; state.game.votes={}; votePass(); }

function votePass(){
  const alive=aliveIndexList();
  if(state.current>=alive.length){ voteResults(); return; }
  const idx=alive[state.current], p=playerByIndex(idx);
  screen(`<div class="card"><h1>Vote secret</h1><p class="small">Passe le téléphone à :</p>${bmPlayerShowcase(p.name)}${playerLevelCard(p.name)}<p class="small">Il doit voter en cachant l'écran.</p><button class="btn" onclick="voteScreen()">Voter</button></div>`);
}
function voteScreen(){
  const voterIdx=aliveIndexList()[state.current];
  const voter=playerByIndex(voterIdx);
  const options=aliveIndexList().filter(i=>i!==voterIdx).map(i=>`<button class="btn secondary" onclick="castVote(${i})">${playerByIndex(i).name}</button>`).join("");
  screen(`<div class="card"><h1>Qui est le Tueur ?</h1><p class="small">${voter.name}, choisis en secret.</p><div class="vote-grid">${options}</div></div>`);
}
function castVote(targetIdx){
  sound("vote");
  const voterIdx=aliveIndexList()[state.current];
  state.game.votes[voterIdx]=targetIdx;
  addLog(`${playerByIndex(voterIdx).name} a voté.`);
  state.current++;
  screen(`<div class="card"><h1>Vote enregistré</h1><p class="small">Passe au joueur suivant sans montrer l'écran.</p><button class="btn" onclick="votePass()">Continuer</button></div>`);
}

function voteResults(){
  const counts={};
  Object.values(state.game.votes).forEach(v=>counts[v]=(counts[v]||0)+1);
  const max=Math.max(...Object.values(counts));
  const tied=Object.keys(counts).filter(k=>counts[k]===max).map(Number);
  const lines=aliveIndexList().map(i=>`<div class="result-line">${playerByIndex(i).name} : <b>${counts[i]||0}</b> vote${(counts[i]||0)>1?"s":""}</div>`).join("");

  if(tied.length>1){
    state.game.tieCount++;
    const tiedNames=tied.map(i=>playerByIndex(i).name).join(", ");
    if(state.game.tieCount>=3){
      state.game.winner="killers"; addLog("Troisième égalité : victoire des Tueurs.");
      return finishGame("killers","Après 3 égalités, les Survivants n'ont pas réussi à se mettre d'accord.");
    }
    sound("bad"); addLog(`Égalité entre ${tiedNames}. Aucun joueur éliminé.`);
    screen(`<div class="card"><h1>⚖️ Égalité</h1>${lines}<h2>Aucun joueur éliminé</h2><p class="small">Égalité entre : ${tiedNames}.</p><p class="small">Égalité ${state.game.tieCount}/3. À la 3e égalité, les Tueurs gagnent.</p><button class="btn" onclick="restartRoundAfterTie()">Nouveau tour</button></div>`);
    return;
  }

  state.game.tieCount=0;
  const eliminatedIdx=tied[0];
  const eliminated=playerByIndex(eliminatedIdx);
  eliminated.alive=false; eliminated.eliminatedRound=state.game.round;
  state.game.eliminatedThisRound=eliminatedIdx;
  const wasKiller=eliminated.role==="killer";
  addLog(`${eliminated.name} éliminé (${wasKiller?"Tueur":"Survivant"}).`);

  const killersLeft=aliveKillers().length;
  if(wasKiller && killersLeft===0){
    state.game.winner="survivors";
    screen(`<div class="card"><h1>Résultat du vote</h1>${lines}<h2>💀 ${eliminated.name} est éliminé</h2><div class="role-reveal killer-reveal">🔪 C'était un Tueur</div><h2>🛡️ Tous les Tueurs sont éliminés</h2><button class="btn" onclick="finishGame('survivors','Tous les Tueurs ont été trouvés.')">Voir le résumé</button></div>`);
    return;
  }

  if(wasKiller && killersLeft>0){
    screen(`<div class="card"><h1>Résultat du vote</h1>${lines}<h2>💀 ${eliminated.name} est éliminé</h2><div class="role-reveal killer-reveal">🔪 C'était un Tueur</div><h2>Il reste encore ${killersLeft} Tueur${killersLeft>1?"s":""} en liberté...</h2><p class="small">La partie continue avec les mêmes mots. ${eliminated.name} ne vote plus.</p><button class="btn" onclick="continueHunt()">Continuer la chasse</button></div>`);
    return;
  }

  // Un Survivant éliminé : les Tueurs gagnent quand il reste autant ou plus de Tueurs que de Survivants.
  const survivorsLeft=alivePlayers().filter(p=>p.role==="survivor").length;
  if(killersLeft>=survivorsLeft){
    state.game.winner="killers";
    screen(`<div class="card"><h1>Résultat du vote</h1>${lines}<h2>💀 ${eliminated.name} est éliminé</h2><div class="role-reveal survivor-reveal">🛡️ C'était un Survivant</div><h2>🔪 Les Tueurs prennent le contrôle</h2><p class="small">Il reste ${killersLeft} Tueur(s) contre ${survivorsLeft} Survivant(s).</p><button class="btn" onclick="finishGame('killers','Les Tueurs sont devenus impossibles à arrêter.')">Voir le résumé</button></div>`);
    return;
  }

  screen(`<div class="card"><h1>Résultat du vote</h1>${lines}<h2>💀 ${eliminated.name} est éliminé</h2><div class="role-reveal survivor-reveal">🛡️ C'était un Survivant</div><h2>La partie continue</h2><p class="small">Il reste ${killersLeft} Tueur(s). ${eliminated.name} ne vote plus.</p><button class="btn" onclick="continueHunt()">Continuer</button></div>`);
}

function restartRoundAfterTie(){ state.game.round++; state.game.votes={}; state.game.timerSeconds=Math.max(30,Math.min(60,state.timerMinutes*60)); discussion(); }
function continueHunt(){ state.game.round++; state.game.votes={}; state.game.timerSeconds=Math.max(30,Math.min(60,state.timerMinutes*60)); addLog(`Tour ${state.game.round} lancé.`); discussion(); }

function calcXP(idx,winner){
  const p=playerByIndex(idx), killer=p.role==="killer";
  const vote=state.game.votes[idx];
  const votedKiller=vote!==undefined && playerByIndex(vote)?.role==="killer";
  let xp=50, notes=[];
  const won=killer?winner==="killers":winner==="survivors";
  if(!killer){
    if(won){xp+=120;notes.push("Victoire Survivant");} else notes.push("Défaite Survivant");
    if(vote!==undefined){ if(votedKiller){xp+=50;notes.push("Bon vote");} else {xp=Math.max(0,xp-20);notes.push("Mauvais vote");} }
  } else {
    if(won){xp+=250;notes.push("Victoire Tueur");} else {xp+=80;notes.push("Défaite Tueur");}
    const received=Object.values(state.game.votes).filter(v=>v===idx).length;
    if(received===0){xp+=60;notes.push("Zéro vote reçu");}
    if(state.game.eliminatedThisRound!==null && playerByIndex(state.game.eliminatedThisRound)?.role==="survivor" && vote===state.game.eliminatedThisRound){xp+=40;notes.push("Manipulation réussie");}
  }
  if(!p.alive && p.eliminatedRound){ notes.push(`Éliminé tour ${p.eliminatedRound}`); }
  return {xp,notes};
}
function clonePlayerStats(p){ return JSON.parse(JSON.stringify(p)); }
function detectLevelUpsForPlayer(before,after){
  before=normalizePlayerStats(before||{}); after=normalizePlayerStats(after||{});
  const ups=[];
  const bg=levelFromXP(before.totalXP||0), ag=levelFromXP(after.totalXP||0); if(ag>bg) ups.push(`⭐ Général ${bg} ➜ ${ag}`);
  const bs=levelFromXP(before.survivor.xp||0), as=levelFromXP(after.survivor.xp||0); if(as>bs) ups.push(`🛡️ Survivant ${bs} ➜ ${as}`);
  const bk=levelFromXP(before.killer.xp||0), ak=levelFromXP(after.killer.xp||0); if(ak>bk) ups.push(`🔪 Tueur ${bk} ➜ ${ak}`);
  return ups;
}

function finishGame(winner,reason=""){
  clearTimer();
  state.game.winner=winner;
  const summary=state.game.players.map((p,i)=>{const r=calcXP(i,winner); return `<div class="result-line"><b>${p.name}</b> — ${p.role==="killer"?"🔪 Tueur":"🛡️ Survivant"} — ${p.alive?'<span class="alive">Vivant</span>':'<span class="dead">Éliminé</span>'}<br><span class="xp">+${r.xp} XP</span><br><span class="small">${r.notes.join(" • ")}</span></div>`}).join("");
  screen(`<div class="card"><h1>${winner==="survivors"?"🛡️ Victoire des Survivants":"🔪 Victoire des Tueurs"}</h1><p class="small">${reason}</p>${summary}<button class="btn" onclick="saveGame()">✅ Valider et enregistrer</button><button class="btn ghost" onclick="home()">Ne pas enregistrer</button></div>`);
}

function saveGame(){
  try{
    if(!state.game){
      alert("Aucune partie à enregistrer.");
      return;
    }

    const previousMVPName = typeof getMVPPlayer === "function" ? (getMVPPlayer()?.name || null) : null;

    const stats = loadStats();
    const history = loadHistory();

    if(history.find(h=>h.id===state.game.id)){
      alert("Cette partie est déjà enregistrée.");
      return;
    }

    const levelUps = [];
    const bloodShardUps = [];

    state.game.players.forEach((gp,i)=>{
      let p = ensurePlayer(stats, gp.name);
      if(typeof bmNormalize === "function") p = bmNormalize(p);
      else {
        p.wallet ??= {};
        p.wallet.shards ??= Number(p.shards || p.bloodShards || 0);
      }

      const before = JSON.parse(JSON.stringify(p));
      const res = calcXP(i, state.game.winner);
      const killer = gp.role === "killer";
      const won = killer ? state.game.winner === "killers" : state.game.winner === "survivors";

      const shardGain = (typeof shardsFromXP === "function" ? shardsFromXP(res.xp) : Math.max(10, Math.round(res.xp * 0.18))) + (won ? 25 : 0);

      p.games = (p.games || 0) + 1;
      p.totalXP = (p.totalXP || 0) + res.xp;

      if(won){
        p.wins = (p.wins || 0) + 1;
        p.streak = (p.streak || 0) + 1;
      }else{
        p.losses = (p.losses || 0) + 1;
        p.streak = 0;
      }
      p.bestStreak = Math.max(p.bestStreak || 0, p.streak || 0);

      p.wallet ??= {};
      p.wallet.shards = Number(p.wallet.shards || p.shards || p.bloodShards || 0) + shardGain;
      p.shards = p.wallet.shards;
      p.bloodShards = p.wallet.shards;
      bloodShardUps.push({name:gp.name, shards:shardGain});

      if(killer){
        p.killer ??= {};
        p.killer.games = (p.killer.games || 0) + 1;
        p.killer.xp = (p.killer.xp || 0) + res.xp;
        if(won){
          p.killer.wins = (p.killer.wins || 0) + 1;
          p.killer.currentStreak = (p.killer.currentStreak || 0) + 1;
        }else{
          p.killer.losses = (p.killer.losses || 0) + 1;
          p.killer.currentStreak = 0;
        }
        p.killer.bestStreak = Math.max(p.killer.bestStreak || 0, p.killer.currentStreak || 0);
        p.killer.votesReceived = (p.killer.votesReceived || 0) + Object.values(state.game.votes || {}).filter(v=>v===i).length;
      }else{
        p.survivor ??= {};
        p.survivor.games = (p.survivor.games || 0) + 1;
        p.survivor.xp = (p.survivor.xp || 0) + res.xp;
        if(won){
          p.survivor.wins = (p.survivor.wins || 0) + 1;
          p.survivor.currentStreak = (p.survivor.currentStreak || 0) + 1;
        }else{
          p.survivor.losses = (p.survivor.losses || 0) + 1;
          p.survivor.currentStreak = 0;
        }
        p.survivor.bestStreak = Math.max(p.survivor.bestStreak || 0, p.survivor.currentStreak || 0);

        const vote = (state.game.votes || {})[i];
        if(vote !== undefined && state.game.players[vote]?.role === "killer"){
          p.survivor.goodVotes = (p.survivor.goodVotes || 0) + 1;
          p.survivor.killersFound = (p.survivor.killersFound || 0) + 1;
        }else if(vote !== undefined){
          p.survivor.badVotes = (p.survivor.badVotes || 0) + 1;
        }
      }

      const beforeGeneral = levelFromXP(before.totalXP || 0);
      const afterGeneral = levelFromXP(p.totalXP || 0);
      const ups = [];
      if(afterGeneral > beforeGeneral) ups.push(`⭐ Général ${beforeGeneral} ➜ ${afterGeneral}`);

      const beforeSurvivor = levelFromXP(before.survivor?.xp || 0);
      const afterSurvivor = levelFromXP(p.survivor?.xp || 0);
      if(afterSurvivor > beforeSurvivor) ups.push(`🛡️ Survivant ${beforeSurvivor} ➜ ${afterSurvivor}`);

      const beforeKiller = levelFromXP(before.killer?.xp || 0);
      const afterKiller = levelFromXP(p.killer?.xp || 0);
      if(afterKiller > beforeKiller) ups.push(`🔪 Tueur ${beforeKiller} ➜ ${afterKiller}`);

      if(ups.length) levelUps.push({name:gp.name, ups});

      stats[gp.name] = typeof bmNormalize === "function" ? bmNormalize(p) : normalizePlayerStats(p);
    });

    history.push({
      id: state.game.id,
      date: new Date().toISOString(),
      winner: state.game.winner,
      players: state.game.players.map(p=>({
        name:p.name,
        role:p.role,
        alive:p.alive,
        eliminatedRound:p.eliminatedRound
      })),
      pair: state.game.pair,
      log: state.game.log || []
    });

    saveStats(stats);
    saveHistory(history);

    const newMVPName = typeof getMVPPlayer === "function" ? (getMVPPlayer()?.name || null) : null;

    if(levelUps.length) setTimeout(()=>sound("levelup"),120);
    else sound("good");

    const levelHtml = levelUps.length ? `
      <div class="levelup-panel">
        <h2>✨ Passages de niveau</h2>
        ${levelUps.map(item=>`
          <div class="result-line levelup-line">
            <b>${item.name}</b><br>
            ${item.ups.map(up=>`<span class="xp">${up}</span>`).join("<br>")}
          </div>
        `).join("")}
      </div>` : "";

    const mvpHtml = (newMVPName && previousMVPName && newMVPName !== previousMVPName) ? `
      <div class="levelup-panel mvp-announcement">
        <h2>👑 Nouveau MVP</h2>
        <div class="result-line levelup-line">
          <b>${newMVPName}</b><br>
          <span class="xp">vient de dépasser ${previousMVPName}</span>
        </div>
      </div>` : "";

    const shardHtml = bloodShardUps.length ? `
      <div class="levelup-panel">
        <h2>🩸 Éclats de Sang gagnés</h2>
        ${bloodShardUps.map(item=>`
          <div class="result-line levelup-line">
            <b>${item.name}</b><br>
            <span class="xp">+${item.shards} 🩸</span>
          </div>
        `).join("")}
      </div>` : "";

    screen(`
      <div class="card">
        <h1>Stats enregistrées ✅</h1>
        <p class="small">La partie a été ajoutée à l'historique.</p>
        ${levelHtml}${mvpHtml}${shardHtml}
        <button class="btn" onclick="leaderboard()">Voir le classement</button>
        <button class="btn secondary" onclick="home()">Menu</button>
      </div>
    `);
  }catch(err){
    console.error("SAVE ERROR", err);
    alert("Erreur pendant l'enregistrement : " + err.message);
  }
}

function hallOfFame(){
  const stats = Object.values(loadStats()).map(normalizePlayerStats).sort((a,b)=>(b.totalXP||0)-(a.totalXP||0));
  const mvp = getMVPPlayer();
  const mostWins = [...stats].sort((a,b)=>(b.wins||0)-(a.wins||0))[0];
  const bestStreak = [...stats].sort((a,b)=>(b.bestStreak||0)-(a.bestStreak||0))[0];
  const mostGames = [...stats].sort((a,b)=>(b.games||0)-(a.games||0))[0];

  const mvpCard = mvp ? `
    <div class="hof-mvp-card">
      <div class="mvp-badge big">👑 MVP ACTUEL</div>
      <h1>${mvp.name}</h1>
      <p class="xp">${mvp.totalXP || 0} XP • Niveau ${levelFromXP(mvp.totalXP||0)}</p>
      <p class="small">Le joueur avec le plus d'XP générale porte la couronne.</p>
    </div>` : `<p class="small">Aucun MVP pour l'instant.</p>`;

  const record = (icon,label,p,value)=>p?`<div class="result-line"><b>${icon} ${label}</b><br><span class="small">${p.name}</span><br><span class="xp">${value}</span></div>`:"";

  screen(`<div class="card">${topBack('home()')}<h1>🏛️ Hall of Fame</h1>
    ${mvpCard}
    <h2>Records</h2>
    ${record("🏆","Plus de victoires",mostWins,`${mostWins?.wins||0} victoires`)}
    ${record("🔥","Meilleure série",bestStreak,`${bestStreak?.bestStreak||0} victoires d'affilée`)}
    ${record("🎮","Plus de parties",mostGames,`${mostGames?.games||0} parties`)}
  </div>`);
}

function leaderboard(){
  const stats=Object.values(loadStats()).map(normalizePlayerStats).sort((a,b)=>b.totalXP-a.totalXP);
  const mvp = getMVPPlayer();
  const topCard = mvp ? `
    <div class="leader-mvp-card">
      <div class="mvp-badge big">👑 MVP</div>
      <h1>${mvp.name}</h1>
      <p class="xp">${mvp.totalXP || 0} XP</p>
      <p class="small">Niveau ${levelFromXP(mvp.totalXP||0)} • ${mvp.games||0} parties</p>
    </div>` : "";
  const lines=stats.length?stats.map((p,i)=>`
    <div class="listitem ${isMVPName(p.name) ? "mvp-row" : ""}" onclick="playerStats('${p.name.replaceAll("'","\\'")}')">
      <div><b>${i+1}. ${isMVPName(p.name) ? "👑 " : ""}${p.name}</b><br><span class="small">Niv. ${levelFromXP(p.totalXP)} • ${p.games} parties</span></div>
      <span class="badge">${p.totalXP} XP</span>
    </div>`).join(""):`<p class="small">Aucune partie enregistrée.</p>`;
  screen(`<div class="card">${topBack('home()')}<h1>🏆 Classement</h1>
    <button class="btn secondary" onclick="historyList()">📜 Historique des parties</button>
    ${topCard}
    <p class="small">Le MVP est automatiquement le joueur avec le plus d'XP générale.</p>
    ${lines}
  </div>`);
}

function statsList(){
  const stats=Object.values(migrateAllWallets()).map(normalizePlayerStats).sort((a,b)=>a.name.localeCompare(b.name));
  const lines=stats.length?stats.map(p=>`<div class="listitem" onclick="playerStats('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">${p.games} parties • ${p.totalXP} XP • 🩸 ${p.wallet?.shards || 0}</span></div><span>›</span></div>`).join(""):`<p class="small">Aucun joueur enregistré.</p>`;
  screen(`<div class="card">${topBack('home()')}<h1>📊 Statistiques</h1>
    <button class="btn" onclick="newPlayerFromStats()">➕ Nouveau joueur</button>
    <p class="small">Crée un profil sans lancer une partie, puis retrouve-le ici.</p>
    ${lines}
  </div>`);
}

function newPlayerFromStats(){
  screen(`<div class="card">${topBack('statsList()')}<h1>➕ Nouveau joueur</h1>
    <p class="small">Ajoute un joueur directement dans les statistiques. Il sera disponible dans les futures parties.</p>
    <input class="input" id="statsNewPlayerName" placeholder="Nom du joueur">
    <div id="setupError" class="error-box hidden"></div>
    <button class="btn" onclick="saveNewPlayerFromStats()">Créer le joueur</button>
  </div>`);
}

function saveNewPlayerFromStats(){
  const input=document.getElementById("statsNewPlayerName");
  const name=(input?.value||"").trim();
  if(!name) return showError("Entre un nom.");
  const stats=loadStats();
  const exists=Object.keys(stats).some(n=>n.toLowerCase()===name.toLowerCase());
  if(exists) return showError("Ce joueur existe déjà.");
  ensurePlayer(stats,name);
  saveStats(stats);
  sound("good");
  playerStats(name);
}

function playerStats(name,tab="survivor"){
  const p=getPlayerByName(name); if(!p)return statsList();
  const isS=tab==="survivor", data=isS?p.survivor:p.killer;
  const lvl=levelFromXP(data.xp), rank=isS?survivorRank(lvl):killerRank(lvl);
  const winrate=data.games?Math.round((data.wins/data.games)*100):0;
  screen(`<div class="card">${topBack('statsList()')}<div class="profile-banner ${isMVPName(p.name) ? "mvp-card" : ""} ${p.cosmetics.frame?'profile-has-frame':''}" style="background:${getBanner(p.cosmetics.banner).css}"><div class="profile-frame-icon">${getFrame(p.cosmetics.frame)?.icon || ""}</div>${mvpBadge(p.name)}<h1>${p.name}</h1><div class="profile-title">${getTitle(p.cosmetics.title)?.name || "Sans titre"}</div><div class="profile-badges">${(p.cosmetics.badges||[]).slice(0,3).map(id=>`<span>${getBadge(id)?.icon||"🏅"}</span>`).join("")}</div></div>${xpCard(p.totalXP,"Niveau général","⭐")}<p class="small">🔥 Série générale : ${p.streak} • Record général : ${p.bestStreak}</p>
    <div class="tabs"><button class="tab ${isS?"active":""}" onclick="playerStats('${name.replaceAll("'","\\'")}','survivor')">🛡️ Survivant</button><button class="tab ${!isS?"active":""}" onclick="playerStats('${name.replaceAll("'","\\'")}','killer')">🔪 Tueur</button></div>
    ${xpCard(data.xp,isS?"Niveau Survivant":"Niveau Tueur",isS?"🛡️":"🔪",rank)}
    <div class="statbox"><div class="stat"><span class="small">Parties</span><b>${data.games}</b></div><div class="stat"><span class="small">Victoires</span><b>${data.wins}</b></div><div class="stat"><span class="small">Défaites</span><b>${data.losses}</b></div><div class="stat"><span class="small">Winrate</span><b>${winrate}%</b></div>
    ${isS?`<div class="stat"><span class="small">Bons votes</span><b>${data.goodVotes}</b></div><div class="stat"><span class="small">Mauvais votes</span><b>${data.badVotes}</b></div><div class="stat"><span class="small">Tueurs trouvés</span><b>${data.killersFound}</b></div>`:`<div class="stat"><span class="small">Manipulations</span><b>${data.manips}</b></div><div class="stat"><span class="small">Votes reçus</span><b>${data.votesReceived}</b></div><div class="stat"><span class="small">Zéro vote</span><b>${data.zeroVoteWins}</b></div>`}
    <div class="stat"><span class="small">Série actuelle</span><b>${data.currentStreak}</b></div><div class="stat"><span class="small">Record d'affilée</span><b>${data.bestStreak}</b></div></div>
    <button class="btn ghost" onclick="statsList()">Retour stats</button></div>`);
}


function armorySelectPlayer(){
  const stats=Object.values(migrateAllWallets()).map(normalizePlayerStats).sort((a,b)=>a.name.localeCompare(b.name));
  const lines=stats.length?stats.map(p=>`
    <div class="listitem" onclick="armoryHome('${p.name.replaceAll("'","\\'")}')">
      <div><b>${p.name}</b><br><span class="small">🩸 ${p.wallet?.shards || 0} Éclats de Sang</span></div><span>›</span>
    </div>`).join(""):`<p class="small">Aucun joueur enregistré. Joue une partie pour créer des joueurs.</p>`;
  screen(`<div class="card">${topBack('home()')}<h1>🩸 Armurerie des Ombres</h1><p class="small">Choisis le joueur qui entre dans le Blood Market.</p>${lines}</div>`);
}
function armoryHeader(p){
  return `<div class="blood-header">
    <div><span class="small">Blood Market</span><b>${p.name}</b></div>
    <div class="blood-money">🩸 ${p.wallet?.shards || 0}</div>
  </div>`;
}
function armoryHome(name){
  const p=getPlayerByName(name); if(!p)return armorySelectPlayer();
  screen(`<div class="card armory-card">${topBack('home()')}
    ${armoryHeader(p)}
    <h1>🩸 Blood Market</h1>
    <p class="small">Achète des objets cosmétiques avec tes Éclats de Sang. Aucun objet ne donne d'avantage en partie.</p>
    <button class="btn" onclick="shop('${name.replaceAll("'","\\'")}','all')">🛒 Boutique</button>
    <button class="btn secondary" onclick="chests('${name.replaceAll("'","\\'")}')">🎁 Coffres</button>
    <button class="btn secondary" onclick="shadowPass('${name.replaceAll("'","\\'")}')">🛡️ Passe des Ombres</button>
    <button class="btn secondary" onclick="playerCollection('${name.replaceAll("'","\\'")}')">🎨 Collection</button>
    <div class="result-line"><b>Offre du jour</b><br><span class="small">Bannière Galaxy — promo prototype</span><br><span class="xp">15 000 ➜ 9 500 🩸</span></div>
  </div>`);
}
function shop(name,filter="all"){
  const stats=loadStats(); const p=normalizePlayerStats(stats[name]); if(!p)return armorySelectPlayer();
  const types=[["all","Tout"],["banner","Bannières"],["badge","Badges"],["frame","Cadres"],["title","Titres"]];
  const items=getShopItems().filter(i=>filter==="all"||i.type===filter);
  const tabs=`<div class="tabs">${types.slice(0,3).map(t=>`<button class="tab ${filter===t[0]?"active":""}" onclick="shop('${name.replaceAll("'","\\'")}','${t[0]}')">${t[1]}</button>`).join("")}</div>
  <div class="tabs">${types.slice(3).map(t=>`<button class="tab ${filter===t[0]?"active":""}" onclick="shop('${name.replaceAll("'","\\'")}','${t[0]}')">${t[1]}</button>`).join("")}</div>`;
  const html=items.map(item=>{
    const owned=hasItem(p,item);
    const afford=(p.wallet?.shards||0)>=item.price;
    const icon=item.icon || (item.type==="banner"?"🖼️":item.type==="frame"?"👑":"⭐");
    const price=item.id==="galaxy" ? 9500 : item.price;
    return `<div class="shop-item ${getRarityClass(item.rarity)}">
      <div class="shop-icon">${icon}</div>
      <div class="shop-info"><b>${item.name}</b><br><span class="small">${item.rarity} • ${item.type}</span><br><span class="xp">🩸 ${price}</span></div>
      <button class="mini-btn" ${owned?"disabled":""} onclick="buyItem('${name.replaceAll("'","\\'")}','${item.type}','${item.id}')">${owned?"Déjà":"Acheter"}</button>
    </div>`;
  }).join("");
  screen(`<div class="card">${topBack(`armoryHome('${name.replaceAll("'","\\'")}')`)}${armoryHeader(p)}<h1>🛒 Boutique</h1>${tabs}${html}</div>`);
}
function findItem(type,id){ return getShopItems().find(i=>i.type===type && i.id===id); }
function buyItem(name,type,id){
  const stats=loadStats(); const p=normalizePlayerStats(stats[name]); const item=findItem(type,id); if(!item)return;
  const price=id==="galaxy"?9500:item.price;
  if(hasItem(p,item)) return alert("Objet déjà débloqué.");
  if((p.wallet?.shards||0)<price) return alert("Pas assez d'Éclats de Sang.");
  if(!confirm(`Acheter ${item.name} pour ${price} Éclats de Sang ?`)) return;
  p.wallet.shards-=price;
  giveItem(p,item);
  savePlayerByName(name,p);
  sound("levelup");
  screen(`<div class="card purchase-screen">
    <h1>🩸 Nouvel objet</h1>
    <div class="shop-icon big">${item.icon || (item.type==="banner"?"🖼️":item.type==="frame"?"👑":"⭐")}</div>
    <h2>${item.name}</h2>
    <p class="xp">${item.rarity}</p>
    <button class="btn" onclick="shop('${name.replaceAll("'","\\'")}','${type}')">Retour boutique</button>
    <button class="btn secondary" onclick="playerCollection('${name.replaceAll("'","\\'")}')">Équiper maintenant</button>
  </div>`);
}
function chests(name){
  const p=getPlayerByName(name); if(!p)return armorySelectPlayer();
  const defs=[
    {id:"common",name:"Coffre Commun",price:1000,rarity:"Commun"},
    {id:"rare",name:"Coffre Rare",price:5000,rarity:"Rare"},
    {id:"epic",name:"Coffre Épique",price:15000,rarity:"Épique"},
    {id:"mythic",name:"Coffre Mythique",price:50000,rarity:"Mythique"}
  ];
  const html=defs.map(c=>`<div class="shop-item ${getRarityClass(c.rarity)}"><div class="shop-icon">🎁</div><div class="shop-info"><b>${c.name}</b><br><span class="small">${c.rarity}</span><br><span class="xp">🩸 ${c.price}</span></div><button class="mini-btn" onclick="openChest('${name.replaceAll("'","\\'")}','${c.id}')">Ouvrir</button></div>`).join("");
  screen(`<div class="card">${topBack(`armoryHome('${name.replaceAll("'","\\'")}')`)}${armoryHeader(p)}<h1>🎁 Coffres</h1><p class="small">Prototype : chaque coffre donne un objet non possédé si possible.</p>${html}</div>`);
}
function openChest(name,chestId){
  const prices={common:1000,rare:5000,epic:15000,mythic:50000};
  const allowed={common:["Commun","Rare"],rare:["Rare","Épique"],epic:["Épique","Légendaire"],mythic:["Légendaire","Mythique"]};
  const stats=loadStats(); const p=normalizePlayerStats(stats[name]); const price=prices[chestId]||1000;
  if((p.wallet?.shards||0)<price) return alert("Pas assez d'Éclats de Sang.");
  let pool=getShopItems().filter(i=>allowed[chestId].includes(i.rarity) && !hasItem(p,i));
  if(!pool.length) pool=getShopItems().filter(i=>!hasItem(p,i));
  if(!pool.length) return alert("Tu as déjà tout débloqué.");
  const item=pool[Math.floor(Math.random()*pool.length)];
  p.wallet.shards-=price; giveItem(p,item); savePlayerByName(name,p); sound("levelup");
  screen(`<div class="card purchase-screen"><h1>🎁 Coffre ouvert</h1><div class="chest-anim">🎁</div><h2>${item.name}</h2><p class="xp">${item.rarity}</p><p class="small">Objet ajouté à ta collection.</p><button class="btn" onclick="chests('${name.replaceAll("'","\\'")}')">Ouvrir un autre coffre</button><button class="btn secondary" onclick="playerCollection('${name.replaceAll("'","\\'")}')">Voir collection</button></div>`);
}
function shadowPass(name){
  const p=getPlayerByName(name); if(!p)return armorySelectPlayer();
  const passXP=Math.floor((p.totalXP||0)/2);
  const lvl=Math.min(100, Math.floor(passXP/250)+1);
  const progress=passXP%250;
  screen(`<div class="card">${topBack(`armoryHome('${name.replaceAll("'","\\'")}')`)}${armoryHeader(p)}<h1>🛡️ Passe des Ombres</h1><p class="small">Prototype gratuit : le passe avance avec ton XP général.</p>
    <div class="level-card"><div class="level-head"><div><span class="small">Niveau du Passe</span><b>Niveau ${lvl}/100</b></div><span class="badge">${passXP} XP</span></div><div class="level-bar"><div style="width:${Math.round((progress/250)*100)}%"></div></div><div class="xp-line"><b>${progress} / 250 XP</b></div></div>
    <div class="result-line"><b>Récompense niveau ${lvl+1}</b><br><span class="small">🩸 Éclats de Sang + objet cosmétique selon le niveau.</span></div>
    <div class="result-line"><b>Important</b><br><span class="small">Le Passe des Ombres sera enrichi dans les prochaines mises à jour.</span></div>
  </div>`);
}

function achievementsList(){
  const stats=Object.values(migrateAllWallets()).map(normalizePlayerStats).sort((a,b)=>a.name.localeCompare(b.name));
  const lines=stats.length?stats.map(p=>{
    const rewards=getUnlockedRewards(p);
    return `<div class="listitem" onclick="playerAchievements('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">${rewards.unlocked.length} / ${achievements.length} succès</span></div><span>›</span></div>`;
  }).join(""):`<p class="small">Aucun joueur enregistré.</p>`;
  screen(`<div class="card">${topBack('home()')}<h1>🏅 Succès</h1><p class="small">Choisis un joueur pour voir ses défis, récompenses, bannières et badges.</p>${lines}<button class="btn ghost" onclick="home()">Retour</button></div>`);
}
function playerAchievements(name,cat="Tous"){
  const p=getPlayerByName(name); if(!p)return achievementsList();
  const rewards=getUnlockedRewards(p);
  const cats=["Tous",...Array.from(new Set(achievements.map(a=>a.cat)))];
  const filtered=achievements.filter(a=>cat==="Tous"||a.cat===cat);
  const tabs=`<div class="tabs">${cats.slice(0,3).map(c=>`<button class="tab ${cat===c?"active":""}" onclick="playerAchievements('${name.replaceAll("'","\\'")}','${c}')">${c}</button>`).join("")}</div>
  <div class="tabs">${cats.slice(3,6).map(c=>`<button class="tab ${cat===c?"active":""}" onclick="playerAchievements('${name.replaceAll("'","\\'")}','${c}')">${c}</button>`).join("")}</div>`;
  const lines=filtered.map(a=>{
    const ok=rewards.unlocked.some(u=>u.id===a.id);
    return `<div class="result-line ${ok?"achievement-ok":"achievement-locked"}">
      <b>${ok?"✅":"🔒"} ${a.name}</b><br>
      <span class="small">${a.desc}</span><br>
      <span class="xp">Récompense : ${a.reward?.banner?"🖼️ Bannière ":""}${a.reward?.badge?"🏅 Badge ":""}${a.reward?.shards?`🩸 ${a.reward.shards} éclats`:""}</span>
    </div>`;
  }).join("");
  screen(`<div class="card">${topBack('achievementsList()')}<h1>🏅 ${name}</h1><p class="small">${rewards.unlocked.length} / ${achievements.length} succès débloqués • 🩸 ${rewards.shards} éclats gagnés</p>${tabs}${lines}<button class="btn ghost" onclick="achievementsList()">Retour</button></div>`);
}
function collectionList(){
  const players = Object.values(typeof bmStats === "function" ? bmStats() : loadStats())
    .map(p=>typeof bmNormalize === "function" ? bmNormalize(p) : normalizePlayerStats(p))
    .sort((a,b)=>a.name.localeCompare(b.name));

  const list = players.length ? players.map(p=>`
    <div class="listitem" onclick="bmCollection('${p.name.replaceAll("'","\\'")}')">
      <div><b>${p.name}</b><br><span class="small">Bannières • Badges • Cadres • Titres</span></div><span>›</span>
    </div>`).join("") : `<p class="small">Aucun joueur enregistré.</p>`;

  screen(`<div class="card">${topBack('home()')}<h1>🎁 Collection</h1>
    <p class="small">Choisis un joueur pour voir toute sa collection complète.</p>
    ${list}
  </div>`);
}

function playerCollection(name){ return bmCollection(name); }

function equipBanner(name,bannerId){
  const stats=loadStats(); const p=normalizePlayerStats(stats[name]); const rewards=getUnlockedRewards(p);
  if(!rewards.banners.includes(bannerId)) return;
  p.cosmetics.banner=bannerId; savePlayerByName(name,p); playerCollection(name);
}
function equipFrame(name,frameId){
  const stats=loadStats(); const p=normalizePlayerStats(stats[name]);
  if(!(p.inventory.frames||[]).includes(frameId)) return;
  p.cosmetics.frame = p.cosmetics.frame===frameId ? null : frameId;
  savePlayerByName(name,p); playerCollection(name);
}
function equipTitle(name,titleId){
  const stats=loadStats(); const p=normalizePlayerStats(stats[name]);
  if(!(p.inventory.titles||[]).includes(titleId)) return;
  p.cosmetics.title = p.cosmetics.title===titleId ? null : titleId;
  savePlayerByName(name,p); playerCollection(name);
}

function toggleBadge(name,badgeId){
  const stats=loadStats(); const p=normalizePlayerStats(stats[name]); const rewards=getUnlockedRewards(p);
  if(!rewards.badges.includes(badgeId)) return;
  p.cosmetics.badges ??= [];
  if(p.cosmetics.badges.includes(badgeId)){
    p.cosmetics.badges=p.cosmetics.badges.filter(id=>id!==badgeId);
  } else {
    if(p.cosmetics.badges.length>=3) p.cosmetics.badges.shift();
    p.cosmetics.badges.push(badgeId);
  }
  savePlayerByName(name,p); playerCollection(name);
}

function historyList(){
  const h=loadHistory().slice().reverse();
  const lines=h.length?h.map((g,i)=>`<div class="listitem" onclick="historyDetail('${g.id}')"><div><b>${new Date(g.date).toLocaleString("fr-FR")}</b><br><span class="small">${g.players.length} joueurs • ${g.winner==="survivors"?"Survivants":"Tueurs"} gagnent</span></div><span>›</span></div>`).join(""):`<p class="small">Aucune partie enregistrée.</p>`;
  screen(`<div class="card">${topBack('home()')}<h1>📜 Historique</h1>${lines}<button class="btn ghost" onclick="home()">Retour</button></div>`);
}
function historyDetail(id){
  const g=loadHistory().find(x=>x.id===id); if(!g)return historyList();
  const players=g.players.map(p=>`<div class="result-line"><b>${p.name}</b> — ${p.role==="killer"?"🔪 Tueur":"🛡️ Survivant"} — ${p.alive?"Vivant":"Éliminé tour "+p.eliminatedRound}</div>`).join("");
  const log=(g.log||[]).map(l=>`<div class="result-line"><span class="small">Tour ${l.round}</span><br>${l.text}</div>`).join("");
  screen(`<div class="card">${topBack('historyList()')}<h1>📜 Détail partie</h1><p class="small">${new Date(g.date).toLocaleString("fr-FR")}</p><h2>${g.winner==="survivors"?"🛡️ Survivants gagnent":"🔪 Tueurs gagnent"}</h2><h3>Joueurs</h3>${players}<h3>Journal</h3><div class="logbox">${log}</div><button class="btn ghost" onclick="historyList()">Retour</button></div>`);
}

function credits(){
  screen(`
    <div class="card credits-card">${topBack('home()')}
      <div class="intro-logo credits-logo">MORDRA</div>
      <p class="small">Alpha 1.1.8 — Full Full Collection Fix</p>

      <div class="result-line">
        <span class="small">CREATOR</span><br>
        <b>Kevin Moreau</b>
      </div>

      <div class="result-line">
        <span class="small">GAME DESIGN</span><br>
        <b>Kevin Moreau</b>
      </div>

      <div class="result-line">
        <span class="small">DEVELOPMENT</span><br>
        <b>Kevin Moreau</b><br>
        <span class="small">Developed with the Assistance of ChatGPT</span>
      </div>

      <div class="result-line">
        <span class="small">SPECIAL THANKS</span><br>
        <b>To everyone who plays MORDRA and helps improve the game.</b>
      </div>

      <p class="small">© 2026 Kevin Moreau. Prototype project.</p>
      <button class="btn ghost" onclick="settings()">Retour</button>
    </div>
  `);
}

function settings(){
  screen(`<div class="card">${topBack('home()')}<h1>⚙️ Paramètres</h1><p class="small">MORDRA 1.0 Alpha utilise une sauvegarde locale pour éviter les conflits avec l'ancien prototype.</p><button class="btn secondary" onclick="if(confirm('Effacer toutes les stats 1.0 Alpha ?')){localStorage.removeItem('${saveKey}');localStorage.removeItem('${historyKey}');home()}">Effacer les stats 1.0 Alpha</button><button class="btn ghost" onclick="home()">Retour</button></div>`);
}
introScreen();


/* =========================================================
   MORDRA 1.1.0 — BLOOD MARKET REWORK
   Module autonome : boutique, coffres, passe, portefeuille.
========================================================= */

const BM_VERSION = "1.1.0 — Full Collection Fix";

const bmItems = [
  // Bannières
  {type:"banner",id:"bm_banner_shadow",name:"Ombre",rarity:"Commun",price:0,icon:"🖼️",css:"linear-gradient(135deg,#101018,#3b0010)"},
  {type:"banner",id:"bm_banner_mist",name:"Brume",rarity:"Commun",price:600,icon:"🌫️",css:"linear-gradient(135deg,#1c2028,#6d7480)"},
  {type:"banner",id:"bm_banner_forest",name:"Forêt Maudite",rarity:"Commun",price:900,icon:"🌲",css:"linear-gradient(135deg,#04140d,#1e7a4d)"},
  {type:"banner",id:"bm_banner_blood",name:"Sang",rarity:"Rare",price:1600,icon:"🩸",css:"linear-gradient(135deg,#250008,#d01f3c)"},
  {type:"banner",id:"bm_banner_ice",name:"Glace",rarity:"Rare",price:2200,icon:"❄️",css:"linear-gradient(135deg,#071827,#7d9cff)"},
  {type:"banner",id:"bm_banner_moon",name:"Lune Rouge",rarity:"Rare",price:3200,icon:"🌙",css:"linear-gradient(135deg,#050610,#26133f,#d01f3c)"},
  {type:"banner",id:"bm_banner_neon",name:"Néon Rouge",rarity:"Épique",price:8000,icon:"⚡",css:"linear-gradient(135deg,#050509,#ff0048,#28000d)"},
  {type:"banner",id:"bm_banner_halloween",name:"Halloween",rarity:"Épique",price:9500,icon:"🎃",css:"linear-gradient(135deg,#160900,#ff7a18)"},
  {type:"banner",id:"bm_banner_cyber",name:"Cyber Blood",rarity:"Épique",price:11000,icon:"🤖",css:"linear-gradient(135deg,#03050a,#00c2ff,#d01f3c)"},
  {type:"banner",id:"bm_banner_vampire",name:"Vampire",rarity:"Légendaire",price:24000,icon:"🧛",css:"linear-gradient(135deg,#150006,#620018,#ff3157)"},
  {type:"banner",id:"bm_banner_galaxy",name:"Galaxy",rarity:"Légendaire",price:30000,icon:"🌌",css:"linear-gradient(135deg,#120024,#2d0b6e,#d01f3c)"},
  {type:"banner",id:"bm_banner_void",name:"Vide Noir",rarity:"Mythique",price:90000,icon:"🕳️",css:"linear-gradient(135deg,#000,#16001f,#42004f)"},

  // Badges
  {type:"badge",id:"bm_badge_eye",name:"Œil",rarity:"Commun",price:400,icon:"👁️"},
  {type:"badge",id:"bm_badge_target",name:"Cible",rarity:"Commun",price:500,icon:"🎯"},
  {type:"badge",id:"bm_badge_bat",name:"Chauve-souris",rarity:"Commun",price:600,icon:"🦇"},
  {type:"badge",id:"bm_badge_knife",name:"Lame",rarity:"Rare",price:1000,icon:"🔪"},
  {type:"badge",id:"bm_badge_shield",name:"Bouclier",rarity:"Rare",price:1000,icon:"🛡️"},
  {type:"badge",id:"bm_badge_blood",name:"Goutte",rarity:"Rare",price:1800,icon:"🩸"},
  {type:"badge",id:"bm_badge_skull",name:"Crâne",rarity:"Épique",price:4500,icon:"💀"},
  {type:"badge",id:"bm_badge_ghost",name:"Fantôme",rarity:"Épique",price:5200,icon:"👻"},
  {type:"badge",id:"bm_badge_wolf",name:"Loup",rarity:"Épique",price:6000,icon:"🐺"},
  {type:"badge",id:"bm_badge_crown",name:"Couronne",rarity:"Légendaire",price:14000,icon:"👑"},
  {type:"badge",id:"bm_badge_dragon",name:"Dragon",rarity:"Légendaire",price:20000,icon:"🐉"},
  {type:"badge",id:"bm_badge_blackheart",name:"Cœur Noir",rarity:"Mythique",price:65000,icon:"🖤"},

  // Cadres
  {type:"frame",id:"bm_frame_bronze",name:"Cadre Bronze",rarity:"Commun",price:700,icon:"🟫"},
  {type:"frame",id:"bm_frame_silver",name:"Cadre Argent",rarity:"Rare",price:2500,icon:"⬜"},
  {type:"frame",id:"bm_frame_blood",name:"Cadre Sang",rarity:"Rare",price:3500,icon:"🩸"},
  {type:"frame",id:"bm_frame_gold",name:"Cadre Or",rarity:"Épique",price:8000,icon:"🟨"},
  {type:"frame",id:"bm_frame_fire",name:"Cadre Flammes",rarity:"Épique",price:12000,icon:"🔥"},
  {type:"frame",id:"bm_frame_diamond",name:"Cadre Diamant",rarity:"Légendaire",price:26000,icon:"💎"},
  {type:"frame",id:"bm_frame_royal",name:"Cadre Royal",rarity:"Légendaire",price:35000,icon:"👑"},
  {type:"frame",id:"bm_frame_void",name:"Cadre Néant",rarity:"Mythique",price:90000,icon:"🕳️"},

  // Titres
  {type:"title",id:"bm_title_survivor",name:"Le Survivant",rarity:"Commun",price:600,icon:"⭐"},
  {type:"title",id:"bm_title_shadow",name:"L'Ombre",rarity:"Rare",price:2500,icon:"🌑"},
  {type:"title",id:"bm_title_detective",name:"Le Détective",rarity:"Rare",price:2800,icon:"🕵️"},
  {type:"title",id:"bm_title_predator",name:"Le Prédateur",rarity:"Épique",price:8500,icon:"🐺"},
  {type:"title",id:"bm_title_ghost",name:"Le Fantôme",rarity:"Épique",price:9000,icon:"👻"},
  {type:"title",id:"bm_title_reaper",name:"Le Faucheur",rarity:"Légendaire",price:26000,icon:"💀"},
  {type:"title",id:"bm_title_legend",name:"La Légende",rarity:"Légendaire",price:32000,icon:"🏆"},
  {type:"title",id:"bm_title_bloodlord",name:"Seigneur du Sang",rarity:"Mythique",price:120000,icon:"🩸"}
];

function bmStats(){
  const stats = loadStats();
  let changed = false;
  Object.keys(stats).forEach(name=>{
    stats[name] = bmNormalize(stats[name]);
    changed = true;
  });
  if(changed) saveStats(stats);
  return stats;
}

function bmNormalize(p){
  p = normalizePlayerStats(p || {});
  p.wallet ??= {};
  p.wallet.shards = Math.max(0, Number(p.wallet.shards || p.shards || p.bloodShards || 0));
  p.shards = p.wallet.shards;
  p.bloodShards = p.wallet.shards;
  p.bm ??= {};
  p.bm.inventory ??= {banners:["bm_banner_shadow"],badges:[],frames:[],titles:[]};
  p.bm.equipped ??= {banner:"bm_banner_shadow",badges:[],frame:null,title:null};
  p.bm.passXP ??= Math.floor((p.totalXP || 0) / 2);
  return p;
}

function bmSavePlayer(name,p){
  const stats = bmStats();
  const key = Object.keys(stats).find(n=>n.toLowerCase()===String(name).toLowerCase()) || name;
  stats[key] = bmNormalize(p);
  saveStats(stats);
}

function bmGetPlayer(name){
  const stats = bmStats();
  const key = Object.keys(stats).find(n=>n.toLowerCase()===String(name).toLowerCase());
  return key ? bmNormalize(stats[key]) : null;
}

function bmTypeKey(type){
  return {banner:"banners",badge:"badges",frame:"frames",title:"titles"}[type];
}

function bmItem(type,id){
  return bmItems.find(i=>i.type===type && i.id===id);
}

function bmOwned(p,item){
  const key = bmTypeKey(item.type);
  return !!key && (p.bm.inventory[key] || []).includes(item.id);
}

function bmGive(p,item){
  const key = bmTypeKey(item.type);
  if(key && !(p.bm.inventory[key] || []).includes(item.id)){
    p.bm.inventory[key].push(item.id);
  }
  return p;
}

function bmRarityClass(r){
  return "bm-rarity-"+String(r||"Commun").toLowerCase().replace("é","e").replace("è","e").replace(" ","-");
}

function bmHourKey(){ return Math.floor(Date.now()/3600000); }

function bmRand(seed){
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function bmNextRefresh(){
  const next = (bmHourKey()+1)*3600000;
  const diff = Math.max(0,next-Date.now());
  const m = Math.floor(diff/60000).toString().padStart(2,"0");
  const s = Math.floor((diff%60000)/1000).toString().padStart(2,"0");
  return `${m}:${s}`;
}

function bmRotating(type="all"){
  const pool = bmItems.filter(i=>type==="all" || i.type===type);
  return pool.map((item,idx)=>({item,score:bmRand(bmHourKey()*1009 + idx*47 + item.id.length*17)}))
    .sort((a,b)=>a.score-b.score)
    .map(x=>x.item)
    .slice(0,type==="all"?10:8);
}

function bmDeal(){
  const pool = bmItems.filter(i=>i.price>0);
  const i = Math.floor(bmRand(bmHourKey()*777)*pool.length);
  const item = pool[i] || pool[0];
  return {...item, dealPrice:Math.max(100,Math.floor(item.price*0.65))};
}

function bmHeader(p){
  return `<div class="bm-header">
    <div><span class="small">Blood Market</span><b>${p.name}</b></div>
    <div class="bm-money">🩸 ${p.wallet.shards}</div>
  </div>`;
}

function bmSelectPlayer(){
  const players = Object.values(bmStats()).map(bmNormalize).sort((a,b)=>a.name.localeCompare(b.name));
  const list = players.length ? players.map(p=>`
    <div class="listitem" onclick="bmHome('${p.name.replaceAll("'","\\'")}')">
      <div><b>${p.name}</b><br><span class="small">🩸 ${p.wallet.shards} Éclats • Niv. ${levelFromXP(p.totalXP||0)}</span></div><span>›</span>
    </div>`).join("") : `<p class="small">Aucun joueur enregistré. Ajoute un joueur dans Statistiques.</p>`;
  screen(`<div class="card">${topBack('home()')}<h1>🩸 Armurerie des Ombres</h1><p class="small">Choisis le joueur qui entre dans le Blood Market.</p>${list}</div>`);
}

function bmHome(name){
  const p = bmGetPlayer(name); if(!p) return bmSelectPlayer();
  screen(`<div class="card bm-card">${topBack('home()')}${bmHeader(p)}
    <h1>🩸 Blood Market</h1>
    <p class="small">Objets cosmétiques uniquement. Aucun avantage en partie.</p>
    <button class="btn" onclick="bmShop('${name.replaceAll("'","\\'")}','all')">🛒 Boutique tournante</button>
    <button class="btn secondary" onclick="bmChests('${name.replaceAll("'","\\'")}')">🎁 Coffres</button>
    <button class="btn secondary" onclick="bmPass('${name.replaceAll("'","\\'")}')">🛡️ Passe des Ombres</button>
    <button class="btn secondary" onclick="bmCollection('${name.replaceAll("'","\\'")}')">🎨 Collection Blood Market</button>
    <div class="result-line"><b>⏳ Rotation boutique</b><br><span class="xp">${bmNextRefresh()}</span><br><span class="small">La sélection change toutes les heures.</span></div>
  </div>`);
}

function bmShop(name,type="all"){
  const p = bmGetPlayer(name); if(!p) return bmSelectPlayer();
  const tabs = [["all","Tout"],["banner","Bannières"],["badge","Badges"],["frame","Cadres"],["title","Titres"]];
  const tabHtml = `<div class="tabs">${tabs.slice(0,3).map(t=>`<button class="tab ${type===t[0]?'active':''}" onclick="bmShop('${name.replaceAll("'","\\'")}','${t[0]}')">${t[1]}</button>`).join("")}</div>
    <div class="tabs">${tabs.slice(3).map(t=>`<button class="tab ${type===t[0]?'active':''}" onclick="bmShop('${name.replaceAll("'","\\'")}','${t[0]}')">${t[1]}</button>`).join("")}</div>`;
  const deal = bmDeal();
  const dealHtml = type==="all" ? `<div class="bm-deal">
    <div class="bm-icon">${deal.icon}</div>
    <div class="bm-info"><b>🔥 Offre de l'heure : ${deal.name}</b><br><span class="small">${deal.rarity} • ${deal.type}</span><br><span class="xp"><s>🩸 ${deal.price}</s> ➜ 🩸 ${deal.dealPrice}</span></div>
    <button class="mini-btn" ${bmOwned(p,deal)?'disabled':''} onclick="bmBuy('${name.replaceAll("'","\\'")}','${deal.type}','${deal.id}',true)">${bmOwned(p,deal)?'Déjà':'Acheter'}</button>
  </div>` : "";
  const items = bmRotating(type);
  const itemHtml = items.map(item=>{
    const owned = bmOwned(p,item);
    return `<div class="bm-item ${bmRarityClass(item.rarity)}">
      <div class="bm-icon">${item.icon}</div>
      <div class="bm-info"><b>${item.name}</b><br><span class="small">${item.rarity} • ${item.type}</span><br><span class="xp">🩸 ${item.price}</span></div>
      <button class="mini-btn" ${owned?'disabled':''} onclick="bmBuy('${name.replaceAll("'","\\'")}','${item.type}','${item.id}',false)">${owned?'Déjà':'Acheter'}</button>
    </div>`;
  }).join("");
  screen(`<div class="card">${topBack(`bmHome('${name.replaceAll("'","\\'")}')`)}${bmHeader(p)}
    <h1>🛒 Boutique tournante</h1>
    <div class="result-line"><b>Prochaine rotation</b><br><span class="xp">${bmNextRefresh()}</span></div>
    ${tabHtml}${dealHtml}${itemHtml}
  </div>`);
}

function bmBuy(name,type,id,isDeal=false){
  const p = bmGetPlayer(name); if(!p) return;
  let item = bmItem(type,id); if(!item) return;
  const deal = bmDeal();
  const price = isDeal && deal.id===id && deal.type===type ? deal.dealPrice : item.price;
  if(bmOwned(p,item)) return alert("Objet déjà possédé.");
  if(p.wallet.shards < price) return alert("Pas assez d'Éclats de Sang.");
  if(!confirm(`Acheter ${item.name} pour ${price} Éclats de Sang ?`)) return;
  p.wallet.shards -= price;
  bmGive(p,item);
  bmSavePlayer(name,p);
  sound("levelup");
  screen(`<div class="card bm-purchase">
    <h1>🩸 Nouvel objet</h1>
    <div class="bm-big-icon">${item.icon}</div>
    <h2>${item.name}</h2>
    <p class="xp">${item.rarity}</p>
    <button class="btn" onclick="bmShop('${name.replaceAll("'","\\'")}','${type}')">Retour boutique</button>
    <button class="btn secondary" onclick="bmCollection('${name.replaceAll("'","\\'")}')">Équiper</button>
  </div>`);
}

function bmChests(name){
  const p = bmGetPlayer(name); if(!p) return bmSelectPlayer();
  const chests = [
    {id:"common",name:"Coffre Commun",price:1000,rarities:["Commun","Rare"],icon:"🎁"},
    {id:"rare",name:"Coffre Rare",price:5000,rarities:["Rare","Épique"],icon:"🧰"},
    {id:"epic",name:"Coffre Épique",price:15000,rarities:["Épique","Légendaire"],icon:"💼"},
    {id:"mythic",name:"Coffre Mythique",price:50000,rarities:["Légendaire","Mythique"],icon:"🧳"}
  ];
  const html = chests.map(c=>`<div class="bm-item">
    <div class="bm-icon">${c.icon}</div>
    <div class="bm-info"><b>${c.name}</b><br><span class="small">${c.rarities.join(" / ")}</span><br><span class="xp">🩸 ${c.price}</span></div>
    <button class="mini-btn" onclick="bmOpenChest('${name.replaceAll("'","\\'")}','${c.id}')">Ouvrir</button>
  </div>`).join("");
  screen(`<div class="card">${topBack(`bmHome('${name.replaceAll("'","\\'")}')`)}${bmHeader(p)}<h1>🎁 Coffres</h1>${html}</div>`);
}

function bmOpenChest(name,chestId){
  const defs = {
    common:{price:1000,rarities:["Commun","Rare"]},
    rare:{price:5000,rarities:["Rare","Épique"]},
    epic:{price:15000,rarities:["Épique","Légendaire"]},
    mythic:{price:50000,rarities:["Légendaire","Mythique"]}
  };
  const def = defs[chestId] || defs.common;
  const p = bmGetPlayer(name); if(!p) return;
  if(p.wallet.shards < def.price) return alert("Pas assez d'Éclats de Sang.");
  let pool = bmItems.filter(i=>def.rarities.includes(i.rarity) && !bmOwned(p,i));
  if(!pool.length) pool = bmItems.filter(i=>!bmOwned(p,i));
  if(!pool.length) return alert("Tu as déjà tout débloqué.");
  const item = pool[Math.floor(bmRand(Date.now())*pool.length)];
  p.wallet.shards -= def.price;
  bmGive(p,item);
  bmSavePlayer(name,p);
  sound("levelup");
  screen(`<div class="card bm-purchase"><h1>🎁 Coffre ouvert</h1><div class="bm-chest-anim">🎁</div><h2>${item.name}</h2><p class="xp">${item.rarity}</p><button class="btn" onclick="bmChests('${name.replaceAll("'","\\'")}')">Ouvrir un autre</button><button class="btn secondary" onclick="bmCollection('${name.replaceAll("'","\\'")}')">Voir collection</button></div>`);
}


function bmSeasonEndText(){
  // Prototype : Saison toujours affichée à 30 jours pour la v1.1.2
  return "Se termine dans 30 jours";
}

function bmPassRewards(){
  const rewards = [];
  for(let i=1;i<=100;i++){
    let reward;
    if(i % 25 === 0){
      reward = {type:"mythic", label:"🎁 Récompense majeure", detail:`Objet rare + ${i*80} 🩸`};
    } else if(i % 10 === 0){
      reward = {type:"legendary", label:"🖼️ Bannière / Badge", detail:`Cosmétique + ${i*45} 🩸`};
    } else if(i % 5 === 0){
      reward = {type:"epic", label:"🎁 Coffre du Passe", detail:`Coffre + ${i*25} 🩸`};
    } else {
      reward = {type:"shards", label:"🩸 Éclats de Sang", detail:`+${80 + i*8} 🩸`};
    }
    rewards.push({level:i, ...reward});
  }
  return rewards;
}

function bmPassInfo(p){
  p = bmNormalize(p);
  const xp = Math.floor((p.totalXP || 0) / 2) + ((p.games || 0) * 35);
  const level = Math.min(100, Math.floor(xp / 250) + 1);
  const progress = xp % 250;
  const percent = Math.min(100, Math.round((progress / 250) * 100));
  return {xp, level, progress, percent};
}

function bmClaimPassReward(name, level){
  const stats = bmStats();
  const key = Object.keys(stats).find(n=>n.toLowerCase()===String(name).toLowerCase());
  if(!key) return;
  const p = bmNormalize(stats[key]);
  const info = bmPassInfo(p);
  if(level > info.level) return alert("Palier pas encore atteint.");
  p.bm.passClaimed ??= [];
  if(p.bm.passClaimed.includes(level)) return alert("Récompense déjà récupérée.");

  const reward = bmPassRewards().find(r=>r.level===level);
  let shards = 80 + level*8;
  if(reward.type === "epic") shards = level*25;
  if(reward.type === "legendary") shards = level*45;
  if(reward.type === "mythic") shards = level*80;

  p.wallet.shards += shards;
  p.shards = p.wallet.shards;
  p.bloodShards = p.wallet.shards;
  p.bm.passClaimed.push(level);

  // Bonus objet cosmétique à certains paliers
  if(level % 10 === 0){
    const pool = bmItems.filter(i=>!bmOwned(p,i));
    if(pool.length){
      const item = pool[Math.floor(bmRand(level * 999 + p.totalXP) * pool.length)];
      bmGive(p,item);
    }
  }

  stats[key] = bmNormalize(p);
  saveStats(stats);
  sound("levelup");
  bmPass(name);
}

function bmPass(name){
  const p = bmGetPlayer(name); if(!p) return bmSelectPlayer();
  p.bm.passClaimed ??= [];
  const info = bmPassInfo(p);
  const rewards = bmPassRewards();

  const visibleRewards = rewards.map(r=>{
    const unlocked = r.level <= info.level;
    const claimed = p.bm.passClaimed.includes(r.level);
    const cls = claimed ? "pass-claimed" : unlocked ? "pass-unlocked" : "pass-locked";
    return `<div class="pass-tier ${cls}">
      <div class="pass-tier-left">
        <b>Palier ${r.level}</b><br>
        <span class="small">${r.label}</span><br>
        <span class="xp">${r.detail}</span>
      </div>
      <button class="mini-btn" ${(!unlocked || claimed) ? "disabled" : ""} onclick="bmClaimPassReward('${name.replaceAll("'","\\'")}',${r.level})">
        ${claimed ? "Pris" : unlocked ? "Récupérer" : "Bloqué"}
      </button>
    </div>`;
  }).join("");

  screen(`<div class="card">${topBack(`bmHome('${name.replaceAll("'","\\'")}')`)}${bmHeader(p)}
    <h1>🛡️ Passe des Ombres</h1>
    <div class="pass-hero">
      <div>
        <span class="small">Saison 1</span>
        <h2>Les Origines</h2>
        <p class="xp">⏳ ${bmSeasonEndText()}</p>
      </div>
      <div class="pass-level">Palier<br><b>${info.level}/100</b></div>
    </div>

    <div class="level-card">
      <div class="level-head">
        <div><span class="small">Progression du Passe</span><b>${info.xp} XP Passe</b></div>
        <span class="badge">${info.percent}%</span>
      </div>
      <div class="level-bar"><div style="width:${info.percent}%"></div></div>
      <div class="xp-line"><b>${info.progress} / 250 XP avant le palier suivant</b></div>
    </div>

    <div class="result-line">
      <b>Comment avancer ?</b><br>
      <span class="small">Joue des parties, gagne de l'XP, débloque des paliers et récupère les récompenses.</span>
    </div>

    <h2>🎁 100 paliers</h2>
    <div class="pass-list">${visibleRewards}</div>
  </div>`);
}

function bmCollection(name){
  const p = bmGetPlayer(name); 
  if(!p) return bmSelectPlayer();

  if(!bmItems.some(i=>i.type==="frame")){
    bmItems.push(
      {type:"frame",id:"bm_frame_bronze",name:"Cadre Bronze",rarity:"Commun",price:700,icon:"🟫"},
      {type:"frame",id:"bm_frame_silver",name:"Cadre Argent",rarity:"Rare",price:2500,icon:"⬜"},
      {type:"frame",id:"bm_frame_gold",name:"Cadre Or",rarity:"Épique",price:8000,icon:"🟨"},
      {type:"frame",id:"bm_frame_diamond",name:"Cadre Diamant",rarity:"Légendaire",price:26000,icon:"💎"}
    );
  }
  if(!bmItems.some(i=>i.type==="title")){
    bmItems.push(
      {type:"title",id:"bm_title_survivor",name:"Le Survivant",rarity:"Commun",price:600,icon:"⭐"},
      {type:"title",id:"bm_title_shadow",name:"L'Ombre",rarity:"Rare",price:2500,icon:"🌑"},
      {type:"title",id:"bm_title_predator",name:"Le Prédateur",rarity:"Épique",price:8500,icon:"🐺"},
      {type:"title",id:"bm_title_reaper",name:"Le Faucheur",rarity:"Légendaire",price:26000,icon:"💀"}
    );
  }
  const byType = (type) => bmItems.filter(i=>i.type===type);

  const section = (title, arr) => {
    if(!arr.length){
      return `<h2>${title}</h2><p class="small">Aucun objet dans cette catégorie pour le moment.</p>`;
    }

    return `<h2>${title}</h2>` + arr.map(item=>{
      const owned = bmOwned(p,item);
      const equipped = item.type==="banner" ? p.bm.equipped.banner===item.id :
        item.type==="frame" ? p.bm.equipped.frame===item.id :
        item.type==="title" ? p.bm.equipped.title===item.id :
        (p.bm.equipped.badges||[]).includes(item.id);

      const action = owned 
        ? `onclick="bmEquip('${name.replaceAll("'","\\'")}','${item.type}','${item.id}')"` 
        : `onclick="bmShop('${name.replaceAll("'","\\'")}','${item.type}')"`;

      return `<div class="bm-collection-item ${owned ? "" : "locked"} ${equipped ? "equipped" : ""}">
        <div class="bm-icon">${item.icon}</div>
        <div class="bm-info">
          <b>${item.name} ${equipped ? "✅" : owned ? "" : "🔒"}</b><br>
          <span class="small">${item.rarity} • ${owned ? "Possédé" : "Non débloqué"}</span><br>
          <span class="xp">${owned ? "Disponible" : "🩸 " + item.price}</span>
        </div>
        <button class="mini-btn" ${action}>${owned ? (equipped ? "Équipé" : "Équiper") : "Boutique"}</button>
      </div>`;
    }).join("");
  };

  const total = bmItems.length;
  const ownedCount = bmItems.filter(i=>bmOwned(p,i)).length;
  const percent = total ? Math.round((ownedCount/total)*100) : 0;

  screen(`<div class="card">${topBack(`bmHome('${name.replaceAll("'","\\'")}')`)}${bmHeader(p)}
    <h1>🎨 Collection</h1>
    <div class="level-card">
      <div class="level-head">
        <div><span class="small">Progression collection</span><b>${ownedCount}/${total} objets</b></div>
        <span class="badge">${percent}%</span>
      </div>
      <div class="level-bar"><div style="width:${percent}%"></div></div>
      <div class="xp-line"><b>Débloque des objets dans la boutique ou les coffres.</b></div>
    </div>
    <p class="small">Équipe ta bannière, jusqu'à 3 badges, un cadre et un titre.</p>
    <div class="tabs">
      <button class="tab" onclick="document.getElementById('bmFrames')?.scrollIntoView({behavior:'smooth'})">👑 Cadres</button>
      <button class="tab" onclick="document.getElementById('bmTitles')?.scrollIntoView({behavior:'smooth'})">⭐ Titres</button>
    </div>
    ${section("🖼️ Bannières", byType("banner"))}
    ${section("🏅 Badges", byType("badge"))}
    ${section("👑 Cadres", byType("frame")).replace("<h2>","<h2 id=\"bmFrames\">")}
    ${section("⭐ Titres", byType("title")).replace("<h2>","<h2 id=\"bmTitles\">")}
  </div>`);
}


function bmEquip(name,type,id){
  const p = bmGetPlayer(name); if(!p) return;
  const item = bmItem(type,id); if(!item || !bmOwned(p,item)) return;
  if(type==="banner") p.bm.equipped.banner = id;
  if(type==="frame") p.bm.equipped.frame = p.bm.equipped.frame===id ? null : id;
  if(type==="title") p.bm.equipped.title = p.bm.equipped.title===id ? null : id;
  if(type==="badge"){
    p.bm.equipped.badges ??= [];
    if(p.bm.equipped.badges.includes(id)){
      p.bm.equipped.badges = p.bm.equipped.badges.filter(x=>x!==id);
    } else {
      if(p.bm.equipped.badges.length>=3) p.bm.equipped.badges.shift();
      p.bm.equipped.badges.push(id);
    }
  }
  bmSavePlayer(name,p);
  bmCollection(name);
}

/* Connexion de la carte joueur au nouveau Blood Market */
function bmPlayerShowcase(name){
  const p = bmGetPlayer(name) || bmNormalize({name});
  const banner = bmItem("banner", p.bm.equipped.banner) || bmItem("banner","bm_banner_shadow");
  const frame = bmItem("frame", p.bm.equipped.frame);
  const title = bmItem("title", p.bm.equipped.title);
  const badges = (p.bm.equipped.badges || []).map(id=>bmItem("badge",id)).filter(Boolean);
  const mvp = isMVPName(name);
  return `
    <div class="pass-player-card ${frame?'has-frame':''} ${mvp?'mvp-card':''}" style="background:${mvp ? 'linear-gradient(135deg,#3b2a00,#f7c75d,#7a4200)' : banner.css}">
      <div class="pass-player-glow"></div>
      ${mvp ? '<div class="mvp-badge">👑 MVP</div>' : ''}
      <div class="pass-player-frame">${frame ? frame.icon : ""}</div>
      ${mvpBadge(name)}<div class="pass-player-name">${name}</div>
      <div class="pass-player-title">${title ? title.name : "Sans titre"}</div>
      <div class="pass-player-level">⭐ Niveau ${levelFromXP(p.totalXP||0)} • 🩸 ${p.wallet.shards}</div>
      <div class="profile-badges">${badges.length ? badges.map(b=>`<span>${b.icon}</span>`).join("") : `<span>🩸</span>`}</div>
      <div class="small">${mvp ? 'Couronne MVP active' : banner.name}</div>
    </div>`;
}
