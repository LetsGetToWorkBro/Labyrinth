const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-DLyjj1q6.js","./vendor-query-C1Sv77l2.js","./vendor-router-ODl1pWfb.js","./vendor-react-D2Kp-oPc.js","./index-BJWS_iEL.css"])))=>i.map(i=>d[i]);
import{u as Pe,an as Ae,h as H,aw as O}from"./index-DLyjj1q6.js";import{j as e}from"./vendor-query-C1Sv77l2.js";import{a as o}from"./vendor-router-ODl1pWfb.js";import"./vendor-react-D2Kp-oPc.js";const V={white:{color:"#e5e7eb",rgb:"229,231,235",label:"Iron Forge"},grey:{color:"#9ca3af",rgb:"156,163,175",label:"Steel Resolve"},gray:{color:"#9ca3af",rgb:"156,163,175",label:"Steel Resolve"},yellow:{color:"#facc15",rgb:"250,204,21",label:"Lightning Strike"},orange:{color:"#ea580c",rgb:"234,88,12",label:"Ember Rush"},green:{color:"#22c55e",rgb:"34,197,94",label:"Viper Fang"},blue:{color:"#3b82f6",rgb:"59,130,246",label:"Frozen Aura"},purple:{color:"#a855f7",rgb:"168,85,247",label:"Void Star"},brown:{color:"#ea580c",rgb:"234,88,12",label:"Blood Flame"},black:{color:"#eab308",rgb:"234,179,8",label:"Grandmaster Crown"}};function Be(r){const l=(r||"white").toLowerCase(),d=l.split("_")[0];return V[l]||V[d]||V.white}const j=[{level:1,xp:0},{level:2,xp:100},{level:3,xp:250},{level:4,xp:450},{level:5,xp:700},{level:6,xp:1e3},{level:7,xp:1350},{level:8,xp:1750},{level:9,xp:2200},{level:10,xp:2700},{level:11,xp:3250},{level:12,xp:3850},{level:13,xp:4500},{level:14,xp:5200},{level:15,xp:6e3},{level:16,xp:6900},{level:17,xp:7900},{level:18,xp:9e3},{level:19,xp:10200},{level:20,xp:11500},{level:25,xp:19500},{level:30,xp:31500},{level:40,xp:6e4},{level:50,xp:1e5}];function Te(r){for(let l=j.length-1;l>=0;l--)if(r>=j[l].xp){if(l===j.length-1)return j[l].level;const d=j[l+1],f=d.level-j[l].level,a=(r-j[l].xp)/(d.xp-j[l].xp);return Math.floor(j[l].level+a*f)}return 1}function _e(r,l){const d=(r||"white").toLowerCase();if(!["grey","gray","yellow","orange","green"].includes(d))return{beltColor:d,barColor:d==="black"?"red":"black"};const a=d==="gray"?"grey":d;return l==="white"?{beltColor:`${a}_white`,barColor:"black"}:l==="black"?{beltColor:`${a}_black`,barColor:"black"}:{beltColor:a,barColor:"none"}}function We(r,l,d){const f={white:{main:"#f8f8f8",edge:"#d4d4d4"},blue:{main:"#2563eb",edge:"#1d4ed8"},purple:{main:"#9333ea",edge:"#7e22ce"},brown:{main:"#78350f",edge:"#451a03"},black:{main:"#18181b",edge:"#000000"},grey:{main:"#9ca3af",edge:"#6b7280"},yellow:{main:"#facc15",edge:"#ca8a04"},orange:{main:"#ea580c",edge:"#c2410c"},green:{main:"#22c55e",edge:"#16a34a"}},a=440,n=56,N=6,x=84,s=a-x-16;let S=f.white.main,$=!1,P=!1,C="";if(f[r])S=f[r].main;else if(r==="red_black")$=!0;else if(r.includes("_")){const h=r.split("_");S=f[h[0]]?f[h[0]].main:S,P=!0,C=h[1]==="white"?"#f8f8f8":"#18181b"}let z="#18181b";l==="red"&&(z="#ef4444"),l==="white"&&(z="#f8f8f8");const L=`<defs>
    <filter id="beltTexture" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" in="noise" result="coloredNoise"/>
      <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply"/>
    </filter>
    <filter id="beltShadow" x="-20%" y="-20%" width="140%" height="200%">
      <feDropShadow dx="0" dy="20" stdDeviation="15" flood-opacity="0.6"/>
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.4"/>
    </filter>
    <linearGradient id="beltCurve" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.3)"/>
      <stop offset="10%" stop-color="rgba(255,255,255,0.1)"/>
      <stop offset="40%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="85%" stop-color="rgba(0,0,0,0.2)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
    </linearGradient>
    <linearGradient id="tapeCurve" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.6)"/>
      <stop offset="15%" stop-color="rgba(255,255,255,0.1)"/>
      <stop offset="50%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="85%" stop-color="rgba(0,0,0,0.2)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.5)"/>
    </linearGradient>
    <linearGradient id="barShadowLeft" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(0,0,0,0.7)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
    <linearGradient id="barShadowRight" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.7)"/>
    </linearGradient>
  </defs>`;let y="";if($){y+=`<rect x="0" y="0" width="${a}" height="${n}" rx="${N}" fill="#ef4444" />`;for(let h=0;h<a;h+=45)y+=`<rect x="${h}" y="0" width="22.5" height="${n}" fill="#18181b" />`}else if(y+=`<rect x="0" y="0" width="${a}" height="${n}" rx="${N}" fill="${S}" />`,P){const m=(n-16)/2,u=a-(s+x);y+=`<rect x="0" y="${m}" width="${s}" height="16" fill="${C}" />
        <rect x="0" y="${m}" width="${s}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="0" y="${m+16-2.5}" width="${s}" height="2.5" fill="rgba(255,255,255,0.3)" />
        <rect x="${s+x}" y="${m}" width="${u}" height="16" fill="${C}" />
        <rect x="${s+x}" y="${m}" width="${u}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="${s+x}" y="${m+16-2.5}" width="${u}" height="2.5" fill="rgba(255,255,255,0.3)" />`}const E=`<line x1="8" y1="10" x2="${a-8}" y2="10" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="18" x2="${a-8}" y2="18" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${n-18}" x2="${a-8}" y2="${n-18}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${n-10}" x2="${a-8}" y2="${n-10}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="11" x2="${a-8}" y2="11" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />
    <line x1="8" y1="19" x2="${a-8}" y2="19" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />`;let g="";if(l!=="none"){g+=`<rect x="${s-5}" y="0" width="5" height="${n}" fill="url(#barShadowLeft)" />`,g+=`<rect x="${s+x}" y="0" width="5" height="${n}" fill="url(#barShadowRight)" />`,g+=`<rect x="${s}" y="0" width="${x}" height="${n}" fill="${z}" />`,g+=`<rect x="${s}" y="0" width="1.5" height="${n}" fill="rgba(255,255,255,0.4)" />`,g+=`<rect x="${s+x-1.5}" y="0" width="1.5" height="${n}" fill="rgba(0,0,0,0.8)" />`;const h=l==="white"?"#18181b":"#ffffff";for(let m=0;m<d;m++){const u=s+x-16-m*15;g+=`<rect x="${u-3}" y="0" width="14" height="${n}" fill="rgba(0,0,0,0.5)" />`,g+=`<rect x="${u}" y="0" width="8" height="${n}" fill="${h}" />`,g+=`<rect x="${u}" y="0" width="8" height="${n}" fill="url(#tapeCurve)" />`,g+=`<rect x="${u}" y="0" width="1" height="${n}" fill="rgba(255,255,255,0.6)" />`,g+=`<rect x="${u+7}" y="0" width="1" height="${n}" fill="rgba(0,0,0,0.6)" />`}}return`<svg viewBox="0 -30 ${a} ${n+60}" width="100%" height="100%">
    ${L}
    <g filter="url(#beltShadow)">
      <g filter="url(#beltTexture)">
        ${y}
        <rect x="0" y="0" width="${a}" height="${n}" rx="${N}" fill="url(#beltCurve)" />
        ${E}
        ${g}
        <rect x="0" y="0" width="${a}" height="${n}" rx="${N}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="2" />
        <rect x="1" y="1" width="${a-2}" height="${n-2}" rx="${N}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
      </g>
    </g>
  </svg>`}const Re=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.acv2-root {
  --bg: #05060a;
  --card: rgba(13,15,20,0.7);
  --border: rgba(255,255,255,0.07);
  --text: #f0f2f5;
  --muted: #9ca3af;
  --subtle: rgba(255,255,255,0.04);
  padding-top: 0; /* safe area handled by top-nav */
}

.acv2-root * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
.acv2-root {
  font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased;
  background: radial-gradient(ellipse 80% 40% at 50% -10%, rgba(var(--th-rgb),0.15), transparent), var(--bg);
  color: var(--text); min-height: 100vh; padding-bottom: 100px;
  transition: background 0.5s ease;
  overflow-y: auto; overflow-x: hidden;
}

/* TOP NAV */
.acv2-root .top-nav {
  position: sticky; top: 0; z-index: 50;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 20px 14px;
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(5,6,10,0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.acv2-root .nav-back {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; color: var(--text);
  font: 600 15px/1 'Inter',sans-serif; cursor: pointer; transition: opacity 0.2s;
  min-height: 44px;
  min-width: 44px;
}
.acv2-root .nav-back:active { opacity: 0.6; }
.acv2-root .nav-title { font-size: 15px; font-weight: 700; color: var(--muted); }

/* LAYOUT & VIEWS */
.acv2-root .page { max-width: 480px; margin: 0 auto; padding: 24px 16px; position: relative; }
.acv2-root .view { display: none; flex-direction: column; gap: 16px; animation: acv2SlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.acv2-root .view.active { display: flex; }
@keyframes acv2SlideIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* CARDS */
.acv2-root .card {
  background: var(--card); border: 1px solid var(--border); border-radius: 24px;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04);
  overflow: hidden;
}
.acv2-root .card-pad { padding: 24px; }
.acv2-root .sec-title {
  font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--muted); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
.acv2-root .sec-title svg { color: var(--th); transition: color 0.5s; }

/* HERO HEADER */
.acv2-root .hero { display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; padding: 36px 24px 28px; }
.acv2-root .hero-glow {
  position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
  width: 180px; height: 180px; background: var(--th); filter: blur(80px); opacity: 0.15;
  pointer-events: none; transition: background 0.5s, opacity 0.5s;
}
.acv2-root .avatar-ring-wrap { position: relative; width: 96px; height: 96px; margin-bottom: 18px; z-index: 2; cursor: pointer; transition: transform 0.2s; }
.acv2-root .avatar-ring-wrap:active { transform: scale(0.95); }
.acv2-root .avatar-spin {
  position: absolute; inset: -5px; border-radius: 50%; border: 2px dashed var(--th);
  animation: acv2Spin 16s linear infinite; box-shadow: 0 0 18px var(--th-glow); transition: border-color 0.5s, box-shadow 0.5s;
}
@keyframes acv2Spin { to { transform: rotate(360deg); } }
.acv2-root .avatar {
  width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
  background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1);
  display: grid; place-items: center; font-size: 30px; font-weight: 900; color: #fff; position: relative; z-index: 1;
}
.acv2-root .avatar img { width: 100%; height: 100%; object-fit: cover; }
.acv2-root .avatar-edit {
  position: absolute; bottom: -2px; right: -2px; z-index: 3;
  width: 28px; height: 28px;
  padding: 8px;
  margin: -8px;
  border-radius: 50%;
  background: var(--th); border: 2px solid var(--bg);
  display: grid; place-items: center; color: var(--bg);
}
.acv2-root .hero-name { font-size: 24px; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 4px; z-index: 2; }
.acv2-root .hero-tier { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--th); margin-bottom: 12px; z-index: 2; transition: color 0.5s; }

.acv2-root .public-profile-btn {
  z-index: 2; margin-bottom: 24px;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 20px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: #fff; font-size: 11px; font-weight: 600; text-decoration: none;
  cursor: pointer; transition: background 0.2s;
}
.acv2-root .public-profile-btn:hover { background: rgba(255,255,255,0.1); }
.acv2-root .public-profile-btn:active { transform: scale(0.96); }

.acv2-root .belt-wrap { width: 100%; max-width: 420px; margin: 0 auto; z-index: 2; }
.acv2-root .belt-wrap svg { width: 100%; height: auto; display: block; overflow: visible; filter: drop-shadow(0 15px 20px rgba(0,0,0,0.6)); }

/* WALLET BUTTONS */
.acv2-root .wallet-btns { display: flex; gap: 10px; margin-top: 16px; }
.acv2-root .wallet-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 6px; border-radius: 12px;
  background: #000; border: 1px solid rgba(255,255,255,0.15);
  color: #fff; font: 700 13px 'Inter',sans-serif; cursor: pointer; transition: transform 0.2s, background 0.2s;
  white-space: nowrap;
}
.acv2-root .wallet-btn:active { transform: scale(0.97); background: rgba(255,255,255,0.05); }
.acv2-root .wallet-btn.google-btn { background: #1a1b1e; }
.acv2-root .wallet-btn svg { flex-shrink: 0; }

/* SETTINGS ROW */
.acv2-root .settings-list { display: flex; flex-direction: column; }
.acv2-root .setting-row {
  display: flex; align-items: center; gap: 14px; padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.15s;
}
.acv2-root .setting-row:last-child { border-bottom: none; }
.acv2-root .setting-row:active { background: rgba(255,255,255,0.02); border-radius: 12px; }
.acv2-root .setting-icon {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); display: grid; place-items: center; color: var(--text);
}
.acv2-root .setting-icon.accent-icon { background: rgba(var(--th-rgb),0.1); border-color: rgba(var(--th-rgb),0.2); color: var(--th); }
.acv2-root .setting-label { flex: 1; }
.acv2-root .setting-name { font-size: 14px; font-weight: 700; color: var(--text); }
.acv2-root .setting-desc { font-size: 11px; font-weight: 500; color: var(--muted); margin-top: 2px; }
.acv2-root .setting-chevron { color: var(--muted); opacity: 0.5; }
.acv2-root .setting-tag { font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.06em; }
.acv2-root .tag-pro { color: var(--th); background: rgba(var(--th-rgb),0.12); border: 1px solid rgba(var(--th-rgb),0.25); transition: all 0.5s; }

/* MEMBERSHIP & CARDS */
.acv2-root .mem-card {
  background: linear-gradient(135deg, rgba(var(--th-rgb),0.12), rgba(var(--th-rgb),0.04));
  border: 1px solid rgba(var(--th-rgb),0.22); border-radius: 18px; padding: 18px 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; transition: background 0.5s, border-color 0.5s;
}
.acv2-root .mem-info { display: flex; flex-direction: column; gap: 4px; }
.acv2-root .mem-plan { font-size: 16px; font-weight: 900; color: #fff; }
.acv2-root .mem-since { font-size: 11px; font-weight: 600; color: var(--muted); }
.acv2-root .mem-status { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #22c55e; }
.acv2-root .mem-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; animation: acv2PulseDot 2s ease infinite; }
@keyframes acv2PulseDot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.6;transform:scale(1.4);} }

.acv2-root .cc-list { display: flex; flex-direction: column; gap: 10px; }
.acv2-root .cc-row {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
}
.acv2-root .cc-icon { width: 36px; height: 24px; background: #fff; border-radius: 4px; display: grid; place-items: center; }
.acv2-root .cc-details { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.acv2-root .cc-num { font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 1px; }
.acv2-root .cc-exp { font-size: 11px; font-weight: 500; color: var(--muted); }
.acv2-root .cc-primary-badge { font-size: 10px; font-weight: 800; color: var(--th); background: rgba(var(--th-rgb),0.15); padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
.acv2-root .cc-add {
  display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px;
  border: 1px dashed rgba(255,255,255,0.15); border-radius: 14px; color: var(--th); font-size: 13px; font-weight: 700;
  cursor: pointer; transition: background 0.2s; background: rgba(var(--th-rgb),0.05);
}
.acv2-root .cc-add:active { background: rgba(var(--th-rgb),0.1); }

/* DANGER ZONE */
.acv2-root .danger-group { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.acv2-root .btn {
  width: 100%; padding: 16px; border-radius: 16px; font: 700 14px/1 'Inter',sans-serif;
  display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s;
}
.acv2-root .btn:active { transform: scale(0.98); }
.acv2-root .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text); }
.acv2-root .btn-danger { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); color: #ef4444; }
.acv2-root .btn-danger-text { background: none; border: none; color: rgba(239,68,68,0.7); font-size: 12px; padding: 12px; text-decoration: underline; cursor: pointer; }

/* FORMS & INPUTS */
.acv2-root .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.acv2-root .form-group label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.acv2-root .form-input {
  width: 100%; padding: 14px 16px; border-radius: 12px; background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.08); color: #fff; font: 500 15px 'Inter',sans-serif; outline: none; transition: border-color 0.3s;
}
.acv2-root .form-input:focus { border-color: var(--th); box-shadow: 0 0 0 3px rgba(var(--th-rgb),0.15); }
.acv2-root select.form-input { appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; }

.acv2-root .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
.acv2-root .toggle-row:last-child { border-bottom: none; }
.acv2-root .toggle-info { display: flex; flex-direction: column; gap: 4px; }
.acv2-root .toggle-title { font-size: 14px; font-weight: 600; color: #fff; }
.acv2-root .toggle-desc { font-size: 11px; color: var(--muted); }
.acv2-root .switch { position: relative; width: 44px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer; transition: background 0.3s; flex-shrink: 0; }
.acv2-root .switch.on { background: var(--th); }
.acv2-root .switch::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  background: #fff; border-radius: 50%; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.acv2-root .switch.on::after { transform: translateX(20px); }

.acv2-root .btn-save { background: var(--th); color: var(--bg); border: none; margin-top: 8px; }
.acv2-root .ver { text-align: center; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.15); padding: 8px 0; letter-spacing: 0.08em; }

.acv2-root .dep-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 16px; margin-bottom: 12px; }
.acv2-root .dep-avatar { width: 40px; height: 40px; border-radius: 50%; background: #22c55e; display: grid; place-items: center; font-weight: 800; color: #05060a; }
`,Ie=()=>e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:e.jsx("path",{d:"M15 18l-6-6 6-6"})}),k=()=>e.jsx("svg",{className:"setting-chevron",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:e.jsx("path",{d:"M9 18l6-6-6-6"})}),De=()=>e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"}),e.jsx("circle",{cx:"12",cy:"13",r:"4"})]});function Fe(){const{member:r,logout:l,refreshProfile:d}=Pe(),[,f]=Ae(),[a,n]=o.useState("main"),[N,x]=o.useState("My Account");function s(t,i){n(t),x(i),window.scrollTo({top:0,behavior:"smooth"})}function S(){a==="main"?f("/more"):(n("main"),x("My Account"))}const[$,P]=o.useState(()=>{try{return localStorage.getItem("lbjj_profile_picture")}catch{return null}}),C=o.useRef(null),z=t=>{const i=t.target.files?.[0];if(!i)return;const c=document.createElement("canvas");c.width=200,c.height=200;const b=c.getContext("2d");if(!b)return;const p=new Image;p.onload=()=>{const w=Math.min(p.width,p.height),Ee=(p.width-w)/2,Me=(p.height-w)/2;b.drawImage(p,Ee,Me,w,w,0,0,200,200);const ce=c.toDataURL("image/jpeg",.8);P(ce);try{localStorage.setItem("lbjj_profile_picture",ce)}catch{}},p.src=URL.createObjectURL(i)},[L,y]=o.useState(r?.name||""),[E,g]=o.useState(r?.phone||""),[h,m]=o.useState(()=>{try{const t=localStorage.getItem("lbjj_member_profile");if(t)return JSON.parse(t).SecondaryEmail||""}catch{}return""}),[u,de]=o.useState(""),[F,X]=o.useState(!1),[ge,A]=o.useState(!1),[U,B]=o.useState(""),[T,_]=o.useState(!1),[W,J]=o.useState(!1),[he,q]=o.useState(!1),[Y,pe]=o.useState(r?.sizingGiTop||"A2"),[K,xe]=o.useState(r?.sizingRashguard||"Medium"),[Z,me]=o.useState(r?.sizingShorts||"Medium"),[Q,ee]=o.useState(!1),[R,ve]=o.useState(()=>{try{const t=localStorage.getItem("lbjj_notif_prefs");if(t)return JSON.parse(t)}catch{}return{push:!0,email:!0,marketing:!1}}),[te,re]=o.useState({publicProfile:!0,leaderboard:!0}),[I,fe]=o.useState(""),[D,ae]=o.useState(!1),[ie,se]=o.useState(""),v=o.useCallback((t,i)=>{se(t),setTimeout(()=>se(""),2500)},[]);o.useEffect(()=>{const t="lbjj-account-v2-styles";if(!document.getElementById(t)){const i=document.createElement("style");i.id=t,i.textContent=Re,document.head.appendChild(i)}return()=>{const i=document.getElementById(t);i&&i.remove()}},[]);const oe=(r?.belt||"white").toLowerCase(),ue=(r?.beltBar||"").toLowerCase(),be=Number(r?.stripes)||0,M=Be(oe),je=Number(r?.xp)||0,ye=Te(je),we=(r?.name||"M").split(" ").map(t=>t[0]).join("").toUpperCase().slice(0,2),{beltColor:ke,barColor:Ne}=_e(oe,ue),Se=We(ke,Ne,be),ne=(()=>{const t=r?.joinDate||r?.startDate||r?.StartDate||r?.memberSince||r?.["Start Date"]||r?.CreatedAt||r?.createdAt;if(!t)return"";try{return new Date(t).toLocaleDateString("en-US",{month:"short",year:"numeric"})}catch{return""}})(),le=r?.familyMembers||[],Ce=async()=>{if(!navigator.onLine){v("No internet connection");return}if(!T){_(!0);try{const{getToken:t}=await O(async()=>{const{getToken:c}=await import("./index-DLyjj1q6.js").then(b=>b.ay);return{getToken:c}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),i=t()||localStorage.getItem("lbjj_session_token")||"";if(!i){v("Please sign in again"),_(!1);return}window.location.href=`https://labyrinth-pass-server-production.up.railway.app/pass/generate?memberToken=${encodeURIComponent(i)}`}catch{v("Could not generate pass")}finally{_(!1)}}},$e=async()=>{if(!navigator.onLine){v("No internet connection");return}if(!W){J(!0);try{const{getToken:t}=await O(async()=>{const{getToken:p}=await import("./index-DLyjj1q6.js").then(w=>w.ay);return{getToken:p}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),i=t()||localStorage.getItem("lbjj_session_token")||"";if(!i){v("Please sign in again");return}const c=await fetch("https://labyrinth-pass-server-production.up.railway.app/pass/google",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({memberToken:i})});if(!c.ok)throw new Error("Server error");const{saveUrl:b}=await c.json();window.location.href=b}catch{v("Could not generate Google Wallet pass")}finally{J(!1)}}},ze=async()=>{X(!0),A(!1),B("");try{await H("updateMemberProfileApp",{memberEmail:r?.email,name:L,phone:E,secondaryEmail:h});const t=localStorage.getItem("lbjj_member_profile");if(t)try{const i=JSON.parse(t);i.Name=L,i.Phone=E,i.SecondaryEmail=h,localStorage.setItem("lbjj_member_profile",JSON.stringify(i))}catch{}await d(),A(!0),setTimeout(()=>{A(!1),s("main","My Account")},1200)}catch(t){B(t.message||"Failed to save")}X(!1)},Le=async()=>{ee(!0);try{const{getToken:t}=await O(async()=>{const{getToken:c}=await import("./index-DLyjj1q6.js").then(b=>b.ay);return{getToken:c}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),i=t()||"";await H("updateMemberProfileApp",{token:i,sizingGiTop:Y,sizingRashguard:K,sizingShorts:Z}),v("Sizes saved"),setTimeout(()=>s("main","My Account"),800)}catch{v("Could not save sizes")}ee(!1)},G=t=>{ve(i=>{const c={...i,[t]:!i[t]};try{localStorage.setItem("lbjj_notif_prefs",JSON.stringify(c))}catch{}return c})};return o.useEffect(()=>{a==="edit"&&(y(r?.name||""),g(r?.phone||""),B(""),A(!1))},[a,r?.name,r?.phone]),e.jsxs("div",{className:"acv2-root",style:{"--th":M.color,"--th-rgb":M.rgb,"--th-glow":`rgba(${M.rgb},0.35)`},children:[ie&&e.jsx("div",{style:{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:999,background:"rgba(0,0,0,0.9)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"10px 20px",color:"#fff",fontSize:13,fontWeight:600,backdropFilter:"blur(20px)"},children:ie}),e.jsx("input",{ref:C,type:"file",accept:"image/*",onChange:z,style:{display:"none"}}),e.jsxs("nav",{className:"top-nav",children:[e.jsxs("button",{className:"nav-back",onClick:S,children:[e.jsx(Ie,{})," Back"]}),e.jsx("span",{className:"nav-title",children:N}),e.jsx("div",{style:{width:36}})]}),e.jsxs("div",{className:"page",children:[e.jsxs("div",{className:`view ${a==="main"?"active":""}`,children:[e.jsx("div",{className:"card",children:e.jsxs("div",{className:"hero",children:[e.jsx("div",{className:"hero-glow",style:{background:M.color}}),e.jsxs("div",{className:"avatar-ring-wrap",onClick:()=>C.current?.click(),children:[e.jsx("div",{className:"avatar-spin"}),e.jsx("div",{className:"avatar",children:$?e.jsx("img",{src:$,alt:"Profile"}):we}),e.jsx("div",{className:"avatar-edit",children:e.jsx(De,{})})]}),e.jsx("h1",{className:"hero-name",children:r?.name||"Member"}),e.jsxs("div",{className:"hero-tier",children:["LV",ye," • ",M.label]}),e.jsxs("button",{className:"public-profile-btn",onClick:()=>f("/profile"),children:["View Public Profile",e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}),e.jsx("polyline",{points:"15 3 21 3 21 9"}),e.jsx("line",{x1:"10",y1:"14",x2:"21",y2:"3"})]})]}),e.jsx("div",{className:"belt-wrap",dangerouslySetInnerHTML:{__html:Se}})]})}),e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"sec-title",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"5",y:"2",width:"14",height:"20",rx:"2",ry:"2"}),e.jsx("line",{x1:"12",y1:"18",x2:"12.01",y2:"18"})]}),"Digital Access Pass"]}),e.jsx("p",{style:{fontSize:12,color:"var(--muted)",marginBottom:0,lineHeight:1.5},children:"Use your phone to unlock the gym doors and check-in. Add your 24/7 pass to your digital wallet."}),e.jsxs("div",{className:"wallet-btns",children:[e.jsxs("button",{className:"wallet-btn",onClick:Ce,disabled:T,children:[e.jsx("svg",{viewBox:"0 0 384 512",width:"15",height:"15",children:e.jsx("path",{fill:"#fff",d:"M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 24 184.8 8 273.5q-9 53.6 15.3 111.4c16.2 38.6 44.8 84.8 82.2 82.8 35.5-1.9 49.4-23.7 90.1-23.7s52.7 23.7 90.1 21.8c39.4-1.9 64.3-43.6 80.5-80.8-39.6-14.8-67.4-48-67.4-116.3zM255.4 75.3c21.2-24.9 35.5-59.6 31.6-94.3-29.4 1.2-66.3 19.1-88.3 43.9-17.6 19.6-34.6 55.4-30 89.3 32.9 2.5 65.5-13.8 86.7-38.9z"})}),T?"Generating...":"Apple Wallet"]}),e.jsxs("button",{className:"wallet-btn google-btn",onClick:$e,disabled:W,children:[e.jsxs("svg",{viewBox:"0 0 48 48",width:"16",height:"16",children:[e.jsx("path",{fill:"#EA4335",d:"M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"}),e.jsx("path",{fill:"#4285F4",d:"M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"}),e.jsx("path",{fill:"#FBBC05",d:"M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"}),e.jsx("path",{fill:"#34A853",d:"M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"})]}),W?"Generating...":"Google Wallet"]})]})]}),e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"sec-title",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[e.jsx("circle",{cx:"12",cy:"12",r:"3"}),e.jsx("path",{d:"M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"})]}),"Account Settings"]}),e.jsxs("div",{className:"settings-list",children:[e.jsxs("div",{className:"setting-row",onClick:()=>s("edit","Edit Profile"),children:[e.jsx("div",{className:"setting-icon accent-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"12",cy:"7",r:"4"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Edit Profile"}),e.jsx("div",{className:"setting-desc",children:"Name, emails, contact info"})]}),e.jsx(k,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>s("family","Family & Dependents"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Family & Dependents"}),e.jsx("div",{className:"setting-desc",children:"Manage kids' profiles"})]}),e.jsx(k,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>s("sizing","Sizing & Preferences"),children:[e.jsx("div",{className:"setting-icon",children:e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:e.jsx("path",{d:"M20.38 3.46L16 2a8 8 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"})})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Apparel Sizing"}),e.jsx("div",{className:"setting-desc",children:"Gi & No-Gi sizes for pro shop"})]}),e.jsx(k,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>s("events","Events & Seminars"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),e.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),e.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Events & Seminars"}),e.jsx("div",{className:"setting-desc",children:"Registrations and tickets"})]}),e.jsx(k,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>s("connected","Connected Apps"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("rect",{x:"4",y:"2",width:"16",height:"20",rx:"2",ry:"2"}),e.jsx("path",{d:"M12 18h.01"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Connected Apps"}),e.jsx("div",{className:"setting-desc",children:"Apple Health, Whoop, Garmin"})]}),e.jsx(k,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>s("notif","Notifications"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"}),e.jsx("path",{d:"M13.73 21a2 2 0 0 1-3.46 0"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Notifications"}),e.jsx("div",{className:"setting-desc",children:"Push & email preferences"})]}),e.jsx(k,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>s("privacy","Privacy & Security"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2"}),e.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Privacy & Security"}),e.jsx("div",{className:"setting-desc",children:"Password, visibility"})]}),e.jsx(k,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>s("waiver","Waivers"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"}),e.jsx("line",{x1:"16",y1:"13",x2:"8",y2:"13"}),e.jsx("line",{x1:"16",y1:"17",x2:"8",y2:"17"}),e.jsx("polyline",{points:"10 9 9 9 8 9"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Waivers & Agreements"}),e.jsx("div",{className:"setting-desc",children:"View signed documents"})]}),e.jsx(k,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>s("refer","Refer a Friend"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"}),e.jsx("line",{x1:"4",y1:"22",x2:"4",y2:"15"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Refer a Friend"}),e.jsx("div",{className:"setting-desc",children:"Earn XP for referrals"})]}),e.jsx("span",{className:"setting-tag tag-pro",children:"PRO"})]})]})]}),e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"sec-title",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[e.jsx("rect",{x:"2",y:"5",width:"20",height:"14",rx:"2"}),e.jsx("path",{d:"M2 10h20"})]}),"Membership & Billing"]}),e.jsx("div",{className:"mem-card",children:e.jsxs("div",{className:"mem-info",children:[e.jsx("div",{className:"mem-plan",children:r?.membership||r?.plan||"Member"}),e.jsx("div",{className:"mem-since",children:ne?`Member since ${ne}`:"Member"}),e.jsxs("div",{className:"mem-status",children:[e.jsx("div",{className:"mem-dot"})," Active"]})]})}),e.jsx("div",{className:"sec-title",style:{marginTop:16,marginBottom:12,fontSize:10,color:"var(--text)"},children:"Payment Methods"}),e.jsxs("div",{className:"cc-list",children:[e.jsx("div",{style:{padding:"14px 16px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14},children:e.jsx("div",{style:{fontSize:13,color:"var(--muted)"},children:r?.lastFour?`•••• ${r.lastFour}`:"Payment managed through membership portal"})}),e.jsx("div",{style:{padding:"12px 16px",color:"var(--muted)",fontSize:12,textAlign:"center"},children:"Card management available at labyrinth.vision"})]})]}),e.jsxs("div",{className:"danger-group",children:[he?e.jsxs("div",{style:{display:"flex",gap:10},children:[e.jsx("button",{className:"btn btn-outline",onClick:()=>q(!1),style:{flex:1},children:"Cancel"}),e.jsx("button",{className:"btn btn-danger",onClick:l,style:{flex:2},children:"Confirm Sign Out"})]}):e.jsxs("button",{className:"btn btn-danger",onClick:()=>q(!0),children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}),e.jsx("polyline",{points:"16 17 21 12 16 7"}),e.jsx("line",{x1:"21",y1:"12",x2:"9",y2:"12"})]}),"Sign Out"]}),e.jsx("button",{className:"btn-danger-text",onClick:()=>s("delete","Account Deletion"),children:"Request Account Deletion"})]}),e.jsx("div",{className:"ver",children:"LABYRINTH BJJ • V3.6 • MEMBER PORTAL"})]}),e.jsx("div",{className:`view ${a==="edit"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Full Name"}),e.jsx("input",{type:"text",className:"form-input",value:L,onChange:t=>y(t.target.value)})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Primary Email"}),e.jsx("input",{type:"email",inputMode:"email",autoCapitalize:"none",autoCorrect:"off",className:"form-input",value:r?.email||"",disabled:!0,style:{opacity:.6}})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Secondary Email"}),e.jsx("input",{type:"email",inputMode:"email",autoCapitalize:"none",autoCorrect:"off",className:"form-input",placeholder:"backup@email.com",value:h,onChange:t=>m(t.target.value)})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Phone Number"}),e.jsx("input",{type:"tel",inputMode:"tel",className:"form-input",value:E,onChange:t=>g(t.target.value)})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Emergency Contact"}),e.jsx("input",{type:"text",className:"form-input",placeholder:"Name & Number",value:u,onChange:t=>de(t.target.value)})]}),U&&e.jsx("p",{style:{fontSize:13,color:"#ef4444",textAlign:"center"},children:U}),e.jsx("button",{className:"btn btn-save",onClick:ze,disabled:F,children:F?"Saving...":ge?"✓ Saved":"Save Changes"})]})}),e.jsx("div",{className:`view ${a==="family"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsx("div",{className:"sec-title",style:{marginBottom:20},children:"Linked Accounts"}),le.length>0?le.map((t,i)=>{const c=(t.name||t.Name||"FM").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),b={green:"#22c55e",grey:"#9ca3af",yellow:"#facc15",orange:"#ea580c",white:"#e5e7eb",blue:"#3b82f6",purple:"#a855f7"},p=(t.belt||t.Belt||"green").toLowerCase();return e.jsxs("div",{className:"dep-card",children:[e.jsx("div",{className:"dep-avatar",style:{background:b[p]||"#22c55e"},children:c}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{style:{fontWeight:700,fontSize:15,color:"#fff"},children:t.name||t.Name}),e.jsx("div",{style:{fontSize:12,color:b[p]||"#22c55e",fontWeight:600},children:t.type||t.Type||`Kids ${p.charAt(0).toUpperCase()+p.slice(1)} Series`})]}),e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"var(--muted)",strokeWidth:"2.5",children:e.jsx("path",{d:"M9 18l6-6-6-6"})})]},i)}):e.jsxs("div",{style:{padding:20,textAlign:"center",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:16},children:[e.jsx("div",{style:{fontWeight:700,color:"#fff",marginBottom:4},children:"No linked accounts"}),e.jsx("div",{style:{fontSize:11,color:"var(--muted)"},children:"Add dependents to manage their profiles"})]}),e.jsx("div",{style:{padding:"12px 16px",color:"var(--muted)",fontSize:12,textAlign:"center",marginTop:12},children:"Contact staff to add family members"})]})}),e.jsx("div",{className:`view ${a==="sizing"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsx("p",{style:{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.5},children:"Set your sizes here so the pro shop can pre-filter gear and suggest the right fit."}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Gi Size"}),e.jsx("select",{className:"form-input",value:Y,onChange:t=>pe(t.target.value),children:["A0","A1","A2","A3","A4","A5"].map(t=>e.jsx("option",{children:t},t))})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"No-Gi Top / Rash Guard"}),e.jsx("select",{className:"form-input",value:K,onChange:t=>xe(t.target.value),children:["XS","Small","Medium","Large","X-Large","XXL"].map(t=>e.jsx("option",{children:t},t))})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"No-Gi Shorts"}),e.jsx("select",{className:"form-input",value:Z,onChange:t=>me(t.target.value),children:["XS","Small","Medium","Large","X-Large","XXL"].map(t=>e.jsx("option",{children:t},t))})]}),e.jsx("button",{className:"btn btn-save",onClick:Le,disabled:Q,children:Q?"Saving...":"Save Sizes"})]})}),e.jsx("div",{className:`view ${a==="events"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsx("p",{style:{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.5},children:"Manage your registrations for upcoming seminars, camps, and in-house tournaments."}),e.jsxs("div",{style:{padding:20,textAlign:"center",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:16},children:[e.jsx("div",{style:{fontWeight:700,color:"#fff",marginBottom:4},children:"No upcoming events"}),e.jsx("div",{style:{fontSize:11,color:"var(--muted)"},children:"You haven't registered for anything recently."})]})]})}),e.jsx("div",{className:`view ${a==="connected"?"active":""}`,children:e.jsx("div",{className:"card card-pad",children:e.jsx("div",{style:{padding:"12px 0",borderBottom:"1px solid var(--border)"},children:e.jsx("div",{style:{fontSize:13,fontWeight:600,color:"var(--muted)"},children:"Apple Health, Whoop, and Garmin integrations are coming in a future update."})})})}),e.jsx("div",{className:`view ${a==="notif"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"toggle-row",onClick:()=>G("push"),style:{cursor:"pointer"},children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Push Notifications"}),e.jsx("div",{className:"toggle-desc",children:"Class updates and app alerts"})]}),e.jsx("div",{className:`switch ${R.push?"on":""}`})]}),e.jsxs("div",{className:"toggle-row",onClick:()=>G("email"),style:{cursor:"pointer"},children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Email Reminders"}),e.jsx("div",{className:"toggle-desc",children:"Schedule and billing receipts"})]}),e.jsx("div",{className:`switch ${R.email?"on":""}`})]}),e.jsxs("div",{className:"toggle-row",onClick:()=>G("marketing"),style:{cursor:"pointer"},children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Marketing & Promos"}),e.jsx("div",{className:"toggle-desc",children:"Merch drops and seminars"})]}),e.jsx("div",{className:`switch ${R.marketing?"on":""}`})]})]})}),e.jsx("div",{className:`view ${a==="privacy"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"toggle-row",onClick:()=>re(t=>({...t,publicProfile:!t.publicProfile})),style:{cursor:"pointer"},children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Public Profile"}),e.jsx("div",{className:"toggle-desc",children:"Let other members see your belt rank"})]}),e.jsx("div",{className:`switch ${te.publicProfile?"on":""}`})]}),e.jsxs("div",{className:"toggle-row",onClick:()=>re(t=>({...t,leaderboard:!t.leaderboard})),style:{marginBottom:16,cursor:"pointer"},children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Leaderboard Opt-In"}),e.jsx("div",{className:"toggle-desc",children:"Appear on global XP leaderboards"})]}),e.jsx("div",{className:`switch ${te.leaderboard?"on":""}`})]}),e.jsx("div",{className:"sec-title",style:{marginTop:24},children:"Change Password"}),e.jsx("div",{className:"form-group",children:e.jsx("input",{type:"password",className:"form-input",placeholder:"Current Password"})}),e.jsx("div",{className:"form-group",children:e.jsx("input",{type:"password",className:"form-input",placeholder:"New Password"})}),e.jsx("button",{className:"btn btn-outline",style:{marginTop:8},onClick:()=>v(`Password reset email sent to ${r?.email||"your email"}`),children:"Update Password"})]})}),e.jsx("div",{className:`view ${a==="waiver"?"active":""}`,children:e.jsx("div",{className:"card card-pad",children:e.jsxs("div",{className:"cc-list",children:[e.jsxs("div",{className:"cc-row",children:[e.jsx("div",{className:"cc-icon",style:{background:"rgba(255,255,255,0.1)"},children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"2",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),e.jsxs("div",{className:"cc-details",children:[e.jsx("div",{className:"cc-num",children:"Liability Waiver 2024"}),e.jsx("div",{className:"cc-exp",children:"Signed Jan 14, 2024"})]}),e.jsx("div",{className:"cc-primary-badge",style:{background:"rgba(34,197,94,0.15)",color:"#22c55e"},children:"SIGNED"})]}),e.jsxs("div",{className:"cc-row",children:[e.jsx("div",{className:"cc-icon",style:{background:"rgba(255,255,255,0.1)"},children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"2",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),e.jsxs("div",{className:"cc-details",children:[e.jsx("div",{className:"cc-num",children:"Code of Conduct"}),e.jsx("div",{className:"cc-exp",children:"Signed Jan 14, 2024"})]}),e.jsx("div",{className:"cc-primary-badge",style:{background:"rgba(34,197,94,0.15)",color:"#22c55e"},children:"SIGNED"})]})]})})}),e.jsx("div",{className:`view ${a==="refer"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"🤝"}),e.jsx("h2",{style:{fontSize:20,fontWeight:800,marginBottom:8},children:"Invite Friends, Earn XP"}),e.jsxs("p",{style:{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.5},children:["Give your friends a free trial week. If they sign up for a membership, you'll earn ",e.jsx("strong",{children:"5,000 XP"})," and a unique profile badge!"]}),e.jsxs("div",{className:"form-group",style:{textAlign:"left"},children:[e.jsx("label",{children:"Your Referral Link"}),e.jsxs("div",{style:{display:"flex",gap:8},children:[e.jsx("input",{type:"text",className:"form-input",value:`join.labyrinth.com/ref/${(r?.name||"member").split(" ")[0].toLowerCase()}`,readOnly:!0}),e.jsx("button",{className:"btn btn-save",style:{width:"auto",margin:0,padding:"0 16px"},onClick:()=>{navigator.clipboard?.writeText(`join.labyrinth.com/ref/${(r?.name||"member").split(" ")[0].toLowerCase()}`),v("Copied!")},children:"Copy"})]})]})]})}),e.jsx("div",{className:`view ${a==="delete"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsx("h2",{style:{fontSize:18,fontWeight:800,color:"#ef4444",marginBottom:12},children:"Danger Zone"}),e.jsx("p",{style:{fontSize:13,color:"var(--text)",marginBottom:24,lineHeight:1.5},children:"Deleting your account is permanent. All your training history, belt rank progression, and XP will be permanently wiped from the Labyrinth database. Your active membership will also be canceled immediately."}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{style:{color:"#ef4444"},children:'Type "DELETE" to confirm'}),e.jsx("input",{type:"text",className:"form-input",placeholder:"DELETE",value:I,onChange:t=>fe(t.target.value)})]}),e.jsx("button",{className:"btn btn-danger",style:{marginTop:16,opacity:I!=="DELETE"||D?.5:1},disabled:I!=="DELETE"||D,onClick:async()=>{if(r?.email){ae(!0);try{const t=localStorage.getItem("lbjj_session_token")||"";await H("requestAccountDeletion",{token:t,email:r.email,reason:"User requested via app"}),s("main","My Account"),v("Deletion requested — your account will be removed within 48 hours.")}catch{v("Could not submit request. Contact info@labyrinth.vision",!0)}finally{ae(!1)}}},children:D?"Submitting…":"Confirm Deletion Request"})]})})]})]})}export{Fe as default};
