import{j as e}from"./vendor-query-C1Sv77l2.js";import{a as i}from"./vendor-router-ODl1pWfb.js";import{q as j,ar as P,as as O,t as k,at as U,Q as $,h as B,au as W}from"./index-DiGNjI_J.js";import{S as X,a as M}from"./StateComponents-CDCKUsRZ.js";import"./vendor-react-D2Kp-oPc.js";const Y=["🔥","💪","🥋","👏","⚡","🤙"],G=["All","Gi","No-Gi","Kids","Comp","Open Mat"],J="https://www.youtube.com/live_chat",N="lbjj-live-v3-styles",H=`
.lv3-root {
  --gold: #D4AF37; --gold2: #E8AF34;
  --surface: rgba(18,18,22,0.65);
  --surface-hover: rgba(25,25,30,0.75);
  --border: rgba(255,255,255,0.05);
  --muted: #888890;
  font-family: system-ui, sans-serif;
  background: #030305;
  color: #F8F8F8;
  min-height: 100vh;
  position: relative;
}
.lv3-root *, .lv3-root *::before, .lv3-root *::after {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

/* Ambient orbs */
.lv3-ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.lv3-orb { position: absolute; border-radius: 50%; filter: blur(90px); mix-blend-mode: screen; }
.lv3-orb1 { width: 60vw; height: 60vw; background: #D4AF37; opacity: 0.12; top: -10%; left: -20%; animation: lv3-drift 20s ease-in-out infinite alternate; }
.lv3-orb2 { width: 50vw; height: 50vw; background: #1A56DB; opacity: 0.12; bottom: 10%; right: -10%; animation: lv3-drift 25s ease-in-out infinite alternate-reverse; }
@keyframes lv3-drift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(30px,40px) scale(1.1); } }

/* Layout */
.lv3-content { position: relative; z-index: 1; }
.lv3-scroll { overflow-y: auto; scrollbar-width: none; padding: 0 20px max(100px, calc(env(safe-area-inset-bottom,0px) + 90px)); }
.lv3-scroll::-webkit-scrollbar { display: none; }

/* Header */
.lv3-header {
  padding: 20px 20px 14px; display: flex; justify-content: space-between; align-items: center;
  background: rgba(3,3,5,0.75); backdrop-filter: blur(30px) saturate(120%); -webkit-backdrop-filter: blur(30px) saturate(120%);
  border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 40;
}
.lv3-header h1 { font-size: 24px; font-weight: 900; color: #fff; margin: 0; letter-spacing: -0.02em; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
.lv3-header p { font-size: 13px; color: var(--muted); margin: 2px 0 0; font-weight: 600; }
.lv3-close-btn {
  width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.03);
  border: 1px solid var(--border); color: var(--muted); display: grid; place-items: center;
  transition: all 0.2s cubic-bezier(0.16,1,0.3,1); cursor: pointer; text-decoration: none;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.05);
}
.lv3-close-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.08); color: #fff; }

/* Section labels */
.lv3-section-label {
  font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 16px; display: flex; align-items: center; gap: 12px;
}
.lv3-section-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--border), transparent); }

/* Live glass wrapper */
.lv3-live-wrap {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 28px; padding: 8px; margin-top: 16px;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08);
  position: relative;
}
.lv3-live-wrap::before {
  content: ''; position: absolute; inset: -1px; border-radius: 29px;
  background: linear-gradient(180deg, rgba(239,68,68,0.25), transparent 40%);
  z-index: -1; pointer-events: none;
}
.lv3-live-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px 14px; }
.lv3-live-title { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.5); }
.lv3-live-inst { font-size: 12px; color: var(--muted); font-weight: 500; margin-top: 2px; }
.lv3-live-badge {
  display: inline-flex; align-items: center; gap: 6px; background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.4); color: #ff5555; font-size: 10px; font-weight: 900;
  letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px;
  box-shadow: 0 0 15px rgba(239,68,68,0.2);
}
.lv3-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff5555; box-shadow: 0 0 8px #ff5555; animation: lv3-dot-pulse 1.5s ease-in-out infinite; }
@keyframes lv3-dot-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.8); } }

/* Video embed */
.lv3-video-wrap { position: relative; width: 100%; padding-top: 56.25%; border-radius: 20px; overflow: hidden; background: #0A0A0C; box-shadow: inset 0 2px 10px rgba(0,0,0,0.8); }
.lv3-video-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }

/* Chat embed */
.lv3-chat-wrap {
  height: 200px; margin-top: 8px; border-radius: 18px;
  background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.04);
  box-shadow: inset 0 4px 15px rgba(0,0,0,0.8);
  overflow: hidden; position: relative;
}
.lv3-chat-wrap iframe { width: 100%; height: 100%; border: none; }
.lv3-chat-header {
  padding: 10px 14px; font-size: 11px; font-weight: 800; color: #fff; letter-spacing: 0.05em;
  text-transform: uppercase; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; justify-content: space-between; align-items: center;
}
.lv3-chat-count { color: var(--gold); font-size: 10px; font-weight: 700; }

/* Reactions zone overlaid on chat */
.lv3-reactions-area { position: absolute; bottom: 60px; right: 8px; width: 100px; height: 130px; overflow: visible; pointer-events: none; z-index: 10; }
@keyframes lv3-reaction-float {
  0%   { transform: translateY(20px) scale(0.5) rotate(0deg); opacity: 0; }
  20%  { transform: translateY(0) scale(1.4) rotate(-10deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(-130px) scale(1) rotate(15deg); opacity: 0; }
}
.lv3-floating-reaction { position: absolute; bottom: 0; font-size: 30px; animation: lv3-reaction-float var(--dur, 2.5s) cubic-bezier(0.16,1,0.3,1) forwards; pointer-events: none; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.8)); }

/* Reaction buttons */
.lv3-reaction-row { display: flex; gap: 8px; justify-content: center; margin-top: 8px; padding: 0 4px 4px; }
.lv3-reaction-btn {
  flex: 1; max-width: 56px; font-size: 22px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; padding: 12px 0; cursor: pointer; outline: none;
  transition: all 0.2s cubic-bezier(0.16,1,0.3,1); box-shadow: inset 0 1px 1px rgba(255,255,255,0.03);
  position: relative; overflow: hidden;
}
.lv3-reaction-btn::after {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at center, rgba(212,175,55,0.4) 0%, transparent 70%);
  opacity: 0; transition: opacity 0.2s; pointer-events: none;
}
.lv3-reaction-btn:active { transform: scale(0.85); background: rgba(212,175,55,0.1); border-color: rgba(212,175,55,0.5); box-shadow: 0 4px 12px rgba(212,175,55,0.2); }
.lv3-reaction-btn:active::after { opacity: 1; }

/* Notifications toggle */
.lv3-notify-glass {
  background: var(--surface); border: 1px solid var(--border); border-radius: 24px;
  padding: 16px 20px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05);
  cursor: pointer; transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
  -webkit-user-select: none; user-select: none;
}
.lv3-notify-glass:active { transform: scale(0.97); background: var(--surface-hover); }
.lv3-notify-left { display: flex; align-items: center; gap: 14px; }
.lv3-notify-icon {
  width: 42px; height: 42px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
  border: 1px solid var(--border); display: grid; place-items: center; color: var(--muted); transition: all 0.3s;
}
.lv3-notify-glass.on .lv3-notify-icon { background: rgba(212,175,55,0.15); border-color: rgba(212,175,55,0.4); color: var(--gold); box-shadow: 0 0 15px rgba(212,175,55,0.2); }
.lv3-notify-title { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
.lv3-notify-sub { font-size: 12px; color: var(--muted); margin-top: 2px; font-weight: 500; transition: color 0.3s; }
.lv3-notify-glass.on .lv3-notify-sub { color: rgba(212,175,55,0.8); }
.lv3-switch { width: 50px; height: 30px; border-radius: 15px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); position: relative; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); flex-shrink: 0; }
.lv3-switch-thumb { position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; border-radius: 50%; background: #666; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
.lv3-notify-glass.on .lv3-switch { background: rgba(212,175,55,0.2); border-color: var(--gold); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2), 0 0 10px rgba(212,175,55,0.2); }
.lv3-notify-glass.on .lv3-switch-thumb { left: 22px; background: linear-gradient(135deg, #FFF0B3, #D4AF37); box-shadow: 0 2px 8px rgba(212,175,55,0.5), inset 0 1px 1px rgba(255,255,255,0.8); }

/* Next Up cards */
.lv3-nextup-card {
  display: flex; gap: 16px; background: var(--surface); border: 1px solid var(--border);
  border-radius: 20px; padding: 16px; transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); margin-bottom: 10px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.05);
}
.lv3-nextup-card:active { transform: scale(0.97); background: var(--surface-hover); }
.lv3-nextup-time {
  flex-shrink: 0; text-align: center; border-right: 1px solid var(--border);
  padding-right: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 68px;
}
.lv3-nextup-time-label { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
.lv3-nextup-time-num { font-size: 20px; font-weight: 900; color: #fff; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
.lv3-nextup-time-ampm { font-size: 11px; font-weight: 800; color: var(--muted); margin-top: 4px; }
.lv3-nextup-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.lv3-nextup-title { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 4px; letter-spacing: -0.01em; }
.lv3-nextup-meta { font-size: 13px; color: var(--muted); font-weight: 500; }
.lv3-nextup-pill {
  display: inline-flex; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase; background: rgba(212,175,55,0.1); color: var(--gold2);
  border: 1px solid rgba(212,175,55,0.2); margin-top: 8px; align-self: flex-start;
}
.lv3-nextup-pill.nogi { color: #38bdf8; background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.2); }
.lv3-nextup-pill.kids { color: #4ade80; background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.2); }

/* Offline card */
.lv3-offline-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 28px;
  padding: 48px 28px; text-align: center; margin-top: 16px; position: relative; overflow: hidden;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05);
}
.lv3-offline-rings { position: absolute; top: 20%; left: 50%; transform: translate(-50%,-50%); width: 200px; height: 200px; pointer-events: none; }
.lv3-offline-rings::before, .lv3-offline-rings::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(255,255,255,0.05);
  animation: lv3-ping 3s cubic-bezier(0.16,1,0.3,1) infinite;
}
.lv3-offline-rings::after { animation-delay: 1.5s; }
@keyframes lv3-ping { 0% { transform:scale(0.2); opacity:1; } 100% { transform:scale(1.5); opacity:0; } }
.lv3-offline-icon { font-size: 44px; margin-bottom: 16px; position: relative; z-index: 2; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); }
.lv3-offline-title { font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 8px; letter-spacing: -0.01em; position: relative; z-index: 2; }
.lv3-offline-sub { font-size: 14px; color: var(--muted); line-height: 1.6; position: relative; z-index: 2; font-weight: 500; }

/* Premium filter track */
.lv3-filter-track {
  display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
  background: rgba(0,0,0,0.5); padding: 6px; border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.04); box-shadow: inset 0 4px 10px rgba(0,0,0,0.6);
  margin-bottom: 16px; align-items: center;
}
.lv3-filter-track::-webkit-scrollbar { display: none; }
.lv3-cat-btn {
  flex-shrink: 0; padding: 10px 18px; border-radius: 14px; outline: none;
  background: transparent; color: var(--muted); font-weight: 700; font-size: 13px;
  border: 1px solid transparent; cursor: pointer; transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
}
.lv3-cat-btn:active { transform: scale(0.92); }
.lv3-cat-btn.active {
  color: #000; font-weight: 800;
  background: linear-gradient(135deg, #FFF0B3, #D4AF37);
  border-color: rgba(255,255,255,0.4);
  box-shadow: 0 4px 12px rgba(212,175,55,0.4), inset 0 1px 1px rgba(255,255,255,0.8);
}

/* Archive rows */
.lv3-archive-row {
  display: flex; gap: 14px; background: rgba(18,18,22,0.5); border-radius: 18px; overflow: hidden;
  text-decoration: none; border: 1px solid var(--border); transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
  margin-bottom: 12px; backdrop-filter: blur(10px); box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  align-items: stretch;
}
.lv3-archive-row:active { transform: scale(0.97); border-color: rgba(212,175,55,0.3); }
.lv3-archive-thumb { width: min(130px,32vw); flex-shrink: 0; background: #0A0A0C; position: relative; border-right: 1px solid var(--border); }
.lv3-archive-thumb img { width: 100%; height: 100%; object-fit: cover; }
.lv3-archive-thumb-empty { width: 100%; min-height: 84px; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 28px; opacity: 0.8; }
.lv3-archive-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); }
.lv3-archive-play-icon { width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: grid; place-items: center; border: 1px solid rgba(255,255,255,0.1); }
.lv3-archive-info { flex: 1; padding: 14px 14px 14px 0; display: flex; flex-direction: column; justify-content: center; }
.lv3-archive-title { font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 6px; line-height: 1.3; letter-spacing: -0.01em; }
.lv3-archive-meta { font-size: 12px; color: var(--muted); font-weight: 500; }
.lv3-archive-instructor { font-size: 11px; color: #555; margin-top: 4px; font-weight: 600; }
.lv3-archive-pill { display: inline-flex; margin-top: 8px; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.05); color: #ccc; border: 1px solid var(--border); align-self: flex-start; }

/* Stagger */
@keyframes lv3-stagger-in { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
.lv3-stagger { animation: lv3-stagger-in 0.6s cubic-bezier(0.16,1,0.3,1) both; }
`;function K(){if(typeof document>"u"||document.getElementById(N))return;const r=document.createElement("style");r.id=N,r.textContent=H,document.head.appendChild(r)}function V(){const[r,c]=i.useState(()=>{try{return localStorage.getItem("lbjj_stream_notify")==="1"}catch{return!1}}),d=()=>{const s=!r;c(s);try{localStorage.setItem("lbjj_stream_notify",s?"1":"0")}catch{}navigator.vibrate&&navigator.vibrate(s?[10,30,10]:[10])};return e.jsxs("div",{className:`lv3-notify-glass${r?" on":""}`,onClick:d,children:[e.jsxs("div",{className:"lv3-notify-left",children:[e.jsx("div",{className:"lv3-notify-icon",children:e.jsx(W,{size:20})}),e.jsxs("div",{children:[e.jsx("div",{className:"lv3-notify-title",children:"Stream Alerts"}),e.jsx("div",{className:"lv3-notify-sub",children:r?"On — We'll alert you":"Off"})]})]}),e.jsx("div",{className:"lv3-switch",children:e.jsx("div",{className:"lv3-switch-thumb"})})]})}function q({item:r}){const[c,d]=r.time.split(" "),s=r.category==="No-Gi"?"lv3-nextup-pill nogi":r.category==="Kids"?"lv3-nextup-pill kids":"lv3-nextup-pill";return e.jsxs("div",{className:"lv3-nextup-card",children:[e.jsxs("div",{className:"lv3-nextup-time",children:[e.jsx("div",{className:"lv3-nextup-time-label",children:r.label}),e.jsx("div",{className:"lv3-nextup-time-num",children:c}),e.jsx("div",{className:"lv3-nextup-time-ampm",children:d})]}),e.jsxs("div",{className:"lv3-nextup-info",children:[e.jsx("div",{className:"lv3-nextup-title",children:r.title}),e.jsxs("div",{className:"lv3-nextup-meta",children:["w/ ",r.instructor]}),e.jsx("div",{className:s,children:r.category})]})]})}function ie(){const[r,c]=i.useState({isLive:!1,videoId:"",videoUrl:"",className:"",instructor:"",startedAt:"",durationMinutes:0,thumbnail:""}),[d,s]=i.useState([]),[v,z]=i.useState(""),[S,I]=i.useState(!0),[C,g]=i.useState(!0),[A,m]=i.useState(!1),[E,u]=i.useState([]),b=i.useRef(0),w=i.useRef(null);i.useEffect(()=>{K()},[]);const _=t=>{b.current=(b.current+1)%4;const a=Date.now()+Math.random(),n=2+Math.random()*.8;u(o=>[...o,{id:a,emoji:t,lane:b.current,duration:n}]),navigator.vibrate&&navigator.vibrate(10),setTimeout(()=>u(o=>o.filter(R=>R.id!==a)),3e3)};i.useEffect(()=>{j().then(c).finally(()=>I(!1));const t=setInterval(()=>j().then(c),3e4);return()=>clearInterval(t)},[]),i.useEffect(()=>{g(!0),m(!1),P(v||void 0).then(t=>{s(t),g(!1)}).catch(()=>{m(!0),g(!1)})},[v]);const L=(t,a)=>{z(t==="All"?"":t);const n=w.current;if(n&&a){const o=a.offsetLeft-n.offsetWidth/2+a.offsetWidth/2;n.scrollTo({left:o,behavior:"smooth"})}},[T,D]=i.useState([]);i.useEffect(()=>{O().then(D)},[]);const p=r.videoId?`lbjj_tunein_${r.videoId}`:"",[l,x]=i.useState(!1),[f,h]=i.useState(!1);i.useEffect(()=>{if(!p){x(!1);return}try{x(!!localStorage.getItem(p))}catch{x(!1)}},[p]);const F=async()=>{if(!(l||!r.isLive||f||!p)){h(!0);try{const t=$();if(!t){h(!1);return}const n=(()=>{try{const o=JSON.parse(localStorage.getItem("lbjj_game_stats_v2")||"{}");return o.totalXP||o.xp||0}catch{return 0}})()+15;try{const o=JSON.parse(localStorage.getItem("lbjj_game_stats_v2")||"{}");o.totalXP=n,o.xp=n,localStorage.setItem("lbjj_game_stats_v2",JSON.stringify(o)),window.dispatchEvent(new Event("xp-updated"))}catch{}await B("saveMemberStats",{token:t,totalPoints:n,source:"stream_watch"}),localStorage.setItem(p,"1"),x(!0)}catch(t){console.error("Tune in XP error:",t)}finally{h(!1)}}},y=r.videoId?`${J}?v=${r.videoId}&embed_domain=${window.location.hostname}`:null;return S?e.jsxs("div",{className:"lv3-root app-content",children:[e.jsxs("div",{className:"lv3-header",children:[e.jsxs("div",{children:[e.jsx("h1",{style:{fontSize:24,fontWeight:900,margin:0,color:"#fff"},children:"Live"}),e.jsx("p",{style:{fontSize:13,color:"#888",margin:"2px 0 0"},children:"Class Streaming"})]}),e.jsx("a",{href:"/#/",className:"lv3-close-btn",children:e.jsx(k,{size:18})})]}),e.jsxs("div",{style:{padding:"48px 20px",textAlign:"center"},children:[e.jsx("div",{style:{fontSize:36,marginBottom:12},children:"📡"}),e.jsx("div",{style:{fontSize:13,color:"#555"},children:"Connecting…"})]})]}):e.jsxs("div",{className:"lv3-root app-content",children:[e.jsxs("div",{className:"lv3-ambient",children:[e.jsx("div",{className:"lv3-orb lv3-orb1"}),e.jsx("div",{className:"lv3-orb lv3-orb2"})]}),e.jsxs("div",{className:"lv3-content",children:[e.jsxs("div",{className:"lv3-header",children:[e.jsxs("div",{children:[e.jsx("h1",{style:{fontSize:24,fontWeight:900,margin:0,color:"#fff",letterSpacing:"-0.02em"},children:"Live"}),e.jsx("p",{style:{fontSize:13,color:"var(--muted)",margin:"2px 0 0",fontWeight:600},children:"Class Streaming"})]}),e.jsx("a",{href:"/#/",className:"lv3-close-btn",children:e.jsx(k,{size:18})})]}),e.jsxs("div",{className:"lv3-scroll",children:[r.isLive&&e.jsx("div",{className:"lv3-stagger",style:{animationDelay:"50ms"},children:e.jsxs("div",{className:"lv3-live-wrap",children:[e.jsxs("div",{className:"lv3-live-header",children:[e.jsxs("div",{children:[e.jsx("div",{className:"lv3-live-title",children:r.className}),e.jsxs("div",{className:"lv3-live-inst",children:["w/ ",r.instructor]})]}),e.jsxs("span",{className:"lv3-live-badge",children:[e.jsx("span",{className:"lv3-live-dot"}),"LIVE"]})]}),e.jsx("div",{className:"lv3-video-wrap",children:e.jsx("iframe",{src:U(r.videoId),allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",allowFullScreen:!0,title:r.className})}),y&&e.jsxs("div",{className:"lv3-chat-wrap",children:[e.jsx("div",{className:"lv3-chat-header",children:e.jsx("span",{children:"Live Chat"})}),e.jsx("iframe",{src:y,title:"Live Chat"}),e.jsx("div",{style:{position:"absolute",bottom:60,right:8,width:100,height:130,overflow:"visible",pointerEvents:"none",zIndex:10},children:E.map(t=>e.jsx("div",{className:"lv3-floating-reaction",style:{right:10+t.lane*22,"--dur":`${t.duration}s`},children:t.emoji},t.id))})]}),e.jsx("div",{className:"lv3-reaction-row",children:Y.map(t=>e.jsx("button",{className:"lv3-reaction-btn",onClick:()=>_(t),children:t},t))}),e.jsx("button",{onClick:F,disabled:l||f,style:{width:"100%",padding:"13px",borderRadius:14,cursor:l?"default":"pointer",background:l?"rgba(34,197,94,0.08)":"linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",border:`1px solid ${l?"rgba(34,197,94,0.3)":"rgba(212,175,55,0.25)"}`,color:l?"#22c55e":"#D4AF37",fontSize:13,fontWeight:800,letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",margin:"8px 4px 4px",WebkitTapHighlightColor:"transparent"},children:l?"✓ Tuned In — +15 XP earned":f?"Checking in…":"📡 Tune In — Earn 15 XP"})]})}),!r.isLive&&e.jsx("div",{className:"lv3-stagger",style:{animationDelay:"50ms"},children:e.jsxs("div",{className:"lv3-offline-card",children:[e.jsx("div",{className:"lv3-offline-rings"}),e.jsx("div",{className:"lv3-offline-icon",children:"📡"}),e.jsx("div",{className:"lv3-offline-title",children:"No class live"}),e.jsx("div",{className:"lv3-offline-sub",children:"We'll alert you when a stream begins."})]})}),e.jsx("div",{className:"lv3-stagger",style:{animationDelay:"150ms"},children:e.jsx(V,{})}),e.jsxs("div",{className:"lv3-stagger",style:{marginTop:32,animationDelay:"200ms"},children:[e.jsx("div",{className:"lv3-section-label",children:"Next Up"}),T.map((t,a)=>e.jsx("div",{className:"lv3-stagger",style:{animationDelay:`${250+a*50}ms`},children:e.jsx(q,{item:t})},t.id))]}),e.jsxs("div",{className:"lv3-stagger",style:{marginTop:32,animationDelay:"350ms"},children:[e.jsx("div",{className:"lv3-section-label",children:"Class Archive"}),e.jsx("div",{className:"lv3-filter-track",ref:w,children:G.map(t=>e.jsx("button",{className:`lv3-cat-btn${v===(t==="All"?"":t)?" active":""}`,onClick:a=>L(t,a.currentTarget),children:t},t))}),C?e.jsx(X,{rows:3}):A?e.jsx(M,{heading:"Couldn't load archives",message:"Pull down to retry.",onRetry:()=>window.location.reload(),compact:!0}):d.length===0?e.jsx("div",{style:{textAlign:"center",padding:"32px",color:"#555",fontSize:13},children:"No recordings yet — past streams will appear here."}):e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:0},children:d.map((t,a)=>e.jsxs("a",{href:t.videoUrl,target:"_blank",rel:"noopener noreferrer",className:"lv3-archive-row lv3-stagger",style:{animationDelay:`${400+a*40}ms`},children:[e.jsxs("div",{className:"lv3-archive-thumb",children:[t.thumbnail?e.jsx("img",{src:t.thumbnail,alt:t.title}):e.jsx("div",{className:"lv3-archive-thumb-empty",children:"🎥"}),e.jsx("div",{className:"lv3-archive-play",children:e.jsx("div",{className:"lv3-archive-play-icon",children:e.jsx("svg",{width:"10",height:"12",viewBox:"0 0 10 12",fill:"#fff",children:e.jsx("polygon",{points:"1,1 9,6 1,11"})})})})]}),e.jsxs("div",{className:"lv3-archive-info",children:[e.jsx("div",{className:"lv3-archive-title",children:t.title}),e.jsxs("div",{className:"lv3-archive-meta",children:[t.date," · ",t.duration]}),e.jsxs("div",{className:"lv3-archive-instructor",children:["w/ ",t.instructor]}),t.category&&e.jsx("span",{className:"lv3-archive-pill",children:t.category})]})]},t.archiveId))})]})]})]})]})}export{ie as default};
