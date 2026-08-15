(function(){
  const API = window.SOLOS_API, UI = window.SOLOS_UI, C = window.SOLOS_CONFIG;
  const playerName = p => p.clanDisplayName || `${C.CLAN_TAG} ${p.displayName || p.username || 'Player'}`;
  function avatarHtml(p, size=''){
    const src = p.profileImage || p.avatarUrl || '';
    const initials = UI.escape((p.displayName || p.username || '?').slice(0,2).toUpperCase());
    return src ? `<img class="avatar avatar-img ${size}" src="${UI.escape(src)}" alt="${UI.escape(playerName(p))} avatar" loading="lazy">` : `<div class="avatar ${size}">${initials}</div>`;
  }
  async function fileToDataUrl(file){
    if(!file) return '';
    const allowed = ['image/jpeg','image/png','image/webp'];
    if(!allowed.includes(file.type)) throw new Error('Profile picture must be JPG, PNG or WebP.');
    if(file.size > 520000) throw new Error('Profile picture is too large. Use an image below 500KB.');
    return await new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(new Error('Unable to read profile picture.')); r.readAsDataURL(file); });
  }
  async function loadHome(){
    try{
      const data = await API.call('publicHome', {}, {method:'GET'});
      renderKpis(data.stats||{}); renderFeatured(data.featuredMatch); renderNews(data.news||[]); renderRoster(data.roster||[]); renderLeaderboard(data.leaderboard||[]);
    }catch(err){ console.warn(err.message); }
  }
  function renderKpis(s){
    const el=document.getElementById('publicKpis'); if(!el) return;
    el.innerHTML=`<div><span class="muted">Members</span><strong>${UI.escape(s.totalMembers||0)}</strong></div><div><span class="muted">Win Rate</span><strong>${UI.escape(s.winRate||0)}%</strong></div><div><span class="muted">MVPs</span><strong>${UI.escape(s.totalMvps||0)}</strong></div>`;
  }
  function renderFeatured(m){
    const el=document.getElementById('featuredMatch'); if(!el) return;
    if(!m){el.innerHTML='<div class="empty">No featured match yet.</div>';return;}
    el.innerHTML=`<div class="versus"><strong>SOLOS十</strong><span class="pill">VS</span><strong>${UI.escape(m.opponent)}</strong></div><div class="score">${UI.escape(m.solosScore)} — ${UI.escape(m.opponentScore)}</div><p><span class="status ${String(m.result).toLowerCase()}">${UI.escape(m.result)}</span> <span class="muted">${UI.escape(m.mode||'Match')} · ${UI.date(m.matchDate)} · MVP: ${UI.escape(m.mvpName||'—')}</span></p><a class="btn ghost small" href="matches.html">Match report</a>`;
  }
  function renderNews(news){
    const home=document.getElementById('homeNews'), grid=document.getElementById('newsGrid');
    const cards = news.length ? news.map(n=>`<article class="card news-card"><div class="thumb"></div><div><span class="eyebrow">${UI.escape(n.category||'News')}</span><h3>${UI.escape(n.title)}</h3><p class="muted">${UI.escape(n.excerpt||'')}</p><small class="muted">${UI.date(n.publishedAt||n.createdAt)}</small></div></article>`).join('') : UI.empty('Nothing new yet.');
    if(home) home.innerHTML=cards; if(grid) grid.innerHTML = news.length ? news.map(n=>`<article class="card feature-card"><div class="thumb" style="margin-bottom:14px"></div><span class="eyebrow">${UI.escape(n.category||'News')}</span><h3>${UI.escape(n.title)}</h3><p>${UI.escape(n.excerpt||n.content||'')}</p><small class="muted">${UI.date(n.publishedAt||n.createdAt)}</small></article>`).join('') : UI.empty('Nothing new yet.');
  }
  function playerCard(p){ return `<article class="card player-card">${avatarHtml(p)}<h3>${UI.escape(playerName(p))}</h3><p class="muted">${UI.escape(p.playerRole||'Player')} · ${UI.escape(p.tier||'Unranked')}</p><div class="pill">${UI.escape(p.score||0)} XP</div><a class="btn ghost small" href="app.html#profile" style="margin-top:12px">Profile</a></article>`; }
  function renderRoster(roster){
    const home=document.getElementById('homeRoster'), team=document.getElementById('teamRoster'); const html=roster.length?roster.map(playerCard).join(''):UI.empty('No players on the board yet.');
    if(home) home.innerHTML=html; if(team) team.innerHTML=html;
  }
  function renderLeaderboard(rows){
    const home=document.getElementById('homeLeaderboard'), table=document.querySelector('#leaderboardTable tbody');
    if(home) home.innerHTML = rows.length ? rows.slice(0,5).map((p,i)=>`<div class="rank-row"><strong>#${i+1}</strong><span>${UI.escape(playerName(p))}</span><span class="pill">${UI.escape(p.score||0)} XP</span></div>`).join('') : UI.empty('No one owns the board yet.');
    if(table){ table.innerHTML = rows.length ? rows.map((p,i)=>`<tr><td>${i+1}</td><td>${avatarHtml(p,'small-avatar')} ${UI.escape(playerName(p))}</td><td>${UI.escape(p.tier||'Unranked')}</td><td>${UI.escape(p.score||0)}</td><td>${UI.escape(p.matches||0)}</td><td>${UI.escape(p.wins||0)}</td><td>${UI.escape(p.winRate||0)}%</td><td>${UI.escape(p.mvps||0)}</td></tr>`).join('') : '<tr><td colspan="8">No one owns the board yet.</td></tr>'; UI.tableCellLabels(document.getElementById('leaderboardTable')); }
  }
  function renderMatches(matches){
    const list=document.getElementById('matchesList'); if(!list) return;
    list.innerHTML = matches.length ? matches.map(m=>`<article class="card feature-card"><span class="eyebrow">${UI.escape(m.mode||'Match')}</span><h3>SOLOS十 vs ${UI.escape(m.opponent)}</h3><div class="score">${UI.escape(m.solosScore)} — ${UI.escape(m.opponentScore)}</div><p><span class="status ${String(m.result).toLowerCase()}">${UI.escape(m.result)}</span> <span class="muted">${UI.date(m.matchDate)} · MVP: ${UI.escape(m.mvpName||'—')}</span></p><p class="muted">${UI.escape(m.notes||'No notes from this battle yet.')}</p></article>`).join('') : UI.empty('No battles recorded yet.');
  }
  async function loadPageLists(){
    try{
      if(document.getElementById('teamRoster')) renderRoster((await API.call('getTeam',{}, {method:'GET'})).users||[]);
      if(document.getElementById('matchesList')) renderMatches((await API.call('getMatches',{publishedOnly:'true'}, {method:'GET'})).matches||[]);
      if(document.getElementById('leaderboardTable')) renderLeaderboard((await API.call('getLeaderboard',{}, {method:'GET'})).leaderboard||[]);
      if(document.getElementById('newsGrid')) renderNews((await API.call('getNews',{publishedOnly:'true'}, {method:'GET'})).news||[]);
    }catch(err){ UI.toast(err.message || 'Unable to load page data.','error'); }
  }
  function bindRegistration(){
    const form=document.getElementById('registerForm'); if(!form) return;
    UI.bindForm(form, async fd=>{
      const body=Object.fromEntries(fd.entries());
      if(body.password !== body.confirmPassword) throw new Error('Passwords do not match.');
      const file = document.getElementById('avatarFile')?.files?.[0];
      if(file) body.avatarData = await fileToDataUrl(file);
      delete body.confirmPassword; delete body.avatarFile;
      const res=await API.call('register', body, {write:true});
      document.getElementById('registerMessage').textContent = res.message || 'Application sent. Leadership will review it.'; form.reset(); UI.toast('Application sent. Leadership will review it.','success');
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{loadHome(); loadPageLists(); bindRegistration();});
})();
