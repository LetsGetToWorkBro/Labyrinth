import{j as e}from"./vendor-query-C1Sv77l2.js";import{a as c}from"./vendor-router-ODl1pWfb.js";import{h as Y,N as X,O as H}from"./index-CwJ76-yl.js";import"./vendor-react-D2Kp-oPc.js";const S=6,C=1200,U=3e4,P=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;800&display=swap');

.sauna-term, .sauna-term * { box-sizing: border-box; user-select: none; }
.sauna-term {
  font-family: 'Inter', sans-serif;
  color: #ffffff;
  padding: 20px;
  padding-bottom: 80px;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  overflow-x: hidden;
  --bg: #000000;
  --panel: rgba(12, 12, 14, 0.7);
  --gold-1: #8B6508;
  --gold-2: #D4AF37;
  --gold-3: #FFDF00;
  --heat-1: #FF4500;
  --heat-2: #FF8C00;
  --text-main: #ffffff;
  --text-muted: #888891;
  --border: rgba(255,255,255,0.08);
  --success: #00FF7F;
  --danger: #FF0000;
}

#sauna-furnace-glow {
  position: fixed; top: -10%; left: 50%; transform: translateX(-50%);
  width: 100vw; height: 70vh;
  background: radial-gradient(ellipse at top, rgba(255, 69, 0, 0.03), transparent 70%);
  pointer-events: none; z-index: 0;
  transition: all 2s cubic-bezier(0.16, 1, 0.3, 1);
}
body.sauna-active #sauna-furnace-glow {
  background: radial-gradient(ellipse at top, rgba(255, 69, 0, 0.25), transparent 80%);
  animation: sauna-breathe 4s infinite alternate ease-in-out;
}
@keyframes sauna-breathe {
  0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
  100% { transform: translateX(-50%) scale(1.05); opacity: 1; }
}

.sauna-back {
  position: absolute; top: 20px; left: 20px;
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  display: grid; place-items: center;
  color: #fff; cursor: pointer; z-index: 20;
  transition: all 0.2s;
}
.sauna-back:active { transform: scale(0.92); }

.sauna-term .terminal-wrapper { max-width: 600px; margin: 0 auto; position: relative; padding-top: 40px; }

.sauna-term .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.sauna-term .title-block { display: flex; flex-direction: column; gap: 4px; }
.sauna-term .eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; color: var(--heat-2); transition: color 0.5s; }
body.sauna-active .sauna-term .eyebrow { color: var(--heat-1); text-shadow: 0 0 12px var(--heat-1); }
.sauna-term .page-title { font-size: 32px; font-weight: 900; letter-spacing: -0.03em; }

.sauna-term .status-badge {
  display: flex; align-items: center; gap: 8px;
  background: rgba(0, 255, 127, 0.05); border: 1px solid rgba(0, 255, 127, 0.2);
  padding: 8px 14px; border-radius: 8px;
  font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--success);
  box-shadow: 0 0 20px rgba(0, 255, 127, 0.1);
}
.sauna-term .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); box-shadow: 0 0 10px var(--success); animation: sauna-pulse-green 2s infinite; }
@keyframes sauna-pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 127, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 255, 127, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 127, 0); }
}

.sauna-term .telemetry {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;
}
.sauna-term .t-card {
  background: rgba(15,15,18,0.8); border: 1px solid var(--border);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-radius: 16px; padding: 24px 16px; text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  transition: all 0.3s;
}
.sauna-term .t-value { font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 800; color: #fff; margin-bottom: 6px; transition: color 0.3s, text-shadow 0.3s; }
.sauna-term .t-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }

body.sauna-active .sauna-term .t-card.capacity { border-color: rgba(255, 140, 0, 0.3); box-shadow: 0 20px 40px rgba(255, 140, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.05); }
body.sauna-active .sauna-term .t-card.capacity .t-value { color: var(--heat-2); text-shadow: 0 0 15px rgba(255, 140, 0, 0.4); }

.sauna-term .console {
  background: linear-gradient(180deg, rgba(25,25,30,0.9) 0%, rgba(10,10,12,0.95) 100%);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px; margin-bottom: 32px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.05);
  position: relative; z-index: 10;
}
.sauna-term .checkin-row { display: flex; gap: 12px; align-items: stretch; }
.sauna-term .checkin-id {
  flex: 1; min-width: 0;
  background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 10px 16px;
  display: flex; flex-direction: column; justify-content: center; gap: 2px;
  min-height: 60px;
}
.sauna-term .checkin-id-label { font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); }
.sauna-term .checkin-id-name { font-size: 18px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sauna-term .btn-checkin-out {
  background: rgba(255,255,255,0.08) !important;
  border: 1px solid rgba(255,255,255,0.15) !important;
  box-shadow: none !important;
  color: #fff !important;
}
.sauna-term .btn-checkin-out:active:not(:disabled) {
  background: rgba(255,255,255,0.12) !important;
  box-shadow: none !important;
  transform: scale(0.96);
}

.sauna-term .search-row { display: flex; gap: 12px; position: relative; }
.sauna-term .input-wrap { flex: 1; position: relative; }
.sauna-term .input-wrap svg.search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; stroke: var(--text-muted); z-index: 2; transition: stroke 0.3s; pointer-events: none; }
.sauna-term .input-wrap input:focus ~ svg.search-icon { stroke: var(--gold-2); }
.sauna-term .search-input {
  width: 100%; height: 60px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1);
  color: #fff; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600;
  padding: 0 16px 0 50px; border-radius: 14px; transition: all 0.3s;
}
.sauna-term .search-input:focus { outline: none; border-color: var(--gold-2); box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.15); background: rgba(0,0,0,0.9); }

.sauna-term .btn-nfc {
  width: 60px; height: 60px; border-radius: 14px; flex-shrink: 0;
  background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.2);
  display: grid; place-items: center; color: var(--gold-2); cursor: pointer; transition: all 0.2s;
  position: relative; overflow: hidden;
}
.sauna-term .btn-nfc:active { transform: scale(0.9); background: rgba(212, 175, 55, 0.2); }
.sauna-term .btn-nfc.scanning { border-style: solid; border-color: var(--gold-2); background: rgba(212, 175, 55, 0.1); }
.sauna-term .btn-nfc.scanning svg { animation: sauna-scan-wave 1.5s infinite; }
@keyframes sauna-scan-wave { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }

.sauna-term .btn-checkin {
  width: 100%; height: 64px; margin-top: 16px;
  background: linear-gradient(135deg, var(--heat-2), var(--heat-1));
  color: #fff; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;
  border-radius: 14px; border: none; cursor: pointer;
  box-shadow: 0 10px 20px rgba(255, 69, 0, 0.3), inset 0 2px 2px rgba(255,255,255,0.3);
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; align-items: center; justify-content: center; gap: 12px;
}
.sauna-term .btn-checkin:disabled { opacity: 0.5; cursor: not-allowed; }
.sauna-term .btn-checkin:active:not(:disabled) { transform: scale(0.96); box-shadow: 0 5px 10px rgba(255, 69, 0, 0.4), inset 0 2px 2px rgba(255,255,255,0.1); }
.sauna-term .btn-checkin svg { transition: transform 0.3s; }
.sauna-term .btn-checkin:hover:not(:disabled) svg { transform: translateX(4px); }

.sauna-term .autocomplete {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0;
  background: rgba(15,15,18,0.98); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.9);
  opacity: 0; pointer-events: none; transform: translateY(-10px); transition: all 0.2s; overflow: hidden;
  max-height: 300px; overflow-y: auto; z-index: 20;
}
.sauna-term .autocomplete.show { opacity: 1; pointer-events: all; transform: translateY(0); }
.sauna-term .ac-item { padding: 16px 20px; display: flex; align-items: center; gap: 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); }
.sauna-term .ac-item:hover, .sauna-term .ac-item.active { background: rgba(255,255,255,0.08); }
.sauna-term .ac-avatar { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.1); display: grid; place-items: center; font-size: 12px; font-weight: 800; color: #fff; }
.sauna-term .ac-name { font-size: 16px; font-weight: 700; color: #fff; }
.sauna-term .ac-empty { padding: 20px; text-align: center; color: var(--text-muted); font-size: 14px; }

.sauna-term .section-lbl { font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.sauna-term .section-lbl::after { content: ''; flex: 1; height: 1px; background: var(--border); }

.sauna-term .empty-state {
  background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 20px; padding: 50px 20px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  transition: all 0.4s; margin-bottom: 32px;
}
.sauna-term .empty-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.05); display: grid; place-items: center; color: var(--text-muted); }
.sauna-term .empty-title { font-size: 16px; font-weight: 800; color: #fff; }
.sauna-term .empty-sub { font-size: 14px; color: var(--text-muted); }

.sauna-term .roster-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }

.sauna-term .roster-card {
  background: rgba(20, 20, 24, 0.7); border: 1px solid rgba(255, 69, 0, 0.3);
  border-radius: 16px; padding: 16px 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 0 30px rgba(255, 69, 0, 0.05);
  animation: sauna-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  position: relative; overflow: hidden; display: flex; align-items: center; gap: 16px;
}
@keyframes sauna-slide-in { 0% { opacity: 0; transform: translateY(20px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
.sauna-term .roster-card.exiting { animation: sauna-slide-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes sauna-slide-out { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.9); margin-bottom: -16px; padding: 0; height: 0; border-color: transparent; } }

.sauna-term .r-avatar-wrap { position: relative; width: 52px; height: 52px; flex-shrink: 0; }
.sauna-term .r-ring {
  position: absolute; inset: -4px; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent, var(--heat-2), var(--heat-1), transparent 60%);
  animation: sauna-spin 1.5s linear infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out; mask-composite: exclude; padding: 2px;
}
@keyframes sauna-spin { 100% { transform: rotate(360deg); } }
.sauna-term .r-avatar {
  width: 100%; height: 100%; border-radius: 50%; background: #111; border: 2px solid #000;
  display: grid; place-items: center; font-size: 16px; font-weight: 900; color: #fff; position: relative; z-index: 2;
}

.sauna-term .r-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.sauna-term .r-top-row { display: flex; justify-content: space-between; align-items: center; }
.sauna-term .r-name { font-size: 18px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sauna-term .r-timer { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 800; color: var(--heat-2); text-shadow: 0 0 10px rgba(255, 140, 0, 0.5); }
.sauna-term .r-timer.warning { color: var(--gold-3); text-shadow: 0 0 10px rgba(255, 223, 0, 0.5); animation: sauna-pulse-text 2s infinite; }
.sauna-term .r-timer.danger { color: var(--danger); text-shadow: 0 0 10px rgba(255, 0, 0, 0.8); animation: sauna-pulse-fast 1s infinite; }

@keyframes sauna-pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
@keyframes sauna-pulse-fast { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.05); } }

.sauna-term .r-bar-bg { width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5); }
.sauna-term .r-bar-fill { height: 100%; background: linear-gradient(90deg, var(--heat-2), var(--heat-1)); width: 0%; transition: width 1s linear, background 0.5s; }
.sauna-term .r-bar-fill.warning { background: linear-gradient(90deg, var(--gold-2), var(--gold-3)); }
.sauna-term .r-bar-fill.danger { background: var(--danger); box-shadow: 0 0 10px var(--danger); }

.sauna-term .btn-checkout {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0; margin-left: 8px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  display: grid; place-items: center; color: rgba(255,255,255,0.5); cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.sauna-term .btn-checkout:active { background: rgba(255,255,255,0.12); transform: scale(0.92); }

.sauna-term .rules-box {
  background: rgba(12,12,14,0.6); border: 1px solid var(--border); border-radius: 16px; padding: 20px;
}
.sauna-term .rules-title { font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.sauna-term .rules-title svg { stroke: var(--gold-2); width: 18px; }
.sauna-term .rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sauna-term .rule-pill {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: rgba(0,0,0,0.4); border-radius: 10px; border: 1px solid rgba(255,255,255,0.03);
}
.sauna-term .rule-pill svg { width: 16px; height: 16px; stroke: var(--gold-2); flex-shrink: 0; }
.sauna-term .rule-pill span { font-size: 11px; font-weight: 600; color: #ccc; line-height: 1.3; }
`;function M(s){const r=s.trim().split(/\s+/).filter(Boolean);return r.length===0?"??":r.length===1?r[0].slice(0,2).toUpperCase():(r[0][0]+r[r.length-1][0]).toUpperCase()}function R(s){const r=String(Math.floor(s/60)).padStart(2,"0"),i=String(Math.floor(s%60)).padStart(2,"0");return`${r}:${i}`}function G(){if(document.getElementById("sauna-terminal-css"))return;const s=document.createElement("style");s.id="sauna-terminal-css",s.textContent=P,document.head.appendChild(s)}const w="lbjj_sauna_sessions",V=10800*1e3;function z(){try{const s=JSON.parse(localStorage.getItem(w)||"[]");if(!Array.isArray(s))return[];const r=s.filter(i=>{const u=new Date(i?.checkedInAt).getTime();return i&&typeof i.name=="string"&&!isNaN(u)&&Date.now()-u<V});return r.length!==s.length&&localStorage.setItem(w,JSON.stringify(r)),r}catch{return[]}}function q(s){try{const r=z();r.find(i=>i.name.toLowerCase()===s.toLowerCase())||(r.push({name:s,checkedInAt:new Date().toISOString()}),localStorage.setItem(w,JSON.stringify(r)))}catch{}}function F(s){try{const i=z().filter(u=>u.name.toLowerCase()!==s.toLowerCase());localStorage.setItem(w,JSON.stringify(i))}catch{}}function ae({onBack:s}={}){const[r,i]=c.useState([]),[u,I]=c.useState(0),[T,L]=c.useState(!1),[y,A]=c.useState(!1),_=c.useRef(null),g=c.useMemo(()=>{try{const a=JSON.parse(localStorage.getItem("lbjj_member_profile")||"{}");return String(a.name||a.Name||"").trim()||"Member"}catch{return"Member"}},[]);c.useEffect(()=>{G();const a=document.body.style.background;document.body.style.background="#000";let n=document.getElementById("sauna-furnace-glow"),t=!1;return n||(n=document.createElement("div"),n.id="sauna-furnace-glow",document.body.appendChild(n),t=!0),()=>{document.body.style.background=a,document.body.classList.remove("sauna-active"),t&&n&&n.parentNode&&n.parentNode.removeChild(n)}},[]),c.useEffect(()=>{r.length>0?document.body.classList.add("sauna-active"):document.body.classList.remove("sauna-active")},[r.length]);const h=c.useCallback(async()=>{try{const a=await Y("getActiveSessions",{}),n=a?.sessions||a?.active||[],t=typeof a?.dailyTotal=="number"?a.dailyTotal:typeof a?.todayCount=="number"?a.todayCount:0;I(t);const o=z(),p=[...n];for(const l of o)p.find(N=>String(N?.name||"").toLowerCase()===l.name.toLowerCase())||p.push({name:l.name,checkedInAt:l.checkedInAt,secondsElapsed:Math.max(0,Math.floor((Date.now()-new Date(l.checkedInAt).getTime())/1e3))});i(l=>{const j=p.map(d=>{const x=String(d?.name||"").trim(),E=d?.id??x;let b=0;if(typeof d?.secondsElapsed=="number")b=Math.max(0,Math.floor(d.secondsElapsed));else if(d?.checkedInAt||d?.checkIn){const m=new Date(d.checkedInAt||d.checkIn).getTime();isNaN(m)||(b=Math.max(0,Math.floor((Date.now()-m)/1e3)))}const v=l.find(m=>m.id===E||m.name===x);if(v&&!v.exiting){const m=Math.abs(v.seconds-b);return{id:v.id,name:x,initials:M(x),seconds:m>5?b:v.seconds}}return{id:E,name:x,initials:M(x),seconds:b}}),N=l.filter(d=>d.exiting&&!j.find(x=>x.id===d.id));return[...j,...N]})}catch(a){console.warn("getActiveSessions failed",a)}},[]);c.useEffect(()=>{h();let a=null;const n=()=>{a===null&&(a=window.setInterval(()=>{document.hidden||h()},U))},t=()=>{a!==null&&(window.clearInterval(a),a=null)},o=()=>{document.hidden?t():(h(),n())};return n(),document.addEventListener("visibilitychange",o),()=>{t(),document.removeEventListener("visibilitychange",o)}},[h]),c.useEffect(()=>{const a=window.setInterval(()=>{i(n=>n.map(t=>t.exiting?t:{...t,seconds:t.seconds+1}))},1e3);return()=>window.clearInterval(a)},[]);const D=()=>{L(!0),window.setTimeout(()=>L(!1),1e3)},f=c.useMemo(()=>r.find(a=>!a.exiting&&a.name.toLowerCase()===g.toLowerCase()),[r,g]),O=async()=>{if(y||r.length>=S)return;const a=g.trim();if(!a||a==="Member"||f)return;A(!0);const n={id:`local-${Date.now()}`,name:a,initials:M(a),seconds:0};i(t=>[n,...t]),q(a);try{const o=(await X(a))?.session?.id;o&&i(p=>p.map(l=>l.id===n.id?{...l,id:o}:l)),setTimeout(()=>h(),500)}catch(t){console.error("sauna checkin failed",t),i(o=>o.filter(p=>p.id!==n.id)),F(a)}finally{A(!1)}},B=async a=>{const n=r.find(t=>t.id===a);if(!(!n||n.exiting)){i(t=>t.map(o=>o.id===a?{...o,exiting:!0}:o)),I(t=>t+1),F(n.name);try{await H(n.name)}catch(t){console.error("sauna checkout failed",t)}window.setTimeout(()=>{i(t=>t.filter(o=>o.id!==a)),h()},400)}},W=async()=>{f&&await B(f.id)},$=()=>{s?s():window.location.hash="#/"},k=r.filter(a=>!a.exiting).length,J=!y&&k<S&&!f&&g.trim().length>0&&g!=="Member";return e.jsxs("div",{className:"sauna-term",ref:_,children:[e.jsx("button",{className:"sauna-back",onClick:$,"aria-label":"Back to home",children:e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsxs("div",{className:"terminal-wrapper",children:[e.jsxs("div",{className:"header",children:[e.jsxs("div",{className:"title-block",children:[e.jsx("div",{className:"eyebrow",children:"Recovery System"}),e.jsx("div",{className:"page-title",children:"Sauna Terminal"})]}),e.jsxs("div",{className:"status-badge",children:[e.jsx("div",{className:"dot"})," Linked"]})]}),e.jsxs("div",{className:"telemetry",children:[e.jsxs("div",{className:"t-card capacity",children:[e.jsxs("div",{className:"t-value",children:[e.jsx("span",{children:k}),e.jsxs("span",{style:{color:"#666",fontSize:24},children:["/",S]})]}),e.jsx("div",{className:"t-label",children:"Capacity"})]}),e.jsxs("div",{className:"t-card",children:[e.jsx("div",{className:"t-value",children:u}),e.jsx("div",{className:"t-label",children:"Daily Uses"})]})]}),e.jsxs("div",{className:"console",children:[e.jsxs("div",{className:"checkin-row",children:[e.jsxs("div",{className:"checkin-id",children:[e.jsx("div",{className:"checkin-id-label",children:"Checking in as"}),e.jsx("div",{className:"checkin-id-name",children:g})]}),e.jsx("button",{className:`btn-nfc ${T?"scanning":""}`,onClick:D,"aria-label":"Scan NFC",type:"button",children:e.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("path",{d:"M4 8v8M8 6v12M12 4v16M16 6v12M20 8v8"})})})]}),f?e.jsxs("button",{className:"btn-checkin btn-checkin-out",onClick:W,disabled:y,type:"button",children:["You're In — Check Out",e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("polyline",{points:"9 10 4 15 9 20"}),e.jsx("path",{d:"M20 4v7a4 4 0 0 1-4 4H4"})]})]}):e.jsxs("button",{className:"btn-checkin",onClick:O,disabled:!J,type:"button",children:["Check Me In",e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})]})]}),e.jsx("div",{className:"section-lbl",children:"Active Sessions"}),k===0?e.jsxs("div",{className:"empty-state",children:[e.jsx("div",{className:"empty-icon",children:e.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("path",{d:"M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"})})}),e.jsxs("div",{children:[e.jsx("div",{className:"empty-title",children:"Sauna is empty"}),e.jsx("div",{className:"empty-sub",children:"Awaiting authorization scan."})]})]}):null,e.jsx("div",{className:"roster-list",children:r.map(a=>{const n=a.seconds>=900&&a.seconds<C,t=a.seconds>=C,o=Math.min(a.seconds/C*100,100),p=t?"danger":n?"warning":"",l=t?"danger":n?"warning":"";return e.jsxs("div",{className:`roster-card ${a.exiting?"exiting":""}`,children:[e.jsxs("div",{className:"r-avatar-wrap",children:[e.jsx("div",{className:"r-ring"}),e.jsx("div",{className:"r-avatar",children:a.initials})]}),e.jsxs("div",{className:"r-info",children:[e.jsxs("div",{className:"r-top-row",children:[e.jsx("div",{className:"r-name",children:a.name}),e.jsx("div",{className:`r-timer ${p}`,children:R(a.seconds)})]}),e.jsx("div",{className:"r-bar-bg",children:e.jsx("div",{className:`r-bar-fill ${l}`,style:{width:`${o}%`}})})]}),e.jsx("button",{className:"btn-checkout",onClick:()=>B(a.id),"aria-label":`Check out ${a.name}`,type:"button",disabled:!!a.exiting,children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("polyline",{points:"9 10 4 15 9 20"}),e.jsx("path",{d:"M20 4v7a4 4 0 0 1-4 4H4"})]})})]},String(a.id))})}),e.jsxs("div",{className:"rules-box",children:[e.jsxs("div",{className:"rules-title",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("path",{d:"M14 2v6h6"}),e.jsx("line",{x1:"16",y1:"13",x2:"8",y2:"13"}),e.jsx("line",{x1:"16",y1:"17",x2:"8",y2:"17"}),e.jsx("polyline",{points:"10 9 9 9 8 9"})]}),"Facility Protocols"]}),e.jsxs("div",{className:"rules-grid",children:[e.jsxs("div",{className:"rule-pill",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:[e.jsx("path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"}),e.jsx("path",{d:"M12 12v9"}),e.jsx("path",{d:"M8 17l4 4 4-4"})]}),e.jsx("span",{children:"Shower before entry"})]}),e.jsxs("div",{className:"rule-pill",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"4.93",y1:"4.93",x2:"19.07",y2:"19.07"})]}),e.jsx("span",{children:"No shoes allowed"})]}),e.jsxs("div",{className:"rule-pill",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"5",width:"18",height:"14",rx:"2"}),e.jsx("path",{d:"M12 12v.01"})]}),e.jsx("span",{children:"Towel required"})]}),e.jsxs("div",{className:"rule-pill",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:[e.jsx("rect",{x:"5",y:"2",width:"14",height:"20",rx:"2",ry:"2"}),e.jsx("line",{x1:"3",y1:"3",x2:"21",y2:"21"})]}),e.jsx("span",{children:"No devices / calls"})]})]})]})]})]})}export{ae as default};
