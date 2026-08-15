(function(){
  const UI = {};
  UI.escape = function(v){ return String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); };
  UI.money = v => Number(v||0).toLocaleString(undefined,{maximumFractionDigits:0});
  UI.date = v => v ? new Date(v).toLocaleString() : '—';
  UI.toast = function(message, type='info'){
    const wrap = document.getElementById('toasts'); if(!wrap) return;
    const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = message; wrap.appendChild(el); setTimeout(()=>el.remove(), 5200);
  };
  UI.setLoading = function(button, loading=true, text){
    if(!button) return;
    if(loading){
      if(!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${UI.escape(text || button.dataset.loadingText || 'Processing...')}`;
    } else { button.disabled = false; if(button.dataset.originalText){ button.innerHTML = button.dataset.originalText; delete button.dataset.originalText; } }
  };
  const formLocks = new WeakMap();
  UI.bindForm = function(form, handler){
    if(!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      if(formLocks.get(form)) return;
      const submitter = ev.submitter || form.querySelector('[type="submit"]');
      formLocks.set(form,true); UI.setLoading(submitter,true);
      try{ await handler(new FormData(form), form, submitter); }
      catch(err){ UI.toast(err.message || 'Something went wrong. Please try again.', 'error'); }
      finally{ formLocks.set(form,false); UI.setLoading(submitter,false); }
    });
  };
  UI.bindButton = function(button, handler){
    if(!button || button.dataset.bound === '1') return;
    button.dataset.bound='1';
    button.addEventListener('click', async ev => { ev.preventDefault(); if(button.disabled) return; UI.setLoading(button,true); try{ await handler(ev,button); } catch(err){ UI.toast(err.message || 'Something went wrong. Please try again.','error'); } finally{ UI.setLoading(button,false); } });
  };
  UI.mobileDrawer = function(){
    document.querySelectorAll('[data-open-drawer]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector('[data-drawer]')?.classList.add('open')));
    document.querySelectorAll('[data-close-drawer]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector('[data-drawer]')?.classList.remove('open')));
    document.querySelector('[data-drawer]')?.addEventListener('click',e=>{ if(e.target.matches('[data-drawer]')) e.currentTarget.classList.remove('open'); });
  };
  UI.tableCellLabels = function(table){
    if(!table) return;
    const headers = [...table.querySelectorAll('thead th')].map(th=>th.textContent.trim());
    table.querySelectorAll('tbody tr').forEach(row=>[...row.children].forEach((td,i)=>td.setAttribute('data-label',headers[i] || '')));
  };
  UI.empty = (text) => `<div class="empty">${UI.escape(text)}</div>`;

  function getStoredSession(){
    const C = window.SOLOS_CONFIG || {};
    try { return JSON.parse(sessionStorage.getItem(C.SESSION_KEY) || localStorage.getItem(C.SESSION_KEY) || 'null'); }
    catch { return null; }
  }
  function closePublicMenu(){ document.querySelector('.mobile-menu-sheet')?.classList.remove('open'); }
  function openPublicMenu(){ document.querySelector('.mobile-menu-sheet')?.classList.add('open'); }
  function isActivePath(target){
    const current = (location.pathname.split('/').pop() || 'index.html');
    return current === target || (current === '' && target === 'index.html');
  }
  function makeItem({label, href, action, primary}){
    if(action === 'menu') return `<button type="button" class="mobile-dock-item ${primary?'primary':''}" data-mobile-menu-open><span>${label}</span></button>`;
    if(action === 'logout') return `<button type="button" class="mobile-dock-item" data-public-logout><span>${label}</span></button>`;
    const file = href ? href.split('#')[0].split('/').pop() : '';
    return `<a class="mobile-dock-item ${isActivePath(file)?'active':''} ${primary?'primary':''}" href="${UI.escape(href)}"><span>${UI.escape(label)}</span></a>`;
  }
  UI.publicMobileNav = function(){
    if(document.body.classList.contains('page-app')) return;
    if(document.querySelector('.mobile-public-dock')) return;
    const session = getStoredSession();
    const hasSession = !!(session && session.token);
    const role = String(session?.role || session?.user?.role || '').toUpperCase();
    const clanRole = String(session?.clanRole || session?.user?.clanRole || '').toUpperCase();
    const isSuper = role === 'SUPER_ADMIN';
    const isLeader = isSuper || ['CLAN_MASTER','CO_LEADER','MANAGEMENT'].includes(role) || ['CLAN_MASTER','CO_LEADER','MANAGEMENT'].includes(clanRole);
    let dock, sheet;
    if(!hasSession){
      dock = [
        {label:'Home', href:'index.html'}, {label:'Roster', href:'team.html'}, {label:'Matches', href:'matches.html'}, {label:'Board', href:'leaderboard.html'}, {label:'Menu', action:'menu', primary:true}
      ];
      sheet = [
        ['Home','index.html'],['Roster','team.html'],['Matches','matches.html'],['Leaderboard','leaderboard.html'],['News','news.html'],['Join','join.html'],['Login','app.html#login']
      ];
    } else if(isSuper){
      dock = [
        {label:'Home', href:'index.html'}, {label:'Admin', href:'app.html#dashboard', primary:true}, {label:'Members', href:'app.html#members'}, {label:'Scrims', href:'app.html#matches'}, {label:'Menu', action:'menu'}
      ];
      sheet = [['Home','index.html'],['Admin Dashboard','app.html#dashboard'],['Members','app.html#members'],['Applications','app.html#members'],['Scrims','app.html#matches'],['Rankings','app.html#ranking'],['News','app.html#news'],['Chat','app.html#chat'],['Audit Logs','app.html#audit'],['Settings','app.html#settings']];
    } else if(isLeader){
      dock = [
        {label:'Home', href:'index.html'}, {label:'Dashboard', href:'app.html#dashboard', primary:true}, {label:'Members', href:'app.html#members'}, {label:'Scrims', href:'app.html#matches'}, {label:'Menu', action:'menu'}
      ];
      sheet = [['Home','index.html'],['Roster','team.html'],['Matches','matches.html'],['Leaderboard','leaderboard.html'],['News','news.html'],['Dashboard','app.html#dashboard'],['Members','app.html#members'],['Scrims','app.html#matches'],['Chat','app.html#chat'],['Settings','app.html#settings']];
    } else {
      dock = [
        {label:'Home', href:'index.html'}, {label:'Roster', href:'team.html'}, {label:'Matches', href:'matches.html'}, {label:'Dashboard', href:'app.html#dashboard', primary:true}, {label:'Menu', action:'menu'}
      ];
      sheet = [['Home','index.html'],['Roster','team.html'],['Matches','matches.html'],['Leaderboard','leaderboard.html'],['News','news.html'],['Chat','app.html#community'],['My Dashboard','app.html#dashboard'],['My Profile','app.html#profile'],['Settings','app.html#settings']];
    }
    const dockEl = document.createElement('nav');
    dockEl.className = 'mobile-public-dock';
    dockEl.setAttribute('aria-label','Mobile navigation');
    dockEl.innerHTML = dock.map(makeItem).join('');
    document.body.appendChild(dockEl);
    const sheetEl = document.createElement('div');
    sheetEl.className = 'mobile-menu-sheet';
    sheetEl.innerHTML = `<div class="mobile-menu-card" role="dialog" aria-label="SOLOS menu"><div class="mobile-menu-head"><strong>SOLOS十</strong><button type="button" class="btn ghost small" data-mobile-menu-close>Close</button></div><div class="mobile-menu-grid">${sheet.map(([label,href])=>`<a href="${UI.escape(href)}">${UI.escape(label)}</a>`).join('')}${hasSession?'<button type="button" data-public-logout>Logout</button>':''}</div></div>`;
    document.body.appendChild(sheetEl);
    document.querySelectorAll('[data-mobile-menu-open]').forEach(b=>b.addEventListener('click',openPublicMenu));
    document.querySelectorAll('[data-mobile-menu-close]').forEach(b=>b.addEventListener('click',closePublicMenu));
    sheetEl.addEventListener('click',e=>{ if(e.target === sheetEl) closePublicMenu(); });
    document.querySelectorAll('.mobile-menu-sheet a,.mobile-public-dock a').forEach(a=>a.addEventListener('click',closePublicMenu));
    document.querySelectorAll('[data-public-logout]').forEach(b=>b.addEventListener('click',async()=>{
      try{ if(window.SOLOS_API) await window.SOLOS_API.call('logout',{}, {write:true}); } catch(err){}
      try{ window.SOLOS_API?.clearSession(); } catch(err){}
      location.href='index.html';
    }));
  };
  document.addEventListener('DOMContentLoaded', ()=>{ UI.mobileDrawer(); UI.publicMobileNav(); });
  window.SOLOS_UI = UI;
})();
