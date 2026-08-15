(function(){
  const API=window.SOLOS_API, UI=window.SOLOS_UI, C=window.SOLOS_CONFIG;
  const Member={};
  const playerName = u => u.clanDisplayName || `${C.CLAN_TAG} ${u.displayName || u.username || 'Player'}`;
  function avatar(u, size=''){
    const src = u.profileImage || u.avatarUrl || '';
    const initials = UI.escape((u.displayName || u.username || '?').slice(0,2).toUpperCase());
    return src ? `<img class="avatar avatar-img ${size}" src="${UI.escape(src)}" alt="${UI.escape(playerName(u))} avatar">` : `<div class="avatar ${size}">${initials}</div>`;
  }
  async function fileToDataUrl(file){
    if(!file) return '';
    const allowed=['image/jpeg','image/png','image/webp'];
    if(!allowed.includes(file.type)) throw new Error('Profile picture must be JPG, PNG or WebP.');
    if(file.size > 520000) throw new Error('Profile picture is too large. Use an image below 500KB.');
    return await new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(new Error('Unable to read image.')); r.readAsDataURL(file); });
  }
  Member.render=async function(route, main, user){
    if(route==='dashboard') return Member.dashboard(main,user);
    if(route==='profile') return Member.profile(main,user);
    if(route==='stats'||route==='rank') return Member.stats(main,user);
    if(route==='matches') return Member.matches(main,user);
    if(route==='community') return Member.community(main,user);
    if(route==='notifications') return Member.notifications(main,user);
    if(route==='settings') return window.SOLOS_ADMIN.settings(main,user);
    main.innerHTML=UI.empty('Page not found.');
  };
  Member.dashboard=async function(main,user){
    const res=await API.call('memberDashboard',{}, {method:'GET'}); const s=res.stats||{};
    main.innerHTML=`<section class="profile-grid"><article class="card profile-card">${avatar(user)}<h2>${UI.escape(playerName(user))}</h2><p class="muted">${UI.escape(user.playerRole||'Player')} · ${UI.escape(user.tier||'Unranked')}</p><div class="statline"><div><span class="muted">Score</span><strong>${s.score||0}</strong></div><div><span class="muted">Wins</span><strong>${s.wins||0}</strong></div><div><span class="muted">MVPs</span><strong>${s.mvps||0}</strong></div></div></article><div class="grid"><section class="card panel"><h2>Recent Matches</h2>${(res.matches||[]).length?(res.matches||[]).map(m=>`<p><strong>SOLOS十 vs ${UI.escape(m.opponent)}</strong><br><span class="muted">${UI.escape(m.result)} · ${UI.date(m.matchDate)}</span></p>`).join(''):UI.empty('No battles recorded yet.')}</section><section class="card panel"><h2>Notifications</h2>${(res.notifications||[]).length?(res.notifications||[]).map(n=>`<p><strong>${UI.escape(n.title)}</strong><br><span class="muted">${UI.date(n.createdAt)}</span></p>`).join(''):UI.empty('Nothing for you yet.')}</section></div></section>`;
  };
  Member.profile=async function(main,user){
    main.innerHTML=`<section class="profile-grid"><article class="card profile-card">${avatar(user)}<h2>${UI.escape(playerName(user))}</h2><p class="muted">${UI.escape(user.bio||'No bio yet.')}</p><p><span class="pill">Clan Role: ${UI.escape(user.role||'MEMBER')}</span></p></article><section class="card panel"><h2>Player Profile</h2><div class="statline"><div><span class="muted">Tier</span><strong>${UI.escape(user.tier||'—')}</strong></div><div><span class="muted">Score</span><strong>${UI.escape(user.score||0)}</strong></div><div><span class="muted">CODM Role</span><strong>${UI.escape(user.playerRole||'—')}</strong></div></div><p><strong>CODM UID:</strong> ${UI.escape(user.codmUid||'—')}</p><p><strong>Country:</strong> ${UI.escape(user.country||'—')}</p><p><strong>Preferred mode:</strong> ${UI.escape(user.preferredMode||'—')}</p><p><strong>Clan tag:</strong> ${UI.escape(user.clanTag || C.CLAN_TAG)}</p><p class="muted">Your clan identity stays with your profile.</p></section></section>`;
  };
  Member.stats=async function(main){ const res=await API.call('memberDashboard',{}, {method:'GET'}); const s=res.stats||{}; main.innerHTML=`<section class="stats-grid"><div class="card stat-card"><span>Score</span><strong>${s.score||0}</strong></div><div class="card stat-card"><span>Tier</span><strong>${UI.escape(s.tier||'—')}</strong></div><div class="card stat-card"><span>Matches</span><strong>${s.matches||0}</strong></div><div class="card stat-card"><span>Win Rate</span><strong>${s.winRate||0}%</strong></div></section><section class="card panel" style="margin-top:16px"><h2>Ranking History</h2>${(res.rankHistory||[]).length?(res.rankHistory||[]).map(r=>`<p>${UI.escape(r.delta)} XP — ${UI.escape(r.reason)} <span class="muted">${UI.date(r.createdAt)}</span></p>`).join(''):UI.empty('No XP changes yet.')}</section>`; };
  Member.matches=async function(main){ const res=await API.call('getMatches',{}, {method:'GET'}); main.innerHTML=`<section class="grid two">${(res.matches||[]).map(m=>`<article class="card feature-card"><span class="eyebrow">${UI.escape(m.mode||'Match')}</span><h3>SOLOS十 vs ${UI.escape(m.opponent)}</h3><div class="score">${UI.escape(m.solosScore)} — ${UI.escape(m.opponentScore)}</div><p><span class="status ${String(m.result).toLowerCase()}">${UI.escape(m.result)}</span> <span class="muted">${UI.date(m.matchDate)}</span></p></article>`).join('')||UI.empty('No battles recorded yet.')}</section>`; };
  Member.community=function(main){ main.innerHTML=`<section class="card panel"><h2>The Clan Room</h2><p class="muted">Talk. Share clips. Find teammates. Set up a scrim. Just don't flood the room.</p><p><a class="btn cyan small" href="${UI.escape(C.SOCIALS.whatsapp)}" target="_blank" rel="noopener">WhatsApp Community</a></p><div id="chatMount"></div></section>`; window.SOLOS_CHAT.mount(document.getElementById('chatMount'), false); };
  Member.notifications=async function(main){ const res=await API.call('listNotifications',{}, {method:'GET'}); main.innerHTML=`<section class="card panel"><h2>Notifications</h2>${(res.notifications||[]).map(n=>`<p><strong>${UI.escape(n.title)}</strong><br>${UI.escape(n.message)}<br><span class="muted">${UI.date(n.createdAt)}</span></p>`).join('')||UI.empty('Nothing for you yet.')}</section>`; };
  Member.fileToDataUrl = fileToDataUrl;
  window.SOLOS_MEMBER=Member;
})();
