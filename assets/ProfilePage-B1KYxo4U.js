import{j as e}from"./vendor-query-C1Sv77l2.js";import{f as A,u as E,a as u}from"./vendor-router-ODl1pWfb.js";import{u as H,h as I,E as D}from"./index-DLnjCuUk.js";import"./vendor-react-D2Kp-oPc.js";const R="v3.0";globalThis.__PROFILE_V=R;const C={white:{color:"#e5e7eb",rgb:"229,231,235",label:"Iron Forge"},grey:{color:"#9ca3af",rgb:"156,163,175",label:"Steel Resolve"},gray:{color:"#9ca3af",rgb:"156,163,175",label:"Steel Resolve"},yellow:{color:"#facc15",rgb:"250,204,21",label:"Lightning Strike"},orange:{color:"#ea580c",rgb:"234,88,12",label:"Ember Rush"},green:{color:"#22c55e",rgb:"34,197,94",label:"Viper Fang"},blue:{color:"#3b82f6",rgb:"59,130,246",label:"Frozen Aura"},purple:{color:"#a855f7",rgb:"168,85,247",label:"Void Star"},brown:{color:"#ea580c",rgb:"234,88,12",label:"Blood Flame"},black:{color:"#eab308",rgb:"234,179,8",label:"Grandmaster Crown"}};function T(c){const s=c.toLowerCase(),l=s.split("_")[0];return C[s]||C[l]||C.white}function G(c,s){const l=c.toLowerCase();if(!["grey","gray","yellow","orange","green"].includes(l))return{beltColor:l,barColor:l==="black"?"red":"black"};const n=l==="gray"?"grey":l;return s==="white"?{beltColor:`${n}_white`,barColor:"black"}:s==="black"?{beltColor:`${n}_black`,barColor:"black"}:{beltColor:n,barColor:"none"}}function F(c,s,l){const p={white:{main:"#f8f8f8",edge:"#d4d4d4"},blue:{main:"#2563eb",edge:"#1d4ed8"},purple:{main:"#9333ea",edge:"#7e22ce"},brown:{main:"#78350f",edge:"#451a03"},black:{main:"#18181b",edge:"#000000"},grey:{main:"#9ca3af",edge:"#6b7280"},yellow:{main:"#facc15",edge:"#ca8a04"},orange:{main:"#ea580c",edge:"#c2410c"},green:{main:"#22c55e",edge:"#16a34a"}},n=440,r=56,b=6,h=84,d=n-h-16;let g=p.white.main,w=!1,j=!1,y="";if(p[c])g=p[c].main;else if(c==="red_black")w=!0;else if(c.includes("_")){const o=c.split("_");g=p[o[0]]?p[o[0]].main:g,j=!0,y=o[1]==="white"?"#f8f8f8":"#18181b"}let v="#18181b";s==="red"&&(v="#ef4444"),s==="white"&&(v="#f8f8f8");const $=`
    <defs>
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
    </defs>
  `;let x="";if(w){x+=`<rect x="0" y="0" width="${n}" height="${r}" rx="${b}" fill="#ef4444" />`;for(let o=0;o<n;o+=45)x+=`<rect x="${o}" y="0" width="22.5" height="${r}" fill="#18181b" />`}else if(x+=`<rect x="0" y="0" width="${n}" height="${r}" rx="${b}" fill="${g}" />`,j){const i=(r-16)/2,t=n-(d+h);x+=`
        <rect x="0" y="${i}" width="${d}" height="16" fill="${y}" />
        <rect x="0" y="${i}" width="${d}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="0" y="${i+16-2.5}" width="${d}" height="2.5" fill="rgba(255,255,255,0.3)" />

        <rect x="${d+h}" y="${i}" width="${t}" height="16" fill="${y}" />
        <rect x="${d+h}" y="${i}" width="${t}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="${d+h}" y="${i+16-2.5}" width="${t}" height="2.5" fill="rgba(255,255,255,0.3)" />
      `}const S=`
    <line x1="8" y1="10" x2="${n-8}" y2="10" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="18" x2="${n-8}" y2="18" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${r-18}" x2="${n-8}" y2="${r-18}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${r-10}" x2="${n-8}" y2="${r-10}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />

    <line x1="8" y1="11" x2="${n-8}" y2="11" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />
    <line x1="8" y1="19" x2="${n-8}" y2="19" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />
  `;let a="";if(s!=="none"){a+=`<rect x="${d-5}" y="0" width="5" height="${r}" fill="url(#barShadowLeft)" />`,a+=`<rect x="${d+h}" y="0" width="5" height="${r}" fill="url(#barShadowRight)" />`,a+=`<rect x="${d}" y="0" width="${h}" height="${r}" fill="${v}" />`,a+=`<rect x="${d}" y="0" width="1.5" height="${r}" fill="rgba(255,255,255,0.4)" />`,a+=`<rect x="${d+h-1.5}" y="0" width="1.5" height="${r}" fill="rgba(0,0,0,0.8)" />`;const o=s==="white"?"#18181b":"#ffffff";for(let i=0;i<l;i++){const t=d+h-16-i*15;a+=`<rect x="${t-3}" y="0" width="14" height="${r}" fill="rgba(0,0,0,0.5)" />`,a+=`<rect x="${t}" y="0" width="8" height="${r}" fill="${o}" />`,a+=`<rect x="${t}" y="0" width="8" height="${r}" fill="url(#tapeCurve)" />`,a+=`<rect x="${t}" y="0" width="1" height="${r}" fill="rgba(255,255,255,0.6)" />`,a+=`<rect x="${t+7}" y="0" width="1" height="${r}" fill="rgba(0,0,0,0.6)" />`}}return`
    <svg viewBox="0 -30 ${n} ${r+60}" width="100%" height="100%">
      ${$}
      <g filter="url(#beltShadow)">
        <g filter="url(#beltTexture)">
          ${x}
          <rect x="0" y="0" width="${n}" height="${r}" rx="${b}" fill="url(#beltCurve)" />
          ${S}
          ${a}
          <rect x="0" y="0" width="${n}" height="${r}" rx="${b}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="2" />
          <rect x="1" y="1" width="${n-2}" height="${r-2}" rx="${b}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
        </g>
      </g>
    </svg>
  `}const L="lbjj-profile-dynamic-styles",W=`
.pdyn-root {
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  padding: 0 0 calc(80px + env(safe-area-inset-bottom, 0px));
  transition: background 0.4s ease;
  color: var(--text-main, #f8f9fa);
  width: 100%;
}

.pdyn-top-nav {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(5,6,10,0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.pdyn-nav-btn {
  background: none; border: none; color: #fff;
  display: flex; align-items: center; gap: 6px;
  font-weight: 600; font-size: 15px; cursor: pointer; padding: 0;
  font-family: inherit;
  transition: color 0.2s; -webkit-tap-highlight-color: transparent;
}
.pdyn-nav-btn:active { color: #aaa; }

.pdyn-container { max-width: 480px; margin: 0 auto; padding: 20px 16px; display: flex; flex-direction: column; gap: 20px; }

.pdyn-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
}

.pdyn-profile-header {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; position: relative; overflow: visible;
}
.pdyn-profile-header::before {
  content: ''; position: absolute; top: -50px; left: 50%; transform: translateX(-50%);
  width: 150px; height: 150px;
  background: var(--theme-color);
  filter: blur(80px);
  opacity: 0.3;
  pointer-events: none;
  transition: background 0.4s ease;
}

.pdyn-avatar-wrap { position: relative; width: 96px; height: 96px; margin-bottom: 16px; z-index: 1; }
.pdyn-avatar-ring {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 2px dashed var(--theme-color);
  animation: pdyn-spin 15s linear infinite;
  box-shadow: 0 0 20px var(--theme-glow);
  transition: border-color 0.4s, box-shadow 0.4s;
}
@keyframes pdyn-spin { 100% { transform: rotate(360deg); } }
.pdyn-avatar-img {
  width: 100%; height: 100%; border-radius: 50%;
  object-fit: cover; border: 2px solid rgba(255,255,255,0.1);
  background: #111; display: flex; align-items: center; justify-content: center;
  font-size: 32px; font-weight: 800; color: #fff; overflow: hidden;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.pdyn-avatar-img img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

.pdyn-name { font-size: 24px; font-weight: 900; margin: 0 0 4px; letter-spacing: -0.02em; z-index: 1; color: var(--text-main); }
.pdyn-title-badge { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--theme-color); margin-bottom: 20px; z-index: 1; transition: color 0.4s; }

.pdyn-belt-wrap { width: 100%; max-width: 440px; margin: 0 auto 8px; position: relative; z-index: 2; cursor: pointer; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pdyn-belt-wrap:active { transform: scale(0.97); }
.pdyn-belt-wrap svg { width: 100%; height: auto; display: block; overflow: visible; }

.pdyn-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; width: 100%; }
.pdyn-btn {
  padding: 14px 16px; border-radius: 14px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 800; letter-spacing: 0.02em;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  transition: all 0.2s; -webkit-tap-highlight-color: transparent;
  color: #fff; font-family: inherit;
}
.pdyn-btn:active { transform: scale(0.96); }
.pdyn-btn-primary {
  background: linear-gradient(135deg, rgba(var(--theme-rgb),0.2), rgba(var(--theme-rgb),0.06));
  border: 1px solid rgba(var(--theme-rgb),0.35);
  color: var(--theme-color);
}
.pdyn-btn-secondary {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-muted);
}
.pdyn-btn svg { color: inherit; }

.pdyn-section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin: 0 0 20px; display: flex; align-items: center; gap: 8px; }
.pdyn-section-title svg { color: var(--theme-color); transition: color 0.4s; }

.pdyn-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.pdyn-stat-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; }
.pdyn-stat-value { font-size: 32px; font-weight: 900; color: #fff; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
.pdyn-stat-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.pdyn-fire { color: #ef4444; font-size: 24px; filter: drop-shadow(0 0 8px rgba(239,68,68,0.6)); }

.pdyn-heatmap-wrapper { background: rgba(0,0,0,0.2); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.03); }
.pdyn-heatmap-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #fff; margin-bottom: 16px; }
.pdyn-heatmap-legend-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px; text-align: center; font-size: 10px; font-weight: 800; color: var(--text-muted); }
.pdyn-heatmap-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.pdyn-day { aspect-ratio: 1; border-radius: 4px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.03); transition: all 0.4s ease; }
.pdyn-day.l1 { background: rgba(var(--theme-rgb),0.35); border-color: rgba(var(--theme-rgb),0.45); }
.pdyn-day.l2 { background: rgba(var(--theme-rgb),0.7); border-color: rgba(var(--theme-rgb),0.8); box-shadow: 0 0 8px rgba(var(--theme-rgb),0.3); }
.pdyn-day.l3 { background: var(--theme-color); border-color: var(--theme-color); box-shadow: 0 0 12px var(--theme-glow); }
.pdyn-day.l4 { background: #fff; border-color: #fff; box-shadow: 0 0 16px #fff; }
.pdyn-heatmap-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

.pdyn-unlocks-list { display: flex; flex-direction: column; gap: 12px; }
.pdyn-unlock-card { display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; position: relative; overflow: hidden; transition: transform 0.2s; }
.pdyn-unlock-card:active { transform: scale(0.98); }
.pdyn-unlock-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(0,0,0,0.4); display: grid; place-items: center; font-size: 24px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); }
.pdyn-unlock-info { flex: 1; min-width: 0; }
.pdyn-unlock-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pdyn-unlock-desc { font-size: 12px; color: var(--text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pdyn-rarity { font-size: 9px; font-weight: 900; padding: 4px 8px; border-radius: 6px; letter-spacing: 0.1em; flex-shrink: 0; }
.pdyn-rarity-common   { color: #9ca3af; background: rgba(156,163,175,0.15); border: 1px solid rgba(156,163,175,0.3); }
.pdyn-rarity-rare     { color: #60a5fa; background: rgba(96,165,250,0.15);  border: 1px solid rgba(96,165,250,0.3); }
.pdyn-rarity-epic     { color: #c084fc; background: rgba(192,132,252,0.15); border: 1px solid rgba(192,132,252,0.3); }
.pdyn-rarity-legendary{ color: #fbbf24; background: rgba(251,191,36,0.15);  border: 1px solid rgba(251,191,36,0.3); }
.pdyn-rarity-mythic   { color: #a855f7; background: rgba(168,85,247,0.15);  border: 1px solid rgba(168,85,247,0.3); }
.pdyn-unlock-card.epic-card::before     { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#c084fc; box-shadow:0 0 15px #c084fc; }
.pdyn-unlock-card.legendary-card::before{ content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#fbbf24; box-shadow:0 0 15px #fbbf24; }
.pdyn-unlock-card.rare-card::before     { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#60a5fa; box-shadow:0 0 15px #60a5fa; }
.pdyn-unlock-card.mythic-card::before   { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#a855f7; box-shadow:0 0 15px #a855f7; }

@keyframes pdyn-spin-load { 100% { transform: rotate(360deg); } }
.pdyn-spinner { width:36px; height:36px; border:3px solid rgba(255,255,255,0.1); border-top-color: var(--theme-color); border-radius:50%; animation: pdyn-spin-load 0.8s linear infinite; }
`;function O(){if(typeof document>"u"||document.getElementById(L))return;const c=document.createElement("style");c.id=L,c.textContent=W,document.head.appendChild(c)}const V={epic:"epic-card",legendary:"legendary-card",rare:"rare-card",mythic:"mythic-card"};function X(){const c=A(),s=c?.email?decodeURIComponent(c.email):null,{member:l}=H(),p=!s||l&&l.email?.toLowerCase()===s.toLowerCase(),[,n]=E(),[r,b]=u.useState(null),[h,d]=u.useState(!0);u.useEffect(()=>{O()},[]),u.useEffect(()=>{if(p){const a=(()=>{try{return JSON.parse(localStorage.getItem("lbjj_game_stats_v2")||"{}")}catch{return{}}})(),o=(()=>{try{return JSON.parse(localStorage.getItem("lbjj_achievements")||"{}")}catch{return{}}})(),i=(()=>{try{return JSON.parse(localStorage.getItem("lbjj_checkin_history")||"[]")}catch{return[]}})(),t=(()=>{try{return localStorage.getItem("lbjj_profile_picture")||""}catch{return""}})();b({name:l?.name||"Member",email:l?.email||"",belt:(l?.belt||"white").toLowerCase(),stripes:Number(l?.stripes||0),bar:l?.bar||"none",totalPoints:Math.max(a.totalXP||0,a.xp||0,l?.totalPoints||0),classesAttended:l?.classesAttended||a.classesAttended||0,currentStreak:l?.currentStreak||a.currentStreak||0,maxStreak:l?.maxStreak||a.maxStreak||a.bestStreak||0,achievements:o,checkinHistory:i,profilePic:t}),d(!1)}else if(s){d(!0);const a=(()=>{try{return localStorage.getItem("lbjj_session_token")||""}catch{return""}})(),o=(()=>{try{return sessionStorage.getItem("lbjj_profile_view_name")||""}catch{return""}})();I("getMemberByEmail",{token:a,email:s,memberName:o}).then(i=>{const t=i?.member||i||{},f=t.name||t.Name||"",m=f&&!f.includes("@")?f:o||s.split("@")[0]||"Member";b({name:m,email:s,belt:(t.belt||t.Belt||"white").toLowerCase(),stripes:Number(t.stripes||t.Stripes||0),bar:t.bar||t.Bar||"none",totalPoints:t.totalPoints||t.TotalPoints||0,classesAttended:t.classesAttended||t.ClassesAttended||0,currentStreak:t.currentStreak||t.CurrentStreak||0,maxStreak:t.maxStreak||t.MaxStreak||0,achievements:t.achievements||{},checkinHistory:[],profilePic:t.profilePic||t.ProfilePic||t.profilePicture||""})}).catch(()=>{b({name:s.split("@")[0]||"Member",email:s,belt:"white",stripes:0,bar:"none",totalPoints:0,classesAttended:0,currentStreak:0,maxStreak:0,achievements:{},checkinHistory:[],profilePic:""})}).finally(()=>d(!1))}},[p,s,l]);const g=T(r?.belt||"white"),w={"--theme-color":g.color,"--theme-rgb":g.rgb,"--theme-glow":`rgba(${g.rgb},0.4)`,"--bg-dark":"#05060a","--card-bg":"rgba(15,17,23,0.6)","--card-border":"rgba(255,255,255,0.08)","--text-main":"#f8f9fa","--text-muted":"#9ca3af",background:`radial-gradient(circle at 50% 0%, rgba(${g.rgb},0.15), transparent 50%), #05060a`},j=u.useMemo(()=>{const a=r?.checkinHistory||[],o=new Set(a),i=[],t=new Date;t.setHours(0,0,0,0);const f=(t.getDay()+6)%7,m=new Date(t);m.setDate(t.getDate()-f-21);for(let N=0;N<28;N++){const k=new Date(m);k.setDate(m.getDate()+N);const _=k.getFullYear(),z=String(k.getMonth()+1).padStart(2,"0"),M=String(k.getDate()).padStart(2,"0"),P=`${_}-${z}-${M}`,B=k>t;i.push(B?0:o.has(P)?3:0)}return i},[r?.checkinHistory]),y=u.useMemo(()=>{const a=r?.achievements||{};if(!a||typeof a!="object")return[];const o=Object.entries(a).map(([i,t])=>{const f=D.find(m=>m.key===i);return f?{key:i,ts:Number(t)||0,def:f}:null}).filter(Boolean);return o.sort((i,t)=>t.ts-i.ts),o.slice(0,3)},[r?.achievements]);if(h||!r)return e.jsx("div",{className:"pdyn-root",style:{...w,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"},children:e.jsx("div",{className:"pdyn-spinner"})});const{beltColor:v,barColor:$}=G(r.belt||"white",r.bar||"none"),x=F(v,$,r.stripes||0),S=(r.name||"M").split(" ").map(a=>a[0]).join("").slice(0,2).toUpperCase();return e.jsxs("div",{className:"pdyn-root",style:w,children:[e.jsxs("nav",{className:"pdyn-top-nav",children:[e.jsxs("button",{className:"pdyn-nav-btn",onClick:()=>window.history.back(),"aria-label":"Back",children:[e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:e.jsx("path",{d:"M15 18l-6-6 6-6"})}),"Back"]}),p&&e.jsx("button",{className:"pdyn-nav-btn",style:{color:"#888",fontSize:13},onClick:()=>n("/account"),"aria-label":"Edit profile",children:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("path",{d:"M12 20h9"}),e.jsx("path",{d:"M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"})]})})]}),e.jsxs("div",{className:"pdyn-container",children:[e.jsxs("div",{className:"pdyn-card pdyn-profile-header",children:[e.jsxs("div",{className:"pdyn-avatar-wrap",children:[e.jsx("div",{className:"pdyn-avatar-ring"}),e.jsx("div",{className:"pdyn-avatar-img",children:r.profilePic?e.jsx("img",{src:r.profilePic,alt:""}):S})]}),e.jsx("h1",{className:"pdyn-name",children:r.name}),e.jsx("div",{className:"pdyn-title-badge",children:g.label}),e.jsx("div",{className:"pdyn-belt-wrap",dangerouslySetInnerHTML:{__html:x},onClick:()=>n(p?"/belt":`/belt/${encodeURIComponent(r.email||s||"")}`)}),e.jsxs("div",{className:"pdyn-actions",children:[e.jsxs("button",{className:"pdyn-btn pdyn-btn-primary",onClick:()=>n(p?"/belt":`/belt/${encodeURIComponent(r.email||s||"")}`),children:[e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:e.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"})}),"Belt Journey"]}),p?e.jsxs("button",{className:"pdyn-btn pdyn-btn-secondary",onClick:()=>n("/achievements"),children:[e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:e.jsx("path",{d:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"})}),"Achievements"]}):e.jsxs("button",{className:"pdyn-btn pdyn-btn-secondary",onClick:()=>n("/chat"),children:[e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})}),"Message"]})]})]}),e.jsxs("div",{className:"pdyn-card",children:[e.jsxs("h2",{className:"pdyn-section-title",children:[e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("path",{d:"M22 12h-4l-3 9L9 3l-3 9H2"})}),"Activity & Momentum"]}),e.jsxs("div",{className:"pdyn-stats-grid",children:[e.jsxs("div",{className:"pdyn-stat-box",children:[e.jsx("div",{className:"pdyn-stat-value",children:r.classesAttended||0}),e.jsx("div",{className:"pdyn-stat-label",children:"Classes Attended"})]}),e.jsxs("div",{className:"pdyn-stat-box",children:[e.jsxs("div",{className:"pdyn-stat-value",children:[r.maxStreak||0," ",e.jsx("span",{className:"pdyn-fire",children:"🔥"})]}),e.jsx("div",{className:"pdyn-stat-label",children:"Longest Streak"})]})]}),p&&e.jsxs("div",{className:"pdyn-heatmap-wrapper",children:[e.jsxs("div",{className:"pdyn-heatmap-header",children:[e.jsx("span",{children:"Training Activity"}),e.jsx("span",{style:{color:"var(--text-muted)",fontSize:10},children:"Last 28 Days"})]}),e.jsx("div",{className:"pdyn-heatmap-legend-row",children:["M","T","W","T","F","S","S"].map((a,o)=>e.jsx("span",{children:a},o))}),e.jsx("div",{className:"pdyn-heatmap-grid",children:j.map((a,o)=>e.jsx("div",{className:`pdyn-day${a>0?` l${Math.min(a,4)}`:""}`},o))}),e.jsxs("div",{className:"pdyn-heatmap-footer",children:[e.jsx("span",{children:"Consistency"}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{children:"Less"}),e.jsx("div",{style:{display:"flex",gap:4},children:[0,1,2,3,4].map(a=>e.jsx("div",{className:`pdyn-day${a>0?` l${a}`:""}`,style:{width:12,height:12,aspectRatio:"auto"}},a))}),e.jsx("span",{children:"More"})]})]})]})]}),y.length>0&&e.jsxs("div",{className:"pdyn-card",children:[e.jsxs("h2",{className:"pdyn-section-title",children:[e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("path",{d:"M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"})}),"Recent Unlocks"]}),e.jsx("div",{className:"pdyn-unlocks-list",children:y.map(({key:a,def:o})=>{const i=(o.rarity||"Common").toLowerCase(),t=V[i]||"";return e.jsxs("div",{className:`pdyn-unlock-card ${t}`,children:[e.jsx("div",{className:"pdyn-unlock-icon",children:o.icon}),e.jsxs("div",{className:"pdyn-unlock-info",children:[e.jsx("h3",{className:"pdyn-unlock-title",children:o.label}),o.desc&&e.jsx("p",{className:"pdyn-unlock-desc",children:o.desc})]}),e.jsx("div",{className:`pdyn-rarity pdyn-rarity-${i}`,children:i.toUpperCase()})]},a)})})]})]})]})}export{X as default};
