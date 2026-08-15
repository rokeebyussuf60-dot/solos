(function(){
  const API=window.SOLOS_API, UI=window.SOLOS_UI, C=window.SOLOS_CONFIG;
  const App={user:null,route:'dashboard',routing:false};

  const navs={
    SUPER_ADMIN:[['dashboard','Dashboard'],['members','Members'],['ranking','Rankings'],['matches','Scrims'],['news','News'],['announcements','Announcements'],['chat','Chat'],['reports','Reports'],['audit','Audit Logs'],['permissions','Permissions'],['settings','Settings'],['site','Back to Site']],
    ADMIN:[['dashboard','Dashboard'],['members','Members'],['ranking','Rankings'],['matches','Scrims'],['news','News'],['announcements','Announcements'],['chat','Chat'],['reports','Reports'],['settings','Settings'],['site','Back to Site']],
    MEMBER:[['dashboard','Dashboard'],['profile','Profile'],['rank','My Rank'],['matches','Match History'],['community','Clan Room'],['notifications','Notifications'],['settings','Settings'],['site','Back to Site']]
  };
  const mobilePrimary={
    SUPER_ADMIN:[['site','Home'],['dashboard','Admin'],['members','Members'],['matches','Scrims'],['more','More']],
    ADMIN:[['site','Home'],['dashboard','HQ'],['members','Members'],['matches','Scrims'],['more','More']],
    MEMBER:[['site','Home'],['dashboard','Dashboard'],['profile','Profile'],['community','Chat'],['more','More']]
  };
  function roleGroup(u){
    const r=String(u?.role||'').toUpperCase();
    const cr=String(u?.clanRole||'').toUpperCase();
    if(r==='SUPER_ADMIN') return 'SUPER_ADMIN';
    if(['CLAN_MASTER','CO_LEADER','MANAGEMENT'].includes(r) || ['CLAN_MASTER','CO_LEADER','MANAGEMENT'].includes(cr)) return 'ADMIN';
    return 'MEMBER';
  }
  function isAdmin(u){ return roleGroup(u)!=='MEMBER'; }
  function cleanRoute(route){
    route=String(route||'dashboard').replace('#','').trim() || 'dashboard';
    if(['login','signin','sign-in','forgot','auth'].includes(route)) return 'dashboard';
    if(['admin','admin-dashboard','super-admin-dashboard','management-dashboard','member-dashboard'].includes(route)) return 'dashboard';
    if(route==='scrims') return 'matches';
    if(route==='leaderboard') return 'ranking';
    return route;
  }
  function displayName(user){
    if(!user) return 'Signed in';
    if(user.role==='SUPER_ADMIN' || user.isClanMember==='NO') return user.displayName || user.username || 'Super Admin';
    return user.clanDisplayName || `${C.CLAN_TAG} ${user.displayName || user.username || ''}`;
  }
  App.boot=function(user){
    App.user=user;
    try{
      const session=API.getSession() || {};
      API.saveSession({...session, role:user.role, clanRole:user.clanRole, user:{role:user.role, clanRole:user.clanRole, username:user.username, displayName:user.displayName}}, false);
    }catch(err){}
    document.body.classList.add('is-authenticated');
    document.getElementById('authScreen')?.classList.add('hidden');
    document.getElementById('appShell')?.classList.remove('hidden');
    const group=roleGroup(user);
    document.getElementById('rolePill').textContent = group==='SUPER_ADMIN' ? 'Super Admin' : (group==='ADMIN' ? (user.clanRole || user.role || 'Leadership') : 'Member');
    document.getElementById('sessionLabel').textContent = displayName(user);
    App.renderNav();
    const route = cleanRoute(location.hash || 'dashboard');
    App.navigate(route, true);
  };
  App.renderNav=function(){
    const group=roleGroup(App.user);
    const items = group==='SUPER_ADMIN' ? navs.SUPER_ADMIN : (group==='ADMIN' ? navs.ADMIN : navs.MEMBER);
    const html = items.map(([id,label])=> id==='site' ? `<a href="index.html" data-route-link="site">${label}</a>` : `<button type="button" data-route="${id}">${label}</button>`).join('');
    ['sideNav','mobileSideNav'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
    document.querySelectorAll('[data-route]').forEach(b=>{ if(b.dataset.bound==='1') return; b.dataset.bound='1'; b.addEventListener('click',()=>App.navigate(b.dataset.route)); });
    App.renderMobileDock(items, group);
  };
  App.renderMobileDock=function(allItems, group){
    document.querySelector('.mobile-app-dock')?.remove();
    document.querySelector('.mobile-app-sheet')?.remove();
    const dock=document.createElement('nav');
    dock.className='mobile-app-dock';
    dock.setAttribute('aria-label','Dashboard mobile navigation');
    const primary=mobilePrimary[group] || mobilePrimary.MEMBER;
    dock.innerHTML=primary.map(([id,label])=>{
      if(id==='site') return `<a href="index.html" class="mobile-dock-item"><span>${label}</span></a>`;
      if(id==='more') return `<button type="button" class="mobile-dock-item" data-app-more><span>${label}</span></button>`;
      return `<button type="button" class="mobile-dock-item" data-mobile-route="${id}"><span>${label}</span></button>`;
    }).join('');
    document.body.appendChild(dock);
    const sheet=document.createElement('div');
    sheet.className='mobile-app-sheet';
    sheet.innerHTML=`<div class="mobile-menu-card" role="dialog" aria-label="Dashboard menu"><div class="mobile-menu-head"><strong>${group==='SUPER_ADMIN'?'Clan Panel':'SOLOS十'}</strong><button type="button" class="btn ghost small" data-app-more-close>Close</button></div><div class="mobile-menu-grid">${allItems.map(([id,label])=> id==='site' ? `<a href="index.html">${label}</a>` : `<button type="button" data-mobile-route="${id}">${label}</button>`).join('')}<button type="button" data-app-logout>Logout</button></div></div>`;
    document.body.appendChild(sheet);
    document.querySelectorAll('[data-mobile-route]').forEach(b=>b.addEventListener('click',()=>{ sheet.classList.remove('open'); App.navigate(b.dataset.mobileRoute); }));
    document.querySelectorAll('[data-app-more]').forEach(b=>b.addEventListener('click',()=>sheet.classList.add('open')));
    document.querySelectorAll('[data-app-more-close]').forEach(b=>b.addEventListener('click',()=>sheet.classList.remove('open')));
    sheet.addEventListener('click',e=>{ if(e.target===sheet) sheet.classList.remove('open'); });
    document.querySelectorAll('[data-app-logout]').forEach(b=>b.addEventListener('click',()=>window.SOLOS_AUTH.logout()));
  };
  App.updateMobileActive=function(){
    document.querySelectorAll('[data-mobile-route]').forEach(b=>b.classList.toggle('active', b.dataset.mobileRoute===App.route));
  };
  App.renderAccessDenied=function(main, message){
    main.innerHTML=`<section class="card panel access-denied"><span class="eyebrow">Access denied</span><h2>You do not have permission for this room.</h2><p class="muted">${UI.escape(message || 'Use the right account or return to the main website.')}</p><div class="hero-actions"><a class="btn primary" href="index.html">Back to site</a><button class="btn ghost" type="button" onclick="SOLOS_APP.navigate('dashboard', true)">Go to dashboard</button></div></section>`;
  };
  App.navigate=async function(route, replace=false){
    if(!App.user) return;
    route=cleanRoute(route);
    if(route==='site'){ window.location.href='index.html'; return; }
    App.route=route; App.routing=true;
    if(replace) history.replaceState({route}, '', '#'+route); else if(cleanRoute(location.hash)!==route) history.pushState({route}, '', '#'+route);
    document.getElementById('appDrawer')?.classList.remove('open');
    document.querySelector('.mobile-app-sheet')?.classList.remove('open');
    document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
    App.updateMobileActive();
    const title = route==='dashboard' && App.user?.role==='SUPER_ADMIN' ? 'Command Center' : route.split('/')[0].replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    document.getElementById('pageTitle').textContent=title;
    const main=document.getElementById('appMain');
    if(!main) return;
    main.innerHTML='<div class="empty"><span class="spinner"></span> Loading...</div>';
    try{
      if(isAdmin(App.user)) await window.SOLOS_ADMIN.render(route, main, App.user); else await window.SOLOS_MEMBER.render(route, main, App.user);
    } catch(err){
      if(String(err.message||'').toLowerCase().includes('access denied') || String(err.response?.code||'')==='403') App.renderAccessDenied(main, err.message);
      else main.innerHTML=`<div class="empty">${UI.escape(err.message||'Unable to load page.')} <button class="btn ghost small" type="button" onclick="SOLOS_APP.navigate(SOLOS_APP.route, true)">Retry</button></div>`;
    }
    App.routing=false;
  };
  App.refresh=()=>App.navigate(App.route, true);
  document.addEventListener('DOMContentLoaded',()=>{
    UI.bindButton(document.getElementById('logoutBtn'),()=>window.SOLOS_AUTH.logout());
    UI.bindButton(document.getElementById('mobileLogoutBtn'),()=>window.SOLOS_AUTH.logout());
    UI.bindButton(document.getElementById('refreshBtn'),()=>App.refresh());
    document.getElementById('openAppMenu')?.addEventListener('click',()=>document.querySelector('.mobile-app-sheet')?.classList.add('open'));
    document.getElementById('closeAppMenu')?.addEventListener('click',()=>document.getElementById('appDrawer')?.classList.remove('open'));
    document.getElementById('appDrawer')?.addEventListener('click',e=>{ if(e.target.id==='appDrawer') e.currentTarget.classList.remove('open'); });
    window.addEventListener('hashchange',()=>{ const next=cleanRoute(location.hash||'dashboard'); if(App.user && next!==App.route) App.navigate(next,true); });
  });
  window.SOLOS_APP=App;
})();
