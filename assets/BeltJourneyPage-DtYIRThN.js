import{j as e}from"./vendor-query-C1Sv77l2.js";import{f as ue,a as b,R as ne}from"./vendor-router-ODl1pWfb.js";import{Y as ye,r as q,Z as we,_ as ke,$ as $e}from"./index-DaKLO3_z.js";import"./vendor-react-D2Kp-oPc.js";const y={white:{base:"#E5E5E5",light:"#FFFFFF",dark:"#B0B0B0",darkest:"#888888",glow:"rgba(255,255,255,0.4)",name:"White"},grey:{base:"#A0A0A0",light:"#C0C0C0",dark:"#808080",darkest:"#606060",glow:"rgba(160,160,160,0.4)",name:"Grey"},yellow:{base:"#FFD700",light:"#FFEB3B",dark:"#FFA500",darkest:"#FF8C00",glow:"rgba(255,215,0,0.5)",name:"Yellow"},orange:{base:"#FF8C00",light:"#FFA500",dark:"#FF6347",darkest:"#FF4500",glow:"rgba(255,140,0,0.5)",name:"Orange"},green:{base:"#228B22",light:"#32CD32",dark:"#006400",darkest:"#004000",glow:"rgba(34,139,34,0.5)",name:"Green"},blue:{base:"#1A56DB",light:"#4A7FF0",dark:"#103A99",darkest:"#0A2266",glow:"rgba(26,86,219,0.5)",name:"Blue"},purple:{base:"#7E3AF2",light:"#A26DF8",dark:"#521BA6",darkest:"#2E0F5C",glow:"rgba(126,58,242,0.5)",name:"Purple"},brown:{base:"#92400E",light:"#B85E24",dark:"#632A08",darkest:"#381603",glow:"rgba(146,64,14,0.5)",name:"Brown"},black:{base:"#222222",light:"#444444",dark:"#111111",darkest:"#000000",glow:"rgba(200,162,76,0.4)",name:"Black"}},Q={white:"White Belt",grey:"Grey Belt",yellow:"Yellow Belt",orange:"Orange Belt",green:"Green Belt",blue:"Blue Belt",purple:"Purple Belt",brown:"Brown Belt",black:"Black Belt"},de={Adult:["white","blue","purple","brown","black"],Kids:["white","grey","yellow","orange","green"]},Fe={white:18,blue:30,purple:30,brown:24},se=["white","grey","yellow","orange","green","blue","purple","brown","black"],ie="belt-forge-v6-styles",le="belt-forge-v6-font",Ne=`
.bjv6-root { --gold:#D4AF37; --gold-glow:rgba(212,175,55,0.4); --bjv6-bg:#030305; --surface:rgba(18,18,22,0.65); --border:rgba(255,255,255,0.06); --text:#F8F8F8; --muted:#777780; }
.bjv6-root, .bjv6-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.bjv6-root { color:#F8F8F8; font-family: 'Inter', sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; }

/* AMBIENT */
.bjv6-ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.03"/></svg>'); }
.bjv6-ambient-orb { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.15; mix-blend-mode: screen; }
.bjv6-orb1 { width: 60vw; height: 60vw; background: #D4AF37; top: -10%; left: -20%; animation: bjv6-orb-drift 20s ease-in-out infinite alternate; }
.bjv6-orb2 { width: 50vw; height: 50vw; background: #1A56DB; bottom: 5%; right: -10%; animation: bjv6-orb-drift 25s ease-in-out infinite alternate-reverse; }
@keyframes bjv6-orb-drift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(30px, 40px) scale(1.1); } }

/* LAYOUT */
.bjv6-page { position: relative; z-index: 1; max-width: 480px; margin: 0 auto; padding: 0 0 120px; }
.bjv6-top-bar { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px; }
.bjv6-back-btn { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); display: grid; place-items: center; cursor: pointer; color: #888; transition: all 0.2s; box-shadow: inset 0 1px 1px rgba(255,255,255,0.05); }
.bjv6-back-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.08); }
.bjv6-top-title { font-size: 16px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }

/* HERO */
.bjv6-hero-wrapper { perspective: 1000px; margin: 8px 16px 24px; }
.bjv6-hero-card {
  border-radius: 28px; padding: 32px 24px; position: relative; overflow: hidden;
  backdrop-filter: blur(30px) saturate(120%); -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2);
  transition: transform 0.1s; transform-style: preserve-3d;
  animation: bjv6-hero-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes bjv6-hero-in { from { opacity:0; transform: translateY(30px) scale(0.95) rotateX(10deg); } to { opacity:1; transform: translateY(0) scale(1) rotateX(0deg); } }
.bjv6-hero-bg-shimmer { position: absolute; inset: 0; pointer-events: none; z-index: 0; mix-blend-mode: overlay; opacity: 0.5; }
.bjv6-hero-content { position: relative; z-index: 2; transform: translateZ(30px); }
.bjv6-hero-eyebrow { font-size: 10px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
.bjv6-hero-body { display: flex; align-items: center; gap: 24px; }
.bjv6-hero-belt-wrap { position: relative; flex-shrink: 0; }
.bjv6-hero-belt-aura { position: absolute; inset: -20px; border-radius: 50%; animation: bjv6-aura-pulse 4s ease-in-out infinite; pointer-events: none; mix-blend-mode: screen; }
@keyframes bjv6-aura-pulse { 0%, 100% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); filter: blur(10px); } }
.bjv6-belt-svg-wrap { position: relative; z-index: 2; filter: drop-shadow(0 20px 20px rgba(0,0,0,0.8)); transform: translateZ(40px); }
.bjv6-hero-rank { font-size: 32px; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 4px; text-shadow: 0 4px 12px rgba(0,0,0,0.4); }
.bjv6-hero-stripes { font-size: 15px; font-weight: 700; color: #D4AF37; margin-bottom: 6px; text-shadow: 0 2px 8px rgba(212,175,55,0.4); }
.bjv6-hero-since { font-size: 12px; color: #AAA; font-weight: 500; }
.bjv6-hero-stats { display: flex; margin-top: 24px; padding-top: 20px; gap: 0; border-top: 1px solid rgba(255,255,255,0.08); transform: translateZ(20px); }
.bjv6-hero-stat { flex: 1; text-align: center; }
.bjv6-hero-stat + .bjv6-hero-stat { border-left: 1px solid rgba(255,255,255,0.06); }
.bjv6-hero-stat-val { font-family: 'JetBrains Mono', monospace; font-size: 26px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
.bjv6-hero-stat-lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #777780; margin-top: 4px; }

/* SECTION LABEL */
.bjv6-section-row { padding: 0 24px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
.bjv6-section-lbl { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #777780; }
.bjv6-section-count { font-size: 11px; font-weight: 600; color: #555; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 10px; }

/* TIMELINE */
.bjv6-timeline { padding: 0 16px; }
.bjv6-belt-node { display: flex; gap: 16px; align-items: flex-start; position: relative; animation: bjv6-node-in 0.6s cubic-bezier(0.16,1,0.3,1) both; }
@keyframes bjv6-node-in { from { opacity:0; transform: translateX(-20px); } to { opacity:1; transform: none; } }
.bjv6-node-left { display: flex; flex-direction: column; align-items: center; gap: 0; flex-shrink: 0; z-index: 2; }
.bjv6-node-orb-wrap { position: relative; }
.bjv6-node-orb {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, #1A1A20, #0A0A0C); border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 10px 20px rgba(0,0,0,0.5), inset 0 2px 2px rgba(255,255,255,0.05);
  display: grid; place-items: center; cursor: pointer; position: relative; transition: all 0.3s;
}
.bjv6-node-orb.bjv6-current { border-color: transparent; }
.bjv6-node-orb.bjv6-current::before {
  content: ''; position: absolute; inset: -4px; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0%, var(--node-color) 40%, #FFF 50%, transparent 60%);
  animation: bjv6-orbit-spin 2.5s linear infinite; z-index: -1;
}
@keyframes bjv6-orbit-spin { 100% { transform: rotate(360deg); } }
.bjv6-node-orb:active { transform: scale(0.92); }
.bjv6-current-star {
  position: absolute; top: -2px; right: -2px; width: 20px; height: 20px; border-radius: 50%;
  background: linear-gradient(135deg, #FFF0B3, #D4AF37);
  display: grid; place-items: center; font-size: 10px; color: #000;
  border: 2px solid #030305; box-shadow: 0 4px 10px rgba(212,175,55,0.4); z-index: 3;
}

.bjv6-connector-wrap { display: flex; flex-direction: column; align-items: center; margin-left: 32px; padding-left: 1px; }
.bjv6-connector-line { width: 4px; flex: 1; border-radius: 4px; background: rgba(0,0,0,0.5); box-shadow: inset 0 1px 3px rgba(0,0,0,0.8); position: relative; overflow: hidden; min-height: 48px; margin: 4px 0; }
.bjv6-connector-fill { position: absolute; top: 0; left: 0; right: 0; height: 0%; box-shadow: 0 0 10px currentColor; transition: height 1.5s cubic-bezier(0.16,1,0.3,1) 0.4s; }
.bjv6-connector-badge { font-size: 10px; font-weight: 800; letter-spacing: 0.08em; white-space: nowrap; color: #444; margin: 4px 0; background: rgba(0,0,0,0.4); padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.02); }
.bjv6-connector-badge.bjv6-early { color: #00FF7F; text-shadow: 0 0 10px rgba(0,255,127,0.4); border-color: rgba(0,255,127,0.2); }
.bjv6-connector-trail { width: 4px; min-height: 40px; border-radius: 4px; background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent); margin-top: 4px; }

.bjv6-node-card {
  flex: 1; border-radius: 20px; padding: 18px 20px; cursor: pointer;
  background: rgba(18,18,22,0.65); border: 1px solid rgba(255,255,255,0.04);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05);
  backdrop-filter: blur(20px); transition: all 0.3s cubic-bezier(0.16,1,0.3,1); margin-bottom: 4px;
}
.bjv6-node-card.bjv6-current { background: linear-gradient(135deg, var(--node-color-15), rgba(18,18,22,0.65)); border-color: var(--node-color-30); box-shadow: 0 15px 40px var(--node-color-10), inset 0 1px 1px rgba(255,255,255,0.1); }
.bjv6-node-card:active { transform: scale(0.96); }
.bjv6-node-card-row1 { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.bjv6-node-belt-name { font-size: 18px; font-weight: 900; color: #F8F8F8; letter-spacing: -0.02em; }
.bjv6-node-stripes { font-size: 12px; color: #D4AF37; font-weight: 700; margin-left: 8px; background: rgba(212,175,55,0.1); padding: 2px 8px; border-radius: 8px; }
.bjv6-node-edit-icon { color: #444; transition: color 0.2s; }
.bjv6-node-date { font-size: 12px; color: #777780; margin-bottom: 12px; font-weight: 500; }
.bjv6-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.bjv6-status-pill .bjv6-dot-pip { width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
.bjv6-status-pending { background: rgba(255,140,0,0.1); border: 1px solid rgba(255,140,0,0.2); color: #FF8C00; }
.bjv6-status-pending .bjv6-dot-pip { background: #FF8C00; }
.bjv6-status-approved { background: rgba(0,255,127,0.1); border: 1px solid rgba(0,255,127,0.2); color: #00FF7F; }
.bjv6-status-approved .bjv6-dot-pip { background: #00FF7F; }
.bjv6-coach-note { margin-top:14px; padding:12px; background:rgba(0,0,0,0.4); border-radius:12px; border:1px solid rgba(255,255,255,0.03); }
.bjv6-coach-note p { font-size:12px; color:#AAA; font-style:italic; line-height:1.6; margin:0; }

/* THE BELT FORGE */
.bjv6-form-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); z-index: 1000; display: flex; align-items: flex-end; opacity: 0; pointer-events: none; transition: opacity 0.4s; }
.bjv6-form-backdrop.bjv6-open { opacity: 1; pointer-events: all; }
.bjv6-form-sheet {
  width: 100%; max-width: 480px; margin: 0 auto; background: #0A0A0C;
  border-radius: 32px 32px 0 0; border-top: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 -20px 60px rgba(0,0,0,0.8); padding: 0 0 40px 0;
  transform: translateY(100%); transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
  max-height: 95vh; display: flex; flex-direction: column; cursor: default;
}
.bjv6-form-backdrop.bjv6-open .bjv6-form-sheet { transform: translateY(0); }

.bjv6-forge-stage {
  position: relative; height: 220px; width: 100%;
  background: radial-gradient(circle at 50% 50%, #1A1A20 0%, #050508 100%);
  border-radius: 32px 32px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: inset 0 -10px 30px rgba(0,0,0,0.8); overflow: hidden;
}
.bjv6-forge-drag { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); width: 48px; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.2); z-index: 10; }
.bjv6-forge-close { position: absolute; top: 16px; right: 20px; width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.05); border: none; color: #888; cursor: pointer; display: grid; place-items: center; z-index: 10; transition: all 0.2s; }
.bjv6-forge-close:active { transform: scale(0.9); background: rgba(255,255,255,0.1); }
.bjv6-forge-spotlight { position: absolute; top: -50%; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; border-radius: 50%; filter: blur(60px); opacity: 0.15; transition: background 0.4s; pointer-events: none; }
.bjv6-forge-belt-container { position: relative; z-index: 5; filter: drop-shadow(0 20px 20px rgba(0,0,0,0.7)); }

.bjv6-forge-controls { padding: 24px; overflow-y: auto; flex: 1; }
.bjv6-forge-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #777780; margin-bottom: 12px; display: flex; justify-content: space-between; }

.bjv6-swatch-row { display: flex; justify-content: space-between; margin-bottom: 24px; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
.bjv6-swatch-btn { width: 44px; height: 44px; border-radius: 14px; border: 2px solid transparent; cursor: pointer; position: relative; display: grid; place-items: center; transition: transform 0.2s, border-color 0.2s; background: transparent; padding: 0; }
.bjv6-swatch-btn::before { content: ''; position: absolute; inset: 2px; border-radius: 10px; background: var(--swatch-color); box-shadow: inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.4); pointer-events: none; }
.bjv6-swatch-btn.bjv6-active { transform: scale(1.15); border-color: rgba(255,255,255,0.8); z-index: 2; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
.bjv6-swatch-btn.bjv6-active::after { content: ''; position: absolute; inset: -6px; border-radius: 18px; box-shadow: 0 0 15px var(--swatch-color); opacity: 0.5; z-index: -1; pointer-events: none; }

.bjv6-stripe-segments { display: flex; background: #111; padding: 6px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px; position: relative; }
.bjv6-stripe-seg { flex: 1; height: 44px; display: grid; place-items: center; font-size: 16px; font-weight: 800; color: #666; cursor: pointer; position: relative; z-index: 2; transition: color 0.2s; -webkit-tap-highlight-color: transparent; }
.bjv6-stripe-seg.bjv6-active { color: #000; }
.bjv6-stripe-slider { position: absolute; top: 6px; left: 6px; width: 20%; height: 44px; background: linear-gradient(135deg, #FFF0B3, #D4AF37); border-radius: 12px; z-index: 1; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 4px 12px rgba(212,175,55,0.4); pointer-events: none; }

.bjv6-date-input, .bjv6-note-input { width: 100%; padding: 16px 20px; border-radius: 16px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); color: #F8F8F8; font-size: 15px; font-weight: 500; outline: none; color-scheme: dark; font-family: inherit; transition: all 0.2s; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); margin-bottom: 20px; }
.bjv6-note-input { resize: none; line-height: 1.6; }
.bjv6-date-input:focus, .bjv6-note-input:focus { border-color: #D4AF37; background: rgba(212,175,55,0.05); }

.bjv6-forge-actions { display: flex; gap: 12px; margin-top: 10px; }
.bjv6-btn-cancel { flex: 1; padding: 18px; border-radius: 16px; background: rgba(255,255,255,0.05); border: none; color: #AAA; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.bjv6-btn-cancel:active { transform: scale(0.95); }
.bjv6-btn-save { flex: 2; padding: 18px; border-radius: 16px; background: linear-gradient(135deg, #FFF0B3, #D4AF37); color: #000; font-size: 16px; font-weight: 900; border: none; cursor: pointer; box-shadow: 0 10px 30px rgba(212,175,55,0.4); transition: all 0.2s; font-family: inherit; }
.bjv6-btn-save:active { transform: scale(0.95); box-shadow: 0 5px 15px rgba(212,175,55,0.4); }
.bjv6-btn-save:disabled { opacity: 0.6; cursor: default; }
.bjv6-btn-delete { display:block; width:100%; padding:16px; border-radius:16px; background:rgba(255,50,50,0.1); border:1px solid rgba(255,50,50,0.2); color:#FF4444; font-size:15px; font-weight:800; cursor:pointer; margin-bottom:8px; transition:all 0.2s; font-family: inherit; }
.bjv6-btn-delete:active { transform: scale(0.97); }

/* CEREMONY */
.bjv6-ceremony { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px; text-align: center; padding: 40px; opacity: 0; pointer-events: none; transition: opacity 0.5s; overflow: hidden; }
.bjv6-ceremony.bjv6-show { opacity: 1; pointer-events: all; }
.bjv6-god-rays { position: absolute; top: 50%; left: 50%; width: 200vw; height: 200vw; transform: translate(-50%, -50%); background: repeating-conic-gradient(from 0deg, transparent 0deg, currentColor 2deg, transparent 4deg); animation: bjv6-rays-spin 40s linear infinite; opacity: 0.15; pointer-events: none; }
@keyframes bjv6-rays-spin { 100% { transform: translate(-50%, -50%) rotate(360deg); } }
.bjv6-ceremony-content { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; }
.bjv6-ceremony-eyebrow { font-size: 12px; font-weight: 900; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 20px; text-shadow: 0 2px 10px currentColor; }
.bjv6-ceremony-belt { transform: scale(0); transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s; filter: drop-shadow(0 20px 40px currentColor); }
.bjv6-ceremony.bjv6-show .bjv6-ceremony-belt { transform: scale(1); }
.bjv6-ceremony-name { font-size: 42px; font-weight: 900; letter-spacing: -0.02em; margin-top: 32px; opacity: 0; transition: opacity 0.5s 0.5s; text-shadow: 0 4px 20px currentColor; }
.bjv6-ceremony.bjv6-show .bjv6-ceremony-name { opacity: 1; }
.bjv6-ceremony-sub { font-size: 15px; color: #888; opacity: 0; transition: opacity 0.5s 0.7s; font-weight: 600; margin-top: 10px; }
.bjv6-ceremony.bjv6-show .bjv6-ceremony-sub { opacity: 1; }
.bjv6-ceremony-oss { margin-top: 40px; padding: 20px 60px; border-radius: 20px; border: none; cursor: pointer; font-size: 22px; font-weight: 900; letter-spacing: 0.15em; opacity: 0; transform: translateY(20px); transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.9s; font-family: inherit; }
.bjv6-ceremony.bjv6-show .bjv6-ceremony-oss { opacity: 1; transform: translateY(0); }
.bjv6-ceremony-oss:active { transform: scale(0.9) !important; }

/* BOTTOM ADD BAR */
.bjv6-bottom-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 430px; max-width: 100%; padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px)); background: linear-gradient(to top, rgba(3,3,5,1) 50%, transparent); z-index: 100; }
.bjv6-bottom-add-btn { width: 100%; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #FFF0B3, #D4AF37); color: #000; font-size: 16px; font-weight: 900; letter-spacing: 0.05em; border: none; cursor: pointer; box-shadow: 0 15px 30px rgba(212,175,55,0.4), inset 0 -2px 5px rgba(0,0,0,0.2), inset 0 2px 5px rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.2s; font-family: inherit; }
.bjv6-bottom-add-btn:active { transform: scale(0.96); box-shadow: 0 5px 15px rgba(212,175,55,0.4); }

/* SLAP-ON */
@keyframes bjv6-slap-on {
  0% { transform: scale(1.4) translateY(-30px) rotate(15deg); opacity: 0; }
  60% { transform: scale(0.95) translateY(2px) rotate(-2deg); opacity: 1; }
  100% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; }
}

/* Skeleton */
.bjv6-skeleton { display: flex; flex-direction: column; gap: 16px; padding: 24px 16px; }
.bjv6-skeleton-card { height: 110px; border-radius: 20px; background: linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03)); background-size: 200% 100%; animation: bjv6-shimmer 1.6s linear infinite; }
@keyframes bjv6-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Empty */
.bjv6-empty { text-align:center; padding: 60px 20px; }
.bjv6-empty-title { font-size:24px; font-weight:900; margin-bottom:12px; }
.bjv6-empty-sub { color:#888; line-height:1.6; }
`;let G=0;function K(t,p=0,o=64,a=!1,i="none"){G++;const h=y[t]||y.white,x=t==="black",u=x?"#C71A1A":"#111111",k=x?"#E83A3A":"#2A2A2A",$=x?"#800B0B":"#050505",s=Math.round(o*.36),c=Math.round((o-s)/2),m=Math.round(o*.26),f=6,w=Math.round(o*.05),S="grad-"+t+"-"+G,A="barGrad-"+t+"-"+G,F="tapeGrad-"+G,N="weave-"+G,C="hBarGrad-"+G,M=a?`
    <style>
      .bjv6-anim-stripe { transform-box: fill-box; transform-origin: center; animation: bjv6-slap-on 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
    </style>
  `:"",l=`
    <defs>
      <linearGradient id="${S}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${h.dark}" />
        <stop offset="15%" stop-color="${h.base}" />
        <stop offset="35%" stop-color="${h.light}" />
        <stop offset="50%" stop-color="${h.base}" />
        <stop offset="85%" stop-color="${h.dark}" />
        <stop offset="100%" stop-color="${h.darkest}" />
      </linearGradient>
      <linearGradient id="${A}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${$}" />
        <stop offset="15%" stop-color="${u}" />
        <stop offset="35%" stop-color="${k}" />
        <stop offset="50%" stop-color="${u}" />
        <stop offset="85%" stop-color="${$}" />
        <stop offset="100%" stop-color="#000" />
      </linearGradient>
      <linearGradient id="${F}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#AAAAAA" />
        <stop offset="15%" stop-color="#FFFFFF" />
        <stop offset="35%" stop-color="#F5F5F5" />
        <stop offset="50%" stop-color="#EEEEEE" />
        <stop offset="85%" stop-color="#CCCCCC" />
        <stop offset="100%" stop-color="#666666" />
      </linearGradient>
      <linearGradient id="${C}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${i==="white"?"#D0D0D0":"#1A1A1A"}" />
        <stop offset="15%" stop-color="${i==="white"?"#FFFFFF":"#333333"}" />
        <stop offset="35%" stop-color="${i==="white"?"#F5F5F5":"#222222"}" />
        <stop offset="50%" stop-color="${i==="white"?"#EEEEEE":"#222222"}" />
        <stop offset="85%" stop-color="${i==="white"?"#D0D0D0":"#1A1A1A"}" />
        <stop offset="100%" stop-color="${i==="white"?"#A0A0A0":"#000000"}" />
      </linearGradient>
      <pattern id="${N}" patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" transform="translate(1,0)" />
      </pattern>
    </defs>
  `;let T="";const B=Math.max(1.5,o*.035),W=Math.max(1,o*.025),J=Math.max(2,o*.03);for(let j=0;j<p;j++){const g=f+m-J-j*(B+W)-B,z=a?`animation-delay: ${j*.08}s;`:"";T+=`
      <g class="${a?"bjv6-anim-stripe":""}" style="${z}">
        <rect x="${g}" y="${c}" width="${B}" height="${s}" fill="url(#${F})" />
        <rect x="${g}" y="${c}" width="${B}" height="${s}" fill="url(#${N})" opacity="0.3" />
        <rect x="${g}" y="${c}" width="0.5" height="${s}" fill="rgba(0,0,0,0.3)" />
        <rect x="${g+B-.5}" y="${c}" width="0.5" height="${s}" fill="rgba(0,0,0,0.3)" />
      </g>
    `}let H="";if(i!=="none"){const j=Math.round(s*.22),g=c+Math.round((s-j)/2),z=f,E=f+m,D=o-f-m-2;H=`
      <g>
        <rect x="2" y="${g}" width="${z-2}" height="${j}" fill="url(#${C})" />
        <rect x="2" y="${g}" width="${z-2}" height="${j}" fill="url(#${N})" opacity="0.15" />
        <rect x="${E}" y="${g}" width="${D}" height="${j}" fill="url(#${C})" />
        <rect x="${E}" y="${g}" width="${D}" height="${j}" fill="url(#${N})" opacity="0.15" />
        <rect x="2" y="${g}" width="${z-2}" height="0.5" fill="rgba(255,255,255,0.3)" />
        <rect x="${E}" y="${g}" width="${D}" height="0.5" fill="rgba(255,255,255,0.3)" />
        <rect x="2" y="${g+j-.5}" width="${z-2}" height="0.5" fill="rgba(0,0,0,0.4)" />
        <rect x="${E}" y="${g+j-.5}" width="${D}" height="0.5" fill="rgba(0,0,0,0.4)" />
      </g>
    `}let Y="";if(x){const j=Math.max(1.5,o*.025);Y=`
      <rect x="${f}" y="${c}" width="${j}" height="${s}" fill="url(#${F})" />
      <rect x="${f+m-j}" y="${c}" width="${j}" height="${s}" fill="url(#${F})" />
    `}const L=Math.max(1.5,o*.04),O=Math.max(2,o*.04),V=`
    <rect x="${f+m+2}" y="${c+L}" width="${o-m-f-6}" height="${s-L*2}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="0.8" stroke-dasharray="${O},${O}"/>
      <rect x="${f+m+2}" y="${c+L}" width="${o-m-f-6}" height="${s-L*2}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.8" stroke-dasharray="${O},${O}" transform="translate(0,1)"/>
  `;return`
    <svg width="${o}" height="${o}" viewBox="0 0 ${o} ${o}" class="belt-svg" style="overflow:visible;">
      ${M}
      ${l}
      <rect x="2" y="${c}" width="${o-4}" height="${s}" rx="${w}" fill="url(#${S})" style="transition: fill 0.3s"/>
      <rect x="2" y="${c}" width="${o-4}" height="${s}" rx="${w}" fill="url(#${N})" />
      ${H}
      <rect x="${f}" y="${c}" width="${m}" height="${s}" fill="url(#${A})" />
      <rect x="${f}" y="${c}" width="${m}" height="${s}" fill="url(#${N})" />
      ${Y}
      ${T}
      <rect x="2" y="${c}" width="${o-4}" height="${s}" rx="${w}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <rect x="2" y="${c}" width="${o-4}" height="${s}" rx="${w}" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="1" transform="translate(0,1)"/>
      ${V}
    </svg>
  `}function R(t,p){const o=parseInt(t.slice(1,3),16),a=parseInt(t.slice(3,5),16),i=parseInt(t.slice(5,7),16);return`rgba(${o},${a},${i},${p})`}function ce(t,p){return Math.round((new Date(p).getTime()-new Date(t).getTime())/(1e3*60*60*24*30.44))}function Se(t){if(t.length<2)return"";const p=ce(t[0].date,t[t.length-1].date);if(p<12)return p+"mo";const o=Math.floor(p/12),a=p%12;return a?o+"y "+a+"m":o+"y"}function Ae(){if(!(typeof document>"u")){if(!document.getElementById(ie)){const t=document.createElement("style");t.id=ie,t.textContent=Ne,document.head.appendChild(t)}if(!document.getElementById(le)){const t=document.createElement("link");t.id=le,t.rel="stylesheet",t.href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;800&display=swap",document.head.appendChild(t)}}}function Ce({current:t,promotions:p}){const o=y[t.belt]||y.white,a=Se(p),i=b.useRef(null),h=b.useRef(null);return b.useEffect(()=>{const x=i.current,u=h.current;if(!x||!u)return;const k=s=>{const c=x.getBoundingClientRect(),m=s.clientX-c.left,f=s.clientY-c.top,w=c.width/2,S=c.height/2,A=(f-S)/S*-6,F=(m-w)/w*6;x.style.transform=`perspective(1000px) rotateX(${A}deg) rotateY(${F}deg) scale3d(1.02, 1.02, 1.02)`},$=()=>{x.style.transform="perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"};return u.addEventListener("mousemove",k),u.addEventListener("mouseleave",$),()=>{u.removeEventListener("mousemove",k),u.removeEventListener("mouseleave",$)}},[t.belt,t.stripes]),e.jsx("div",{className:"bjv6-hero-wrapper",ref:h,children:e.jsxs("div",{className:"bjv6-hero-card",ref:i,style:{boxShadow:`0 30px 60px ${R(o.base,.2)}, inset 0 1px 1px rgba(255,255,255,0.3)`,borderTop:"1px solid rgba(255,255,255,0.4)"},children:[e.jsx("div",{className:"bjv6-hero-bg-shimmer",style:{background:`radial-gradient(circle at top left, ${R(o.base,.4)}, transparent 60%), radial-gradient(circle at bottom right, ${R(o.dark,.6)}, transparent 60%)`}}),e.jsxs("div",{className:"bjv6-hero-content",children:[e.jsx("div",{className:"bjv6-hero-eyebrow",style:{color:o.light},children:t.status==="pending"?"Pending Rank":"Current Rank"}),e.jsxs("div",{className:"bjv6-hero-body",children:[e.jsxs("div",{className:"bjv6-hero-belt-wrap",children:[e.jsx("div",{className:"bjv6-hero-belt-aura",style:{background:`radial-gradient(circle, ${o.glow}, transparent 70%)`}}),e.jsx("div",{className:"bjv6-belt-svg-wrap",dangerouslySetInnerHTML:{__html:K(t.belt,t.stripes,110,!1,t.bar||"none")}})]}),e.jsxs("div",{children:[e.jsx("div",{className:"bjv6-hero-rank",children:Q[t.belt]||"Belt"}),t.stripes>0&&e.jsxs("div",{className:"bjv6-hero-stripes",style:{color:o.light},children:[t.stripes," stripe",t.stripes>1?"s":""]}),e.jsxs("div",{className:"bjv6-hero-since",children:["Since ",new Date(t.date).toLocaleDateString("en-US",{month:"long",year:"numeric"})]})]})]}),a&&e.jsxs("div",{className:"bjv6-hero-stats",children:[e.jsxs("div",{className:"bjv6-hero-stat",children:[e.jsx("div",{className:"bjv6-hero-stat-val",children:a}),e.jsx("div",{className:"bjv6-hero-stat-lbl",children:"On the mats"})]}),e.jsxs("div",{className:"bjv6-hero-stat",children:[e.jsx("div",{className:"bjv6-hero-stat-val",style:{color:o.light},children:p.length}),e.jsx("div",{className:"bjv6-hero-stat-lbl",children:"Promotions"})]})]})]})]})})}function Be({p:t,i:p,isCurrent:o,onEdit:a,onDeleteCard:i,readOnly:h}){const x=(y[t.belt]||y.white).base,[u,k]=b.useState(!1),$={"--node-color-30":R(x,.3),"--node-color-15":R(x,.15),"--node-color-10":R(x,.1)};return e.jsxs("div",{className:"bjv6-belt-node",style:{animationDelay:`${p*100}ms`},children:[e.jsx("div",{className:"bjv6-node-left",children:e.jsxs("div",{className:"bjv6-node-orb-wrap",children:[o&&e.jsx("div",{className:"bjv6-current-star",children:"★"}),e.jsx("div",{className:`bjv6-node-orb ${o?"bjv6-current":""}`,style:{"--node-color":x,cursor:h?"default":"pointer"},onClick:()=>{h||a(t.id)},dangerouslySetInnerHTML:{__html:K(t.belt,t.stripes,46,!1,t.bar||"none")}})]})}),e.jsxs("div",{className:`bjv6-node-card ${o?"bjv6-current":""}`,style:$,children:[e.jsxs("div",{className:"bjv6-node-card-row1",children:[e.jsxs("div",{onClick:()=>{h||a(t.id)},style:{flex:1,cursor:h?"default":"pointer"},children:[e.jsx("span",{className:"bjv6-node-belt-name",children:Q[t.belt]||"Belt"}),t.stripes>0&&e.jsxs("span",{className:"bjv6-node-stripes",children:[t.stripes,"s"]})]}),h?null:u?e.jsxs("div",{style:{display:"flex",gap:6,alignItems:"center"},children:[e.jsx("button",{onClick:s=>{s.stopPropagation(),i(t.id),k(!1)},style:{background:"#DC2626",color:"#fff",border:"none",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:"0.05em"},"aria-label":"Confirm delete",children:"YES"}),e.jsx("button",{onClick:s=>{s.stopPropagation(),k(!1)},style:{background:"rgba(255,255,255,0.08)",color:"#aaa",border:"none",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:"0.05em"},"aria-label":"Cancel delete",children:"NO"})]}):e.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center"},children:[e.jsx("button",{onClick:s=>{s.stopPropagation(),a(t.id)},style:{background:"transparent",border:"none",color:"#444",padding:4,cursor:"pointer",display:"grid",placeItems:"center"},"aria-label":"Edit promotion",children:e.jsxs("svg",{className:"bjv6-node-edit-icon",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"}),e.jsx("path",{d:"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"})]})}),e.jsx("button",{onClick:s=>{s.stopPropagation(),k(!0)},style:{background:"transparent",border:"none",color:"#DC2626",padding:4,cursor:"pointer",display:"grid",placeItems:"center"},"aria-label":"Delete promotion",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("polyline",{points:"3 6 5 6 21 6"}),e.jsx("path",{d:"M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"}),e.jsx("path",{d:"M10 11v6M14 11v6"}),e.jsx("path",{d:"M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"})]})})]})]}),e.jsx("div",{className:"bjv6-node-date",children:new Date(t.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}),e.jsxs("span",{className:`bjv6-status-pill ${t.status==="approved"?"bjv6-status-approved":"bjv6-status-pending"}`,children:[e.jsx("span",{className:"bjv6-dot-pip"}),t.status==="approved"?"Verified":"Pending"]}),t.note&&e.jsx("div",{className:"bjv6-coach-note",children:e.jsxs("p",{children:['"',t.note,'"']})})]})]})}function Ee({open:t,isEditing:p,belt:o,stripes:a,bar:i,date:h,note:x,category:u,onSetBelt:k,onSetStripes:$,onSetBar:s,onSetDate:c,onSetNote:m,onClose:f,onSave:w,onDelete:S,saving:A}){const F=y[o]||y.white,N=`${o}-${a}-${i}`,C=de[u],M=u==="Kids";return e.jsx("div",{className:`bjv6-form-backdrop ${t?"bjv6-open":""}`,onClick:l=>{l.target.classList.contains("bjv6-form-backdrop")&&f()},children:e.jsxs("div",{className:"bjv6-form-sheet",children:[e.jsxs("div",{className:"bjv6-forge-stage",children:[e.jsx("div",{className:"bjv6-forge-drag"}),e.jsx("button",{className:"bjv6-forge-close",onClick:f,"aria-label":"Close",children:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx("div",{className:"bjv6-forge-spotlight",style:{background:F.base}}),e.jsx("div",{className:"bjv6-forge-belt-container",dangerouslySetInnerHTML:{__html:K(o,a,180,!0,i)}},N)]}),e.jsxs("div",{className:"bjv6-forge-controls",children:[e.jsxs("div",{className:"bjv6-forge-label",children:[e.jsx("span",{children:"Color Foundation"}),e.jsx("span",{style:{color:"#FFF"},children:F.name})]}),e.jsx("div",{className:"bjv6-swatch-row",children:C.map(l=>e.jsx("button",{className:`bjv6-swatch-btn ${l===o?"bjv6-active":""}`,style:{"--swatch-color":y[l].base},onClick:()=>{k(l),typeof navigator<"u"&&navigator.vibrate&&navigator.vibrate(10)},"aria-label":y[l].name},l))}),M&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"bjv6-forge-label",children:[e.jsx("span",{children:"Horizontal Bar"}),e.jsx("span",{style:{color:"var(--gold)"},children:i==="none"?"None":i==="white"?"White":"Black"})]}),e.jsx("div",{style:{display:"flex",gap:8,marginBottom:24,background:"rgba(255,255,255,0.02)",padding:8,borderRadius:20,border:"1px solid rgba(255,255,255,0.05)"},children:["none","white","black"].map(l=>e.jsx("button",{onClick:()=>{s(l),typeof navigator<"u"&&navigator.vibrate&&navigator.vibrate([20,30,20])},style:{flex:1,padding:"12px 16px",borderRadius:14,cursor:"pointer",transition:"all 0.3s",fontSize:12,fontWeight:700,fontFamily:"inherit",background:i===l?"linear-gradient(135deg, #FFF0B3, #D4AF37)":"rgba(255,255,255,0.05)",border:i===l?"1px solid #D4AF37":"1px solid rgba(255,255,255,0.1)",color:i===l?"#000":"#888",boxShadow:i===l?"0 4px 12px rgba(212,175,55,0.4)":"none"},children:l==="none"?"None":l==="white"?"White":"Black"},l))})]}),e.jsxs("div",{className:"bjv6-forge-label",children:[e.jsx("span",{children:"Rank Stripes"}),e.jsx("span",{style:{color:"var(--gold)"},children:a})]}),e.jsxs("div",{className:"bjv6-stripe-segments",children:[e.jsx("div",{className:"bjv6-stripe-slider",style:{transform:`translateX(${a*100}%)`}}),[0,1,2,3,4].map(l=>e.jsx("div",{className:`bjv6-stripe-seg ${l===a?"bjv6-active":""}`,onClick:()=>{$(l),typeof navigator<"u"&&navigator.vibrate&&navigator.vibrate([20,30,20])},children:l},l))]}),e.jsx("div",{className:"bjv6-forge-label",children:"Date Earned"}),e.jsx("input",{type:"date",className:"bjv6-date-input",value:h,onChange:l=>c(l.target.value)}),e.jsx("div",{className:"bjv6-forge-label",children:"Coach's Note (Optional)"}),e.jsx("textarea",{className:"bjv6-note-input",rows:2,placeholder:"e.g. Promoted by Coach Anthony",value:x,onChange:l=>m(l.target.value)}),p&&e.jsx("button",{className:"bjv6-btn-delete",onClick:S,children:"Delete Promotion"}),e.jsxs("div",{className:"bjv6-forge-actions",children:[e.jsx("button",{className:"bjv6-btn-cancel",onClick:f,children:"Cancel"}),e.jsx("button",{className:"bjv6-btn-save",onClick:w,disabled:A,children:A?"Saving…":p?"Save Changes":"Log Promotion"})]})]})]})})}function De({belt:t,bar:p,show:o,onClose:a}){if(!t)return null;const i=y[t]||y.white,h=t==="white"||t==="grey"||t==="yellow"?"#000":"#FFF";return e.jsxs("div",{className:`bjv6-ceremony ${o?"bjv6-show":""}`,onClick:a,style:{color:i.light},children:[e.jsx("div",{className:"bjv6-god-rays",style:{color:i.base}}),e.jsxs("div",{className:"bjv6-ceremony-content",children:[e.jsx("div",{className:"bjv6-ceremony-eyebrow",children:"New Promotion"}),e.jsx("div",{className:"bjv6-ceremony-belt",dangerouslySetInnerHTML:{__html:K(t,0,220,!1,p||"none")}}),e.jsx("div",{className:"bjv6-ceremony-name",children:Q[t]}),e.jsx("div",{className:"bjv6-ceremony-sub",children:"Coach verification pending."}),e.jsx("button",{className:"bjv6-ceremony-oss",onClick:x=>{x.stopPropagation(),a()},style:{background:`linear-gradient(135deg, ${i.light}, ${i.base})`,color:h,boxShadow:`0 10px 30px ${i.glow}, inset 0 2px 5px rgba(255,255,255,0.4)`},children:"OSS 🤙"})]})]})}function Te({onBack:t}={}){const p=ue(),o=p?.email?decodeURIComponent(p.email):null,a=!!o,[i,h]=b.useState(null),[x,u]=b.useState([]),[k,$]=b.useState(!0),[s,c]=b.useState(!1),[m,f]=b.useState(null),[w,S]=b.useState("white"),[A,F]=b.useState(0),[N,C]=b.useState("none"),[M,l]=b.useState(()=>new Date().toISOString().split("T")[0]),[T,B]=b.useState(""),[W,J]=b.useState(!1),[H,Y]=b.useState(null),[L,O]=b.useState("none"),[V,j]=b.useState(!1),[g,z]=b.useState("Adult"),E=b.useRef(new Map);b.useEffect(()=>{Ae();const r=document.body.style.background;return document.body.style.background="#030305",()=>{document.body.style.background=r}},[]);const D=b.useCallback(async()=>{try{const r=await ye(o||void 0);let n=[];if(!a)try{n=JSON.parse(localStorage.getItem("lbjj_belt_deleted_ids")||"[]")}catch{}if(a&&Array.isArray(r)&&r.length){const d=r[0],I=d.memberName||d.name||null;I&&h(String(I))}const v=(r||[]).filter(d=>!n.includes(d.id)).map(d=>({id:String(d.id),belt:String(d.belt||"white").toLowerCase(),stripes:Number(d.stripes)||0,bar:d.bar==="white"||d.bar==="black"?d.bar:"none",date:typeof d.date=="string"?d.date.split("T")[0]:String(d.date),note:d.note||"",status:d.status||"pending",category:d.category==="Kids"?"Kids":"Adult"})).sort((d,I)=>new Date(d.date).getTime()-new Date(I.date).getTime());u(v);try{a&&o?localStorage.setItem(`lbjj_belt_promotions_${o}`,JSON.stringify(v)):(localStorage.setItem("lbjj_belt_promotions_cache",JSON.stringify(v)),localStorage.setItem("lbjj_belt_promotions",JSON.stringify(v)),window.dispatchEvent(new Event("belt-promotions-updated")))}catch{}}catch(r){console.error("beltGetPromotions failed",r)}finally{$(!1)}},[a,o]);b.useEffect(()=>{try{const r=a&&o?`lbjj_belt_promotions_${o}`:null,n=r?localStorage.getItem(r):localStorage.getItem("lbjj_belt_promotions_cache")||localStorage.getItem("lbjj_belt_promotions");if(n){const v=JSON.parse(n);Array.isArray(v)&&v.length&&(u(v),$(!1))}else u([]),$(!0)}catch{}D()},[D,a,o]),b.useEffect(()=>{const r=requestAnimationFrame(()=>{E.current.forEach(n=>{const v=n.dataset.pct;v&&(n.style.height=`${v}%`)})});return()=>cancelAnimationFrame(r)},[x]);const be=()=>{f(null),S(de[g][0]),F(0),C("none"),l(new Date().toISOString().split("T")[0]),B(""),c(!0)},pe=r=>{const n=x.find(v=>v.id===r);n&&(f(n.id),S(n.belt),F(n.stripes),C(n.bar||"none"),l(n.date),B(n.note||""),c(!0))},ge=()=>c(!1),xe=async()=>{if(W)return;J(!0);const r=!m;try{m?await we({promotionId:m,belt:w,stripes:A,bar:N,date:M,note:T,category:g}):await ke({belt:w,stripes:A,bar:N,date:M,note:T,category:g}),c(!1),await D(),r&&(Y(w),O(N),j(!0),typeof navigator<"u"&&navigator.vibrate&&navigator.vibrate([80,400,80,150,40,80,40]))}catch(n){console.error("save promotion failed",n)}finally{J(!1)}},ee=async r=>{try{let n=[];try{n=JSON.parse(localStorage.getItem("lbjj_belt_deleted_ids")||"[]")}catch{}n.includes(r)||(n.push(r),localStorage.setItem("lbjj_belt_deleted_ids",JSON.stringify(n))),u(v=>{const d=v.filter(I=>I.id!==r);try{localStorage.setItem("lbjj_belt_promotions_cache",JSON.stringify(d)),localStorage.setItem("lbjj_belt_promotions",JSON.stringify(d)),window.dispatchEvent(new Event("belt-promotions-updated"))}catch{}return d}),await $e(r),await D()}catch(n){console.error("delete promotion failed",n)}},he=async()=>{if(!m)return;const r=m;c(!1),await ee(r)},me=()=>{j(!1),setTimeout(()=>Y(null),500)},fe=()=>{if(a&&typeof window<"u"){window.history.back();return}t?t():typeof window<"u"&&(window.location.hash="/")},_=x.filter(r=>(r.category||"Adult")===g),X=_.length>0,te=X?[..._].sort((r,n)=>{const v=se.indexOf(r.belt),d=se.indexOf(n.belt);return v!==d?d-v:(n.stripes||0)-(r.stripes||0)})[0]:null,P=typeof document<"u"?document.body:null;return e.jsxs("div",{className:"bjv6-root",children:[e.jsxs("div",{className:"bjv6-ambient",children:[e.jsx("div",{className:"bjv6-ambient-orb bjv6-orb1"}),e.jsx("div",{className:"bjv6-ambient-orb bjv6-orb2"})]}),e.jsxs("div",{className:"bjv6-page",children:[e.jsxs("div",{className:"bjv6-top-bar",children:[e.jsx("button",{className:"bjv6-back-btn",onClick:fe,"aria-label":"Back",children:e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("div",{className:"bjv6-top-title",children:a?`${(i||o||"Member").split(" ")[0]}'s Journey`:"Belt Journey"}),e.jsx("div",{style:{width:44}})]}),e.jsx("div",{style:{display:"flex",gap:10,padding:"0 16px 18px",borderBottom:"1px solid rgba(255,255,255,0.05)",marginBottom:20},children:["Adult","Kids"].map(r=>e.jsx("button",{onClick:()=>z(r),style:{padding:"8px 20px",borderRadius:12,cursor:"pointer",fontSize:12,fontWeight:700,letterSpacing:"0.05em",transition:"all 0.25s",background:g===r?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${g===r?"#D4AF37":"rgba(255,255,255,0.08)"}`,color:g===r?"#D4AF37":"#888",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"},children:r},r))}),k&&!X&&e.jsxs("div",{className:"bjv6-skeleton",children:[e.jsx("div",{className:"bjv6-skeleton-card",style:{height:220}}),e.jsx("div",{className:"bjv6-skeleton-card"}),e.jsx("div",{className:"bjv6-skeleton-card"}),e.jsx("div",{className:"bjv6-skeleton-card"})]}),!k&&!X&&e.jsxs("div",{className:"bjv6-empty",children:[e.jsx("div",{className:"bjv6-empty-title",children:"The Journey Begins"}),e.jsx("div",{className:"bjv6-empty-sub",children:g==="Kids"?"No kids belts logged yet. Start the journey.":"Every black belt started right where you are."})]}),X&&te&&e.jsxs(e.Fragment,{children:[e.jsx(Ce,{current:te,promotions:_}),e.jsxs("div",{className:"bjv6-section-row",children:[e.jsx("div",{className:"bjv6-section-lbl",children:"The Path"}),e.jsxs("div",{className:"bjv6-section-count",children:[_.length," logged"]})]}),e.jsx("div",{className:"bjv6-timeline",children:_.map((r,n)=>{const v=n===_.length-1,d=e.jsx(Be,{p:r,i:n,isCurrent:v,onEdit:pe,onDeleteCard:ee,readOnly:a},`node-${r.id}`);if(n<_.length-1){const I=_[n+1],U=ce(r.date,I.date),oe=Fe[r.belt]||24,re=U<oe,ve=Math.min(100,U/oe*100),je=(y[r.belt]||y.white).base,ae=(y[I.belt]||y.white).base;return e.jsxs(ne.Fragment,{children:[d,e.jsxs("div",{className:"bjv6-connector-wrap",children:[e.jsx("div",{className:"bjv6-connector-line",children:e.jsx("div",{className:"bjv6-connector-fill",ref:Z=>{Z?(Z.dataset.pct=String(ve),E.current.set(n,Z)):E.current.delete(n)},style:{background:`linear-gradient(to bottom, ${je}, ${ae})`,color:ae}})}),e.jsxs("div",{className:`bjv6-connector-badge ${re?"bjv6-early":""}`,children:[U,"mo",re?" · early ⚡":""]})]})]},`frag-${r.id}`)}return e.jsxs(ne.Fragment,{children:[d,e.jsx("div",{className:"bjv6-connector-wrap",children:e.jsx("div",{className:"bjv6-connector-trail"})})]},`frag-${r.id}`)})})]})]}),!a&&P&&q.createPortal(e.jsx("div",{className:"bjv6-bottom-bar",children:e.jsxs("button",{className:"bjv6-bottom-add-btn",onClick:be,children:[e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round",children:[e.jsx("line",{x1:"12",y1:"5",x2:"12",y2:"19"}),e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"})]}),e.jsx("span",{children:_.length===0?"Log My First Belt":"Add Promotion"})]})}),P),!a&&P&&q.createPortal(e.jsx(Ee,{open:s,isEditing:!!m,belt:w,stripes:A,bar:N,date:M,note:T,category:g,onSetBelt:S,onSetStripes:F,onSetBar:C,onSetDate:l,onSetNote:B,onClose:ge,onSave:xe,onDelete:he,saving:W}),P),P&&q.createPortal(e.jsx(De,{belt:H,bar:L,show:V,onClose:me}),P)]})}export{Te as default};
