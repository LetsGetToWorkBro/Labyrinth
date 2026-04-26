import{j as e}from"./vendor-query-C1Sv77l2.js";import{a as t}from"./vendor-router-ODl1pWfb.js";import{u as xe,h as d,r as ue,Q as u}from"./index-Bf77bU8o.js";import"./vendor-react-D2Kp-oPc.js";const A={priority:"Priority Update",event:"Event",schedule:"Schedule Change",reminder:"Reminder",new:"New"},he=["M","T","W","T","F","S","S"],L=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];function je(l,c){if(l==="always")return 8760;if(l==="month"){const n=new Date,r=new Date(n.getFullYear(),n.getMonth()+1,1);return Math.max(1,Math.round((r.getTime()-n.getTime())/36e5))}if(l==="week"){const n=new Date,r=n.getDay(),p=r===0?0:7-r,s=new Date(n);return s.setDate(s.getDate()+p),s.setHours(23,59,59,999),Math.max(1,Math.round((s.getTime()-n.getTime())/36e5))}if(c){const n=new Date(c+"T23:59:59"),r=Math.round((n.getTime()-Date.now())/36e5);if(r>0)return r}return 24}function Ne({onBack:l}){const{member:c}=xe(),n=typeof document<"u"?document.body:null,[r,p]=t.useState(null),s=t.useCallback((a,i="success")=>{p({message:a,type:i}),window.setTimeout(()=>p(null),2600)},[]),[h,E]=t.useState(""),[b,T]=t.useState(""),[F,te]=t.useState("priority"),[j,B]=t.useState(""),[z,se]=t.useState(!0),[f,W]=t.useState(!1),re=async()=>{if(!h.trim()&&!b.trim()){s("Title or message required","error");return}W(!0);try{const a=await d("pinAnnouncement",{token:u()||"",title:h,body:b,message:b,badge:A[F],ctaUrl:j,link:j,pinned:z});console.log("[AdminPage] pinAnnouncement result:",JSON.stringify(a)),!a||a?.success===!1?s(`Pin failed: ${a?.error||"No response"}`,"error"):(s("✓ Announcement pinned to home screens"),window.dispatchEvent(new Event("announcement-updated")),E(""),T(""),B(""))}catch{s("Failed to publish","error")}finally{W(!1)}},[m,D]=t.useState(!0),[P,G]=t.useState(2),[ne,ie]=t.useState("06:30"),[X,le]=t.useState(""),[R,oe]=t.useState("week"),[v,I]=t.useState(1.5),[y,H]=t.useState(!1);t.useEffect(()=>{(async()=>{try{const a=await d("getXpEvent",{});if(a&&typeof a=="object"){D(!!a.active);const i=Number(a.multiplier);(i===1.25||i===1.5||i===2)&&I(i);const be=String(a.label||""),ee=L.findIndex(ge=>be.toLowerCase().includes(ge.toLowerCase()));ee>=0&&G(ee)}}catch{}try{const a=await d("getGeoConfig",{});a&&typeof a=="object"&&(typeof a.checkinWindowMinutes=="number"&&Y(a.checkinWindowMinutes),typeof a.checkinGateEnabled=="boolean"&&$(a.checkinGateEnabled),typeof a.geoEnabled=="boolean"&&U(a.geoEnabled),typeof a.geoLocation=="string"&&a.geoLocation&&N(a.geoLocation),typeof a.geoRadiusYards=="number"&&O(a.geoRadiusYards),typeof a.geoLat=="number"&&_(a.geoLat),typeof a.geoLng=="number"&&q(a.geoLng))}catch{}})()},[]);const de=async()=>{H(!0);try{m?(await d("setXpEvent",{token:u()||"",active:!0,label:`${v}× XP — ${L[P]}s`,durationHours:je(R,X),multiplier:v}),s("XP event saved")):(await d("setXpEvent",{token:u()||"",active:!1}),s("XP event disabled"))}catch{s("Failed to save XP event","error")}finally{H(!1)}},[k,$]=t.useState(!0),[g,Y]=t.useState(60),[x,U]=t.useState(!0),[w,N]=t.useState("Labyrinth BJJ, Fulshear, TX"),[o,O]=t.useState(500),[V,_]=t.useState(null),[J,q]=t.useState(null),[C,S]=t.useState(!1),ce=()=>{if(!navigator.geolocation){s("Geolocation not supported","error");return}S(!0),navigator.geolocation.getCurrentPosition(a=>{_(a.coords.latitude),q(a.coords.longitude),N(`${a.coords.latitude.toFixed(6)}, ${a.coords.longitude.toFixed(6)}`),S(!1),s("Location captured")},()=>{S(!1),s("Failed to get location","error")},{enableHighAccuracy:!0,timeout:1e4})},[Q,K]=t.useState(!1),pe=async()=>{K(!0);try{console.log("[AdminPage] saveGeoConfig payload:",{checkinWindowMinutes:g,checkinGateEnabled:k,geoEnabled:x,geoLocation:w,geoRadiusYards:o,geoLat:V,geoLng:J});const a=await d("saveGeoConfig",{token:u()||"",checkinWindowMinutes:g,checkinGateEnabled:k,geoEnabled:x,geoLocation:w,geoRadiusYards:o,geoLat:V,geoLng:J});if(a?.success===!1)s(a.error||"Failed to save","error");else{try{sessionStorage.setItem("lbjj_checkin_window",String(g))}catch{}s("System config saved")}}catch{s("Failed to save","error")}finally{K(!1)}};if(!c?.isAdmin)return e.jsxs("div",{style:{padding:40,color:"#EAEAEA",fontFamily:"Inter, system-ui, sans-serif",background:"#050505",minHeight:"100vh"},children:[e.jsx("button",{onClick:l,style:ae,"aria-label":"Back",children:"←"}),e.jsx("div",{style:{marginTop:80,textAlign:"center",color:"#888891"},children:"Admin access required."})]});const Z=Math.max(30,o/2e3*150);return e.jsxs("div",{style:fe,children:[e.jsx(me,{}),e.jsxs("div",{style:{maxWidth:600,margin:"0 auto",position:"relative"},children:[e.jsxs("div",{className:"lbj-admin-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("button",{onClick:l,style:ae,"aria-label":"Back",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"19",y1:"12",x2:"5",y2:"12"}),e.jsx("polyline",{points:"12 19 5 12 12 5"})]})}),e.jsxs("div",{className:"lbj-page-title",children:[e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"}),e.jsx("circle",{cx:"12",cy:"12",r:"3"})]}),"Academy Controls"]})]}),e.jsx("div",{className:"lbj-status-badge",children:"Live"})]}),e.jsxs("div",{className:"lbj-card",style:{borderColor:"rgba(244, 63, 94, 0.3)"},children:[e.jsx("div",{className:"lbj-card-glow ann"}),e.jsx("div",{className:"lbj-c-header",children:e.jsxs("div",{children:[e.jsxs("div",{className:"lbj-c-title ann",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M3 11l18-5v12L3 14v-3z"}),e.jsx("path",{d:"M11.6 16.8a3 3 0 1 1-5.8-1.6"})]}),"Broadcast Announcement"]}),e.jsx("div",{className:"lbj-c-desc",children:"Push an alert directly to members' devices and home screens."})]})}),e.jsxs("div",{className:"lbj-input-group",children:[e.jsx("label",{children:"Title"}),e.jsx("input",{type:"text",className:"lbj-input",placeholder:"e.g., Gym Closed for ADCC",value:h,onChange:a=>E(a.target.value)})]}),e.jsxs("div",{className:"lbj-input-group",children:[e.jsx("label",{children:"Message"}),e.jsx("textarea",{className:"lbj-input",placeholder:"Enter your announcement details here...",value:b,onChange:a=>T(a.target.value)})]}),e.jsxs("div",{className:"lbj-input-group",children:[e.jsx("label",{children:"Badge Label"}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8},children:Object.keys(A).map(a=>e.jsx("div",{className:`lbj-badge-pill ${F===a?"active":""}`,"data-type":a,onClick:()=>te(a),children:A[a]},a))})]}),e.jsxs("div",{className:"lbj-input-group",children:[e.jsx("label",{children:"CTA Link (Optional)"}),e.jsxs("div",{className:"lbj-input-with-icon",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:[e.jsx("path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"}),e.jsx("path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"})]}),e.jsx("input",{type:"url",className:"lbj-input",placeholder:"https://...",value:j,onChange:a=>B(a.target.value)})]})]}),e.jsxs("div",{className:"lbj-flex-row-check",style:{marginBottom:16},children:[e.jsxs("span",{children:[e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:e.jsx("path",{d:"M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"})}),"Pin to All Home Screens"]}),e.jsxs("label",{className:"lbj-toggle toggle-danger",children:[e.jsx("input",{type:"checkbox",checked:z,onChange:a=>se(a.target.checked)}),e.jsx("span",{className:"lbj-slider"})]})]}),e.jsxs("button",{className:"lbj-btn-secondary btn-announcement",onClick:re,disabled:f,children:[f?e.jsx(M,{}):e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("path",{d:"M22 2L11 13"}),e.jsx("path",{d:"M22 2l-7 20-4-9-9-4 20-7z"})]}),f?"Publishing…":"Publish Announcement"]})]}),e.jsxs("div",{className:"lbj-card",style:{borderColor:"rgba(245, 158, 11, 0.3)"},children:[e.jsx("div",{className:"lbj-card-glow xp"}),e.jsxs("div",{className:"lbj-c-header",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"lbj-c-title xp",children:[e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polygon",{points:"13 2 3 14 12 14 11 22 21 10 12 10 13 2"})}),"Dynamic XP Multiplier"]}),e.jsx("div",{className:"lbj-c-desc",children:"Boost class attendance by offering bonus XP."})]}),e.jsxs("label",{className:"lbj-toggle",children:[e.jsx("input",{type:"checkbox",checked:m,onChange:a=>D(a.target.checked)}),e.jsx("span",{className:"lbj-slider"})]})]}),e.jsxs("div",{className:"lbj-input-group",children:[e.jsx("label",{children:"Select Day"}),e.jsx("div",{className:"lbj-day-pills",children:he.map((a,i)=>e.jsx("div",{className:`lbj-day-pill ${P===i?"active":""}`,onClick:()=>G(i),title:L[i],children:a},i))})]}),e.jsxs("div",{style:{display:"flex",gap:16},children:[e.jsxs("div",{className:"lbj-input-group",style:{flex:1},children:[e.jsx("label",{children:"Time Slot"}),e.jsxs("div",{className:"lbj-input-with-icon",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("polyline",{points:"12 6 12 12 16 14"})]}),e.jsx("input",{type:"time",className:"lbj-input",value:ne,onChange:a=>ie(a.target.value),style:{colorScheme:"dark"}})]})]}),e.jsxs("div",{className:"lbj-input-group",style:{flex:1},children:[e.jsx("label",{children:"Valid Until"}),e.jsxs("div",{className:"lbj-input-with-icon",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),e.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),e.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]}),e.jsx("input",{type:"date",className:"lbj-input",value:X,onChange:a=>le(a.target.value),style:{colorScheme:"dark"}})]})]})]}),e.jsxs("div",{className:"lbj-input-group",children:[e.jsx("label",{children:"Duration / Scope"}),e.jsx("div",{className:"lbj-pills-wrap",children:[{k:"week",label:"Just This Week"},{k:"month",label:"All Month"},{k:"always",label:"Always On"}].map(a=>e.jsx("div",{className:`lbj-pill ${R===a.k?"active":""}`,onClick:()=>oe(a.k),children:a.label},a.k))})]}),e.jsxs("div",{className:"lbj-input-group",children:[e.jsx("label",{children:"Multiplier Level"}),e.jsx("div",{className:"lbj-xp-pills",children:[1.25,1.5,2].map(a=>e.jsxs("div",{className:`lbj-xp-pill ${v===a?"active":""}`,onClick:()=>I(a),children:[a.toFixed(2),"x"]},a))})]}),e.jsxs("button",{className:"lbj-btn-secondary",onClick:de,disabled:y,children:[y?e.jsx(M,{}):null,y?"Saving…":m?"Add Multiplier Event":"Disable Multiplier"]})]}),e.jsxs("div",{className:"lbj-card",children:[e.jsx("div",{className:"lbj-card-glow"}),e.jsxs("div",{className:"lbj-c-header",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"lbj-c-title",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("polyline",{points:"12 6 12 12 16 14"})]}),"Check-In Time Gate"]}),e.jsx("div",{className:"lbj-c-desc",children:"Block early check-ins outside the window."})]}),e.jsxs("label",{className:"lbj-toggle",children:[e.jsx("input",{type:"checkbox",checked:k,onChange:a=>$(a.target.checked)}),e.jsx("span",{className:"lbj-slider"})]})]}),e.jsxs("div",{className:"lbj-input-group",style:{marginBottom:0},children:[e.jsx("label",{children:"Window Opens Before Class"}),e.jsx("div",{className:"lbj-pills-wrap",children:[{m:15,label:"15 Min"},{m:30,label:"30 Min"},{m:60,label:"1 Hour"},{m:120,label:"2 Hours"},{m:240,label:"4 Hours"}].map(a=>e.jsx("div",{className:`lbj-pill ${g===a.m?"active":""}`,onClick:()=>Y(a.m),children:a.label},a.m))})]})]}),e.jsxs("div",{className:"lbj-card",children:[e.jsx("div",{className:"lbj-card-glow"}),e.jsxs("div",{className:"lbj-c-header",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"lbj-c-title",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),e.jsx("circle",{cx:"12",cy:"10",r:"3"})]}),"Location Geo-Lock"]}),e.jsx("div",{className:"lbj-c-desc",children:"Require members to be physically inside the academy radius."})]}),e.jsxs("label",{className:"lbj-toggle",children:[e.jsx("input",{type:"checkbox",checked:x,onChange:a=>U(a.target.checked)}),e.jsx("span",{className:"lbj-slider"})]})]}),e.jsxs("div",{className:"lbj-input-group",children:[e.jsx("label",{children:"Academy Coordinates"}),e.jsxs("div",{className:"lbj-input-with-icon",children:[e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",strokeWidth:"2",children:[e.jsx("circle",{cx:"11",cy:"11",r:"8"}),e.jsx("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]}),e.jsx("input",{type:"text",className:"lbj-input",value:w,onChange:a=>N(a.target.value)})]})]}),e.jsx("div",{className:"lbj-input-group",children:e.jsxs("button",{className:"lbj-btn-secondary",style:{background:"rgba(255,255,255,0.02)",border:"1px dashed rgba(255,255,255,0.15)"},onClick:ce,disabled:C,children:[C?e.jsx(M,{}):e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("polygon",{points:"3 11 22 2 13 21 11 13 3 11"})}),C?"Locating…":"Use My Current Location"]})}),e.jsxs("div",{className:"lbj-input-group",style:{marginTop:24},children:[e.jsxs("div",{className:"lbj-range-header",children:[e.jsx("label",{style:{margin:0},children:"Allowed Radius"}),e.jsxs("div",{style:{textAlign:"right"},children:[e.jsxs("div",{className:"lbj-range-val",children:[o," yd"]}),e.jsxs("div",{className:"lbj-range-sub",children:["~ ",(o/1760).toFixed(2)," miles"]})]})]}),e.jsx("input",{type:"range",min:50,max:2e3,step:50,value:o,onChange:a=>O(Number(a.target.value))})]}),e.jsxs("div",{className:"lbj-radar-box",children:[e.jsx("div",{className:"lbj-radar-grid"}),e.jsx("div",{className:"lbj-radar-ring",style:{width:Z,height:Z}}),e.jsx("div",{className:"lbj-radar-center"}),e.jsxs("div",{style:{position:"absolute",bottom:8,right:10,fontSize:9,color:"#888891",fontFamily:"monospace"},children:["GPS: ",x?"ACTIVE":"OFF"]})]})]}),n&&ue.createPortal(e.jsx("div",{className:"lbj-save-bar",children:e.jsx("button",{className:"lbj-btn-save",onClick:pe,disabled:Q,children:Q?"Saving…":"Save System Config"})}),n),r&&e.jsx("div",{className:"lbj-toast",style:{background:r.type==="error"?"rgba(239,68,68,0.15)":"rgba(34,197,94,0.15)",borderColor:r.type==="error"?"rgba(239,68,68,0.5)":"rgba(34,197,94,0.5)",color:r.type==="error"?"#fca5a5":"#86efac"},children:r.message})]})]})}function M(){return e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",style:{animation:"lbj-spin 1s linear infinite"},children:e.jsx("path",{d:"M21 12a9 9 0 1 1-6.219-8.56"})})}const fe={background:"#050505",color:"#f5f5f5",fontFamily:"Inter, system-ui, sans-serif",minHeight:"100vh",padding:"20px 20px",paddingBottom:"calc(180px + env(safe-area-inset-bottom, 34px))",WebkitFontSmoothing:"antialiased"},ae={background:"transparent",border:"none",color:"#fff",width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0};function me(){return e.jsx("style",{children:`
      @keyframes lbj-spin { to { transform: rotate(360deg); } }
      @keyframes lbj-radar-pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
      @keyframes lbj-toast-in { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }

      .lbj-admin-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 24px; padding-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .lbj-page-title {
        font-size: 20px; font-weight: 900; letter-spacing: -0.02em;
        display: flex; align-items: center; gap: 10px; color: #f5f5f5;
      }
      .lbj-page-title svg { stroke: #C8A24C; }
      .lbj-status-badge {
        font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
        background: rgba(34, 197, 94, 0.1); color: #22c55e;
        padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(34, 197, 94, 0.2);
      }

      .lbj-card {
        background: linear-gradient(160deg, rgba(20,20,24,0.6) 0%, rgba(10,10,12,0.8) 100%);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 16px; padding: 24px; margin-bottom: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02);
        position: relative; overflow: hidden;
      }
      .lbj-card-glow {
        position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, #C8A24C, transparent);
        opacity: 0.2;
      }
      .lbj-card-glow.xp { background: linear-gradient(90deg, transparent, #fbbf24, #f59e0b, transparent); opacity: 0.5; }
      .lbj-card-glow.ann { background: linear-gradient(90deg, transparent, #ef4444, #f43f5e, transparent); opacity: 0.5; }

      .lbj-c-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        margin-bottom: 20px; gap: 12px;
      }
      .lbj-c-title { font-size: 16px; font-weight: 800; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; color: #f5f5f5; }
      .lbj-c-title svg { width: 18px; height: 18px; stroke: #888891; }
      .lbj-c-title.xp svg { stroke: #fbbf24; fill: rgba(251, 191, 36, 0.2); }
      .lbj-c-title.ann svg { stroke: #f43f5e; fill: rgba(244, 63, 94, 0.2); }
      .lbj-c-desc { font-size: 13px; color: #888891; line-height: 1.5; max-width: 85%; }

      .lbj-toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
      .lbj-toggle input { opacity: 0; width: 0; height: 0; }
      .lbj-slider {
        position: absolute; cursor: pointer; inset: 0;
        background-color: rgba(255,255,255,0.1);
        border-radius: 24px; transition: 0.3s;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .lbj-slider:before {
        position: absolute; content: "";
        height: 18px; width: 18px; left: 3px; bottom: 2px;
        background-color: #fff; border-radius: 50%; transition: 0.3s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
      }
      .lbj-toggle input:checked + .lbj-slider { background-color: #C8A24C; box-shadow: 0 0 12px rgba(200,162,76,0.3); border-color: #FFD700; }
      .lbj-toggle input:checked + .lbj-slider:before { transform: translateX(19px); }
      .lbj-toggle.toggle-danger input:checked + .lbj-slider { background-color: #ef4444; box-shadow: 0 0 12px rgba(239,68,68,0.3); border-color: #f87171; }

      .lbj-input-group { margin-bottom: 16px; position: relative; }
      .lbj-input-group label {
        display: block; font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.1em; color: #888891; margin-bottom: 8px;
      }
      .lbj-input-with-icon { position: relative; }
      .lbj-input-with-icon svg {
        position: absolute; left: 14px; top: 12px;
        width: 16px; height: 16px; stroke: #888891; pointer-events: none;
      }
      .lbj-input {
        width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06);
        color: #fff; font-family: 'Inter', sans-serif; font-size: 14px;
        padding: 12px 14px; border-radius: 10px; transition: all 0.2s;
      }
      .lbj-input-with-icon .lbj-input { padding-left: 40px; }
      .lbj-input:focus { outline: none; border-color: #C8A24C; box-shadow: 0 0 0 3px rgba(200,162,76,0.15); }
      textarea.lbj-input { resize: vertical; min-height: 80px; line-height: 1.5; }

      .lbj-pills-wrap {
        display: flex; gap: 8px; flex-wrap: wrap;
        background: rgba(0,0,0,0.3); padding: 6px; border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.06);
      }
      .lbj-pill {
        flex: 1; min-width: 60px; text-align: center;
        padding: 10px 12px; font-size: 12px; font-weight: 600; color: #888891;
        cursor: pointer; border-radius: 8px; transition: all 0.2s;
        border: 1px solid transparent; white-space: nowrap;
      }
      .lbj-pill:hover { background: rgba(255,255,255,0.05); color: #fff; }
      .lbj-pill.active {
        background: rgba(200,162,76,0.15); color: #FFD700;
        border: 1px solid rgba(200,162,76,0.5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
      }

      .lbj-badge-pill { padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.4); color: #888891; cursor: pointer; transition: 0.2s; user-select: none; }
      .lbj-badge-pill:hover { background: rgba(255,255,255,0.05); }
      .lbj-badge-pill.active[data-type="priority"] { background: rgba(239,68,68,0.15); color: #fca5a5; border-color: rgba(239,68,68,0.5); }
      .lbj-badge-pill.active[data-type="event"] { background: rgba(200,162,76,0.15); color: #FFD700; border-color: rgba(200,162,76,0.5); }
      .lbj-badge-pill.active[data-type="schedule"] { background: rgba(59,130,246,0.15); color: #93c5fd; border-color: rgba(59,130,246,0.5); }
      .lbj-badge-pill.active[data-type="reminder"] { background: rgba(168,85,247,0.15); color: #d8b4fe; border-color: rgba(168,85,247,0.5); }
      .lbj-badge-pill.active[data-type="new"] { background: rgba(34,197,94,0.15); color: #86efac; border-color: rgba(34,197,94,0.5); }

      .lbj-day-pills { display: flex; gap: 6px; margin-bottom: 0; }
      .lbj-day-pill {
        width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; font-size: 13px; font-weight: 700;
        background: rgba(255,255,255,0.05); color: #888891; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s;
      }
      .lbj-day-pill.active { background: #fff; color: #000; border-color: #fff; box-shadow: 0 4px 12px rgba(255,255,255,0.2); }

      .lbj-xp-pills { display: flex; gap: 8px; margin-bottom: 0; }
      .lbj-xp-pill {
        flex: 1; padding: 12px 0; border-radius: 12px; text-align: center;
        font-size: 16px; font-weight: 900; font-style: italic; color: #888891;
        background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s;
      }
      .lbj-xp-pill.active {
        background: linear-gradient(135deg, #f59e0b, #d97706); color: #000;
        border-color: #fbbf24; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4), inset 0 2px 0 rgba(255,255,255,0.4);
        transform: translateY(-2px);
      }

      .lbj-range-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
      .lbj-range-val { font-size: 20px; font-weight: 800; color: #C8A24C; }
      .lbj-range-sub { font-size: 12px; color: #888891; font-weight: 500; }
      .lbj-card input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; background: transparent; }
      .lbj-card input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; height: 24px; width: 24px; border-radius: 50%;
        background: #FFD700; cursor: pointer; margin-top: -10px;
        box-shadow: 0 0 10px rgba(200,162,76,0.5), inset 0 -2px 4px rgba(0,0,0,0.3); border: 2px solid #fff;
      }
      .lbj-card input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: rgba(255,255,255,0.1); border-radius: 4px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5); }
      .lbj-card input[type=range]::-moz-range-thumb { height: 24px; width: 24px; border-radius: 50%; background: #FFD700; cursor: pointer; border: 2px solid #fff; }
      .lbj-card input[type=range]::-moz-range-track { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; }

      .lbj-radar-box {
        width: 100%; height: 120px; background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-top: 20px;
        display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
      }
      .lbj-radar-grid {
        position: absolute; inset: 0;
        background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size: 20px 20px; background-position: center;
      }
      .lbj-radar-center { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 8px #ef4444; position: relative; z-index: 2; }
      .lbj-radar-ring { position: absolute; border-radius: 50%; border: 1px solid #C8A24C; background: rgba(200,162,76,0.1); animation: lbj-radar-pulse 3s infinite; }

      .lbj-flex-row-check {
        display: flex; align-items: center; justify-content: space-between;
        background: rgba(255,255,255,0.02); padding: 14px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
      }
      .lbj-flex-row-check span { font-size: 14px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 8px; }
      .lbj-flex-row-check span svg { stroke: #C8A24C; width: 18px; height: 18px; }

      .lbj-btn-secondary {
        background: rgba(255,255,255,0.05); color: #fff; font-size: 13px; font-weight: 700;
        border: 1px solid rgba(255,255,255,0.06); padding: 12px 16px; border-radius: 10px; cursor: pointer;
        display: flex; align-items: center; gap: 8px; transition: all 0.2s; justify-content: center; width: 100%;
        font-family: 'Inter', sans-serif;
      }
      .lbj-btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
      .lbj-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
      .lbj-btn-secondary.btn-announcement {
        background: rgba(244, 63, 94, 0.1); color: #fecdd3; border: 1px solid rgba(244, 63, 94, 0.3);
      }
      .lbj-btn-secondary.btn-announcement:hover:not(:disabled) { background: rgba(244, 63, 94, 0.2); }

      .lbj-save-bar {
        position: fixed; bottom: calc(72px + env(safe-area-inset-bottom, 34px)); left: 50%; transform: translateX(-50%); z-index: 10;
        width: calc(430px - 40px); max-width: calc(100% - 40px);
        background: rgba(10,10,12,0.9); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(200,162,76,0.5); padding: 16px; border-radius: 16px;
        display: flex; gap: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(200,162,76,0.1);
      }
      .lbj-btn-save {
        flex: 1; background: linear-gradient(135deg, #C8A24C, #FFD700);
        color: #000; font-size: 15px; font-weight: 900; text-transform: uppercase;
        letter-spacing: 0.05em; padding: 16px; border-radius: 10px; border: none;
        cursor: pointer; box-shadow: inset 0 1px 1px rgba(255,255,255,0.5); transition: transform 0.1s;
        font-family: 'Inter', sans-serif;
      }
      .lbj-btn-save:active:not(:disabled) { transform: scale(0.98); }
      .lbj-btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

      .lbj-toast {
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        padding: 12px 18px; border-radius: 10px; border: 1px solid;
        font-size: 13px; font-weight: 700; z-index: 20;
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        animation: lbj-toast-in 0.25s ease-out;
      }
    `})}export{Ne as default};
