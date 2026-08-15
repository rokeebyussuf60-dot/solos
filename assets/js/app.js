(function(){
  const API=window.SOLOS_API, UI=window.SOLOS_UI, C=window.SOLOS_CONFIG;
  const App={user:null,route:'dashboard'};
  const navs={
    SUPER_ADMIN:[['dashboard','Command Center'],['members','Members'],['ranking','Ranking'],['matches','Matches'],['news','News'],['announcements','Announcements'],['chat','Chat'],['reports','Reports'],['audit','Audit Log'],['permissions','Permissions'],['settings','Settings']],
    ADMIN:[['dashboard','Command Center'],['members','Members'],['ranking','Ranking'],['matches','Matches'],['news','News'],['announcements','Announcements'],['chat','Chat'],['reports','Reports'],['settings','Settings']],
    MEMBER:[['dashboard','Dashboard'],['profile','Profile'],['stats','My Stats'],['rank','My Rank'],['matches','Match History'],['community','Clan Room'],['notifications','Notifications'],['settings','Settings']]
  };
  function isAdmin(u){return ['SUPER_ADMIN','CLAN_MASTER','CO_LEADER','MANAGEMENT'].includes(u?.role)}
  App.boot=function(user){
    App.user=user; document.getElementById('authScreen')?.classList.add('hidden'); document.getElementById('appShell')?.classList.remove('hidden');
    document.getElementById('rolePill').textContent = user.role || 'Member'; document.getElementById('sessionLabel').textContent = user.role === 'SUPER_ADMIN' ? (user.displayName || user.username || 'Super Admin') : (user.clanDisplayName || `${C.CLAN_TAG} ${user.displayName || user.username || ''}`);
    App.renderNav(); App.route = location.hash?.replace('#','') || 'dashboard'; App.navigate(App.route);
  };
  App.renderNav=function(){
    const items = App.user?.role === 'SUPER_ADMIN' ? navs.SUPER_ADMIN : (isAdmin(App.user) ? navs.ADMIN : navs.MEMBER);
    const html = items.map(([id,label])=>`<button type="button" data-route="${id}">${label}</button>`).join('');
    ['sideNav','mobileSideNav'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
    document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>App.navigate(b.dataset.route)));
  };
  App.navigate=async function(route){
    App.route=route; location.hash=route; document.getElementById('appDrawer')?.classList.remove('open');
    document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
    const title = route==='dashboard' && App.user?.role==='SUPER_ADMIN' ? 'Command Center' : route.split('/')[0].replace(/\b\w/g,c=>c.toUpperCase()); document.getElementById('pageTitle').textContent=title;
    const main=document.getElementById('appMain'); main.innerHTML='<div class="empty"><span class="spinner"></span> Loading...</div>';
    try{ if(isAdmin(App.user)) await window.SOLOS_ADMIN.render(route, main, App.user); else await window.SOLOS_MEMBER.render(route, main, App.user); }
    catch(err){ main.innerHTML=`<div class="empty">${UI.escape(err.message||'Unable to load page.')} <button class="btn ghost small" onclick="SOLOS_APP.navigate(SOLOS_APP.route)">Retry</button></div>`; }
  };
  App.refresh=()=>App.navigate(App.route);
  document.addEventListener('DOMContentLoaded',()=>{
    UI.bindButton(document.getElementById('logoutBtn'),()=>window.SOLOS_AUTH.logout());
    UI.bindButton(document.getElementById('refreshBtn'),()=>App.refresh());
    document.getElementById('openAppMenu')?.addEventListener('click',()=>document.getElementById('appDrawer')?.classList.add('open'));
    document.getElementById('closeAppMenu')?.addEventListener('click',()=>document.getElementById('appDrawer')?.classList.remove('open'));
    document.getElementById('appDrawer')?.addEventListener('click',e=>{ if(e.target.id==='appDrawer') e.currentTarget.classList.remove('open'); });
  });
  window.SOLOS_APP=App;
})();
