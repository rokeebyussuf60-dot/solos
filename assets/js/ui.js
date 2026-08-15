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
  document.addEventListener('DOMContentLoaded', UI.mobileDrawer);
  window.SOLOS_UI = UI;
})();
