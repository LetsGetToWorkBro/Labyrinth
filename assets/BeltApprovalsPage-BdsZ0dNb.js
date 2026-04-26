import{j as e}from"./vendor-query-C1Sv77l2.js";import{a as x}from"./vendor-router-ODl1pWfb.js";import{u as Y,Y as V,a0 as W}from"./index-SKWXCDbW.js";import"./vendor-react-D2Kp-oPc.js";const w={white:{base:"#E5E5E5",light:"#FFFFFF",dark:"#B0B0B0",darkest:"#888888",glow:"rgba(255,255,255,0.4)",name:"White"},grey:{base:"#A0A0A0",light:"#C0C0C0",dark:"#808080",darkest:"#606060",glow:"rgba(160,160,160,0.4)",name:"Grey"},yellow:{base:"#FFD700",light:"#FFEB3B",dark:"#FFA500",darkest:"#FF8C00",glow:"rgba(255,215,0,0.5)",name:"Yellow"},orange:{base:"#FF8C00",light:"#FFA500",dark:"#FF6347",darkest:"#FF4500",glow:"rgba(255,140,0,0.5)",name:"Orange"},green:{base:"#228B22",light:"#32CD32",dark:"#006400",darkest:"#004000",glow:"rgba(34,139,34,0.5)",name:"Green"},blue:{base:"#1A56DB",light:"#4A7FF0",dark:"#103A99",darkest:"#0A2266",glow:"rgba(26,86,219,0.5)",name:"Blue"},purple:{base:"#7E3AF2",light:"#A26DF8",dark:"#521BA6",darkest:"#2E0F5C",glow:"rgba(126,58,242,0.5)",name:"Purple"},brown:{base:"#92400E",light:"#B85E24",dark:"#632A08",darkest:"#381603",glow:"rgba(146,64,14,0.5)",name:"Brown"},black:{base:"#222222",light:"#444444",dark:"#111111",darkest:"#000000",glow:"rgba(200,162,76,0.4)",name:"Black"}},I="belt-approvals-styles",L="belt-approvals-font",H=`
.bapp-root { --gold:#D4AF37; --gold-glow:rgba(212,175,55,0.4); --bapp-bg:#030305; --surface:rgba(18,18,22,0.65); --border:rgba(255,255,255,0.06); --text:#F8F8F8; --muted:#777780; }
.bapp-root, .bapp-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.bapp-root { color:#F8F8F8; font-family: 'Inter', sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; }

/* AMBIENT */
.bapp-ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.03"/></svg>'); }
.bapp-ambient-orb { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.15; mix-blend-mode: screen; }
.bapp-orb1 { width: 60vw; height: 60vw; background: #D4AF37; top: -10%; left: -20%; animation: bapp-orb-drift 20s ease-in-out infinite alternate; }
.bapp-orb2 { width: 50vw; height: 50vw; background: #1A56DB; bottom: 5%; right: -10%; animation: bapp-orb-drift 25s ease-in-out infinite alternate-reverse; }
@keyframes bapp-orb-drift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(30px, 40px) scale(1.1); } }

/* LAYOUT */
.bapp-page { position: relative; z-index: 1; max-width: 480px; margin: 0 auto; padding: 0 0 120px; }
.bapp-top-bar { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px; }
.bapp-back-btn { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); display: grid; place-items: center; cursor: pointer; color: #888; transition: all 0.2s; box-shadow: inset 0 1px 1px rgba(255,255,255,0.05); }
.bapp-back-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.08); }
.bapp-top-title { font-size: 16px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }

@keyframes bapp-hero-in { from { opacity:0; transform: translateY(30px) scale(0.95); } to { opacity:1; transform: translateY(0) scale(1); } }
@keyframes bapp-aura-pulse { 0%, 100% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); filter: blur(10px); } }
@keyframes spin { to { transform: rotate(360deg); } }

/* CARDS */
.bapp-card {
  margin: 0 16px 20px;
  background: rgba(18,18,22,0.65);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 24px 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08);
  transition: opacity 0.3s ease, transform 0.3s ease;
  animation: bapp-hero-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.bapp-card.dismissing { opacity: 0; transform: translateY(-20px) scale(0.97); }
.bapp-member-name { font-size: 20px; font-weight: 900; color: #F8F8F8; letter-spacing: -0.02em; margin-bottom: 6px; }
.bapp-belt-center { display: flex; flex-direction: column; align-items: center; margin: 20px 0 16px; position: relative; }
.bapp-belt-aura { position: absolute; inset: -30px; border-radius: 50%; mix-blend-mode: screen; pointer-events: none; animation: bapp-aura-pulse 4s ease-in-out infinite; }
.bapp-belt-name { font-size: 18px; font-weight: 900; margin-top: 12px; }
.bapp-meta { font-size: 12px; color: #888; margin-bottom: 4px; }
.bapp-note { font-size: 12px; color: #666; font-style: italic; padding: 10px 14px; background: rgba(255,255,255,0.03); border-radius: 10px; margin: 12px 0; line-height: 1.5; }
.bapp-actions { display: flex; gap: 10px; margin-top: 20px; }
.bapp-btn-approve {
  flex: 1; height: 48px; border-radius: 14px; cursor: pointer;
  background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08));
  border: 1px solid rgba(34,197,94,0.35);
  color: #22c55e; font-size: 14px; font-weight: 800; letter-spacing: 0.06em;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s; -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}
.bapp-btn-approve:active { transform: scale(0.96); background: rgba(34,197,94,0.15); }
.bapp-btn-approve:disabled { opacity: 0.5; cursor: default; }
.bapp-btn-deny {
  flex: 1; height: 48px; border-radius: 14px; cursor: pointer;
  background: rgba(239,68,68,0.06);
  border: 1px solid rgba(239,68,68,0.2);
  color: #ef4444; font-size: 14px; font-weight: 800; letter-spacing: 0.06em;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s; -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}
.bapp-btn-deny:active { transform: scale(0.96); }
.bapp-btn-deny:disabled { opacity: 0.5; cursor: default; }

.bapp-history-row { padding: 14px 16px; margin: 0 16px 10px; background: rgba(18,18,22,0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; display: flex; align-items: center; gap: 12px; }
.bapp-status-approved { font-size: 10px; font-weight: 900; color: #22c55e; background: rgba(34,197,94,0.1); padding: 3px 8px; border-radius: 6px; letter-spacing: 0.08em; flex-shrink: 0; }
.bapp-status-denied { font-size: 10px; font-weight: 900; color: #ef4444; background: rgba(239,68,68,0.1); padding: 3px 8px; border-radius: 6px; letter-spacing: 0.08em; flex-shrink: 0; }

.bapp-tabs { display: flex; gap: 8px; padding: 0 16px 20px; }
.bapp-tab { padding: 8px 20px; border-radius: 12px; cursor: pointer; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; transition: all 0.25s; -webkit-tap-highlight-color: transparent; font-family: inherit; }
.bapp-tab.active { background: rgba(212,175,55,0.15); border: 1px solid #D4AF37; color: #D4AF37; }
.bapp-tab.inactive { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #888; }

.bapp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 16px; text-align: center; }
.bapp-empty-title { font-size: 18px; font-weight: 800; color: #F8F8F8; }
.bapp-empty-sub { font-size: 13px; color: #555; }

.bapp-badge-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; background: #D4AF37; color: #000; font-size: 11px; font-weight: 900; margin-left: 6px; }
`;let $=0;function _(n,N=0,a=64,h="none"){$++;const g=w[n]||w.white,f=n==="black",v=f?"#C71A1A":"#111111",k=f?"#E83A3A":"#2A2A2A",F=f?"#800B0B":"#050505",o=Math.round(a*.36),i=Math.round((a-o)/2),b=Math.round(a*.26),l=6,m=Math.round(a*.05),A="gradA-"+n+"-"+$,t="barGradA-"+n+"-"+$,p="tapeGradA-"+$,r="weaveA-"+$,s="hBarGradA-"+$,j=`
    <defs>
      <linearGradient id="${A}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${g.dark}" />
        <stop offset="15%" stop-color="${g.base}" />
        <stop offset="35%" stop-color="${g.light}" />
        <stop offset="50%" stop-color="${g.base}" />
        <stop offset="85%" stop-color="${g.dark}" />
        <stop offset="100%" stop-color="${g.darkest}" />
      </linearGradient>
      <linearGradient id="${t}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${F}" />
        <stop offset="15%" stop-color="${v}" />
        <stop offset="35%" stop-color="${k}" />
        <stop offset="50%" stop-color="${v}" />
        <stop offset="85%" stop-color="${F}" />
        <stop offset="100%" stop-color="#000" />
      </linearGradient>
      <linearGradient id="${p}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#AAAAAA" />
        <stop offset="15%" stop-color="#FFFFFF" />
        <stop offset="35%" stop-color="#F5F5F5" />
        <stop offset="50%" stop-color="#EEEEEE" />
        <stop offset="85%" stop-color="#CCCCCC" />
        <stop offset="100%" stop-color="#666666" />
      </linearGradient>
      <linearGradient id="${s}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${h==="white"?"#D0D0D0":"#1A1A1A"}" />
        <stop offset="15%" stop-color="${h==="white"?"#FFFFFF":"#333333"}" />
        <stop offset="35%" stop-color="${h==="white"?"#F5F5F5":"#222222"}" />
        <stop offset="50%" stop-color="${h==="white"?"#EEEEEE":"#222222"}" />
        <stop offset="85%" stop-color="${h==="white"?"#D0D0D0":"#1A1A1A"}" />
        <stop offset="100%" stop-color="${h==="white"?"#A0A0A0":"#000000"}" />
      </linearGradient>
      <pattern id="${r}" patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" transform="translate(1,0)" />
      </pattern>
    </defs>
  `;let E="";const u=Math.max(1.5,a*.035),y=Math.max(1,a*.025),O=Math.max(2,a*.03);for(let d=0;d<N;d++){const c=l+b-O-d*(u+y)-u;E+=`
      <g>
        <rect x="${c}" y="${i}" width="${u}" height="${o}" fill="url(#${p})" />
        <rect x="${c}" y="${i}" width="${u}" height="${o}" fill="url(#${r})" opacity="0.3" />
        <rect x="${c}" y="${i}" width="0.5" height="${o}" fill="rgba(0,0,0,0.3)" />
        <rect x="${c+u-.5}" y="${i}" width="0.5" height="${o}" fill="rgba(0,0,0,0.3)" />
      </g>
    `}let M="";if(h!=="none"){const d=Math.round(o*.22),c=i+Math.round((o-d)/2),S=l,C=l+b,G=a-l-b-2;M=`
      <g>
        <rect x="2" y="${c}" width="${S-2}" height="${d}" fill="url(#${s})" />
        <rect x="2" y="${c}" width="${S-2}" height="${d}" fill="url(#${r})" opacity="0.15" />
        <rect x="${C}" y="${c}" width="${G}" height="${d}" fill="url(#${s})" />
        <rect x="${C}" y="${c}" width="${G}" height="${d}" fill="url(#${r})" opacity="0.15" />
        <rect x="2" y="${c}" width="${S-2}" height="0.5" fill="rgba(255,255,255,0.3)" />
        <rect x="${C}" y="${c}" width="${G}" height="0.5" fill="rgba(255,255,255,0.3)" />
        <rect x="2" y="${c+d-.5}" width="${S-2}" height="0.5" fill="rgba(0,0,0,0.4)" />
        <rect x="${C}" y="${c+d-.5}" width="${G}" height="0.5" fill="rgba(0,0,0,0.4)" />
      </g>
    `}let T="";if(f){const d=Math.max(1.5,a*.025);T=`
      <rect x="${l}" y="${i}" width="${d}" height="${o}" fill="url(#${p})" />
      <rect x="${l+b-d}" y="${i}" width="${d}" height="${o}" fill="url(#${p})" />
    `}const D=Math.max(1.5,a*.04),B=Math.max(2,a*.04),P=`
    <rect x="${l+b+2}" y="${i+D}" width="${a-b-l-6}" height="${o-D*2}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="0.8" stroke-dasharray="${B},${B}"/>
    <rect x="${l+b+2}" y="${i+D}" width="${a-b-l-6}" height="${o-D*2}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.8" stroke-dasharray="${B},${B}" transform="translate(0,1)"/>
  `;return`
    <svg width="${a}" height="${a}" viewBox="0 0 ${a} ${a}" class="belt-svg" style="overflow:visible;">
      ${j}
      <rect x="2" y="${i}" width="${a-4}" height="${o}" rx="${m}" fill="url(#${A})" style="transition: fill 0.3s"/>
      <rect x="2" y="${i}" width="${a-4}" height="${o}" rx="${m}" fill="url(#${r})" />
      ${M}
      <rect x="${l}" y="${i}" width="${b}" height="${o}" fill="url(#${t})" />
      <rect x="${l}" y="${i}" width="${b}" height="${o}" fill="url(#${r})" />
      ${T}
      ${E}
      <rect x="2" y="${i}" width="${a-4}" height="${o}" rx="${m}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <rect x="2" y="${i}" width="${a-4}" height="${o}" rx="${m}" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="1" transform="translate(0,1)"/>
      ${P}
    </svg>
  `}function R(){if(!(typeof document>"u")){if(!document.getElementById(I)){const n=document.createElement("style");n.id=I,n.textContent=H,document.head.appendChild(n)}if(!document.getElementById(L)){const n=document.createElement("link");n.id=L,n.rel="stylesheet",n.href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",document.head.appendChild(n)}}}function X(){const{member:n}=Y(),[N,a]=x.useState([]),[h,g]=x.useState(!0),[f,v]=x.useState("pending"),[k,F]=x.useState(null),[o,i]=x.useState(new Set);x.useEffect(()=>{R();const t=document.body.style.background;return document.body.style.background="#030305",()=>{document.body.style.background=t}},[]),x.useEffect(()=>{if(!n)return;const t=(n?.role||"").toLowerCase();t.includes("owner")||t.includes("admin")||t.includes("coach")||t.includes("instructor")||(window.location.hash="/")},[n]);const b=()=>{g(!0),V().then(t=>a(t||[])).catch(()=>{}).finally(()=>g(!1))};x.useEffect(()=>{b()},[]);const l=N.filter(t=>t.status==="pending"),m=N.filter(t=>t.status!=="pending").sort((t,p)=>{const r=t.approvedDate||t.date||"";return(p.approvedDate||p.date||"").localeCompare(r)}),A=async(t,p)=>{F(t);try{await W(t,p),i(r=>new Set([...r,t])),setTimeout(()=>{a(r=>r.map(s=>s.id===t?{...s,status:p?"approved":"rejected"}:s)),i(r=>{const s=new Set(r);return s.delete(t),s})},350)}catch{}F(null)};return e.jsxs("div",{className:"bapp-root",style:{background:"#030305",minHeight:"100vh"},children:[e.jsxs("div",{className:"bapp-ambient",children:[e.jsx("div",{className:"bapp-ambient-orb bapp-orb1"}),e.jsx("div",{className:"bapp-ambient-orb bapp-orb2"})]}),e.jsxs("div",{className:"bapp-page",style:{paddingBottom:"calc(80px + env(safe-area-inset-bottom, 0px))"},children:[e.jsxs("div",{className:"bapp-top-bar",children:[e.jsx("button",{className:"bapp-back-btn",onClick:()=>window.history.back(),"aria-label":"Back",children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M15 18l-6-6 6-6"})})}),e.jsx("span",{className:"bapp-top-title",style:{color:"#D4AF37"},children:"Belt Approvals"}),e.jsx("div",{style:{width:44}})]}),e.jsxs("div",{className:"bapp-tabs",children:[e.jsxs("button",{className:`bapp-tab ${f==="pending"?"active":"inactive"}`,onClick:()=>v("pending"),children:["Pending ",l.length>0&&e.jsx("span",{className:"bapp-badge-count",children:l.length})]}),e.jsx("button",{className:`bapp-tab ${f==="history"?"active":"inactive"}`,onClick:()=>v("history"),children:"History"})]}),h&&e.jsx("div",{className:"bapp-empty",children:e.jsx("div",{style:{width:40,height:40,border:"3px solid rgba(212,175,55,0.2)",borderTopColor:"#D4AF37",borderRadius:"50%",animation:"spin 0.8s linear infinite"}})}),!h&&f==="pending"&&(l.length===0?e.jsxs("div",{className:"bapp-empty",children:[e.jsx("div",{style:{opacity:.3},dangerouslySetInnerHTML:{__html:_("white",0,120)}}),e.jsx("div",{className:"bapp-empty-title",children:"All caught up"}),e.jsx("div",{className:"bapp-empty-sub",children:"No pending belt promotions"})]}):l.map((t,p)=>{const r=(t.belt||"white").toLowerCase(),s=w[r]||w.white,j=o.has(t.id),E=k===t.id,u=t.bar==="white"||t.bar==="black"?t.bar:"none",y=Number(t.stripes)||0;return e.jsxs("div",{className:`bapp-card${j?" dismissing":""}`,style:{animationDelay:`${p*80}ms`},children:[e.jsx("div",{className:"bapp-member-name",children:t.memberName||t.memberEmail}),e.jsx("div",{style:{fontSize:11,color:"#666",marginBottom:4},children:t.memberEmail}),e.jsxs("div",{className:"bapp-belt-center",children:[e.jsx("div",{className:"bapp-belt-aura",style:{background:`radial-gradient(circle, ${s.glow} 0%, transparent 70%)`}}),e.jsx("div",{dangerouslySetInnerHTML:{__html:_(r,y,180,u)},style:{position:"relative",zIndex:1}}),e.jsxs("div",{className:"bapp-belt-name",style:{color:s.base},children:[s.name," Belt"]}),y>0&&e.jsxs("div",{style:{fontSize:12,color:"#D4AF37",marginTop:2},children:[y," stripe",y!==1?"s":""]}),t.category&&t.category!=="Adult"&&e.jsx("div",{style:{fontSize:11,color:"#888",marginTop:2},children:t.category})]}),e.jsxs("div",{className:"bapp-meta",children:["Requested: ",t.date||"Unknown date"]}),t.note&&e.jsxs("div",{className:"bapp-note",children:['"',t.note,'"']}),e.jsxs("div",{className:"bapp-actions",children:[e.jsx("button",{className:"bapp-btn-approve",onClick:()=>A(t.id,!0),disabled:!!k||j,children:E?"…":"✓ Approve"}),e.jsx("button",{className:"bapp-btn-deny",onClick:()=>A(t.id,!1),disabled:!!k||j,children:E?"…":"✕ Deny"})]})]},t.id)})),!h&&f==="history"&&(m.length===0?e.jsxs("div",{className:"bapp-empty",children:[e.jsx("div",{className:"bapp-empty-title",children:"No history yet"}),e.jsx("div",{className:"bapp-empty-sub",children:"Approved and denied promotions will appear here"})]}):m.map(t=>{const p=(t.belt||"white").toLowerCase(),r=w[p]||w.white,s=Number(t.stripes)||0;return e.jsxs("div",{className:"bapp-history-row",children:[e.jsx("div",{style:{width:10,height:36,borderRadius:4,background:r.base,flexShrink:0,boxShadow:`0 0 8px ${r.glow}`}}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{style:{fontSize:14,fontWeight:800,color:"#F8F8F8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:t.memberName||t.memberEmail}),e.jsxs("div",{style:{fontSize:11,color:"#666",marginTop:2},children:[r.name," Belt",s>0?` · ${s} stripe${s!==1?"s":""}`:""," · ",t.date||""]}),t.approvedBy&&e.jsxs("div",{style:{fontSize:10,color:"#555",marginTop:2},children:[t.status==="approved"?"Approved":"Denied"," by ",t.approvedBy]})]}),e.jsx("div",{className:t.status==="approved"?"bapp-status-approved":"bapp-status-denied",children:t.status==="approved"?"APPROVED":"DENIED"})]},t.id)}))]})]})}export{X as default};
