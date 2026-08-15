(function(){
  const C = window.SOLOS_CONFIG;
  const API = {};
  const readCache = new Map();
  const inflight = new Map();
  const CACHE_TTL = {
    getSettings: 120000, publicHome: 60000, getTeam: 45000, getLeaderboard: 30000,
    getMatches: 30000, getNews: 45000, getAnnouncements: 30000, adminDashboard: 18000,
    listUsers: 20000, memberDashboard: 15000, playerDashboard: 15000, myDashboard: 15000,
    getPlayerDashboard: 15000, getMemberDashboard: 15000, listNotifications: 20000, getChat: 15000
  };
  function cacheKey(action, payload){ return action + '::' + JSON.stringify(payload, Object.keys(payload).sort()); }
  function clone(obj){ try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; } }
  API.clearCache = function(action){
    if(!action){ readCache.clear(); inflight.clear(); return; }
    [...readCache.keys()].forEach(k=>{ if(k.startsWith(action+'::')) readCache.delete(k); });
    [...inflight.keys()].forEach(k=>{ if(k.startsWith(action+'::')) inflight.delete(k); });
  };
  function uuid(){
    if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const arr = new Uint8Array(16);
    if(window.crypto && crypto.getRandomValues) crypto.getRandomValues(arr); else for(let i=0;i<16;i++) arr[i]=Math.floor(Math.random()*256);
    arr[6]=(arr[6]&0x0f)|0x40; arr[8]=(arr[8]&0x3f)|0x80;
    return [...arr].map((b,i)=>([4,6,8,10].includes(i)?'-':'')+b.toString(16).padStart(2,'0')).join('');
  }
  API.requestId = () => `req_${uuid()}`;
  API.getSession = () => { try { return JSON.parse(sessionStorage.getItem(C.SESSION_KEY) || localStorage.getItem(C.SESSION_KEY) || 'null'); } catch { return null; } };
  API.saveSession = (session, remember=false) => { const data = JSON.stringify(session); sessionStorage.setItem(C.SESSION_KEY, data); if(remember) localStorage.setItem(C.SESSION_KEY, data); };
  API.clearSession = () => { sessionStorage.removeItem(C.SESSION_KEY); localStorage.removeItem(C.SESSION_KEY); };
  function ensureConfigured(){ if(!C.API_BASE_URL || C.API_BASE_URL.includes('PASTE_YOUR')) throw new Error('Unable to connect right now. Please tell leadership.'); }
  API.call = async function(action, data={}, opts={}){
    ensureConfigured();
    const method = (opts.method || (opts.write ? 'POST' : 'GET')).toUpperCase();
    const session = API.getSession();
    const payload = {...data, action};
    if(session && session.token){ payload.sessionToken = session.token; payload.token = session.token; }
    if(opts.write && !payload.requestId) payload.requestId = API.requestId();
    const useCache = method === 'GET' && opts.cache !== false;
    const key = useCache ? cacheKey(action, payload) : '';
    const ttl = Number(opts.cacheMs || CACHE_TTL[action] || 12000);
    if(useCache){
      const hit = readCache.get(key);
      if(hit && (Date.now() - hit.time) < ttl) return clone(hit.data);
      if(inflight.has(key)) return clone(await inflight.get(key));
    }
    let url = C.API_BASE_URL;
    const headers = {'Accept':'application/json'};
    const fetchOptions = {method, headers, cache:'no-store'};
    if(method === 'GET'){
      url += (url.includes('?') ? '&' : '?') + new URLSearchParams(payload).toString();
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      fetchOptions.body = new URLSearchParams(payload).toString();
    }
    const run = (async()=>{
      const ctl = new AbortController(); fetchOptions.signal = ctl.signal;
      const timer = setTimeout(()=>ctl.abort(), opts.timeout || C.REQUEST_TIMEOUT_MS);
      try{
        const res = await fetch(url, fetchOptions);
        const text = await res.text();
        let out;
        try{ out = JSON.parse(text); } catch { throw new Error('The clan panel could not read the response. Please try again.'); }
        if(out.code === 'UNAUTHORIZED' || out.message === 'Session expired. Please sign in again.'){
          API.clearSession(); API.clearCache(); window.dispatchEvent(new CustomEvent('solos:session-expired'));
        }
        if(out.success === false){ const err = new Error(out.message || 'Unable to complete request.'); err.response = out; throw err; }
        if(method !== 'GET') API.clearCache();
        if(action === 'getSettings' || action === 'publicHome'){
          const settings = out.settings || {};
          if(settings.socials){
            const socials = typeof settings.socials === 'string' ? JSON.parse(settings.socials || '{}') : settings.socials;
            C.SOCIALS = {...(C.SOCIALS||{}), ...socials};
          }
          if(settings.clanName) C.APP_NAME = settings.clanName;
          if(settings.clanTag) C.CLAN_TAG = settings.clanTag;
        }
        return out;
      } catch(err){
        if(err.name === 'AbortError') throw new Error('This is taking longer than expected. Please check your connection and try again.');
        if(err.message === 'Failed to fetch') throw new Error('Unable to reach the server. Check your connection and try again.');
        throw err;
      } finally { clearTimeout(timer); }
    })();
    if(useCache) inflight.set(key, run);
    try{
      const out = await run;
      if(useCache) readCache.set(key, {time:Date.now(), data:clone(out)});
      return clone(out);
    } finally {
      if(useCache) inflight.delete(key);
    }
  };  window.SOLOS_API = API;
})();
