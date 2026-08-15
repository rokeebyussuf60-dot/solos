(function(){
  const API=window.SOLOS_API, UI=window.SOLOS_UI;
  const Auth={user:null};
  Auth.init=function(){
    document.querySelectorAll('[data-auth-tab]').forEach(btn=>btn.addEventListener('click',()=>Auth.showPane(btn.dataset.authTab)));
    UI.bindForm(document.getElementById('loginForm'), Auth.login);
    UI.bindForm(document.getElementById('forgotForm'), Auth.forgotPassword);
    window.addEventListener('solos:session-expired',()=>{ Auth.showAuth('Your session has expired. Please sign in again.'); });
    const s=API.getSession(); if(s?.token) Auth.restore(); else Auth.showAuth();
  };
  Auth.showPane=function(id){
    document.querySelectorAll('.auth-pane').forEach(p=>p.classList.toggle('hidden',p.id!==id));
    document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===id));
  };
  Auth.login=async function(fd){
    const identity=fd.get('identity')?.trim(), password=fd.get('password')||'';
    if(!identity || !password) throw new Error('Enter your username/email and password.');
    const res=await API.call('login',{identity,password},{write:true});
    const session = res.session || { token: res.token, expiresAt: res.expiresAt || '' };
    if(!session || !session.token) throw new Error('Sign in could not be completed. Please try again.');
    API.saveSession({...session, role:res.user?.role, clanRole:res.user?.clanRole, user:{role:res.user?.role, clanRole:res.user?.clanRole, username:res.user?.username, displayName:res.user?.displayName}}, false); Auth.user=res.user; document.getElementById('loginMessage').textContent=''; window.SOLOS_APP.boot(res.user);
  };
  Auth.restore=async function(){
    try{
      let res;
      try{ res=await API.call('me',{}, {method:'GET'}); }
      catch(firstErr){ res=await API.call('me',{}, {write:true}); }
      Auth.user=res.user;
      const session=API.getSession() || {};
      API.saveSession({...session, role:res.user?.role, clanRole:res.user?.clanRole, user:{role:res.user?.role, clanRole:res.user?.clanRole, username:res.user?.username, displayName:res.user?.displayName}}, false);
      window.SOLOS_APP.boot(res.user);
    }
    catch(err){ Auth.showAuth(err.message || 'Please sign in.'); }
  };
  Auth.forgotPassword=async function(fd){
    const email=fd.get('email')?.trim(); if(!email) throw new Error('Enter your email.');
    const res=await API.call('requestPasswordReset',{email},{write:true});
    document.getElementById('forgotMessage').textContent=res.message || 'If the account exists, reset instructions have been created.';
  };
  Auth.logout=async function(){
    try{ await API.call('logout',{}, {write:true}); } catch(err){ console.warn(err.message); }
    API.clearSession(); API.clearCache?.(); Auth.user=null;
    history.replaceState(null,'','index.html');
    window.location.replace('index.html');
  };
  Auth.showAuth=function(message){
    Auth.user=null; API.clearSession(); document.getElementById('appShell')?.classList.add('hidden'); document.getElementById('authScreen')?.classList.remove('hidden');
    Auth.showPane('loginPane');
    const msg=document.getElementById('loginMessage'); if(msg) msg.textContent=message||'';
  };
  window.addEventListener('pageshow', (event)=>{
    if(event.persisted && !API.getSession() && document.getElementById('appShell')){
      Auth.showAuth('Please sign in again.');
    }
  });
  document.addEventListener('DOMContentLoaded',()=>{ if(document.getElementById('authScreen')) Auth.init(); });
  window.SOLOS_AUTH=Auth;
})();
