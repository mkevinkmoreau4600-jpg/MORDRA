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
function sound(type="click"){ try{ const a=new (window.AudioContext||window.webkitAudioContext)(); const o=a.createOscillator(); const g=a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value= type==="bad"?120:type==="level"?620:260; g.gain.value=.04; o.start(); setTimeout(()=>{o.stop();a.close()},90)}catch{} }
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
  screen(`<div class="loading"><div class="loading-center"><div class="loading-logo">MORDRA</div><div class="loading-sub">Chargement...</div><div class="loading-text" id="lt">Chargement des survivants...</div><div class="bar"><div id="lf"></div></div><div class="percent" id="lp">0%</div></div><div class="credit-bottom"><span>A game imagined by</span><b>Kevin Moreau</b><small>Developed with the assistance of ChatGPT</small></div></div>`);
  const texts=["Chargement des survivants...","Préparation des tueurs...","Ouverture du Blood Market...","Chargement des profils...","Vérification du jeu...","Bienvenue dans MORDRA..."];
  let p=0;
  const i=setInterval(()=>{
    p+=Math.floor(4+Math.random()*8);
    if(p>100)p=100;
    const f=document.getElementById("lf");
    const pct=document.getElementById("lp");
    const t=document.getElementById("lt");
    if(f) f.style.width=p+"%";
    if(pct) pct.textContent=p+"%";
    if(t) t.textContent=texts[Math.min(texts.length-1,Math.floor(p/18))];
    if(p>=100){
      clearInterval(i);
      setTimeout(startScreen,550);
    }
  },190);
}

function startScreen(){ screen(`<div class="start-screen"><div><div class="logo">MORDRA</div><div class="small">Le jeu de déduction horrifique</div><button class="btn start-btn" onclick="home()">DÉMARRER</button><div class="small">Version 3.1.1 Mode Cleanup</div></div></div>`)}
function home(){ try{clearDiscussionTimer()}catch(e){}  screen(`<div class="card"><div class="logo">MORDRA</div><p class="small" style="text-align:center">Version 3.1.1 Mode Cleanup</p><button class="btn" onclick="modeSelect()">🎮 Nouvelle partie</button><button class="btn secondary" onclick="progression()">🏆 Progression</button><button class="btn secondary" onclick="statsList()">📊 Statistiques</button><button class="btn secondary" onclick="achievementsMenu()">🏅 Succès</button><button class="btn secondary" onclick="collectionSelect()">🎁 Collection</button><button class="btn secondary" onclick="shopHub()">🛒 Boutique</button><button class="btn ghost" onclick="settings()">⚙️ Paramètres</button></div>`);}

function progression(){screen(`<div class="card">${back()}<h1>🏆 Progression</h1><button class="btn secondary" onclick="leaderboard()">🏆 Classement</button><button class="btn secondary" onclick="hall()">🏛️ Hall of Fame</button><button class="btn secondary" onclick="historyList()">📜 Historique</button></div>`)}
function statsList(){ const ps=allPlayers(); screen(`<div class="card">${back()}<h1>📊 Statistiques</h1><button class="btn" onclick="newPlayer()">➕ Nouveau joueur</button>${ps.length?ps.map(p=>`<div class="listitem" onclick="playerStats('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">${p.games} parties • ${p.totalXP} XP • 🩸 ${p.wallet.shards}</span></div><span>›</span></div>`).join(""):`<p class="small">Aucun joueur.</p>`}</div>`)}
function newPlayer(){screen(`<div class="card">${back("statsList()")}<h1>➕ Nouveau joueur</h1><input class="input" id="np" placeholder="Nom du joueur"><div id="msg"></div><button class="btn" onclick="saveNewPlayer()">Créer le joueur</button><button class="btn ghost" onclick="statsList()">Retour</button></div>`); setTimeout(()=>document.getElementById("np")?.focus(),100)}
function saveNewPlayer(){try{createPlayer(document.getElementById("np").value); sound("level"); document.getElementById("msg").className="success-box"; document.getElementById("msg").textContent="Joueur créé ✅"; setTimeout(statsList,350)}catch(e){document.getElementById("msg").className="error-box";document.getElementById("msg").textContent=e.message}}
function playerStats(n){const p=getPlayer(n); if(!p)return statsList(); screen(`<div class="card">${back("statsList()")}${playerCard(p)}${xpcard(p.totalXP,"Niveau général","⭐")}${xpcard(p.survivor.xp,"Niveau Survivant","🛡️")}${xpcard(p.killer.xp,"Niveau Tueur","🔪")}<div class="statbox"><div><b>${p.games}</b><span>Parties</span></div><div><b>${p.wins}</b><span>Victoires</span></div><div><b>${p.losses}</b><span>Défaites</span></div><div><b>${p.bestStreak}</b><span>Record série</span></div><div><b>${p.wallet.shards}</b><span>Éclats</span></div><div><b>${levelFromXP(p.totalXP)}</b><span>Niveau</span></div></div></div>`)}
function leaderboard(){const ps=allPlayers().sort((a,b)=>b.totalXP-a.totalXP); const m=mvp(); screen(`<div class="card">${back("progression()")}<h1>🏆 Classement</h1>${m?`<div class="player-card mvp-card" style="background:linear-gradient(135deg,#3b2a00,#f7c75d,#7a4200)"><div class="mvp-badge">👑 MVP</div><h1>${m.name}</h1><div class="xp">${m.totalXP} XP</div></div>`:""}${ps.map((p,i)=>`<div class="listitem ${isMVP(p.name)?"mvp-card":""}" onclick="playerStats('${p.name.replaceAll("'","\\'")}')"><div><b>${i+1}. ${isMVP(p.name)?"👑 ":""}${p.name}</b><br><span class="small">Niv. ${levelFromXP(p.totalXP)} • ${p.games} parties</span></div><span class="badge">${p.totalXP} XP</span></div>`).join("")||"<p class='small'>Aucun joueur.</p>"}</div>`)}
function hall(){const ps=allPlayers(); const m=mvp(); const wins=[...ps].sort((a,b)=>b.wins-a.wins)[0]; const games=[...ps].sort((a,b)=>b.games-a.games)[0]; screen(`<div class="card">${back("progression()")}<h1>🏛️ Hall of Fame</h1>${m?playerCard(m):"<p class='small'>Aucun MVP.</p>"}<h2>Records</h2><div class="listitem"><b>🏆 Victoires</b><span>${wins?wins.name+" • "+wins.wins:0}</span></div><div class="listitem"><b>🎮 Parties</b><span>${games?games.name+" • "+games.games:0}</span></div></div>`)}
function historyList(){const h=loadHistory().slice().reverse(); screen(`<div class="card">${back("progression()")}<h1>📜 Historique</h1>${h.map(x=>`<div class="listitem"><div><b>${new Date(x.date).toLocaleDateString()}</b><br><span class="small">${x.winner==="killers"?"Tueurs":"Survivants"} gagnent • ${x.players.length} joueurs</span></div></div>`).join("")||"<p class='small'>Aucune partie.</p>"}</div>`)}



/* =========================================================
   MORDRA 3.1.1 — SHADOW MODES
   Choix du mode avant la partie.
========================================================= */

const mordraModes = {
  classic:{
    id:"classic",
    icon:"🔪",
    name:"Classique",
    desc:"Le mode original de MORDRA. Les joueurs voient leur rôle et leur mot.",
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
    desc:"Parties rapides. Discussion réglée automatiquement sur 1 minute.",
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
  screen(`<div class="card">${back("home()")}<h1>🎮 Choisis un mode</h1>
    <p class="small">Sélectionne le style de partie avant de choisir les joueurs.</p>
    ${modes.map(m=>`
      <div class="mode-card ${m.soon?"mode-soon":""}" onclick="${m.soon?`modeSoon('${m.name.replaceAll("'","\\'")}')`:`selectMode('${m.id}')`}">
        <div class="mode-icon">${m.icon}</div>
        <div class="mode-info">
          <b>${m.name} ${m.soon?'<span class="soon-badge">Bientôt</span>':""}</b><br>
          <span class="small">${m.desc}</span>
        </div>
        <span>›</span>
      </div>
    `).join("")}
  </div>`);
}

function modeSoon(name){
  try{ sound("bad"); }catch(e){}
  alert(name+" arrive dans une prochaine mise à jour.");
}

function selectMode(id){
  state.selectedMode = mordraModes[id] || mordraModes.classic;
  setup();
}

function setup(){try{clearDiscussionTimer()}catch(e){} state.players=[]; screen(`<div class="card">${back()}<h1>🎮 Nouvelle partie</h1><div class="selected-mode-box"><b>${(state.selectedMode||mordraModes.classic).icon} Mode sélectionné : ${(state.selectedMode||mordraModes.classic).name}</b><br><span class="small">${(state.selectedMode||mordraModes.classic).desc}</span><br><span class="xp">${(state.selectedMode||mordraModes.classic).roleMode==="hidden"?"Dévoilement : mot seulement":"Dévoilement : rôle + mot"}</span><br><button class="mini-btn" onclick="modeSelect()">Changer</button></div><label class="small">Joueurs</label><input class="input" id="count" type="number" min="3" max="12" value="4"><label class="small">Tueurs</label><input class="input" id="killers" type="number" min="1" max="3" value="1"><label class="small">Temps discussion/vote (minutes)</label><input class="input" id="minutes" type="number" min="1" max="20" value="${(state.selectedMode&&state.selectedMode.minutes)||3}">    <button class="btn" onclick="selectPlayers()">Continuer</button></div>`)}
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
function launchGame(){ if(state.players.length!==state.setup.count)return alert("Sélectionne tous les joueurs."); const pair=words[Math.floor(Math.random()*words.length)]; let ids=state.players.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,state.setup.killers); state.game={id:Date.now(),pair,round:0,winner:null,votes:{},starter:null,roleMode:state.setup?.roleMode||"visible",gameMode:state.setup?.gameMode||"classic",gameModeName:(state.selectedMode||mordraModes.classic).name,discussionMinutes:state.setup?.minutes||3,players:state.players.map((n,i)=>({name:n,role:ids.includes(i)?"killer":"survivor",alive:true}))}; state.game.starter=state.game.players[Math.floor(Math.random()*state.game.players.length)].name; revealPass(0)}
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
  screen(`<div class="card"><h1>Récompenses obtenues 🎁</h1><p class="small">Tout est sauvegardé automatiquement.</p>${rewardHtml}${oldM&&newM&&oldM!==newM?`<div class="mvp-card player-card"><div class="mvp-badge">👑 Nouveau MVP</div><h1>${newM}</h1></div>`:""}<button class="btn" onclick="leaderboard()">Classement</button><button class="btn secondary" onclick="home()">Menu</button></div>`);
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
   MORDRA 3.1.1 — ACHIEVEMENTS STABLE
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

function settings(){screen(`<div class="card">${back()}<h1>⚙️ Paramètres</h1><button class="btn secondary" onclick="dataSettings()">💾 Données</button><button class="btn secondary" onclick="credits()">ℹ️ À propos / Crédits</button></div>`)}
function dataSettings(){screen(`<div class="card">${back("settings()")}<h1>💾 Données</h1><div class="success-box">✅ Sauvegarde automatique activée</div><p class="small">Tout est enregistré automatiquement sur cet appareil.</p><button class="btn secondary" onclick="exportData()">📤 Exporter</button><button class="btn secondary" onclick="importData()">📥 Importer</button><button class="btn danger" onclick="resetData()">🗑️ Réinitialiser</button></div>`)}
function exportData(){const data=JSON.stringify({stats:loadStats(),history:loadHistory()},null,2); navigator.clipboard?.writeText(data).then(()=>alert("Copié ✅")).catch(()=>prompt("Copie tes données :",data))}
function importData(){try{const t=prompt("Colle tes données :"); if(!t)return; const d=JSON.parse(t); if(d.stats)saveStats(d.stats); if(d.history)saveHistory(d.history); home()}catch(e){alert("Import impossible.")}}
function resetData(){if(confirm("Tout effacer ?")&&confirm("Vraiment tout remettre à zéro ?")){localStorage.removeItem(saveKey);localStorage.removeItem(historyKey);home()}}
function credits(){screen(`<div class="card">${back("settings()")}<div class="logo">MORDRA</div><p class="small" style="text-align:center">Version 3.1.1 Mode Cleanup</p><div class="listitem"><div><b>AN ORIGINAL GAME BY</b><br>Kevin Moreau</div></div><div class="listitem"><div><b>DEVELOPED WITH THE ASSISTANCE OF</b><br>ChatGPT</div></div></div>`)}
intro();



/* =========================================================
   MORDRA 3.1.1 — REVEAL BUTTON FIX
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
   MORDRA 3.1.1 — NEW PLAYER FLOW FIX
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
   MORDRA 3.1.1 — DISCUSSION TIMER
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
   MORDRA 3.1.1 — VERDICT CINEMATIC
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
