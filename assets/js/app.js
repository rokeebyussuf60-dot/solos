(function(){
  const API=window.SOLOS_API, UI=window.SOLOS_UI, C=window.SOLOS_CONFIG;
  const App={user:null,route:'dashboard',routing:false};
  const navs={
    SUPER_ADMIN:[['dashboard','Dashboard'],['members','Members'],['ranking','Rankings'],['matches','Scrims'],['news','News'],['announcements','Announcements'],['chat','Chat'],['reports','Reports'],['audit','Audit Logs'],['permissions','Permissions'],['settings','Settings'],['site','Back to Site']],
    ADMIN:[['dashboard','Dashboard'],['members','Members'],['ranking','Rankings'],['matches','Scrims'],['news','News'],['announcements','Announcements'],['chat','Chat'],['reports','Reports'],['settings','Settings'],['site','Back to Site']],
    MEMBER:[['dashboard','Dashboard'],['profile','Profile'],['rank','My Rank'],['matches','Match History'],['community','Clan Room'],['notifications','Notifications'],['settings','Settings'],['site','Back to Site']]
  };
  function isAdmin(u){return ['SUPER_ADMIN','CLAN_MASTER','CO_LEADER','MANAGEMENT'].includes(u?.role)}
  App.boot=function(user){
    App.user=user;
    document.getElementById('authScreen')?.classList.add('hidden');
    document.getElementById('appShell')?.classList.remove('hidden');
    document.getElementById('rolePill').textContent = user.role || 'Member';
    document.getElementById('sessionLabel').textContent = user.role === 'SUPER_ADMIN' ? (user.displayName || user.username || 'Super Admin') : (user.clanDisplayName || `${C.CLAN_TAG} ${user.displayName || user.username || ''}`);
    App.renderNav();
    const route = (location.hash || '#dashboard').replace('#','') || 'dashboard';
    App.navigate(route, true);
  };
  App.renderNav=function(){
    const items = App.user?.role === 'SUPER_ADMIN' ? navs.SUPER_ADMIN : (isAdmin(App.user) ? navs.ADMIN : navs.MEMBER);
    const html = items.map(([id,label])=> id==='site' ? `<a href="index.html" data-route-link="site">${label}</a>` : `<button type="button" data-route="${id}">${label}</button>`).join('');
    ['sideNav','mobileSideNav'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
    document.querySelectorAll('[data-route]').forEach(b=>{ if(b.dataset.bound==='1') return; b.dataset.bound='1'; b.addEventListener('click',()=>App.navigate(b.dataset.route)); });
  };
  App.navigate=async function(route, replace=false){
    if(!App.user) return;
    if(route==='site'){ window.location.href='index.html'; return; }
    App.route=route; App.routing=true;
    if(replace) history.replaceState({route}, '', '#'+route); else if(location.hash.replace('#','')!==route) history.pushState({route}, '', '#'+route);
    document.getElementById('appDrawer')?.classList.remove('open');
    document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
    const title = route==='dashboard' && App.user?.role==='SUPER_ADMIN' ? 'Command Center' : route.split('/')[0].replace(/\b\w/g,c=>c.toUpperCase());
    document.getElementById('pageTitle').textContent=title;
    const main=document.getElementById('appMain'); main.innerHTML='<div class="empty"><span class="spinner"></span> Loading...</div>';
    try{ if(isAdmin(App.user)) await window.SOLOS_ADMIN.render(route, main, App.user); else await window.SOLOS_MEMBER.render(route, main, App.user); }
    catch(err){ main.innerHTML=`<div class="empty">${UI.escape(err.message||'Unable to load page.')} <button class="btn ghost small" type="button" onclick="SOLOS_APP.navigate(SOLOS_APP.route, true)">Retry</button></div>`; }
    App.routing=false;
  };
  App.refresh=()=>App.navigate(App.route, true);
  document.addEventListener('DOMContentLoaded',()=>{
    UI.bindButton(document.getElementById('logoutBtn'),()=>window.SOLOS_AUTH.logout());
    UI.bindButton(document.getElementById('mobileLogoutBtn'),()=>window.SOLOS_AUTH.logout());
    UI.bindButton(document.getElementById('refreshBtn'),()=>App.refresh());
    document.getElementById('openAppMenu')?.addEventListener('click',()=>document.getElementById('appDrawer')?.classList.add('open'));
    document.getElementById('closeAppMenu')?.addEventListener('click',()=>document.getElementById('appDrawer')?.classList.remove('open'));
    document.getElementById('appDrawer')?.addEventListener('click',e=>{ if(e.target.id==='appDrawer') e.currentTarget.classList.remove('open'); });
    window.addEventListener('hashchange',()=>{ const next=(location.hash||'#dashboard').replace('#','')||'dashboard'; if(App.user && next!==App.route) App.navigate(next,true); });
  });
  window.SOLOS_APP=App;
})();
