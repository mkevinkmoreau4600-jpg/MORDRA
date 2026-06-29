
const app = document.getElementById("app");

const pairs = [
  {s:"Pizza", k:"Burger", level:"Très proche"},
  {s:"Lion", k:"Tigre", level:"Très proche"},
  {s:"Chien", k:"Loup", level:"Très proche"},
  {s:"Coca", k:"Pepsi", level:"Très proche"},
  {s:"Xbox", k:"PlayStation", level:"Très proche"},
  {s:"Ferrari", k:"Lamborghini", level:"Très proche"},
  {s:"Forêt", k:"Jungle", level:"Proche"},
  {s:"Avion", k:"Hélicoptère", level:"Proche"},
  {s:"Téléphone", k:"Tablette", level:"Proche"},
  {s:"Hôpital", k:"Clinique", level:"Proche"},
  {s:"Prison", k:"Commissariat", level:"Proche"},
  {s:"Tennis", k:"Padel", level:"Proche"},
  {s:"Football", k:"Arbitre", level:"Piégeux"},
  {s:"Océan", k:"Plage", level:"Piégeux"},
  {s:"Pizza", k:"Four", level:"Piégeux"},
  {s:"Avion", k:"Aéroport", level:"Piégeux"},
  {s:"Lion", k:"Savane", level:"Piégeux"},
  {s:"Hôpital", k:"Ambulance", level:"Piégeux"}
];

let state = {
  playersCount: 4,
  killersCount: 1,
  timerMinutes: 3,
  playerNames: [],
  current: 0,
  game: null,
  timerInterval: null
};

const saveKey = "mordra_v03_stats";
const historyKey = "mordra_v03_history";

function loadStats(){ return JSON.parse(localStorage.getItem(saveKey) || "{}"); }
function saveStats(s){ localStorage.setItem(saveKey, JSON.stringify(s)); }
function loadHistory(){ return JSON.parse(localStorage.getItem(historyKey) || "[]"); }
function saveHistory(h){ localStorage.setItem(historyKey, JSON.stringify(h)); }

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



function startScreen(){
  clearTimer();
  screen(`
    <div class="start-screen">
      <div class="intro-fog"></div>
      <div class="start-logo-wrap">
        <div class="start-logo">MORDRA</div>
        <div class="start-subtitle">The Hunt Begins</div>
        <div class="start-pulse"></div>
        <button class="btn start-btn" onclick="home()">Démarrer</button>
        <p class="small">Ne fais confiance à personne. Remets tout en question. Survis.</p>
      </div>
    </div>
  `);
  sound("reveal");
}

function introScreen(){
  clearTimer();
  screen(`
    <div class="intro-screen">
      <div class="intro-fog"></div>

      <div class="intro-panel intro-panel-one" id="introPanelOne">
        <div class="intro-warning">⚠️</div>
        <div class="intro-lines">
          <div>Trust no one.</div>
          <div>Question everything.</div>
          <div>Survive.</div>
        </div>
      </div>

      <div class="intro-panel intro-panel-two hidden" id="introPanelTwo">
        <div class="intro-logo">MORDRA</div>
        <div class="intro-credit">
          <span>An Original Game by</span>
          <b>KEVIN MOREAU</b>
          <small>Developed with the Assistance of ChatGPT</small>
        </div>
      </div>

      <button class="intro-skip" onclick="startScreen()">Passer</button>
    </div>
  `);

  sound("end");

  setTimeout(()=>{
    const one = document.getElementById("introPanelOne");
    const two = document.getElementById("introPanelTwo");
    if(one) one.classList.add("hidden");
    if(two) two.classList.remove("hidden");
    sound("reveal");
  }, 3300);

  setTimeout(()=>{
    startScreen();
  }, 7600);
}

function home(){
  clearTimer();
  screen(`
    <div class="logo">MORDRA</div>
    <div class="tagline">The Hunt Update — v0.3.0</div>
    <div class="card">
      <button class="btn" onclick="newGame()">▶️ Nouvelle partie</button>
      <button class="btn secondary" onclick="leaderboard()">🏆 Classement</button>
      <button class="btn secondary" onclick="statsList()">📊 Statistiques</button>
      <button class="btn secondary" onclick="historyList()">📜 Historique</button>
      <button class="btn secondary" onclick="credits()">🎬 Crédits</button>
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
  screen(`<div class="card"><h1>Passe le téléphone</h1><p class="small">Donne le téléphone à :</p><h2>${p.name}</h2>${playerLevelCard(p.name)}<p class="small">Cache bien l'écran avant d'appuyer.</p><button class="btn" onclick="showRole()">Voir mon rôle</button></div>`);
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
  screen(`<div class="card"><h1>Vote secret</h1><p class="small">Passe le téléphone à :</p><h2>${p.name}</h2>${playerLevelCard(p.name)}<p class="small">Il doit voter en cachant l'écran.</p><button class="btn" onclick="voteScreen()">Voter</button></div>`);
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
  const stats=loadStats(), history=loadHistory();
  if(history.find(h=>h.id===state.game.id)) return alert("Cette partie est déjà enregistrée.");
  const levelUps=[];
  state.game.players.forEach((gp,i)=>{
    const p=ensurePlayer(stats,gp.name);
    const before=clonePlayerStats(p);
    const res=calcXP(i,state.game.winner);
    const killer=gp.role==="killer";
    const won=killer?state.game.winner==="killers":state.game.winner==="survivors";
    p.games++; p.totalXP+=res.xp; won?p.wins++:p.losses++; p.streak=won?p.streak+1:0; p.bestStreak=Math.max(p.bestStreak||0,p.streak||0);
    if(killer){
      p.killer.games++; p.killer.xp+=res.xp; won?p.killer.wins++:p.killer.losses++;
      if(won){p.killer.currentStreak=(p.killer.currentStreak||0)+1; p.killer.bestStreak=Math.max(p.killer.bestStreak||0,p.killer.currentStreak);} else p.killer.currentStreak=0;
      p.killer.votesReceived += Object.values(state.game.votes).filter(v=>v===i).length;
      if(state.game.eliminatedThisRound!==null && playerByIndex(state.game.eliminatedThisRound)?.role==="survivor" && state.game.votes[i]===state.game.eliminatedThisRound) p.killer.manips++;
      if(Object.values(state.game.votes).filter(v=>v===i).length===0) p.killer.zeroVoteWins++;
    } else {
      p.survivor.games++; p.survivor.xp+=res.xp; won?p.survivor.wins++:p.survivor.losses++;
      if(won){p.survivor.currentStreak=(p.survivor.currentStreak||0)+1; p.survivor.bestStreak=Math.max(p.survivor.bestStreak||0,p.survivor.currentStreak);} else p.survivor.currentStreak=0;
      const vote=state.game.votes[i];
      if(vote!==undefined && playerByIndex(vote)?.role==="killer"){p.survivor.goodVotes++; p.survivor.killersFound++;} else if(vote!==undefined) p.survivor.badVotes++;
    }
    const ups=detectLevelUpsForPlayer(before,p);
    if(ups.length) levelUps.push({name:gp.name,ups});
  });
  history.push({id:state.game.id,date:new Date().toISOString(),winner:state.game.winner,players:state.game.players.map(p=>({name:p.name,role:p.role,alive:p.alive,eliminatedRound:p.eliminatedRound})),pair:state.game.pair,log:state.game.log});
  saveStats(stats); saveHistory(history);
  if(levelUps.length) setTimeout(()=>sound("levelup"),120); else sound("good");
  const levelHtml=levelUps.length?`<div class="levelup-panel"><h2>✨ Passages de niveau</h2><p class="small">${levelUps.length} joueur${levelUps.length>1?"s":""} ont gagné au moins un niveau.</p>${levelUps.map(item=>`<div class="result-line levelup-line"><b>${item.name}</b><br>${item.ups.map(up=>`<span class="xp">${up}</span>`).join("<br>")}</div>`).join("")}</div>`:"";
  screen(`<div class="card"><h1>Stats enregistrées ✅</h1><p class="small">La partie a été ajoutée à l'historique.</p>${levelHtml}<button class="btn" onclick="leaderboard()">Voir le classement</button><button class="btn secondary" onclick="home()">Menu</button></div>`);
}

function leaderboard(){
  const stats=Object.values(loadStats()).map(normalizePlayerStats).sort((a,b)=>b.totalXP-a.totalXP);
  const lines=stats.length?stats.map((p,i)=>`<div class="listitem" onclick="playerStats('${p.name.replaceAll("'","\\'")}')"><div><b>${i+1}. ${p.name}</b><br><span class="small">Niv. ${levelFromXP(p.totalXP)} • ${p.games} parties</span></div><span class="badge">${p.totalXP} XP</span></div>`).join(""):`<p class="small">Aucune partie enregistrée.</p>`;
  screen(`<div class="card"><h1>🏆 Classement</h1>${lines}<button class="btn ghost" onclick="home()">Retour</button></div>`);
}
function statsList(){
  const stats=Object.values(loadStats()).map(normalizePlayerStats).sort((a,b)=>a.name.localeCompare(b.name));
  const lines=stats.length?stats.map(p=>`<div class="listitem" onclick="playerStats('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">${p.games} parties • ${p.totalXP} XP</span></div><span>›</span></div>`).join(""):`<p class="small">Aucun joueur enregistré.</p>`;
  screen(`<div class="card"><h1>📊 Statistiques</h1>${lines}<button class="btn ghost" onclick="home()">Retour</button></div>`);
}
function playerStats(name,tab="survivor"){
  const p=normalizePlayerStats(loadStats()[name]); if(!p)return statsList();
  const isS=tab==="survivor", data=isS?p.survivor:p.killer;
  const lvl=levelFromXP(data.xp), rank=isS?survivorRank(lvl):killerRank(lvl);
  const winrate=data.games?Math.round((data.wins/data.games)*100):0;
  screen(`<div class="card"><h1>${p.name}</h1>${xpCard(p.totalXP,"Niveau général","⭐")}<p class="small">🔥 Série générale : ${p.streak} • Record général : ${p.bestStreak}</p>
    <div class="tabs"><button class="tab ${isS?"active":""}" onclick="playerStats('${name.replaceAll("'","\\'")}','survivor')">🛡️ Survivant</button><button class="tab ${!isS?"active":""}" onclick="playerStats('${name.replaceAll("'","\\'")}','killer')">🔪 Tueur</button></div>
    ${xpCard(data.xp,isS?"Niveau Survivant":"Niveau Tueur",isS?"🛡️":"🔪",rank)}
    <div class="statbox"><div class="stat"><span class="small">Parties</span><b>${data.games}</b></div><div class="stat"><span class="small">Victoires</span><b>${data.wins}</b></div><div class="stat"><span class="small">Défaites</span><b>${data.losses}</b></div><div class="stat"><span class="small">Winrate</span><b>${winrate}%</b></div>
    ${isS?`<div class="stat"><span class="small">Bons votes</span><b>${data.goodVotes}</b></div><div class="stat"><span class="small">Mauvais votes</span><b>${data.badVotes}</b></div><div class="stat"><span class="small">Tueurs trouvés</span><b>${data.killersFound}</b></div>`:`<div class="stat"><span class="small">Manipulations</span><b>${data.manips}</b></div><div class="stat"><span class="small">Votes reçus</span><b>${data.votesReceived}</b></div><div class="stat"><span class="small">Zéro vote</span><b>${data.zeroVoteWins}</b></div>`}
    <div class="stat"><span class="small">Série actuelle</span><b>${data.currentStreak}</b></div><div class="stat"><span class="small">Record d'affilée</span><b>${data.bestStreak}</b></div></div>
    <button class="btn ghost" onclick="statsList()">Retour stats</button></div>`);
}
function historyList(){
  const h=loadHistory().slice().reverse();
  const lines=h.length?h.map((g,i)=>`<div class="listitem" onclick="historyDetail('${g.id}')"><div><b>${new Date(g.date).toLocaleString("fr-FR")}</b><br><span class="small">${g.players.length} joueurs • ${g.winner==="survivors"?"Survivants":"Tueurs"} gagnent</span></div><span>›</span></div>`).join(""):`<p class="small">Aucune partie enregistrée.</p>`;
  screen(`<div class="card"><h1>📜 Historique</h1>${lines}<button class="btn ghost" onclick="home()">Retour</button></div>`);
}
function historyDetail(id){
  const g=loadHistory().find(x=>x.id===id); if(!g)return historyList();
  const players=g.players.map(p=>`<div class="result-line"><b>${p.name}</b> — ${p.role==="killer"?"🔪 Tueur":"🛡️ Survivant"} — ${p.alive?"Vivant":"Éliminé tour "+p.eliminatedRound}</div>`).join("");
  const log=(g.log||[]).map(l=>`<div class="result-line"><span class="small">Tour ${l.round}</span><br>${l.text}</div>`).join("");
  screen(`<div class="card"><h1>📜 Détail partie</h1><p class="small">${new Date(g.date).toLocaleString("fr-FR")}</p><h2>${g.winner==="survivors"?"🛡️ Survivants gagnent":"🔪 Tueurs gagnent"}</h2><h3>Joueurs</h3>${players}<h3>Journal</h3><div class="logbox">${log}</div><button class="btn ghost" onclick="historyList()">Retour</button></div>`);
}

function credits(){
  screen(`
    <div class="card credits-card">
      <div class="intro-logo credits-logo">MORDRA</div>
      <p class="small">Prototype v0.3.1 — The Hunt Update</p>

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
      <button class="btn ghost" onclick="home()">Retour</button>
    </div>
  `);
}

function settings(){
  screen(`<div class="card"><h1>⚙️ Paramètres</h1><p class="small">v0.3 utilise une nouvelle sauvegarde pour éviter les conflits avec l'ancien prototype.</p><button class="btn secondary" onclick="if(confirm('Effacer toutes les stats v0.3 ?')){localStorage.removeItem('${saveKey}');localStorage.removeItem('${historyKey}');home()}">Effacer les stats v0.3</button><button class="btn ghost" onclick="home()">Retour</button></div>`);
}
introScreen();
