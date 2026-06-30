
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
function playerCard(p){p=normalize(p); const badges=p.eq.badges.map(id=>item("badge",id)).filter(Boolean); const title=item("title",p.eq.title)?.name || "Sans titre"; return `<div class="player-card ${isMVP(p.name)?"mvp-card":""}" style="background:${isMVP(p.name)?"linear-gradient(135deg,#3b2a00,#f7c75d,#7a4200)":bannerCSS(p)}">${mvpBadge(p.name)}<h1>${p.name}</h1><div class="xp">${title}</div><div class="small">⭐ Niveau ${levelFromXP(p.totalXP)} • 🩸 ${p.wallet.shards}</div><div class="profile-badges">${badges.length?badges.map(b=>`<span>${b.icon}</span>`).join(""):"<span>🩸</span>"}</div></div>`}

function intro(){
  screen(`<div class="loading"><div class="loading-center"><div class="loading-logo">MORDRA</div><div class="loading-sub">Chargement...</div><div class="loading-text" id="lt">Chargement des survivants...</div><div class="bar"><div id="lf"></div></div><div class="percent" id="lp">0%</div></div><div class="credit-bottom"><span>A game imagined by</span><b>Kevin Moreau</b><small>Developed with the assistance of ChatGPT</small></div></div>`);
  const texts=["Chargement des survivants...","Préparation des tueurs...","Ouverture du Blood Market...","Chargement du Passe des Ombres...","Vérification des succès...","Bienvenue dans MORDRA..."]; let p=0;
  const i=setInterval(()=>{ p+=Math.floor(4+Math.random()*8); if(p>100)p=100; document.getElementById("lf").style.width=p+"%"; document.getElementById("lp").textContent=p+"%"; document.getElementById("lt").textContent=texts[Math.min(texts.length-1,Math.floor(p/18))]; if(p>=100){clearInterval(i); setTimeout(startScreen,550)} },190);
}
function startScreen(){ screen(`<div class="start-screen"><div><div class="logo">MORDRA</div><div class="small">Le jeu de déduction horrifique</div><button class="btn start-btn" onclick="home()">DÉMARRER</button><div class="small">Version 2.0.1 Shop Hub</div></div></div>`)}
function home(){ screen(`<div class="card"><div class="logo">MORDRA</div><p class="small" style="text-align:center">Version 2.0.1 Shop Hub</p><button class="btn" onclick="setup()">🎮 Nouvelle partie</button><button class="btn secondary" onclick="progression()">🏆 Progression</button><button class="btn secondary" onclick="statsList()">📊 Statistiques</button><button class="btn secondary" onclick="achievements()">🏅 Succès</button><button class="btn secondary" onclick="collectionSelect()">🎁 Collection</button><button class="btn secondary" onclick="shopHub()">🛒 Boutique</button><button class="btn ghost" onclick="settings()">⚙️ Paramètres</button></div>`);}

function progression(){screen(`<div class="card">${back()}<h1>🏆 Progression</h1><button class="btn secondary" onclick="leaderboard()">🏆 Classement</button><button class="btn secondary" onclick="hall()">🏛️ Hall of Fame</button><button class="btn secondary" onclick="historyList()">📜 Historique</button></div>`)}
function statsList(){ const ps=allPlayers(); screen(`<div class="card">${back()}<h1>📊 Statistiques</h1><button class="btn" onclick="newPlayer()">➕ Nouveau joueur</button>${ps.length?ps.map(p=>`<div class="listitem" onclick="playerStats('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">${p.games} parties • ${p.totalXP} XP • 🩸 ${p.wallet.shards}</span></div><span>›</span></div>`).join(""):`<p class="small">Aucun joueur.</p>`}</div>`)}
function newPlayer(){screen(`<div class="card">${back("statsList()")}<h1>➕ Nouveau joueur</h1><input class="input" id="np" placeholder="Nom du joueur"><div id="msg"></div><button class="btn" onclick="saveNewPlayer()">Créer le joueur</button><button class="btn ghost" onclick="statsList()">Retour</button></div>`); setTimeout(()=>document.getElementById("np")?.focus(),100)}
function saveNewPlayer(){try{createPlayer(document.getElementById("np").value); sound("level"); document.getElementById("msg").className="success-box"; document.getElementById("msg").textContent="Joueur créé ✅"; setTimeout(statsList,350)}catch(e){document.getElementById("msg").className="error-box";document.getElementById("msg").textContent=e.message}}
function playerStats(n){const p=getPlayer(n); if(!p)return statsList(); screen(`<div class="card">${back("statsList()")}${playerCard(p)}${xpcard(p.totalXP,"Niveau général","⭐")}${xpcard(p.survivor.xp,"Niveau Survivant","🛡️")}${xpcard(p.killer.xp,"Niveau Tueur","🔪")}<div class="statbox"><div><b>${p.games}</b><span>Parties</span></div><div><b>${p.wins}</b><span>Victoires</span></div><div><b>${p.losses}</b><span>Défaites</span></div><div><b>${p.bestStreak}</b><span>Record série</span></div><div><b>${p.wallet.shards}</b><span>Éclats</span></div><div><b>${levelFromXP(p.totalXP)}</b><span>Niveau</span></div></div></div>`)}
function leaderboard(){const ps=allPlayers().sort((a,b)=>b.totalXP-a.totalXP); const m=mvp(); screen(`<div class="card">${back("progression()")}<h1>🏆 Classement</h1>${m?`<div class="player-card mvp-card" style="background:linear-gradient(135deg,#3b2a00,#f7c75d,#7a4200)"><div class="mvp-badge">👑 MVP</div><h1>${m.name}</h1><div class="xp">${m.totalXP} XP</div></div>`:""}${ps.map((p,i)=>`<div class="listitem ${isMVP(p.name)?"mvp-card":""}" onclick="playerStats('${p.name.replaceAll("'","\\'")}')"><div><b>${i+1}. ${isMVP(p.name)?"👑 ":""}${p.name}</b><br><span class="small">Niv. ${levelFromXP(p.totalXP)} • ${p.games} parties</span></div><span class="badge">${p.totalXP} XP</span></div>`).join("")||"<p class='small'>Aucun joueur.</p>"}</div>`)}
function hall(){const ps=allPlayers(); const m=mvp(); const wins=[...ps].sort((a,b)=>b.wins-a.wins)[0]; const games=[...ps].sort((a,b)=>b.games-a.games)[0]; screen(`<div class="card">${back("progression()")}<h1>🏛️ Hall of Fame</h1>${m?playerCard(m):"<p class='small'>Aucun MVP.</p>"}<h2>Records</h2><div class="listitem"><b>🏆 Victoires</b><span>${wins?wins.name+" • "+wins.wins:0}</span></div><div class="listitem"><b>🎮 Parties</b><span>${games?games.name+" • "+games.games:0}</span></div></div>`)}
function historyList(){const h=loadHistory().slice().reverse(); screen(`<div class="card">${back("progression()")}<h1>📜 Historique</h1>${h.map(x=>`<div class="listitem"><div><b>${new Date(x.date).toLocaleDateString()}</b><br><span class="small">${x.winner==="killers"?"Tueurs":"Survivants"} gagnent • ${x.players.length} joueurs</span></div></div>`).join("")||"<p class='small'>Aucune partie.</p>"}</div>`)}

function setup(){state.players=[]; screen(`<div class="card">${back()}<h1>🎮 Nouvelle partie</h1><label class="small">Joueurs</label><input class="input" id="count" type="number" min="3" max="12" value="4"><label class="small">Tueurs</label><input class="input" id="killers" type="number" min="1" max="3" value="1"><label class="small">Temps vote (minutes)</label><input class="input" id="minutes" type="number" min="1" max="20" value="5"><button class="btn" onclick="selectPlayers()">Continuer</button></div>`)}
function selectPlayers(){const count=+document.getElementById("count").value; const killers=+document.getElementById("killers").value; state.setup={count,killers,minutes:+document.getElementById("minutes").value}; const ps=allPlayers(); screen(`<div class="card">${back("setup()")}<h1>Joueurs</h1><button class="btn secondary" onclick="quickAddPlayer()">➕ Nouveau joueur</button><div id="sel">${ps.map(p=>`<button class="btn secondary" onclick="toggleSelect('${p.name.replaceAll("'","\\'")}')">${p.name}</button>`).join("")}</div><p class="small" id="chosen">0/${count}</p><button class="btn" onclick="launchGame()">Lancer partie</button></div>`)}
function quickAddPlayer(){const n=prompt("Nom du joueur"); if(!n)return; try{createPlayer(n); selectPlayers()}catch(e){alert(e.message)}}
function toggleSelect(n){const i=state.players.indexOf(n); if(i>=0)state.players.splice(i,1); else if(state.players.length<state.setup.count)state.players.push(n); document.getElementById("chosen").textContent=state.players.length+"/"+state.setup.count}
function launchGame(){ if(state.players.length!==state.setup.count)return alert("Sélectionne tous les joueurs."); const pair=words[Math.floor(Math.random()*words.length)]; let ids=state.players.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,state.setup.killers); state.game={id:Date.now(),pair,round:0,winner:null,votes:{},players:state.players.map((n,i)=>({name:n,role:ids.includes(i)?"killer":"survivor",alive:true}))}; revealPass(0)}
function revealPass(i){ if(i>=state.game.players.length)return discussion(); const gp=state.game.players[i]; screen(`<div class="card">${playerCard(getPlayer(gp.name)||defaultPlayer(gp.name))}<p class="small">Passe le téléphone à ${gp.name}. Cache bien l'écran.</p><button class="btn" onclick="revealWord(${i})">Dévoiler</button></div>`)}
function revealWord(i){const gp=state.game.players[i], word=gp.role==="killer"?state.game.pair[1]:state.game.pair[0]; screen(`<div class="card"><h1>${gp.role==="killer"?"🔪 Tueur":"🛡️ Survivant"}</h1><div class="logo" style="font-size:38px">${word}</div><button class="btn" onclick="revealPass(${i+1})">Cacher et passer</button></div>`)}
function discussion(){screen(`<div class="card"><h1>⏳ Discussion</h1><p class="small">Débattez, puis passez au vote.</p><button class="btn" onclick="votePass(0)">Voter</button></div>`)}
function votePass(i){const alive=state.game.players.map((p,idx)=>({...p,idx})).filter(p=>p.alive); if(i>=alive.length)return resolveVote(); const p=alive[i]; screen(`<div class="card">${playerCard(getPlayer(p.name)||defaultPlayer(p.name))}<p class="small">Vote en secret.</p>${alive.filter(x=>x.idx!==p.idx).map(t=>`<button class="btn secondary" onclick="state.game.votes[${p.idx}]=${t.idx}; votePass(${i+1})">${t.name}</button>`).join("")}</div>`)}
function resolveVote(){let counts={}; Object.values(state.game.votes).forEach(v=>counts[v]=(counts[v]||0)+1); const vals=Object.entries(counts).sort((a,b)=>b[1]-a[1]); if(vals.length>1&&vals[0][1]===vals[1][1]) return screen(`<div class="card"><h1>Égalité</h1><p class="small">Aucun éliminé. Nouveau vote.</p><button class="btn" onclick="state.game.votes={}; votePass(0)">Revoter</button></div>`); const elim=+vals[0][0]; state.game.players[elim].alive=false; const aliveKillers=state.game.players.filter(p=>p.alive&&p.role==="killer").length; const aliveSurv=state.game.players.filter(p=>p.alive&&p.role==="survivor").length; if(aliveKillers===0)state.game.winner="survivors"; else if(aliveKillers>=aliveSurv)state.game.winner="killers"; if(state.game.winner)return endGame(); screen(`<div class="card"><h1>${state.game.players[elim].name} éliminé</h1><p class="small">Il reste encore un tueur.</p><button class="btn" onclick="state.game.votes={}; discussion()">Continuer</button></div>`)}
function endGame(){screen(`<div class="card"><h1>${state.game.winner==="killers"?"🔪 Tueurs gagnent":"🛡️ Survivants gagnent"}</h1><button class="btn" onclick="saveGame()">Valider et enregistrer</button></div>`)}
function saveGame(){ const stats=loadStats(); const hist=loadHistory(); if(hist.find(h=>h.id===state.game.id))return alert("Déjà enregistré."); const oldM=mvp()?.name; state.game.players.forEach((gp,i)=>{let p=getPlayer(gp.name)||defaultPlayer(gp.name); const win=(gp.role==="killer"&&state.game.winner==="killers")||(gp.role==="survivor"&&state.game.winner==="survivors"); const xp=win?160:70; const shards=win?65:20; p.games++; p.totalXP+=xp; p.wallet.shards+=shards; if(win){p.wins++;p.streak++}else{p.losses++;p.streak=0} p.bestStreak=Math.max(p.bestStreak,p.streak); const r=gp.role==="killer"?p.killer:p.survivor; r.games++; r.xp+=xp; if(win){r.wins++;r.streak=(r.streak||0)+1}else r.streak=0; r.bestStreak=Math.max(r.bestStreak||0,r.streak||0); savePlayer(p); }); hist.push({id:state.game.id,date:new Date().toISOString(),winner:state.game.winner,players:state.game.players,pair:state.game.pair}); saveHistory(hist); const newM=mvp()?.name; screen(`<div class="card"><h1>Stats enregistrées ✅</h1>${oldM&&newM&&oldM!==newM?`<div class="mvp-card player-card"><div class="mvp-badge">👑 Nouveau MVP</div><h1>${newM}</h1></div>`:""}<button class="btn" onclick="leaderboard()">Classement</button><button class="btn secondary" onclick="home()">Menu</button></div>`);}


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
function hourKey(){return Math.floor(Date.now()/3600000)} function rand(s){let x=Math.sin(s)*10000; return x-Math.floor(x)} function deal(){const pool=shopItems.filter(i=>i.price>0); return pool[Math.floor(rand(hourKey()*777)*pool.length)]}
function shop(n,type="all"){const p=getPlayer(n); const tabs=["all","banner","badge","frame","title"]; const d=deal(); const pool=shopItems.filter(i=>type==="all"||i.type===type).map((it,i)=>({it,score:rand(hourKey()*999+i*31)})).sort((a,b)=>a.score-b.score).slice(0,8).map(x=>x.it); screen(`<div class="card">${back(`market('${n.replaceAll("'","\\'")}')`)}<h1>🛒 Boutique</h1><p class="small">Change toutes les heures.</p><div class="tabs">${tabs.map(t=>`<button class="tab ${type===t?"active":""}" onclick="shop('${n.replaceAll("'","\\'")}','${t}')">${t}</button>`).join("")}</div>${type==="all"?shopLine(p,d,n,true):""}${pool.map(it=>shopLine(p,it,n,false)).join("")}</div>`)}
function shopLine(p,it,n,isDeal){const price=isDeal?Math.floor(it.price*.65):it.price; const own=owned(p,it); return `<div class="shop-item ${isDeal?"deal":""}"><div class="shop-icon">${it.icon}</div><div class="shop-info"><b>${isDeal?"🔥 ":""}${it.name}</b><br><span class="small">${it.rarity} • ${it.type}</span><br><span class="xp">🩸 ${price}</span></div><button class="mini-btn" ${own?"disabled":""} onclick="buy('${n.replaceAll("'","\\'")}','${it.id}',${price})">${own?"Déjà":"Acheter"}</button></div>`}
function buy(n,id,price){let p=getPlayer(n); const it=shopItems.find(x=>x.id===id); if(!it)return; if(owned(p,it))return alert("Déjà possédé."); if(p.wallet.shards<price)return alert("Pas assez d'Éclats."); if(!confirm(`Acheter ${it.name} ?`))return; p.wallet.shards-=price; give(p,it); savePlayer(p); sound("level"); collection(n)}
function collectionSelect(){const ps=allPlayers(); screen(`<div class="card">${back("shopHub()")}<h1>🎁 Collection</h1>${ps.map(p=>`<div class="listitem" onclick="collection('${p.name.replaceAll("'","\\'")}')"><div><b>${p.name}</b><br><span class="small">Bannières, badges, cadres, titres</span></div><span>›</span></div>`).join("")||"<p class='small'>Aucun joueur.</p>"}</div>`)}
function collection(n){const p=getPlayer(n); const sec=(type,title)=>`<h2>${title}</h2>`+shopItems.filter(i=>i.type===type).map(it=>{const own=owned(p,it); const eq=type==="banner"?p.eq.banner===it.id:type==="frame"?p.eq.frame===it.id:type==="title"?p.eq.title===it.id:p.eq.badges.includes(it.id); return `<div class="shop-item ${own?"":"locked"} ${eq?"equipped":""}"><div class="shop-icon">${it.icon}</div><div class="shop-info"><b>${it.name} ${eq?"✅":own?"":"🔒"}</b><br><span class="small">${it.rarity}</span></div><button class="mini-btn" ${own?"":"disabled"} onclick="equip('${n.replaceAll("'","\\'")}','${it.id}')">${eq?"Équipé":"Équiper"}</button></div>`}).join(""); screen(`<div class="card">${back("collectionSelect()")}<h1>🎁 Collection</h1>${playerCard(p)}${sec("banner","🖼️ Bannières")}${sec("badge","🏅 Badges")}${sec("frame","👑 Cadres")}${sec("title","⭐ Titres")}</div>`)}
function equip(n,id){let p=getPlayer(n); const it=shopItems.find(x=>x.id===id); if(!it||!owned(p,it))return; if(it.type==="banner")p.eq.banner=id; if(it.type==="frame")p.eq.frame=p.eq.frame===id?null:id; if(it.type==="title")p.eq.title=p.eq.title===id?null:id; if(it.type==="badge"){ if(p.eq.badges.includes(id))p.eq.badges=p.eq.badges.filter(x=>x!==id); else{ if(p.eq.badges.length>=3)p.eq.badges.shift(); p.eq.badges.push(id)}} savePlayer(p); collection(n)}
function pass(n){const p=getPlayer(n); const xp=Math.floor(p.totalXP/2)+p.games*35; const lvl=Math.min(100,Math.floor(xp/250)+1); const prog=xp%250; const tiers=Array.from({length:100},(_,i)=>i+1).map(i=>{const unlocked=i<=lvl, claimed=p.passClaimed.includes(i); return `<div class="pass-tier ${claimed?"equipped":unlocked?"deal":"locked"}"><div class="shop-info"><b>Palier ${i}</b><br><span class="small">${i%10===0?"Objet cosmétique":"Éclats de Sang"}</span><br><span class="xp">+${80+i*8} 🩸</span></div><button class="mini-btn" ${!unlocked||claimed?"disabled":""} onclick="claimPass('${n.replaceAll("'","\\'")}',${i})">${claimed?"Pris":unlocked?"Récupérer":"Bloqué"}</button></div>`}).join(""); screen(`<div class="card">${back(`market('${n.replaceAll("'","\\'")}')`)}<h1>🛡️ Passe des Ombres</h1><p class="xp">Se termine dans 30 jours</p><div class="level-card"><div class="level-head"><b>Palier ${lvl}/100</b><span class="badge">${xp} XP</span></div><div class="level-bar"><div style="width:${Math.round(prog/250*100)}%"></div></div></div>${tiers}</div>`)}
function claimPass(n,l){let p=getPlayer(n); if(p.passClaimed.includes(l))return; const xp=Math.floor(p.totalXP/2)+p.games*35; if(l>Math.min(100,Math.floor(xp/250)+1))return; p.wallet.shards+=80+l*8; p.passClaimed.push(l); if(l%10===0){const pool=shopItems.filter(i=>!owned(p,i)); if(pool.length)give(p,pool[Math.floor(Math.random()*pool.length)])} savePlayer(p); pass(n)}
function achievements(){screen(`<div class="card">${back()}<h1>🏅 Succès</h1><p class="small">Système stable simplifié pour la 2.0. Les succès avancés reviennent dans une version future.</p>${allPlayers().map(p=>`<div class="listitem"><div><b>${p.name}</b><br><span class="small">${p.games>=1?"✅ Première partie":"🔒 Première partie"} • ${p.wins>=1?"✅ Première victoire":"🔒 Première victoire"} • ${levelFromXP(p.totalXP)>=5?"✅ Niveau 5":"🔒 Niveau 5"}</span></div></div>`).join("")}</div>`)}
function settings(){screen(`<div class="card">${back()}<h1>⚙️ Paramètres</h1><button class="btn secondary" onclick="dataSettings()">💾 Données</button><button class="btn secondary" onclick="credits()">ℹ️ À propos / Crédits</button></div>`)}
function dataSettings(){screen(`<div class="card">${back("settings()")}<h1>💾 Données</h1><div class="success-box">✅ Sauvegarde automatique activée</div><p class="small">Tout est enregistré automatiquement sur cet appareil.</p><button class="btn secondary" onclick="exportData()">📤 Exporter</button><button class="btn secondary" onclick="importData()">📥 Importer</button><button class="btn danger" onclick="resetData()">🗑️ Réinitialiser</button></div>`)}
function exportData(){const data=JSON.stringify({stats:loadStats(),history:loadHistory()},null,2); navigator.clipboard?.writeText(data).then(()=>alert("Copié ✅")).catch(()=>prompt("Copie tes données :",data))}
function importData(){try{const t=prompt("Colle tes données :"); if(!t)return; const d=JSON.parse(t); if(d.stats)saveStats(d.stats); if(d.history)saveHistory(d.history); home()}catch(e){alert("Import impossible.")}}
function resetData(){if(confirm("Tout effacer ?")&&confirm("Vraiment tout remettre à zéro ?")){localStorage.removeItem(saveKey);localStorage.removeItem(historyKey);home()}}
function credits(){screen(`<div class="card">${back("settings()")}<div class="logo">MORDRA</div><p class="small" style="text-align:center">Version 2.0.1 Shop Hub</p><div class="listitem"><div><b>AN ORIGINAL GAME BY</b><br>Kevin Moreau</div></div><div class="listitem"><div><b>DEVELOPED WITH THE ASSISTANCE OF</b><br>ChatGPT</div></div></div>`)}
intro();
