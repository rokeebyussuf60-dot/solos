(function(){
  const C = window.SOLOS_CONFIG;
  const API = {};
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
    let url = C.API_BASE_URL;
    const headers = {'Accept':'application/json'};
    const fetchOptions = {method, headers};
    if(method === 'GET'){
      url += (url.includes('?') ? '&' : '?') + new URLSearchParams(payload).toString();
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      fetchOptions.body = new URLSearchParams(payload).toString();
    }
    const ctl = new AbortController(); fetchOptions.signal = ctl.signal;
    const timer = setTimeout(()=>ctl.abort(), opts.timeout || C.REQUEST_TIMEOUT_MS);
    try{
      const res = await fetch(url, fetchOptions);
      const text = await res.text();
      let out;
      try{ out = JSON.parse(text); } catch { throw new Error('Invalid response from server. Redeploy the Apps Script web app.'); }
      if(out.code === 'UNAUTHORIZED' || out.message === 'Session expired. Please sign in again.'){
        API.clearSession(); window.dispatchEvent(new CustomEvent('solos:session-expired'));
      }
      if(out.success === false){ const err = new Error(out.message || 'Unable to complete request.'); err.response = out; throw err; }
      return out;
    } catch(err){
      if(err.name === 'AbortError') throw new Error('This is taking longer than expected. Please check your connection and try again.');
      if(err.message === 'Failed to fetch') throw new Error('Unable to reach the server. Check your connection and try again.');
      throw err;
    } finally { clearTimeout(timer); }
  };
  window.SOLOS_API = API;
})();
