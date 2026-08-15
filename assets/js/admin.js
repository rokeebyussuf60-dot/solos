(function(){
  const API = window.SOLOS_API, UI = window.SOLOS_UI, C = window.SOLOS_CONFIG;
  const Admin = {};
  const CLAN_ROLES = ['CLAN_MASTER','CO_LEADER','MANAGEMENT','MEMBER'];
  const TIERS = ['T1','T2','T3','T4'];

  const esc = v => UI.escape(v ?? '');
  const n = v => Number(v || 0);
  const playerName = u => (u?.role === 'SUPER_ADMIN' || u?.isClanMember === 'NO')
    ? (u.displayName || u.username || 'Super Admin')
    : (u.clanDisplayName || `${C.CLAN_TAG} ${u.displayName || u.username || 'Player'}`);

  function avatar(u, size=''){
    const src = u?.profileImage || u?.avatarUrl || '';
    const initials = esc((u?.displayName || u?.username || '?').slice(0,2).toUpperCase());
    return src
      ? `<img class="avatar avatar-img ${size}" src="${esc(src)}" alt="${esc(playerName(u))} avatar">`
      : `<div class="avatar ${size}">${initials}</div>`;
  }
  function memberOptions(users){
    return users
      .filter(u => u.isClanMember === 'YES' && ['APPROVED','ACTIVE'].includes(u.status))
      .map(u => `<option value="${esc(u.userId)}">${esc(playerName(u))}</option>`)
      .join('');
  }
  function statusClass(v){ return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g,''); }
  function winRate(u){ return n(u.matches) ? Math.round(n(u.wins) / n(u.matches) * 100) : 0; }
  function clanRole(u){ return u.clanRole || u.role || 'MEMBER'; }
  function canSuper(user){ return user?.role === 'SUPER_ADMIN'; }
  function safeList(list){ return Array.isArray(list) ? list : []; }

  Admin.render = async function(route, main, user){
    if(route === 'dashboard') return Admin.dashboard(main,user);
    if(route === 'members') return Admin.members(main,user);
    if(route === 'content') return Admin.content(main,user);
    if(route === 'feed') return Admin.feed(main,user);
    if(route === 'ranking') return Admin.ranking(main,user);
    if(route === 'matches') return Admin.matches(main,user);
    if(route === 'news') return Admin.news(main,user);
    if(route === 'announcements') return Admin.announcements(main,user);
    if(route === 'chat') return Admin.chatModeration(main,user);
    if(route === 'reports') return Admin.reports(main,user);
    if(route === 'audit') return Admin.audit(main,user);
    if(route === 'permissions') return Admin.permissions(main,user);
    if(route === 'settings') return Admin.settings(main,user);
    main.innerHTML = UI.empty('That section is not available.');
  };

  Admin.dashboard = async function(main,user){
    const d = await API.call('adminDashboard',{}, {method:'GET'});
    const s = d.stats || {};
    const tier = d.tiers || {};
    const recentMembers = safeList(d.recentMembers).slice(0,4);
    const recentScrims = safeList(d.recentScrims).slice(0,3);
    const announcements = safeList(d.recentAnnouncements).slice(0,2);
    const topPlayers = safeList(d.topPlayers || (d.topPlayer ? [d.topPlayer] : [])).slice(0,3);
    const pending = n(s.pendingApplications);
    const title = canSuper(user) ? 'Clan Panel' : 'Leadership Panel';
    const sub = canSuper(user) ? 'Run the roster, scrims, rankings and clan content from one place.' : 'Handle the clan work your role allows.';
    main.innerHTML = `
      <section class="admin-panel-head">
        <span class="eyebrow">SOLOS十ESPORTZ</span>
        <h2>${title}</h2>
        <p>${sub}</p>
      </section>
      <section class="stats-grid admin-stat-grid">
        <div class="card stat-card"><span>Total Members</span><strong>${n(s.totalMembers)}</strong></div>
        <div class="card stat-card"><span>Active</span><strong>${n(s.activeMembers)}</strong></div>
        <div class="card stat-card ${pending ? 'needs-attention' : ''}"><span>Pending</span><strong>${pending}</strong></div>
        <div class="card stat-card"><span>Suspended</span><strong>${n(s.suspendedMembers)}</strong></div>
        <div class="card stat-card"><span>Tier 1</span><strong>${n(tier.T1)}</strong></div>
        <div class="card stat-card"><span>Tier 2</span><strong>${n(tier.T2)}</strong></div>
        <div class="card stat-card"><span>Tier 3</span><strong>${n(tier.T3)}</strong></div>
        <div class="card stat-card"><span>Management</span><strong>${n(s.leadership)}</strong></div>
      </section>
      <section class="admin-action-grid">
        <button class="card admin-action-card ${pending ? 'hot' : ''}" type="button" data-admin-jump="members">
          <span>Pending Applications</span><strong>${pending}</strong><em>${pending === 1 ? '1 player waiting' : pending + ' players waiting'}</em>
        </button>
        <button class="card admin-action-card" type="button" data-admin-jump="matches">
          <span>Recent Scrim</span><strong>${recentScrims[0] ? esc((recentScrims[0].result || 'SCRIM') + ' — ' + (recentScrims[0].solosScore ?? '0') + ':' + (recentScrims[0].opponentScore ?? '0')) : 'None yet'}</strong><em>${recentScrims[0] ? 'vs ' + esc(recentScrims[0].opponent || 'Opponent') : 'No battles recorded yet'}</em>
        </button>
        <button class="card admin-action-card" type="button" data-admin-jump="ranking">
          <span>Top Player</span><strong>${topPlayers[0] ? esc(playerName(topPlayers[0])) : 'No rank yet'}</strong><em>${topPlayers[0] ? `#1 · ${esc(topPlayers[0].score || 0)} XP` : 'The board is waiting'}</em>
        </button>
        <button class="card admin-action-card" type="button" data-admin-jump="announcements">
          <span>Recent Announcement</span><strong>${announcements[0] ? esc(announcements[0].title) : 'Nothing posted'}</strong><em>${announcements[0] ? UI.date(announcements[0].createdAt) : 'Keep the clan updated'}</em>
        </button>
      </section>
      <section class="dashboard-grid admin-dashboard-grid">
        <div class="card panel admin-list-panel"><h2>Recent Members</h2>${recentMembers.length ? recentMembers.map(u => `<div class="mini-row">${avatar(u,'small-avatar')}<div><strong>${esc(playerName(u))}</strong><span>${esc(u.status || '')} · ${esc(clanRole(u))}</span></div></div>`).join('') : UI.empty('No players on the board yet.')}</div>
        <div class="card panel admin-list-panel"><h2>Top Players</h2>${topPlayers.length ? topPlayers.map((u,i) => `<div class="mini-row"><b>#${i+1}</b><div><strong>${esc(playerName(u))}</strong><span>${esc(u.tier || 'T1')} · ${esc(u.score || 0)} XP</span></div></div>`).join('') : UI.empty('No ranked players yet.')}</div>
      </section>`;
    main.querySelectorAll('[data-admin-jump]').forEach(btn => btn.addEventListener('click', () => window.SOLOS_APP.navigate(btn.dataset.adminJump)));
  };

  Admin.content = async function(main){
    const [ann, news, matches] = await Promise.all([
      API.call('getAnnouncements',{}, {method:'GET'}).catch(()=>({announcements:[]})),
      API.call('getNews',{}, {method:'GET'}).catch(()=>({news:[]})),
      API.call('getMatches',{}, {method:'GET'}).catch(()=>({matches:[]}))
    ]);
    const announcements = safeList(ann.announcements);
    const newsRows = safeList(news.news);
    const scrims = safeList(matches.matches).filter(m => m.status !== 'CANCELLED');
    main.innerHTML = `
      <section class="admin-panel-head"><span class="eyebrow">Content</span><h2>Clan Content</h2><p>Post updates, record battles and keep the roster informed.</p></section>
      <section class="content-action-grid">
        <button class="card content-action" type="button" data-admin-jump="announcements"><strong>Announcements</strong><span>${announcements.length} posted</span><em>+ New</em></button>
        <button class="card content-action" type="button" data-admin-jump="matches"><strong>Scrims</strong><span>${scrims.length} recorded</span><em>+ New</em></button>
        <button class="card content-action" type="button" data-admin-jump="news"><strong>News</strong><span>${newsRows.length} stories</span><em>+ New</em></button>
        <button class="card content-action" type="button" data-admin-jump="feed"><strong>Clan Feed</strong><span>Recent squad activity</span><em>Open</em></button>
      </section>`;
    main.querySelectorAll('[data-admin-jump]').forEach(btn => btn.addEventListener('click', () => window.SOLOS_APP.navigate(btn.dataset.adminJump)));
  };

  Admin.feed = async function(main){
    const d = await API.call('adminDashboard',{}, {method:'GET'});
    const feed = safeList(d.feed);
    main.innerHTML = `<section class="admin-panel-head"><span class="eyebrow">Feed</span><h2>Clan Feed</h2><p>Useful updates from the roster, scrims and clan posts.</p></section><section class="card panel feed-panel">${feed.length ? feed.map(item => `<div class="feed-item"><span>${esc(item.type || 'Update')}</span><strong>${esc(item.text || '')}</strong><em>${UI.date(item.createdAt)}</em></div>`).join('') : UI.empty('Nothing moving yet.')}</section>`;
  };

  Admin.members = async function(main,user){
    const canChangeRoles = canSuper(user);
    main.innerHTML = `
      <section class="card panel admin-members-panel member-manager">
        <div class="section-row member-manager-head">
          <div><h2 id="membersTitle">Members</h2><p class="muted">Add players, update roster data and keep rankings clean.</p></div>
          <div class="member-manager-actions">
            <button class="btn cyan" id="addMemberBtn" type="button">+ Add Member</button>
            <button class="btn ghost" id="importMembersBtn" type="button">Import Members</button>
            <button class="btn ghost" id="reloadMembers" type="button" data-loading-text="Refreshing...">Refresh</button>
          </div>
        </div>
        <div class="filters admin-member-filters">
          <input id="memberSearch" placeholder="Search members...">
          <select id="memberStatus"><option value="">All statuses</option><option>ACTIVE</option><option>APPROVED</option><option>PENDING</option><option>SUSPENDED</option><option>INACTIVE</option></select>
          <select id="memberRole"><option value="">All roles</option><option>MEMBER</option><option>MANAGEMENT</option><option>CO_LEADER</option><option>CLAN_MASTER</option></select>
        </div>
        <div class="admin-member-cards" id="memberCards"></div>
        <div class="table-wrap admin-member-table"><table class="data-table" id="membersTable"><thead><tr><th>Player</th><th>CODM UID</th><th>Clan Role</th><th>Tier</th><th>Points</th><th>K/D</th><th>Status</th><th>Actions</th></tr></thead><tbody><tr><td colspan="8">Loading...</td></tr></tbody></table></div>
      </section>
      <div class="admin-modal" id="memberFormModal" aria-hidden="true">
        <div class="admin-modal-card member-form-card">
          <div class="modal-head"><div><span class="eyebrow">Roster</span><h2 id="memberFormTitle">Add Member</h2></div><button type="button" class="btn ghost small" data-close-member-form>Close</button></div>
          <form id="memberForm" class="member-form-grid">
            <input type="hidden" name="userId" id="memberUserId">
            <label>Username / IGN<input name="username" id="memberUsername" required autocomplete="off"></label>
            <label>CODM UID<input name="codmUid" id="memberCodmUid" autocomplete="off"></label>
            <label>Profile Picture<input name="profilePictureFile" id="memberImageFile" type="file" accept="image/jpeg,image/png,image/webp"></label>
            <div class="member-image-preview"><div class="avatar large-avatar" id="memberImagePreview">S²</div><small>JPG, PNG or WebP. Keep it clean.</small></div>
            <label>Clan Role<select name="role" id="memberClanRole"><option>MEMBER</option><option>MANAGEMENT</option><option>CO_LEADER</option><option>CLAN_MASTER</option></select></label>
            <label>Competitive Tier<select name="tier" id="memberTier"><option>T1</option><option>T2</option><option>T3</option><option>T4</option></select></label>
            <label>Status<select name="status" id="memberStatusInput"><option>ACTIVE</option><option>SUSPENDED</option><option>INACTIVE</option><option>PENDING</option></select></label>
            <label>Kills<input name="kills" id="memberKills" type="number" min="0" value="0"></label>
            <label>Deaths<input name="deaths" id="memberDeaths" type="number" min="0" value="0"></label>
            <label>Wins<input name="wins" id="memberWins" type="number" min="0" value="0"></label>
            <label>Losses<input name="losses" id="memberLosses" type="number" min="0" value="0"></label>
            <label>Points<input name="points" id="memberPoints" type="number" min="0" value="0"></label>
            <label>MVPs<input name="mvps" id="memberMvps" type="number" min="0" value="0"></label>
            <label>Scrim Wins<input name="scrimWins" id="memberScrimWins" type="number" min="0" value="0"></label>
            <label>Tournament Wins<input name="tournamentWins" id="memberTournamentWins" type="number" min="0" value="0"></label>
            <label>Activity<select name="activity" id="memberActivity"><option>ACTIVE</option><option>LOW</option><option>INACTIVE</option></select></label>
            <label>Join Date<input name="joinDate" id="memberJoinDate" type="date"></label>
            <label class="wide">Bio / Notes<textarea name="bio" id="memberBio" rows="3"></textarea></label>
            <div class="wide form-actions"><button class="btn primary" type="submit" data-loading-text="Saving...">Save Member</button></div>
          </form>
        </div>
      </div>
      <div class="admin-modal" id="importMembersModal" aria-hidden="true">
        <div class="admin-modal-card import-card">
          <div class="modal-head"><div><span class="eyebrow">Bulk Roster</span><h2>Import Members</h2></div><button type="button" class="btn ghost small" data-close-import>Close</button></div>
          <p class="muted">CSV columns: username,codmUid,role,tier,status,kills,deaths,wins,losses,points,mvps,scrimWins,tournamentWins,activity</p>
          <input id="membersCsvFile" type="file" accept=".csv,text/csv">
          <label class="import-update-toggle"><input id="updateExistingMembers" type="checkbox"> Update existing members with matching CODM UID</label>
          <div id="importSummary" class="import-summary empty">Choose a CSV file to preview.</div>
          <div class="table-wrap import-preview-wrap"><table class="data-table" id="importPreview"><thead><tr><th>Row</th><th>Username</th><th>CODM UID</th><th>Status</th><th>Issues</th></tr></thead><tbody></tbody></table></div>
          <div class="form-actions"><button class="btn primary" id="confirmImportMembers" type="button" disabled data-loading-text="Importing...">Confirm Import</button></div>
        </div>
      </div>`;

    let currentUsers = [];
    let importRows = [];
    let imageData = '';
    let lastImportFile = null;

    const getVal = id => document.getElementById(id)?.value || '';
    const setVal = (id,v) => { const el=document.getElementById(id); if(el) el.value = v ?? ''; };
    const modal = document.getElementById('memberFormModal');
    const importModal = document.getElementById('importMembersModal');
    const openModal = el => { el?.classList.add('open'); el?.setAttribute('aria-hidden','false'); };
    const closeModal = el => { el?.classList.remove('open'); el?.setAttribute('aria-hidden','true'); };
    const kd = u => n(u.deaths) ? (n(u.kills)/n(u.deaths)).toFixed(2) : (n(u.kills) ? n(u.kills).toFixed(2) : '0.00');

    function normalizeStatus(s){ return String(s || '').toUpperCase() === 'APPROVED' ? 'ACTIVE' : String(s || 'ACTIVE').toUpperCase(); }
    function fillForm(u={}){
      document.getElementById('memberFormTitle').textContent = u.userId ? 'Edit Member' : 'Add Member';
      setVal('memberUserId', u.userId || '');
      setVal('memberUsername', u.username || u.displayName || '');
      setVal('memberCodmUid', u.codmUid || '');
      setVal('memberClanRole', clanRole(u) || 'MEMBER');
      setVal('memberTier', u.tier || 'T1');
      setVal('memberStatusInput', normalizeStatus(u.status || 'ACTIVE'));
      setVal('memberKills', u.kills || 0);
      setVal('memberDeaths', u.deaths || 0);
      setVal('memberWins', u.wins || 0);
      setVal('memberLosses', u.losses || 0);
      setVal('memberPoints', u.score || u.points || 0);
      setVal('memberMvps', u.mvps || 0);
      setVal('memberScrimWins', u.scrimWins || 0);
      setVal('memberTournamentWins', u.tournamentWins || 0);
      setVal('memberActivity', u.activity || 'ACTIVE');
      setVal('memberJoinDate', (u.joinDate || u.createdAt || '').slice(0,10));
      setVal('memberBio', u.bio || u.notes || '');
      imageData = u.profileImage || u.avatarUrl || '';
      const preview = document.getElementById('memberImagePreview');
      if(preview){
        preview.outerHTML = imageData ? `<img class="avatar avatar-img large-avatar" id="memberImagePreview" src="${esc(imageData)}" alt="Profile preview">` : `<div class="avatar large-avatar" id="memberImagePreview">${esc((u.displayName || u.username || 'S²').slice(0,2).toUpperCase())}</div>`;
      }
      if(!canChangeRoles) document.getElementById('memberClanRole')?.setAttribute('disabled','disabled');
      else document.getElementById('memberClanRole')?.removeAttribute('disabled');
    }
    function actionButtons(u){
      const active = ['APPROVED','ACTIVE'].includes(String(u.status).toUpperCase());
      return `<div class="actions admin-card-actions"><button class="btn small cyan" data-edit-member="${esc(u.userId)}" type="button">Edit</button>${active ? `<button class="btn small danger" data-suspend="${esc(u.userId)}" type="button" data-loading-text="Suspending...">Suspend</button>` : `<button class="btn small ghost" data-reactivate="${esc(u.userId)}" type="button" data-loading-text="Reactivating...">Reactivate</button>`}</div>`;
    }
    function memberCard(u, rank){
      return `<details class="admin-member-card"><summary><div class="member-summary-left">${avatar(u,'small-avatar')}<div><strong>${esc(playerName(u))}</strong><span>${esc(normalizeStatus(u.status))} · ${esc(clanRole(u))}</span></div></div><span class="chev">⌄</span></summary><div class="member-detail-grid"><div>${avatar(u,'large-avatar')}</div><dl><dt>Username</dt><dd>${esc(u.username || '—')}</dd><dt>CODM UID</dt><dd>${esc(u.codmUid || '—')}</dd><dt>Clan role</dt><dd>${esc(clanRole(u))}</dd><dt>Tier</dt><dd>${esc(u.tier || 'T1')}</dd><dt>Points</dt><dd>${esc(u.score || 0)} XP</dd><dt>Rank</dt><dd>${rank ? '#' + rank : '—'}</dd><dt>Kills</dt><dd>${esc(u.kills || 0)}</dd><dt>Deaths</dt><dd>${esc(u.deaths || 0)}</dd><dt>K/D</dt><dd>${kd(u)}</dd><dt>Wins</dt><dd>${esc(u.wins || 0)}</dd><dt>Losses</dt><dd>${esc(u.losses || 0)}</dd><dt>Win rate</dt><dd>${winRate(u)}%</dd><dt>MVPs</dt><dd>${esc(u.mvps || 0)}</dd><dt>Scrim W</dt><dd>${esc(u.scrimWins || 0)}</dd><dt>Tourn W</dt><dd>${esc(u.tournamentWins || 0)}</dd><dt>Activity</dt><dd>${esc(u.activity || '—')}</dd><dt>Joined</dt><dd>${UI.date(u.joinDate || u.createdAt)}</dd></dl></div>${actionButtons(u)}</details>`;
    }
    async function load(){
      const res = await API.call('listUsers',{}, {method:'GET'});
      const q = (document.getElementById('memberSearch')?.value || '').toLowerCase();
      const st = document.getElementById('memberStatus')?.value || '';
      const role = document.getElementById('memberRole')?.value || '';
      currentUsers = safeList(res.users).filter(u => u.role !== 'SUPER_ADMIN' && u.isClanMember === 'YES');
      const ranked = [...currentUsers].sort((a,b) => n(b.score)-n(a.score)).map((u,i) => [u.userId, i+1]);
      const rankMap = Object.fromEntries(ranked);
      const rows = currentUsers.filter(u => (!st || normalizeStatus(u.status) === st || u.status === st) && (!role || clanRole(u) === role || u.role === role) && (!q || `${u.username} ${u.displayName} ${u.email} ${u.clanDisplayName} ${u.codmUid}`.toLowerCase().includes(q)));
      const title = document.getElementById('membersTitle'); if(title) title.textContent = `Members (${rows.length})`;
      const tbody = document.querySelector('#membersTable tbody');
      tbody.innerHTML = rows.map(u => `<tr><td>${avatar(u,'small-avatar')} <strong>${esc(playerName(u))}</strong><br><span class="muted">${esc(u.username || '')}</span></td><td>${esc(u.codmUid || '—')}</td><td>${esc(clanRole(u))}</td><td>${esc(u.tier || 'T1')}</td><td>${esc(u.score || 0)}</td><td>${kd(u)}</td><td><span class="status ${statusClass(u.status)}">${esc(normalizeStatus(u.status))}</span></td><td>${actionButtons(u)}</td></tr>`).join('') || '<tr><td colspan="8">No players on the board yet.</td></tr>';
      document.getElementById('memberCards').innerHTML = rows.map(u => memberCard(u, rankMap[u.userId])).join('') || UI.empty('No players on the board yet.');
      UI.tableCellLabels(document.getElementById('membersTable'));
      bindActions();
    }
    function bindActions(){
      document.querySelectorAll('[data-edit-member]').forEach(b => UI.bindButton(b, async () => { const u=currentUsers.find(x=>x.userId===b.dataset.editMember); fillForm(u || {}); openModal(modal); }));
      document.querySelectorAll('[data-suspend]').forEach(b => UI.bindButton(b, async () => { if(!confirm('Suspend this member?')) return; await API.call('suspendUser',{userId:b.dataset.suspend},{write:true}); UI.toast('Member suspended.','success'); await load(); }));
      document.querySelectorAll('[data-reactivate]').forEach(b => UI.bindButton(b, async () => { await API.call('reactivateUser',{userId:b.dataset.reactivate},{write:true}); UI.toast('Member reactivated.','success'); await load(); }));
    }
    function formPayload(fd){
      return {
        userId: getVal('memberUserId'), username: getVal('memberUsername'), displayName: getVal('memberUsername'), codmUid: getVal('memberCodmUid'), profileImage: imageData,
        role: getVal('memberClanRole'), tier: getVal('memberTier'), status: getVal('memberStatusInput'), kills:getVal('memberKills'), deaths:getVal('memberDeaths'), wins:getVal('memberWins'), losses:getVal('memberLosses'), points:getVal('memberPoints'), mvps:getVal('memberMvps'), scrimWins:getVal('memberScrimWins'), tournamentWins:getVal('memberTournamentWins'), activity:getVal('memberActivity'), joinDate:getVal('memberJoinDate'), bio:getVal('memberBio'), notes:getVal('memberBio')
      };
    }
    function parseCsv(text){
      const rows=[]; let cur='', row=[], quote=false;
      for(let i=0;i<text.length;i++){ const ch=text[i], next=text[i+1]; if(ch==='"' && quote && next==='"'){ cur+='"'; i++; } else if(ch==='"'){ quote=!quote; } else if(ch===',' && !quote){ row.push(cur.trim()); cur=''; } else if((ch==='\n' || ch==='\r') && !quote){ if(cur || row.length){ row.push(cur.trim()); rows.push(row); row=[]; cur=''; } if(ch==='\r' && next==='\n') i++; } else cur+=ch; }
      if(cur || row.length){ row.push(cur.trim()); rows.push(row); }
      return rows.filter(r=>r.some(Boolean));
    }
    function previewImport(file){
      const reader=new FileReader();
      reader.onload=()=>{
        const rows=parseCsv(reader.result || ''); const headers=(rows.shift() || []).map(h=>h.trim().toLowerCase());
        const get=(row,name)=>{ const i=headers.indexOf(name.toLowerCase()); return i>=0 ? row[i] : ''; };
        const seen=new Set(); importRows=[]; let valid=0, invalid=0, dup=0;
        const tbody=document.querySelector('#importPreview tbody');
        const html=rows.map((row,idx)=>{ const item={username:get(row,'username'), codmUid:get(row,'codmuid'), role:get(row,'role')||'MEMBER', tier:get(row,'tier')||'T1', status:get(row,'status')||'ACTIVE', kills:get(row,'kills')||0, deaths:get(row,'deaths')||0, wins:get(row,'wins')||0, losses:get(row,'losses')||0, points:get(row,'points')||0, mvps:get(row,'mvps')||0, scrimWins:get(row,'scrimwins')||0, tournamentWins:get(row,'tournamentwins')||0, activity:get(row,'activity')||'ACTIVE'};
          const issues=[]; if(!item.username) issues.push('Username required'); if(!item.codmUid) issues.push('CODM UID required'); const key=String(item.codmUid || item.username).toLowerCase(); if(seen.has(key)){ issues.push('Duplicate in file'); dup++; } seen.add(key); const exists=currentUsers.some(u => String(u.codmUid||'').toLowerCase()===String(item.codmUid||'').toLowerCase() || String(u.username||'').toLowerCase()===String(item.username||'').toLowerCase()); const updateExisting=document.getElementById('updateExistingMembers')?.checked; if(exists){ dup++; if(updateExisting) issues.push('Will update existing member'); else issues.push('Member already exists'); }
          const ok=!issues.some(x => x !== 'Will update existing member'); if(ok){ valid++; importRows.push(item); } else invalid++;
          return `<tr class="${ok?'':'invalid-row'}"><td>${idx+2}</td><td>${esc(item.username)}</td><td>${esc(item.codmUid)}</td><td>${ok?'Valid':'Check'}</td><td>${esc(issues.join('; ') || 'Ready')}</td></tr>`; }).join('');
        tbody.innerHTML=html || '<tr><td colspan="5">No rows found.</td></tr>';
        document.getElementById('importSummary').className='import-summary';
        document.getElementById('importSummary').textContent=`Valid rows: ${valid} · Invalid rows: ${invalid} · Duplicates: ${dup}`;
        document.getElementById('confirmImportMembers').disabled=!valid;
      };
      reader.readAsText(file);
    }
    document.querySelectorAll('[data-close-member-form]').forEach(b=>b.addEventListener('click',()=>closeModal(modal)));
    document.querySelectorAll('[data-close-import]').forEach(b=>b.addEventListener('click',()=>closeModal(importModal)));
    modal?.addEventListener('click',e=>{ if(e.target===modal) closeModal(modal); });
    importModal?.addEventListener('click',e=>{ if(e.target===importModal) closeModal(importModal); });
    document.getElementById('addMemberBtn')?.addEventListener('click',()=>{ fillForm({status:'ACTIVE',role:'MEMBER',tier:'T1'}); openModal(modal); });
    document.getElementById('importMembersBtn')?.addEventListener('click',()=>{ importRows=[]; document.getElementById('membersCsvFile').value=''; lastImportFile=null; document.querySelector('#importPreview tbody').innerHTML=''; document.getElementById('importSummary').textContent='Choose a CSV file to preview.'; document.getElementById('confirmImportMembers').disabled=true; openModal(importModal); });
    document.getElementById('memberImageFile')?.addEventListener('change',e=>{ const file=e.target.files?.[0]; if(!file) return; if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){ UI.toast('Use JPG, PNG or WebP.','error'); e.target.value=''; return; } if(file.size > 650000){ UI.toast('Image is too large. Use a smaller file.','error'); e.target.value=''; return; } const reader=new FileReader(); reader.onload=()=>{ imageData=reader.result; const preview=document.getElementById('memberImagePreview'); if(preview) preview.outerHTML=`<img class="avatar avatar-img large-avatar" id="memberImagePreview" src="${esc(imageData)}" alt="Profile preview">`; }; reader.readAsDataURL(file); });
    UI.bindForm(document.getElementById('memberForm'), async () => { const payload=formPayload(); const action=payload.userId ? 'updateMember' : 'addMember'; const res=await API.call(action,payload,{write:true}); UI.toast(res.message || (payload.userId ? 'Member saved.' : 'Member added.'),'success'); closeModal(modal); await load(); });
    document.getElementById('membersCsvFile')?.addEventListener('change',e=>{ const f=e.target.files?.[0]; if(f){ lastImportFile=f; previewImport(f); } });
    document.getElementById('updateExistingMembers')?.addEventListener('change',()=>{ if(lastImportFile) previewImport(lastImportFile); });
    UI.bindButton(document.getElementById('confirmImportMembers'), async () => { const res=await API.call('importMembers',{members:JSON.stringify(importRows), updateExisting:document.getElementById('updateExistingMembers')?.checked ? 'YES' : 'NO'},{write:true, timeout:45000}); UI.toast(res.message || 'Members imported.','success'); closeModal(importModal); await load(); });
    ['memberSearch','memberStatus','memberRole'].forEach(id => document.getElementById(id)?.addEventListener('input', load));
    document.getElementById('memberStatus')?.addEventListener('change', load);
    document.getElementById('memberRole')?.addEventListener('change', load);
    UI.bindButton(document.getElementById('reloadMembers'), () => load());
    await load();
  };

  
Admin.ranking = async function(main){
    const res = await API.call('listUsers',{}, {method:'GET'});
    const users = safeList(res.users).filter(u => u.role !== 'SUPER_ADMIN' && u.isClanMember === 'YES');
    main.innerHTML = `<section class="grid two"><form class="card panel form-grid" id="rankForm"><h2>Adjust Player XP</h2><div class="field"><label>Player</label><select name="userId" required>${memberOptions(users)}</select></div><div class="field"><label>XP change</label><input name="delta" type="number" required placeholder="25 or -10"></div><div class="field"><label>Reason</label><input name="reason" required maxlength="160" placeholder="Scrim correction, bonus, penalty..."></div><button class="btn primary" type="submit" data-loading-text="Updating...">Apply XP</button></form><form class="card panel form-grid" id="setRankForm"><h2>Set Exact Rank</h2><div class="field"><label>Player</label><select name="userId" required>${memberOptions(users)}</select></div><div class="field"><label>Exact score</label><input name="score" type="number" min="0" required></div><div class="field"><label>Tier</label><select name="tier"><option value="">Auto from score</option>${TIERS.map(t => `<option>${t}</option>`).join('')}</select></div><div class="field"><label>Reason</label><input name="reason" required maxlength="160"></div><button class="btn primary" type="submit" data-loading-text="Saving...">Save Exact Rank</button></form></section><section class="card panel" style="margin-top:16px"><h2>Score History</h2><div id="rankHistory">Loading...</div></section>`;
    UI.bindForm(document.getElementById('rankForm'), async fd => { await API.call('updateRanking',Object.fromEntries(fd.entries()),{write:true}); UI.toast('XP updated.','success'); await Admin.ranking(main); });
    UI.bindForm(document.getElementById('setRankForm'), async fd => { await API.call('setCompetitiveProfile',Object.fromEntries(fd.entries()),{write:true}); UI.toast('Ranking saved.','success'); await Admin.ranking(main); });
    const h = await API.call('rankingHistory',{}, {method:'GET'});
    document.getElementById('rankHistory').innerHTML = safeList(h.history).slice(0,40).map(x => `<p><strong>${esc(x.playerName || 'Player')}</strong> ${esc(x.delta)} XP<br><span class="muted">${esc(x.previousTier || '—')} → ${esc(x.newTier || '—')} · ${esc(x.reason)} · ${UI.date(x.createdAt)}</span></p>`).join('') || UI.empty('No XP changes yet.');
  };

  Admin.matches = async function(main){
    const users = safeList((await API.call('listUsers',{}, {method:'GET'})).users);
    const options = memberOptions(users);
    main.innerHTML = `<section class="grid two"><form class="card panel form-grid" id="scrimForm"><h2>Add Scrim Result</h2><input type="hidden" name="matchId" id="matchId"><div class="field"><label>Opponent</label><input name="opponent" required></div><div class="grid two"><div class="field"><label>Our score</label><input name="solosScore" type="number" min="0" required></div><div class="field"><label>Opponent score</label><input name="opponentScore" type="number" min="0" required></div></div><div class="grid two"><div class="field"><label>Date</label><input name="matchDate" type="date"></div><div class="field"><label>Time</label><input name="matchTime" type="time"></div></div><div class="grid two"><div class="field"><label>Game mode</label><select name="mode"><option>MP</option><option>BR</option><option>Scrim</option><option>Tournament</option></select></div><div class="field"><label>Map</label><input name="map" placeholder="Standoff, Firing Range..."></div></div><div class="field"><label>Participating players</label><select name="participantIds" multiple size="7" required>${options}</select><small class="muted">Hold Ctrl on Windows to pick more than one player.</small></div><div class="field"><label>MVP</label><select name="mvpUserId"><option value="">No MVP</option>${options}</select></div><div class="grid two"><div class="field"><label>Custom bonus per player</label><input name="customBonus" type="number" value="0"></div><div class="field"><label>Screenshot URL</label><input name="screenshotUrl" type="url"></div></div><div class="field"><label>Notes</label><textarea name="notes" placeholder="What happened in the lobby?"></textarea></div><button class="btn primary" type="submit" data-loading-text="Saving scrim...">Save Scrim Result</button><button class="btn ghost" type="button" id="clearScrimForm">Clear</button></form><section class="card panel"><h2>Scoring</h2><p class="muted">Save the scrim and the points update automatically.</p><div id="scoringBox" class="statline"><div><span class="muted">Win</span><strong>30</strong></div><div><span class="muted">Participation</span><strong>10</strong></div><div><span class="muted">MVP</span><strong>10</strong></div></div></section></section><section class="card panel" style="margin-top:16px"><h2>Scrim Results</h2><div class="table-wrap"><table class="data-table" id="matchesTable"><thead><tr><th>Date</th><th>Opponent</th><th>Score</th><th>Result</th><th>MVP</th><th>Actions</th></tr></thead><tbody><tr><td colspan="6">Loading...</td></tr></tbody></table></div></section>`;
    const form = document.getElementById('scrimForm');
    document.getElementById('clearScrimForm')?.addEventListener('click', () => { form.reset(); form.matchId.value = ''; });
    UI.bindForm(form, async fd => { const body = Object.fromEntries(fd.entries()); body.participantIds = [...form.elements['participantIds'].selectedOptions].map(o => o.value).join(','); const action = body.matchId ? 'updateMatch' : 'createMatch'; await API.call(action,body,{write:true}); UI.toast(body.matchId ? 'Scrim updated.' : 'Scrim saved.','success'); await Admin.matches(main); });
    const matches = safeList((await API.call('getMatches',{}, {method:'GET'})).matches);
    const tbody = document.querySelector('#matchesTable tbody');
    tbody.innerHTML = matches.map(m => `<tr><td>${UI.date(m.matchDate)}</td><td>${esc(m.opponent)}</td><td>${esc(m.solosScore)} — ${esc(m.opponentScore)}</td><td><span class="status ${statusClass(m.result)}">${esc(m.result)}</span></td><td>${esc(m.mvpName || '—')}</td><td><div class="actions"><button class="btn small ghost" type="button" data-edit-match="${esc(m.matchId)}">Edit</button><button class="btn small danger" type="button" data-delete-match="${esc(m.matchId)}" data-loading-text="Cancelling...">Cancel</button></div></td></tr>`).join('') || '<tr><td colspan="6">No battles recorded yet.</td></tr>';
    UI.tableCellLabels(document.getElementById('matchesTable'));
    document.querySelectorAll('[data-edit-match]').forEach(b => b.addEventListener('click', () => { const m = matches.find(x => x.matchId === b.dataset.editMatch); if(!m) return; form.matchId.value=m.matchId||''; form.opponent.value=m.opponent||''; form.solosScore.value=m.solosScore||0; form.opponentScore.value=m.opponentScore||0; form.matchDate.value=(m.matchDate||'').slice(0,10); form.matchTime.value=m.matchTime||''; form.mode.value=m.mode||'MP'; form.map.value=m.map||''; form.mvpUserId.value=m.mvpUserId||''; form.customBonus.value=0; form.screenshotUrl.value=m.screenshotUrl||''; form.notes.value=m.notes||''; const ids=String(m.participantIds||'').split(','); [...form.elements['participantIds'].options].forEach(o => o.selected = ids.includes(o.value)); form.scrollIntoView({behavior:'smooth',block:'start'}); }));
    document.querySelectorAll('[data-delete-match]').forEach(b => UI.bindButton(b, async () => { if(!confirm('Cancel this scrim and reverse its points?')) return; await API.call('deleteMatch',{matchId:b.dataset.deleteMatch},{write:true}); UI.toast('Scrim cancelled.','success'); await Admin.matches(main); }));
  };

  Admin.news = async function(main){
    main.innerHTML = `<section class="card panel"><form id="newsForm" class="form-grid"><h2>Clan News</h2><input type="hidden" name="newsId"><div class="field"><label>Title</label><input name="title" required></div><div class="field"><label>Category</label><input name="category" value="News"></div><div class="field"><label>Excerpt</label><input name="excerpt"></div><div class="field"><label>Cover image URL</label><input name="coverImageUrl" type="url"></div><div class="field"><label>Content</label><textarea name="content" required></textarea></div><button class="btn primary" type="submit" data-loading-text="Saving...">Save News</button><button class="btn ghost" id="clearNewsForm" type="button">Clear</button></form><div id="newsList" style="margin-top:20px"></div></section>`;
    const form = document.getElementById('newsForm');
    UI.bindForm(form, async fd => { const data = Object.fromEntries(fd.entries()); await API.call(data.newsId ? 'updateNews' : 'createNews', data, {write:true}); UI.toast('News saved.','success'); await Admin.news(main); });
    document.getElementById('clearNewsForm')?.addEventListener('click', () => form.reset());
    const rows = safeList((await API.call('getNews',{}, {method:'GET'})).news);
    document.getElementById('newsList').innerHTML = rows.map(x => `<p><strong>${esc(x.title)}</strong><br><span class="muted">${UI.date(x.createdAt)}</span><br>${esc(x.excerpt || '')}<br><button class="btn small ghost" type="button" data-edit-news="${esc(x.newsId)}">Edit</button> <button class="btn small danger" type="button" data-delete-news="${esc(x.newsId)}" data-loading-text="Deleting...">Delete</button></p>`).join('') || UI.empty('Nothing new yet.');
    document.querySelectorAll('[data-edit-news]').forEach(b => b.addEventListener('click', () => { const x = rows.find(r => r.newsId === b.dataset.editNews); if(!x) return; form.newsId.value=x.newsId||''; form.title.value=x.title||''; form.category.value=x.category||''; form.excerpt.value=x.excerpt||''; form.coverImageUrl.value=x.coverImageUrl||''; form.content.value=x.content||''; form.scrollIntoView({behavior:'smooth',block:'start'}); }));
    document.querySelectorAll('[data-delete-news]').forEach(b => UI.bindButton(b, async () => { if(!confirm('Delete this news item?')) return; await API.call('deleteNews',{newsId:b.dataset.deleteNews},{write:true}); UI.toast('News deleted.','success'); await Admin.news(main); }));
  };

  Admin.announcements = async function(main){
    main.innerHTML = `<section class="card panel"><form id="announceForm" class="form-grid"><h2>Announcements</h2><input type="hidden" name="announcementId"><div class="field"><label>Title</label><input name="title" required></div><div class="field"><label>Message</label><textarea name="message" required></textarea></div><button class="btn primary" type="submit" data-loading-text="Posting...">Save Announcement</button><button class="btn ghost" id="clearAnnouncementForm" type="button">Clear</button></form><div id="announcementsList" style="margin-top:20px"></div></section>`;
    const form = document.getElementById('announceForm');
    UI.bindForm(form, async fd => { const data = Object.fromEntries(fd.entries()); await API.call(data.announcementId ? 'updateAnnouncement' : 'createAnnouncement', data, {write:true}); UI.toast('Announcement saved.','success'); await Admin.announcements(main); });
    document.getElementById('clearAnnouncementForm')?.addEventListener('click', () => form.reset());
    const rows = safeList((await API.call('getAnnouncements',{}, {method:'GET'})).announcements);
    document.getElementById('announcementsList').innerHTML = rows.map(x => `<p><strong>${esc(x.title)}</strong><br><span class="muted">${UI.date(x.createdAt)}</span><br>${esc(x.message)}<br><button class="btn small ghost" type="button" data-edit-announcement="${esc(x.announcementId)}">Edit</button> <button class="btn small danger" type="button" data-delete-announcement="${esc(x.announcementId)}" data-loading-text="Deleting...">Delete</button></p>`).join('') || UI.empty('No announcements yet.');
    document.querySelectorAll('[data-edit-announcement]').forEach(b => b.addEventListener('click', () => { const x = rows.find(r => r.announcementId === b.dataset.editAnnouncement); if(!x) return; form.announcementId.value=x.announcementId||''; form.title.value=x.title||''; form.message.value=x.message||''; form.scrollIntoView({behavior:'smooth',block:'start'}); }));
    document.querySelectorAll('[data-delete-announcement]').forEach(b => UI.bindButton(b, async () => { if(!confirm('Delete this announcement?')) return; await API.call('deleteAnnouncement',{announcementId:b.dataset.deleteAnnouncement},{write:true}); UI.toast('Announcement deleted.','success'); await Admin.announcements(main); }));
  };

  Admin.chatModeration = async function(main){ main.innerHTML = '<section class="card panel"><h2>Chat Moderation</h2><div id="chatMount"></div></section>'; window.SOLOS_CHAT.mount(document.getElementById('chatMount'), true); };
  Admin.reports = async function(main){ const d = await API.call('adminDashboard',{}, {method:'GET'}); const s=d.stats||{}; main.innerHTML = `<section class="admin-panel-head"><span class="eyebrow">Reports</span><h2>Clan Numbers</h2><p>Current roster and scrim summary.</p></section><section class="stats-grid admin-stat-grid"><div class="card stat-card"><span>Members</span><strong>${n(s.totalMembers)}</strong></div><div class="card stat-card"><span>Wins</span><strong>${n(s.wins)}</strong></div><div class="card stat-card"><span>Losses</span><strong>${n(s.losses)}</strong></div><div class="card stat-card"><span>Win Rate</span><strong>${n(s.winRate)}%</strong></div></section>`; };
  Admin.audit = async function(main,user){ if(user.role !== 'SUPER_ADMIN'){ main.innerHTML = UI.empty('Only the Super Admin can open the audit log.'); return; } const res = await API.call('auditLogs',{}, {method:'GET'}); main.innerHTML = `<section class="card panel"><h2>Audit Log</h2>${safeList(res.logs).map(x => `<p><strong>${esc(x.action)}</strong> <span class="muted">${UI.date(x.createdAt)}</span><br>${esc(x.actorName || 'System')} → ${esc(x.targetName || x.targetId || '')}<br><span class="muted">${esc(x.details || '')}</span></p>`).join('') || UI.empty('No audit records yet.')}</section>`; };
  Admin.permissions = async function(main,user){
    if(user.role !== 'SUPER_ADMIN'){ main.innerHTML = UI.empty('Only the Super Admin can manage permissions.'); return; }
    const res = await API.call('getPermissions',{}, {method:'GET'});
    const editable = safeList(res.permissions).filter(p => !['SUPER_ADMIN','MEMBER'].includes(p.role));
    main.innerHTML = `<section class="card panel"><h2>Leadership Permissions</h2><p class="muted">Give leadership only the control they need.</p><div class="grid two">${editable.map(p => `<form class="card form-grid permission-form" data-role="${esc(p.role)}"><h3>${esc(p.role)}</h3><label><input type="checkbox" name="canManageMembers" ${String(p.canManageMembers).toLowerCase()==='true'?'checked':''}> Manage members</label><label><input type="checkbox" name="canManageRanking" ${String(p.canManageRanking).toLowerCase()==='true'?'checked':''}> Manage ranking</label><label><input type="checkbox" name="canManageMatches" ${String(p.canManageMatches).toLowerCase()==='true'?'checked':''}> Manage scrims</label><label><input type="checkbox" name="canManageNews" ${String(p.canManageNews).toLowerCase()==='true'?'checked':''}> Manage news</label><label><input type="checkbox" name="canModerateChat" ${String(p.canModerateChat).toLowerCase()==='true'?'checked':''}> Moderate chat</label><button class="btn primary" type="submit" data-loading-text="Saving...">Save</button></form>`).join('')}</div></section>`;
    document.querySelectorAll('.permission-form').forEach(form => UI.bindForm(form, async fd => { const body=Object.fromEntries(fd.entries()); body.role=form.dataset.role; ['canManageMembers','canManageRanking','canManageMatches','canManageNews','canModerateChat','canManagePermissions'].forEach(k => body[k] = body[k] ? 'true' : 'false'); await API.call('updatePermissions',body,{write:true}); UI.toast('Permissions saved.','success'); }));
  };
  Admin.settings = async function(main,user){
    let settings={};
    try{ settings=(await API.call('getSettings',{}, {method:'GET'})).settings || {}; }catch(err){ settings={}; }
    let socials=settings.socials || C.SOCIALS || {};
    if(typeof socials === 'string'){
      try{ socials=JSON.parse(socials || '{}'); }catch(err){ socials={}; }
    }
    C.SOCIALS={...(C.SOCIALS||{}), ...socials};
    const canEditClan = user.role === 'SUPER_ADMIN';
    const safeSocial = key => esc((socials && socials[key]) || '');
    const clanName = esc(settings.clanName || C.APP_NAME || 'SOLOS十ESPORTZ');
    const clanTag = esc(settings.clanTag || C.CLAN_TAG || 'S²十');
    const game = esc(settings.game || 'Call of Duty: Mobile');
    const tiers = esc(settings.tierThresholdsJson || settings.tier_thresholds_json || '{"T1":0,"T2":500,"T3":1000,"T4":1500}');
    const scoring = esc(settings.scoringJson || settings.scoring_json || '{"WIN":30,"DRAW":15,"LOSS":5,"PARTICIPATION":10,"MVP":10}');
    const superOnly = canEditClan ? `
      <section class="settings-block">
        <h2>Community Links</h2>
        <p class="muted">Keep the official clan links in one place.</p>
        <form id="communityLinksForm" class="form-grid">
          <div class="field"><label>WhatsApp Community</label><input name="whatsappUrl" type="url" inputmode="url" placeholder="https://chat.whatsapp.com/..." value="${safeSocial('whatsapp')}"></div>
          <div class="field"><label>TikTok</label><input name="tiktokUrl" type="url" inputmode="url" placeholder="https://www.tiktok.com/@solosesportz" value="${safeSocial('tiktok')}"></div>
          <div class="field"><label>Instagram</label><input name="instagramUrl" type="url" inputmode="url" placeholder="https://www.instagram.com/..." value="${safeSocial('instagram')}"></div>
          <div class="field"><label>Discord</label><input name="discordUrl" type="url" inputmode="url" placeholder="https://discord.gg/..." value="${safeSocial('discord')}"></div>
          <div class="field"><label>YouTube</label><input name="youtubeUrl" type="url" inputmode="url" placeholder="https://www.youtube.com/..." value="${safeSocial('youtube')}"></div>
          <button class="btn primary" type="submit" data-loading-text="Saving links...">Save Links</button>
        </form>
      </section>
      <section class="settings-block">
        <h2>Clan Information</h2>
        <form id="clanSettingsForm" class="form-grid">
          <div class="field"><label>Clan Name</label><input name="clanName" value="${clanName}"></div>
          <div class="field"><label>Clan Tag</label><input name="clanTag" value="${clanTag}"></div>
          <div class="field"><label>Game</label><input name="game" value="${game}"></div>
          <div class="field wide"><label>Tier System</label><textarea name="tierThresholdsJson" rows="3">${tiers}</textarea></div>
          <div class="field wide"><label>Scoring System</label><textarea name="scoringJson" rows="3">${scoring}</textarea></div>
          <button class="btn primary" type="submit" data-loading-text="Saving clan info...">Save Clan Info</button>
        </form>
      </section>` : `
      <section class="settings-block">
        <h2>Clan Information</h2>
        <div class="settings-list">
          <p><span>Clan Name</span><strong>${clanName}</strong></p>
          <p><span>Clan Tag</span><strong>${clanTag}</strong></p>
          <p><span>Game</span><strong>${game}</strong></p>
        </div>
      </section>`;
    main.innerHTML = `<section class="settings-layout admin-settings-layout">
      <nav class="settings-menu"><button class="active" type="button">Account</button><button type="button">Profile</button><button type="button">Security</button></nav>
      <div class="card panel settings-panel">
        <section class="settings-block account-block">
          <h2>Account</h2>
          <div class="settings-list">
            <p><span>Logged in as</span><strong>${esc(user.displayName || user.username || 'Signed in')}</strong></p>
            <p><span>Username</span><strong>${esc(user.username || '—')}</strong></p>
            <p><span>Role</span><strong>${esc(user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : (user.clanRole || user.role || 'MANAGEMENT'))}</strong></p>
            <p><span>Status</span><strong>${esc(user.status || 'ACTIVE')}</strong></p>
          </div>
          <button class="btn danger" id="settingsLogoutBtn" type="button" data-loading-text="Logging out...">Logout</button>
        </section>
        ${superOnly}
        <section class="settings-block">
          <h2>Profile</h2>
          <form id="profileForm" class="form-grid">
            <div class="field"><label>Display name</label><input name="displayName" value="${esc(user.displayName || '')}"></div>
            <div class="field"><label>Profile picture</label><input name="avatarFile" id="profileAvatarFile" type="file" accept="image/png,image/jpeg,image/webp"></div>
            <div class="field wide"><label>Bio</label><textarea name="bio" rows="3">${esc(user.bio || '')}</textarea></div>
            <div class="field"><label>Country</label><input name="country" value="${esc(user.country || '')}"></div>
            <div class="field"><label>CODM Role</label><select name="playerRole"><option>${esc(user.playerRole || 'FLEX')}</option><option>IGL</option><option>SLAYER</option><option>SMG</option><option>AR</option><option>SNIPER</option><option>FLEX</option><option>SUPPORT</option><option>BR PLAYER</option><option>MP PLAYER</option></select></div>
            <button class="btn primary" type="submit" data-loading-text="Saving...">Save Profile</button>
          </form>
        </section>
        <section class="settings-block">
          <h2>Security</h2>
          <form id="passwordForm" class="form-grid">
            <div class="field"><label>Current password</label><input name="currentPassword" type="password" required></div>
            <div class="field"><label>New password</label><input name="newPassword" type="password" required minlength="8"></div>
            <div class="field"><label>Confirm new password</label><input name="confirmPassword" type="password" required minlength="8"></div>
            <button class="btn primary" type="submit" data-loading-text="Updating password...">Change Password</button>
          </form>
        </section>
      </div>
    </section>`;
    UI.bindButton(document.getElementById('settingsLogoutBtn'), async()=>window.SOLOS_AUTH.logout());
    const validateUrl = v => { if(!v) return ''; try{ const u=new URL(v); if(!['http:','https:'].includes(u.protocol)) throw new Error(); return v; } catch(e){ throw new Error('Please enter a valid URL.'); } };
    const linksForm=document.getElementById('communityLinksForm');
    if(linksForm) UI.bindForm(linksForm, async fd => { const body=Object.fromEntries(fd.entries()); ['whatsappUrl','tiktokUrl','instagramUrl','discordUrl','youtubeUrl'].forEach(k=>{ body[k]=validateUrl(String(body[k]||'').trim()); }); await API.call('updateClanSettings',body,{write:true}); API.clearCache(); UI.toast('Links saved.','success'); });
    const clanForm = document.getElementById('clanSettingsForm');
    if(clanForm) UI.bindForm(clanForm, async fd => { await API.call('updateClanSettings',Object.fromEntries(fd.entries()),{write:true}); API.clearCache(); UI.toast('Clan info saved.','success'); });
    UI.bindForm(document.getElementById('profileForm'), async fd => { const body = Object.fromEntries(fd.entries()); const f=document.getElementById('profileAvatarFile')?.files?.[0]; if(f) body.avatarData = await window.SOLOS_MEMBER.fileToDataUrl(f); delete body.avatarFile; const res = await API.call('updateProfile',body,{write:true}); if(res.user){ window.SOLOS_APP.user = res.user; } UI.toast('Profile saved.','success'); });
    UI.bindForm(document.getElementById('passwordForm'), async fd => { const b=Object.fromEntries(fd.entries()); if(b.newPassword !== b.confirmPassword) throw new Error('Passwords do not match.'); await API.call('changePassword',b,{write:true}); UI.toast('Password changed.','success'); document.getElementById('passwordForm').reset(); });
  };

  window.SOLOS_ADMIN = Admin;
})();
