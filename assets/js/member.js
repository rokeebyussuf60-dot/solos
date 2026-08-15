(function(){
  const API=window.SOLOS_API, UI=window.SOLOS_UI, C=window.SOLOS_CONFIG;
  const Member={};
  const allowedRoutes=new Set(['dashboard','profile','rank','stats','matches','community','notifications','settings']);
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
  function rankHistoryHtml(history){
    return (history||[]).length ? history.map(r=>`<p><strong>${UI.escape(r.delta||r.change||0)} XP</strong> — ${UI.escape(r.reason||'Point update')}<br><span class="muted">${UI.escape(r.previousTier||'—')} → ${UI.escape(r.newTier||'—')} · ${UI.date(r.createdAt)}</span></p>`).join('') : UI.empty('No XP changes yet.');
  }
  Member.render=async function(route, main, user){
    if(!allowedRoutes.has(route)){ main.innerHTML=UI.empty('You are not allowed to open that room.'); return; }
    if(route==='dashboard') return Member.dashboard(main,user);
    if(route==='profile') return Member.profile(main,user);
    if(route==='stats'||route==='rank') return Member.stats(main,user);
    if(route==='matches') return Member.matches(main,user);
    if(route==='community') return Member.community(main,user);
    if(route==='notifications') return Member.notifications(main,user);
    if(route==='settings') return Member.settings(main,user);
  };
  Member.dashboard=async function(main,user){
    const res=await API.call('memberDashboard',{}, {method:'GET'});
    const s=res.stats||{};
    const me=res.user||user;
    const rankText=s.position?`#${s.position} in the clan`:'Not ranked yet';
    const progress=s.nextTier?`${s.toNextTier} XP to ${s.nextTier}`:'Top tier reached';
    main.innerHTML=`<section class="profile-grid"><article class="card profile-card">${avatar(me)}<span class="eyebrow">Welcome back</span><h2>${UI.escape(playerName(me))}</h2><p class="muted">${UI.escape(rankText)} · ${UI.escape(s.tier||'Unranked')}</p><div class="statline"><div><span class="muted">Score</span><strong>${s.score||0}</strong></div><div><span class="muted">Position</span><strong>${s.position?('#'+s.position):'—'}</strong></div><div><span class="muted">Next Tier</span><strong>${UI.escape(progress)}</strong></div></div></article><div class="grid"><section class="card panel"><h2>Your Numbers</h2><div class="stats-grid compact"><div class="stat-card"><span>Matches</span><strong>${s.matches||0}</strong></div><div class="stat-card"><span>Wins</span><strong>${s.wins||0}</strong></div><div class="stat-card"><span>Losses</span><strong>${s.losses||0}</strong></div><div class="stat-card"><span>Win Rate</span><strong>${s.winRate||0}%</strong></div><div class="stat-card"><span>MVPs</span><strong>${s.mvps||0}</strong></div><div class="stat-card"><span>K/D</span><strong>${s.kd||0}</strong></div></div></section><section class="card panel"><h2>Recent Point Changes</h2>${rankHistoryHtml((res.rankHistory||[]).slice(0,5))}</section></div></section>`;
  };
  Member.profile=async function(main,user){
    const res=await API.call('me',{}, {method:'GET'}); user=res.user||user;
    main.innerHTML=`<section class="profile-grid"><article class="card profile-card">${avatar(user)}<h2>${UI.escape(playerName(user))}</h2><p class="muted">${UI.escape(user.bio||'No bio yet.')}</p><p><span class="pill">Clan Role: ${UI.escape(user.role||'MEMBER')}</span></p><p><span class="pill">Tier: ${UI.escape(user.tier||'—')}</span></p></article><section class="card panel"><h2>Player Profile</h2><div class="statline"><div><span class="muted">Score</span><strong>${UI.escape(user.score||0)}</strong></div><div><span class="muted">CODM Role</span><strong>${UI.escape(user.playerRole||'—')}</strong></div><div><span class="muted">Mode</span><strong>${UI.escape(user.preferredMode||'—')}</strong></div></div><p><strong>CODM UID:</strong> ${UI.escape(user.codmUid||'—')}</p><p><strong>Country:</strong> ${UI.escape(user.country||'—')}</p><p><button class="btn primary small" type="button" onclick="SOLOS_APP.navigate('settings')">Edit profile</button></p></section></section>`;
  };
  Member.stats=async function(main){
    const res=await API.call('memberDashboard',{}, {method:'GET'}); const s=res.stats||{};
    main.innerHTML=`<section class="stats-grid"><div class="card stat-card"><span>Position</span><strong>${s.position?('#'+s.position):'—'}</strong></div><div class="card stat-card"><span>Score</span><strong>${s.score||0}</strong></div><div class="card stat-card"><span>Tier</span><strong>${UI.escape(s.tier||'—')}</strong></div><div class="card stat-card"><span>Win Rate</span><strong>${s.winRate||0}%</strong></div></section><section class="card panel" style="margin-top:16px"><h2>Ranking History</h2>${rankHistoryHtml(res.rankHistory||[])}</section>`;
  };
  Member.matches=async function(main){
    const res=await API.call('memberDashboard',{}, {method:'GET'});
    main.innerHTML=`<section class="grid two">${(res.matches||[]).map(m=>`<article class="card feature-card"><span class="eyebrow">${UI.escape(m.mode||'Scrim')}</span><h3>SOLOS十 vs ${UI.escape(m.opponent)}</h3><div class="score">${UI.escape(m.solosScore)} — ${UI.escape(m.opponentScore)}</div><p><span class="status ${String(m.result).toLowerCase()}">${UI.escape(m.result)}</span> <span class="muted">${UI.date(m.matchDate)}</span></p></article>`).join('')||UI.empty('No battles recorded yet.')}</section>`;
  };
  Member.community=function(main){
    main.innerHTML=`<section class="card panel"><h2>The Clan Room</h2><p class="muted">Talk. Share clips. Find teammates. Set up a scrim. Just don't flood the room.</p><p><a class="btn cyan small" href="${UI.escape(C.SOCIALS.whatsapp)}" target="_blank" rel="noopener">WhatsApp Community</a></p><div id="chatMount"></div></section>`;
    window.SOLOS_CHAT.mount(document.getElementById('chatMount'), false);
  };
  Member.notifications=async function(main){
    const res=await API.call('listNotifications',{}, {method:'GET'});
    main.innerHTML=`<section class="card panel"><h2>Notifications</h2>${(res.notifications||[]).map(n=>`<p><strong>${UI.escape(n.title)}</strong><br>${UI.escape(n.message)}<br><span class="muted">${UI.date(n.createdAt)}</span></p>`).join('')||UI.empty('Nothing for you yet.')}</section>`;
  };
  Member.settings=async function(main,user){
    const res=await API.call('me',{}, {method:'GET'}); user=res.user||user;
    main.innerHTML=`<section class="settings-layout member-settings"><nav class="settings-menu"><button class="active" type="button">Profile</button><button type="button">Security</button></nav><div class="card panel"><form id="memberProfileForm" class="form-grid"><h2>My Profile</h2><p class="muted">Update your public player profile. Clan role, tag, tier and score are controlled by leadership.</p><div class="field"><label>Display name</label><input name="displayName" value="${UI.escape(user.displayName||'')}"></div><div class="field"><label>Profile picture</label><input name="avatarFile" id="memberAvatarFile" type="file" accept="image/png,image/jpeg,image/webp"></div><div class="field"><label>Bio</label><textarea name="bio">${UI.escape(user.bio||'')}</textarea></div><div class="field"><label>Country</label><input name="country" value="${UI.escape(user.country||'')}"></div><div class="field"><label>CODM Role</label><select name="playerRole"><option>${UI.escape(user.playerRole||'FLEX')}</option><option>IGL</option><option>SLAYER</option><option>SMG</option><option>AR</option><option>SNIPER</option><option>FLEX</option><option>SUPPORT</option><option>BR PLAYER</option><option>MP PLAYER</option></select></div><button class="btn primary" type="submit" data-loading-text="Saving...">Save Profile</button></form><hr style="border-color:var(--line);margin:24px 0"><form id="memberPasswordForm" class="form-grid"><h2>Change Password</h2><div class="field"><label>Current password</label><input name="currentPassword" type="password" required></div><div class="field"><label>New password</label><input name="newPassword" type="password" required minlength="8"></div><div class="field"><label>Confirm new password</label><input name="confirmPassword" type="password" required minlength="8"></div><button class="btn primary" type="submit" data-loading-text="Updating password...">Change Password</button></form></div></section>`;
    UI.bindForm(document.getElementById('memberProfileForm'),async fd=>{ const body=Object.fromEntries(fd.entries()); const f=document.getElementById('memberAvatarFile')?.files?.[0]; if(f) body.avatarData=await fileToDataUrl(f); delete body.avatarFile; const out=await API.call('updateProfile',body,{write:true}); if(out.user){ window.SOLOS_APP.user=out.user; } UI.toast('Profile saved.','success'); });
    UI.bindForm(document.getElementById('memberPasswordForm'),async fd=>{ const b=Object.fromEntries(fd.entries()); if(b.newPassword!==b.confirmPassword) throw new Error('Passwords do not match.'); await API.call('changePassword',b,{write:true}); UI.toast('Password changed.','success'); document.getElementById('memberPasswordForm').reset(); });
  };
  Member.fileToDataUrl = fileToDataUrl;
  window.SOLOS_MEMBER=Member;
})();
