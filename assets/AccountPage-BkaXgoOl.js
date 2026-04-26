const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-C4lel946.js","./vendor-query-C1Sv77l2.js","./vendor-router-ODl1pWfb.js","./vendor-react-D2Kp-oPc.js","./index-KZQiSium.css"])))=>i.map(i=>d[i]);
import{u as Ee,an as Be,aw as G,h as ne}from"./index-C4lel946.js";import{j as e}from"./vendor-query-C1Sv77l2.js";import{a as n}from"./vendor-router-ODl1pWfb.js";import"./vendor-react-D2Kp-oPc.js";const H={white:{color:"#e5e7eb",rgb:"229,231,235",label:"Iron Forge"},grey:{color:"#9ca3af",rgb:"156,163,175",label:"Steel Resolve"},gray:{color:"#9ca3af",rgb:"156,163,175",label:"Steel Resolve"},yellow:{color:"#facc15",rgb:"250,204,21",label:"Lightning Strike"},orange:{color:"#ea580c",rgb:"234,88,12",label:"Ember Rush"},green:{color:"#22c55e",rgb:"34,197,94",label:"Viper Fang"},blue:{color:"#3b82f6",rgb:"59,130,246",label:"Frozen Aura"},purple:{color:"#a855f7",rgb:"168,85,247",label:"Void Star"},brown:{color:"#ea580c",rgb:"234,88,12",label:"Blood Flame"},black:{color:"#eab308",rgb:"234,179,8",label:"Grandmaster Crown"}};function Pe(i){const l=(i||"white").toLowerCase(),g=l.split("_")[0];return H[l]||H[g]||H.white}const j=[{level:1,xp:0},{level:2,xp:100},{level:3,xp:250},{level:4,xp:450},{level:5,xp:700},{level:6,xp:1e3},{level:7,xp:1350},{level:8,xp:1750},{level:9,xp:2200},{level:10,xp:2700},{level:11,xp:3250},{level:12,xp:3850},{level:13,xp:4500},{level:14,xp:5200},{level:15,xp:6e3},{level:16,xp:6900},{level:17,xp:7900},{level:18,xp:9e3},{level:19,xp:10200},{level:20,xp:11500},{level:25,xp:19500},{level:30,xp:31500},{level:40,xp:6e4},{level:50,xp:1e5}];function Ae(i){for(let l=j.length-1;l>=0;l--)if(i>=j[l].xp){if(l===j.length-1)return j[l].level;const g=j[l+1],f=g.level-j[l].level,r=(i-j[l].xp)/(g.xp-j[l].xp);return Math.floor(j[l].level+r*f)}return 1}function Me(i,l){const g=(i||"white").toLowerCase();if(!["grey","gray","yellow","orange","green"].includes(g))return{beltColor:g,barColor:g==="black"?"red":"black"};const r=g==="gray"?"grey":g;return l==="white"?{beltColor:`${r}_white`,barColor:"black"}:l==="black"?{beltColor:`${r}_black`,barColor:"black"}:{beltColor:r,barColor:"none"}}function Te(i,l,g){const f={white:{main:"#f8f8f8",edge:"#d4d4d4"},blue:{main:"#2563eb",edge:"#1d4ed8"},purple:{main:"#9333ea",edge:"#7e22ce"},brown:{main:"#78350f",edge:"#451a03"},black:{main:"#18181b",edge:"#000000"},grey:{main:"#9ca3af",edge:"#6b7280"},yellow:{main:"#facc15",edge:"#ca8a04"},orange:{main:"#ea580c",edge:"#c2410c"},green:{main:"#22c55e",edge:"#16a34a"}},r=440,o=56,k=6,m=84,a=r-m-16;let S=f.white.main,$=!1,P=!1,C="";if(f[i])S=f[i].main;else if(i==="red_black")$=!0;else if(i.includes("_")){const x=i.split("_");S=f[x[0]]?f[x[0]].main:S,P=!0,C=x[1]==="white"?"#f8f8f8":"#18181b"}let z="#18181b";l==="red"&&(z="#ef4444"),l==="white"&&(z="#f8f8f8");const L=`<defs>
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
  </defs>`;let y="";if($){y+=`<rect x="0" y="0" width="${r}" height="${o}" rx="${k}" fill="#ef4444" />`;for(let x=0;x<r;x+=45)y+=`<rect x="${x}" y="0" width="22.5" height="${o}" fill="#18181b" />`}else if(y+=`<rect x="0" y="0" width="${r}" height="${o}" rx="${k}" fill="${S}" />`,P){const v=(o-16)/2,b=r-(a+m);y+=`<rect x="0" y="${v}" width="${a}" height="16" fill="${C}" />
        <rect x="0" y="${v}" width="${a}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="0" y="${v+16-2.5}" width="${a}" height="2.5" fill="rgba(255,255,255,0.3)" />
        <rect x="${a+m}" y="${v}" width="${b}" height="16" fill="${C}" />
        <rect x="${a+m}" y="${v}" width="${b}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="${a+m}" y="${v+16-2.5}" width="${b}" height="2.5" fill="rgba(255,255,255,0.3)" />`}const E=`<line x1="8" y1="10" x2="${r-8}" y2="10" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="18" x2="${r-8}" y2="18" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${o-18}" x2="${r-8}" y2="${o-18}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${o-10}" x2="${r-8}" y2="${o-10}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="11" x2="${r-8}" y2="11" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />
    <line x1="8" y1="19" x2="${r-8}" y2="19" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />`;let h="";if(l!=="none"){h+=`<rect x="${a-5}" y="0" width="5" height="${o}" fill="url(#barShadowLeft)" />`,h+=`<rect x="${a+m}" y="0" width="5" height="${o}" fill="url(#barShadowRight)" />`,h+=`<rect x="${a}" y="0" width="${m}" height="${o}" fill="${z}" />`,h+=`<rect x="${a}" y="0" width="1.5" height="${o}" fill="rgba(255,255,255,0.4)" />`,h+=`<rect x="${a+m-1.5}" y="0" width="1.5" height="${o}" fill="rgba(0,0,0,0.8)" />`;const x=l==="white"?"#18181b":"#ffffff";for(let v=0;v<g;v++){const b=a+m-16-v*15;h+=`<rect x="${b-3}" y="0" width="14" height="${o}" fill="rgba(0,0,0,0.5)" />`,h+=`<rect x="${b}" y="0" width="8" height="${o}" fill="${x}" />`,h+=`<rect x="${b}" y="0" width="8" height="${o}" fill="url(#tapeCurve)" />`,h+=`<rect x="${b}" y="0" width="1" height="${o}" fill="rgba(255,255,255,0.6)" />`,h+=`<rect x="${b+7}" y="0" width="1" height="${o}" fill="rgba(0,0,0,0.6)" />`}}return`<svg viewBox="0 -30 ${r} ${o+60}" width="100%" height="100%">
    ${L}
    <g filter="url(#beltShadow)">
      <g filter="url(#beltTexture)">
        ${y}
        <rect x="0" y="0" width="${r}" height="${o}" rx="${k}" fill="url(#beltCurve)" />
        ${E}
        ${h}
        <rect x="0" y="0" width="${r}" height="${o}" rx="${k}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="2" />
        <rect x="1" y="1" width="${r-2}" height="${o-2}" rx="${k}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
      </g>
    </g>
  </svg>`}const We=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.acv2-root {
  --bg: #05060a;
  --card: rgba(13,15,20,0.7);
  --border: rgba(255,255,255,0.07);
  --text: #f0f2f5;
  --muted: #6b7280;
  --subtle: rgba(255,255,255,0.04);
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
  position: sticky; top: 0; z-index: 50; padding: 14px 20px;
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(5,6,10,0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.acv2-root .nav-back {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; color: var(--text);
  font: 600 15px/1 'Inter',sans-serif; cursor: pointer; transition: opacity 0.2s;
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
  width: 28px; height: 28px; border-radius: 50%;
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
`,_e=()=>e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:e.jsx("path",{d:"M15 18l-6-6 6-6"})}),N=()=>e.jsx("svg",{className:"setting-chevron",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:e.jsx("path",{d:"M9 18l6-6-6-6"})}),Ie=()=>e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"}),e.jsx("circle",{cx:"12",cy:"13",r:"4"})]});function Oe(){const{member:i,logout:l,refreshProfile:g}=Ee(),[,f]=Be(),[r,o]=n.useState("main"),[k,m]=n.useState("My Account");function a(t,s){o(t),m(s),window.scrollTo({top:0,behavior:"smooth"})}function S(){r==="main"?f("/more"):(o("main"),m("My Account"))}const[$,P]=n.useState(()=>{try{return localStorage.getItem("lbjj_profile_picture")}catch{return null}}),C=n.useRef(null),z=t=>{const s=t.target.files?.[0];if(!s)return;const c=document.createElement("canvas");c.width=200,c.height=200;const u=c.getContext("2d");if(!u)return;const p=new Image;p.onload=()=>{const w=Math.min(p.width,p.height),ze=(p.width-w)/2,Le=(p.height-w)/2;u.drawImage(p,ze,Le,w,w,0,0,200,200);const oe=c.toDataURL("image/jpeg",.8);P(oe);try{localStorage.setItem("lbjj_profile_picture",oe)}catch{}},p.src=URL.createObjectURL(s)},[L,y]=n.useState(i?.name||""),[E,h]=n.useState(i?.phone||""),[x,v]=n.useState(()=>{try{const t=localStorage.getItem("lbjj_member_profile");if(t)return JSON.parse(t).SecondaryEmail||""}catch{}return""}),[b,le]=n.useState(""),[O,V]=n.useState(!1),[ce,A]=n.useState(!1),[F,M]=n.useState(""),[T,W]=n.useState(!1),[_,X]=n.useState(!1),[de,U]=n.useState(!1),[J,ge]=n.useState(i?.sizingGiTop||"A2"),[Y,he]=n.useState(i?.sizingRashguard||"Medium"),[q,xe]=n.useState(i?.sizingShorts||"Medium"),[K,Z]=n.useState(!1),[I,pe]=n.useState(()=>{try{const t=localStorage.getItem("lbjj_notif_prefs");if(t)return JSON.parse(t)}catch{}return{push:!0,email:!0,marketing:!1}}),[Q,ee]=n.useState({publicProfile:!0,leaderboard:!0}),[R,me]=n.useState(""),[te,ie]=n.useState(""),d=n.useCallback(t=>{ie(t),setTimeout(()=>ie(""),2500)},[]);n.useEffect(()=>{const t="lbjj-account-v2-styles";if(!document.getElementById(t)){const s=document.createElement("style");s.id=t,s.textContent=We,document.head.appendChild(s)}return()=>{const s=document.getElementById(t);s&&s.remove()}},[]);const re=(i?.belt||"white").toLowerCase(),ve=(i?.beltBar||"").toLowerCase(),fe=Number(i?.stripes)||0,B=Pe(re),be=Number(i?.xp)||0,ue=Ae(be),je=(i?.name||"M").split(" ").map(t=>t[0]).join("").toUpperCase().slice(0,2),{beltColor:ye,barColor:we}=Me(re,ve),Ne=Te(ye,we,fe),se=(()=>{const t=i?.joinDate||i?.startDate||i?.StartDate||i?.memberSince||i?.["Start Date"]||i?.CreatedAt||i?.createdAt;if(!t)return"";try{return new Date(t).toLocaleDateString("en-US",{month:"short",year:"numeric"})}catch{return""}})(),ae=i?.familyMembers||[],ke=async()=>{if(!navigator.onLine){d("No internet connection");return}if(!T){W(!0);try{const{getToken:t}=await G(async()=>{const{getToken:c}=await import("./index-C4lel946.js").then(u=>u.ay);return{getToken:c}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),s=t()||localStorage.getItem("lbjj_session_token")||"";if(!s){d("Please sign in again"),W(!1);return}window.location.href=`https://labyrinth-pass-server-production.up.railway.app/pass/generate?memberToken=${encodeURIComponent(s)}`}catch{d("Could not generate pass")}finally{W(!1)}}},Se=async()=>{if(!navigator.onLine){d("No internet connection");return}if(!_){X(!0);try{const{getToken:t}=await G(async()=>{const{getToken:p}=await import("./index-C4lel946.js").then(w=>w.ay);return{getToken:p}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),s=t()||localStorage.getItem("lbjj_session_token")||"";if(!s){d("Please sign in again");return}const c=await fetch("https://labyrinth-pass-server-production.up.railway.app/pass/google",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({memberToken:s})});if(!c.ok)throw new Error("Server error");const{saveUrl:u}=await c.json();window.location.href=u}catch{d("Could not generate Google Wallet pass")}finally{X(!1)}}},Ce=async()=>{V(!0),A(!1),M("");try{await ne("updateMemberProfileApp",{memberEmail:i?.email,name:L,phone:E,secondaryEmail:x});const t=localStorage.getItem("lbjj_member_profile");if(t)try{const s=JSON.parse(t);s.Name=L,s.Phone=E,s.SecondaryEmail=x,localStorage.setItem("lbjj_member_profile",JSON.stringify(s))}catch{}await g(),A(!0),setTimeout(()=>{A(!1),a("main","My Account")},1200)}catch(t){M(t.message||"Failed to save")}V(!1)},$e=async()=>{Z(!0);try{const{getToken:t}=await G(async()=>{const{getToken:c}=await import("./index-C4lel946.js").then(u=>u.ay);return{getToken:c}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),s=t()||"";await ne("updateMemberProfileApp",{token:s,sizingGiTop:J,sizingRashguard:Y,sizingShorts:q}),d("Sizes saved"),setTimeout(()=>a("main","My Account"),800)}catch{d("Could not save sizes")}Z(!1)},D=t=>{pe(s=>{const c={...s,[t]:!s[t]};try{localStorage.setItem("lbjj_notif_prefs",JSON.stringify(c))}catch{}return c})};return n.useEffect(()=>{r==="edit"&&(y(i?.name||""),h(i?.phone||""),M(""),A(!1))},[r,i?.name,i?.phone]),e.jsxs("div",{className:"acv2-root",style:{"--th":B.color,"--th-rgb":B.rgb,"--th-glow":`rgba(${B.rgb},0.35)`},children:[te&&e.jsx("div",{style:{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:999,background:"rgba(0,0,0,0.9)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"10px 20px",color:"#fff",fontSize:13,fontWeight:600,backdropFilter:"blur(20px)"},children:te}),e.jsx("input",{ref:C,type:"file",accept:"image/*",onChange:z,style:{display:"none"}}),e.jsxs("nav",{className:"top-nav",children:[e.jsxs("button",{className:"nav-back",onClick:S,children:[e.jsx(_e,{})," Back"]}),e.jsx("span",{className:"nav-title",children:k}),e.jsx("div",{style:{width:36}})]}),e.jsxs("div",{className:"page",children:[e.jsxs("div",{className:`view ${r==="main"?"active":""}`,children:[e.jsx("div",{className:"card",children:e.jsxs("div",{className:"hero",children:[e.jsx("div",{className:"hero-glow",style:{background:B.color}}),e.jsxs("div",{className:"avatar-ring-wrap",onClick:()=>C.current?.click(),children:[e.jsx("div",{className:"avatar-spin"}),e.jsx("div",{className:"avatar",children:$?e.jsx("img",{src:$,alt:"Profile"}):je}),e.jsx("div",{className:"avatar-edit",children:e.jsx(Ie,{})})]}),e.jsx("h1",{className:"hero-name",children:i?.name||"Member"}),e.jsxs("div",{className:"hero-tier",children:["LV",ue," • ",B.label]}),e.jsxs("button",{className:"public-profile-btn",onClick:()=>f("/profile"),children:["View Public Profile",e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}),e.jsx("polyline",{points:"15 3 21 3 21 9"}),e.jsx("line",{x1:"10",y1:"14",x2:"21",y2:"3"})]})]}),e.jsx("div",{className:"belt-wrap",dangerouslySetInnerHTML:{__html:Ne}})]})}),e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"sec-title",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"5",y:"2",width:"14",height:"20",rx:"2",ry:"2"}),e.jsx("line",{x1:"12",y1:"18",x2:"12.01",y2:"18"})]}),"Digital Access Pass"]}),e.jsx("p",{style:{fontSize:12,color:"var(--muted)",marginBottom:0,lineHeight:1.5},children:"Use your phone to unlock the gym doors and check-in. Add your 24/7 pass to your digital wallet."}),e.jsxs("div",{className:"wallet-btns",children:[e.jsxs("button",{className:"wallet-btn",onClick:ke,disabled:T,children:[e.jsx("svg",{viewBox:"0 0 384 512",width:"15",height:"15",children:e.jsx("path",{fill:"#fff",d:"M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 24 184.8 8 273.5q-9 53.6 15.3 111.4c16.2 38.6 44.8 84.8 82.2 82.8 35.5-1.9 49.4-23.7 90.1-23.7s52.7 23.7 90.1 21.8c39.4-1.9 64.3-43.6 80.5-80.8-39.6-14.8-67.4-48-67.4-116.3zM255.4 75.3c21.2-24.9 35.5-59.6 31.6-94.3-29.4 1.2-66.3 19.1-88.3 43.9-17.6 19.6-34.6 55.4-30 89.3 32.9 2.5 65.5-13.8 86.7-38.9z"})}),T?"Generating...":"Apple Wallet"]}),e.jsxs("button",{className:"wallet-btn google-btn",onClick:Se,disabled:_,children:[e.jsxs("svg",{viewBox:"0 0 48 48",width:"16",height:"16",children:[e.jsx("path",{fill:"#EA4335",d:"M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"}),e.jsx("path",{fill:"#4285F4",d:"M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"}),e.jsx("path",{fill:"#FBBC05",d:"M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"}),e.jsx("path",{fill:"#34A853",d:"M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"})]}),_?"Generating...":"Google Wallet"]})]})]}),e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"sec-title",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[e.jsx("circle",{cx:"12",cy:"12",r:"3"}),e.jsx("path",{d:"M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"})]}),"Account Settings"]}),e.jsxs("div",{className:"settings-list",children:[e.jsxs("div",{className:"setting-row",onClick:()=>a("edit","Edit Profile"),children:[e.jsx("div",{className:"setting-icon accent-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"12",cy:"7",r:"4"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Edit Profile"}),e.jsx("div",{className:"setting-desc",children:"Name, emails, contact info"})]}),e.jsx(N,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>a("family","Family & Dependents"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Family & Dependents"}),e.jsx("div",{className:"setting-desc",children:"Manage kids' profiles"})]}),e.jsx(N,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>a("sizing","Sizing & Preferences"),children:[e.jsx("div",{className:"setting-icon",children:e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:e.jsx("path",{d:"M20.38 3.46L16 2a8 8 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"})})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Apparel Sizing"}),e.jsx("div",{className:"setting-desc",children:"Gi & No-Gi sizes for pro shop"})]}),e.jsx(N,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>a("events","Events & Seminars"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),e.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),e.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Events & Seminars"}),e.jsx("div",{className:"setting-desc",children:"Registrations and tickets"})]}),e.jsx(N,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>a("connected","Connected Apps"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("rect",{x:"4",y:"2",width:"16",height:"20",rx:"2",ry:"2"}),e.jsx("path",{d:"M12 18h.01"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Connected Apps"}),e.jsx("div",{className:"setting-desc",children:"Apple Health, Whoop, Garmin"})]}),e.jsx(N,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>a("notif","Notifications"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"}),e.jsx("path",{d:"M13.73 21a2 2 0 0 1-3.46 0"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Notifications"}),e.jsx("div",{className:"setting-desc",children:"Push & email preferences"})]}),e.jsx(N,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>a("privacy","Privacy & Security"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2"}),e.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Privacy & Security"}),e.jsx("div",{className:"setting-desc",children:"Password, visibility"})]}),e.jsx(N,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>a("waiver","Waivers"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"}),e.jsx("line",{x1:"16",y1:"13",x2:"8",y2:"13"}),e.jsx("line",{x1:"16",y1:"17",x2:"8",y2:"17"}),e.jsx("polyline",{points:"10 9 9 9 8 9"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Waivers & Agreements"}),e.jsx("div",{className:"setting-desc",children:"View signed documents"})]}),e.jsx(N,{})]}),e.jsxs("div",{className:"setting-row",onClick:()=>a("refer","Refer a Friend"),children:[e.jsx("div",{className:"setting-icon",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"}),e.jsx("line",{x1:"4",y1:"22",x2:"4",y2:"15"})]})}),e.jsxs("div",{className:"setting-label",children:[e.jsx("div",{className:"setting-name",children:"Refer a Friend"}),e.jsx("div",{className:"setting-desc",children:"Earn XP for referrals"})]}),e.jsx("span",{className:"setting-tag tag-pro",children:"PRO"})]})]})]}),e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"sec-title",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[e.jsx("rect",{x:"2",y:"5",width:"20",height:"14",rx:"2"}),e.jsx("path",{d:"M2 10h20"})]}),"Membership & Billing"]}),e.jsx("div",{className:"mem-card",children:e.jsxs("div",{className:"mem-info",children:[e.jsx("div",{className:"mem-plan",children:i?.membership||i?.plan||"Member"}),e.jsx("div",{className:"mem-since",children:se?`Member since ${se}`:"Member"}),e.jsxs("div",{className:"mem-status",children:[e.jsx("div",{className:"mem-dot"})," Active"]})]})}),e.jsx("div",{className:"sec-title",style:{marginTop:16,marginBottom:12,fontSize:10,color:"var(--text)"},children:"Payment Methods"}),e.jsxs("div",{className:"cc-list",children:[e.jsxs("div",{className:"cc-row",children:[e.jsx("div",{className:"cc-icon",children:e.jsxs("svg",{width:"24",height:"16",viewBox:"0 0 24 16",fill:"none",children:[e.jsx("rect",{width:"24",height:"16",rx:"3",fill:"#1a1f36"}),e.jsx("circle",{cx:"8",cy:"8",r:"4",fill:"#ff5f00"}),e.jsx("circle",{cx:"13",cy:"8",r:"4",fill:"#f59e0b",fillOpacity:"0.8"})]})}),e.jsxs("div",{className:"cc-details",children:[e.jsx("div",{className:"cc-num",children:"•••• 4242"}),e.jsx("div",{className:"cc-exp",children:"Exp 12/28"})]}),e.jsx("div",{className:"cc-primary-badge",children:"Primary"})]}),e.jsxs("div",{className:"cc-add",onClick:()=>d("Coming soon"),children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[e.jsx("line",{x1:"12",y1:"5",x2:"12",y2:"19"}),e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"})]}),"Add New Card"]})]})]}),e.jsxs("div",{className:"danger-group",children:[de?e.jsxs("div",{style:{display:"flex",gap:10},children:[e.jsx("button",{className:"btn btn-outline",onClick:()=>U(!1),style:{flex:1},children:"Cancel"}),e.jsx("button",{className:"btn btn-danger",onClick:l,style:{flex:2},children:"Confirm Sign Out"})]}):e.jsxs("button",{className:"btn btn-danger",onClick:()=>U(!0),children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}),e.jsx("polyline",{points:"16 17 21 12 16 7"}),e.jsx("line",{x1:"21",y1:"12",x2:"9",y2:"12"})]}),"Sign Out"]}),e.jsx("button",{className:"btn-danger-text",onClick:()=>a("delete","Account Deletion"),children:"Request Account Deletion"})]}),e.jsx("div",{className:"ver",children:"LABYRINTH BJJ • V3.6 • MEMBER PORTAL"})]}),e.jsx("div",{className:`view ${r==="edit"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Full Name"}),e.jsx("input",{type:"text",className:"form-input",value:L,onChange:t=>y(t.target.value)})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Primary Email"}),e.jsx("input",{type:"email",className:"form-input",value:i?.email||"",disabled:!0,style:{opacity:.6}})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Secondary Email"}),e.jsx("input",{type:"email",className:"form-input",placeholder:"backup@email.com",value:x,onChange:t=>v(t.target.value)})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Phone Number"}),e.jsx("input",{type:"tel",className:"form-input",value:E,onChange:t=>h(t.target.value)})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Emergency Contact"}),e.jsx("input",{type:"text",className:"form-input",placeholder:"Name & Number",value:b,onChange:t=>le(t.target.value)})]}),F&&e.jsx("p",{style:{fontSize:13,color:"#ef4444",textAlign:"center"},children:F}),e.jsx("button",{className:"btn btn-save",onClick:Ce,disabled:O,children:O?"Saving...":ce?"✓ Saved":"Save Changes"})]})}),e.jsx("div",{className:`view ${r==="family"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsx("div",{className:"sec-title",style:{marginBottom:20},children:"Linked Accounts"}),ae.length>0?ae.map((t,s)=>{const c=(t.name||t.Name||"FM").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),u={green:"#22c55e",grey:"#9ca3af",yellow:"#facc15",orange:"#ea580c",white:"#e5e7eb",blue:"#3b82f6",purple:"#a855f7"},p=(t.belt||t.Belt||"green").toLowerCase();return e.jsxs("div",{className:"dep-card",children:[e.jsx("div",{className:"dep-avatar",style:{background:u[p]||"#22c55e"},children:c}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{style:{fontWeight:700,fontSize:15,color:"#fff"},children:t.name||t.Name}),e.jsx("div",{style:{fontSize:12,color:u[p]||"#22c55e",fontWeight:600},children:t.type||t.Type||`Kids ${p.charAt(0).toUpperCase()+p.slice(1)} Series`})]}),e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"var(--muted)",strokeWidth:"2.5",children:e.jsx("path",{d:"M9 18l6-6-6-6"})})]},s)}):e.jsxs("div",{style:{padding:20,textAlign:"center",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:16},children:[e.jsx("div",{style:{fontWeight:700,color:"#fff",marginBottom:4},children:"No linked accounts"}),e.jsx("div",{style:{fontSize:11,color:"var(--muted)"},children:"Add dependents to manage their profiles"})]}),e.jsxs("div",{className:"cc-add",onClick:()=>d("Add dependent coming soon"),style:{marginTop:12},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[e.jsx("line",{x1:"12",y1:"5",x2:"12",y2:"19"}),e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"})]}),"Add Dependent"]})]})}),e.jsx("div",{className:`view ${r==="sizing"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsx("p",{style:{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.5},children:"Set your sizes here so the pro shop can pre-filter gear and suggest the right fit."}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"Gi Size"}),e.jsx("select",{className:"form-input",value:J,onChange:t=>ge(t.target.value),children:["A0","A1","A2","A3","A4","A5"].map(t=>e.jsx("option",{children:t},t))})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"No-Gi Top / Rash Guard"}),e.jsx("select",{className:"form-input",value:Y,onChange:t=>he(t.target.value),children:["XS","Small","Medium","Large","X-Large","XXL"].map(t=>e.jsx("option",{children:t},t))})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"No-Gi Shorts"}),e.jsx("select",{className:"form-input",value:q,onChange:t=>xe(t.target.value),children:["XS","Small","Medium","Large","X-Large","XXL"].map(t=>e.jsx("option",{children:t},t))})]}),e.jsx("button",{className:"btn btn-save",onClick:$e,disabled:K,children:K?"Saving...":"Save Sizes"})]})}),e.jsx("div",{className:`view ${r==="events"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsx("p",{style:{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.5},children:"Manage your registrations for upcoming seminars, camps, and in-house tournaments."}),e.jsxs("div",{style:{padding:20,textAlign:"center",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:16},children:[e.jsx("div",{style:{fontWeight:700,color:"#fff",marginBottom:4},children:"No upcoming events"}),e.jsx("div",{style:{fontSize:11,color:"var(--muted)"},children:"You haven't registered for anything recently."})]})]})}),e.jsx("div",{className:`view ${r==="connected"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"toggle-row",children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",style:{display:"flex",alignItems:"center",gap:8},children:"Apple Health"}),e.jsx("div",{className:"toggle-desc",children:"Sync workouts and calories"})]}),e.jsx("div",{className:"switch",onClick:()=>d("Coming soon")})]}),e.jsxs("div",{className:"toggle-row",children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Whoop"}),e.jsx("div",{className:"toggle-desc",children:"Import strain and recovery data"})]}),e.jsx("div",{className:"switch",onClick:()=>d("Coming soon")})]}),e.jsxs("div",{className:"toggle-row",style:{borderBottom:"none"},children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Garmin"}),e.jsx("div",{className:"toggle-desc",children:"Sync activity and heart rate"})]}),e.jsx("div",{className:"switch",onClick:()=>d("Coming soon")})]})]})}),e.jsx("div",{className:`view ${r==="notif"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"toggle-row",children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Push Notifications"}),e.jsx("div",{className:"toggle-desc",children:"Class updates and app alerts"})]}),e.jsx("div",{className:`switch ${I.push?"on":""}`,onClick:()=>D("push")})]}),e.jsxs("div",{className:"toggle-row",children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Email Reminders"}),e.jsx("div",{className:"toggle-desc",children:"Schedule and billing receipts"})]}),e.jsx("div",{className:`switch ${I.email?"on":""}`,onClick:()=>D("email")})]}),e.jsxs("div",{className:"toggle-row",children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Marketing & Promos"}),e.jsx("div",{className:"toggle-desc",children:"Merch drops and seminars"})]}),e.jsx("div",{className:`switch ${I.marketing?"on":""}`,onClick:()=>D("marketing")})]})]})}),e.jsx("div",{className:`view ${r==="privacy"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsxs("div",{className:"toggle-row",children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Public Profile"}),e.jsx("div",{className:"toggle-desc",children:"Let other members see your belt rank"})]}),e.jsx("div",{className:`switch ${Q.publicProfile?"on":""}`,onClick:()=>ee(t=>({...t,publicProfile:!t.publicProfile}))})]}),e.jsxs("div",{className:"toggle-row",style:{marginBottom:16},children:[e.jsxs("div",{className:"toggle-info",children:[e.jsx("div",{className:"toggle-title",children:"Leaderboard Opt-In"}),e.jsx("div",{className:"toggle-desc",children:"Appear on global XP leaderboards"})]}),e.jsx("div",{className:`switch ${Q.leaderboard?"on":""}`,onClick:()=>ee(t=>({...t,leaderboard:!t.leaderboard}))})]}),e.jsx("div",{className:"sec-title",style:{marginTop:24},children:"Change Password"}),e.jsx("div",{className:"form-group",children:e.jsx("input",{type:"password",className:"form-input",placeholder:"Current Password"})}),e.jsx("div",{className:"form-group",children:e.jsx("input",{type:"password",className:"form-input",placeholder:"New Password"})}),e.jsx("button",{className:"btn btn-outline",style:{marginTop:8},onClick:()=>d(`Password reset email sent to ${i?.email||"your email"}`),children:"Update Password"})]})}),e.jsx("div",{className:`view ${r==="waiver"?"active":""}`,children:e.jsx("div",{className:"card card-pad",children:e.jsxs("div",{className:"cc-list",children:[e.jsxs("div",{className:"cc-row",children:[e.jsx("div",{className:"cc-icon",style:{background:"rgba(255,255,255,0.1)"},children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"2",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),e.jsxs("div",{className:"cc-details",children:[e.jsx("div",{className:"cc-num",children:"Liability Waiver 2024"}),e.jsx("div",{className:"cc-exp",children:"Signed Jan 14, 2024"})]}),e.jsx("div",{className:"cc-primary-badge",style:{background:"rgba(34,197,94,0.15)",color:"#22c55e"},children:"SIGNED"})]}),e.jsxs("div",{className:"cc-row",children:[e.jsx("div",{className:"cc-icon",style:{background:"rgba(255,255,255,0.1)"},children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"2",children:[e.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),e.jsx("polyline",{points:"14 2 14 8 20 8"})]})}),e.jsxs("div",{className:"cc-details",children:[e.jsx("div",{className:"cc-num",children:"Code of Conduct"}),e.jsx("div",{className:"cc-exp",children:"Signed Jan 14, 2024"})]}),e.jsx("div",{className:"cc-primary-badge",style:{background:"rgba(34,197,94,0.15)",color:"#22c55e"},children:"SIGNED"})]})]})})}),e.jsx("div",{className:`view ${r==="refer"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"🤝"}),e.jsx("h2",{style:{fontSize:20,fontWeight:800,marginBottom:8},children:"Invite Friends, Earn XP"}),e.jsxs("p",{style:{fontSize:13,color:"var(--muted)",marginBottom:24,lineHeight:1.5},children:["Give your friends a free trial week. If they sign up for a membership, you'll earn ",e.jsx("strong",{children:"5,000 XP"})," and a unique profile badge!"]}),e.jsxs("div",{className:"form-group",style:{textAlign:"left"},children:[e.jsx("label",{children:"Your Referral Link"}),e.jsxs("div",{style:{display:"flex",gap:8},children:[e.jsx("input",{type:"text",className:"form-input",value:`join.labyrinth.com/ref/${(i?.name||"member").split(" ")[0].toLowerCase()}`,readOnly:!0}),e.jsx("button",{className:"btn btn-save",style:{width:"auto",margin:0,padding:"0 16px"},onClick:()=>{navigator.clipboard?.writeText(`join.labyrinth.com/ref/${(i?.name||"member").split(" ")[0].toLowerCase()}`),d("Copied!")},children:"Copy"})]})]})]})}),e.jsx("div",{className:`view ${r==="delete"?"active":""}`,children:e.jsxs("div",{className:"card card-pad",children:[e.jsx("h2",{style:{fontSize:18,fontWeight:800,color:"#ef4444",marginBottom:12},children:"Danger Zone"}),e.jsx("p",{style:{fontSize:13,color:"var(--text)",marginBottom:24,lineHeight:1.5},children:"Deleting your account is permanent. All your training history, belt rank progression, and XP will be permanently wiped from the Labyrinth database. Your active membership will also be canceled immediately."}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{style:{color:"#ef4444"},children:'Type "DELETE" to confirm'}),e.jsx("input",{type:"text",className:"form-input",placeholder:"DELETE",value:R,onChange:t=>me(t.target.value)})]}),e.jsx("button",{className:"btn btn-danger",style:{marginTop:16,opacity:R!=="DELETE"?.5:1},disabled:R!=="DELETE",onClick:()=>{window.location.href="mailto:info@labyrinth.vision?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20account%20("+encodeURIComponent(i?.email||"")+")"},children:"Confirm Deletion"})]})})]})]})}export{Oe as default};
