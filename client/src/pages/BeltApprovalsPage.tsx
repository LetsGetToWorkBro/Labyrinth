import { useState, useEffect } from "react";
import { beltGetPromotions, beltApprovePromotion, type BeltPromotion } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const BELT_DEFS: Record<string, { base: string; light: string; dark: string; darkest: string; glow: string; name: string }> = {
  white:  { base: '#E5E5E5', light: '#FFFFFF', dark: '#B0B0B0', darkest: '#888888', glow: 'rgba(255,255,255,0.4)', name: 'White' },
  grey:   { base: '#A0A0A0', light: '#C0C0C0', dark: '#808080', darkest: '#606060', glow: 'rgba(160,160,160,0.4)', name: 'Grey' },
  yellow: { base: '#FFD700', light: '#FFEB3B', dark: '#FFA500', darkest: '#FF8C00', glow: 'rgba(255,215,0,0.5)',   name: 'Yellow' },
  orange: { base: '#FF8C00', light: '#FFA500', dark: '#FF6347', darkest: '#FF4500', glow: 'rgba(255,140,0,0.5)',   name: 'Orange' },
  green:  { base: '#228B22', light: '#32CD32', dark: '#006400', darkest: '#004000', glow: 'rgba(34,139,34,0.5)',   name: 'Green' },
  blue:   { base: '#1A56DB', light: '#4A7FF0', dark: '#103A99', darkest: '#0A2266', glow: 'rgba(26,86,219,0.5)',  name: 'Blue' },
  purple: { base: '#7E3AF2', light: '#A26DF8', dark: '#521BA6', darkest: '#2E0F5C', glow: 'rgba(126,58,242,0.5)', name: 'Purple' },
  brown:  { base: '#92400E', light: '#B85E24', dark: '#632A08', darkest: '#381603', glow: 'rgba(146,64,14,0.5)',  name: 'Brown' },
  black:  { base: '#222222', light: '#444444', dark: '#111111', darkest: '#000000', glow: 'rgba(200,162,76,0.4)', name: 'Black' },
};

const STYLE_TAG_ID = 'belt-approvals-styles';
const FONT_LINK_ID = 'belt-approvals-font';

const CSS_TEXT = `
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
`;

let svgUidCounter = 0;
function beltSVG(belt: string, stripes = 0, size = 64, bar: 'none' | 'white' | 'black' = 'none'): string {
  svgUidCounter++;
  const c = BELT_DEFS[belt] || BELT_DEFS.white;
  const isBlack = belt === 'black';
  const barColor = isBlack ? '#C71A1A' : '#111111';
  const barLight = isBlack ? '#E83A3A' : '#2A2A2A';
  const barDark  = isBlack ? '#800B0B' : '#050505';

  const beltH = Math.round(size * 0.36);
  const beltY = Math.round((size - beltH) / 2);
  const barW  = Math.round(size * 0.26);
  const barX  = 6;
  const rx    = Math.round(size * 0.05);

  const gradId = 'gradA-' + belt + '-' + svgUidCounter;
  const barGradId = 'barGradA-' + belt + '-' + svgUidCounter;
  const tapeGradId = 'tapeGradA-' + svgUidCounter;
  const patternId = 'weaveA-' + svgUidCounter;
  const hBarGradId = 'hBarGradA-' + svgUidCounter;

  const defs = `
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c.dark}" />
        <stop offset="15%" stop-color="${c.base}" />
        <stop offset="35%" stop-color="${c.light}" />
        <stop offset="50%" stop-color="${c.base}" />
        <stop offset="85%" stop-color="${c.dark}" />
        <stop offset="100%" stop-color="${c.darkest}" />
      </linearGradient>
      <linearGradient id="${barGradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${barDark}" />
        <stop offset="15%" stop-color="${barColor}" />
        <stop offset="35%" stop-color="${barLight}" />
        <stop offset="50%" stop-color="${barColor}" />
        <stop offset="85%" stop-color="${barDark}" />
        <stop offset="100%" stop-color="#000" />
      </linearGradient>
      <linearGradient id="${tapeGradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#AAAAAA" />
        <stop offset="15%" stop-color="#FFFFFF" />
        <stop offset="35%" stop-color="#F5F5F5" />
        <stop offset="50%" stop-color="#EEEEEE" />
        <stop offset="85%" stop-color="#CCCCCC" />
        <stop offset="100%" stop-color="#666666" />
      </linearGradient>
      <linearGradient id="${hBarGradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bar === 'white' ? '#D0D0D0' : '#1A1A1A'}" />
        <stop offset="15%" stop-color="${bar === 'white' ? '#FFFFFF' : '#333333'}" />
        <stop offset="35%" stop-color="${bar === 'white' ? '#F5F5F5' : '#222222'}" />
        <stop offset="50%" stop-color="${bar === 'white' ? '#EEEEEE' : '#222222'}" />
        <stop offset="85%" stop-color="${bar === 'white' ? '#D0D0D0' : '#1A1A1A'}" />
        <stop offset="100%" stop-color="${bar === 'white' ? '#A0A0A0' : '#000000'}" />
      </linearGradient>
      <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" transform="translate(1,0)" />
      </pattern>
    </defs>
  `;

  let stripesSVG = '';
  const sw = Math.max(1.5, size * 0.035);
  const gap = Math.max(1, size * 0.025);
  const startOffset = Math.max(2, size * 0.03);

  for (let i = 0; i < stripes; i++) {
    const sx = barX + barW - startOffset - (i * (sw + gap)) - sw;
    stripesSVG += `
      <g>
        <rect x="${sx}" y="${beltY}" width="${sw}" height="${beltH}" fill="url(#${tapeGradId})" />
        <rect x="${sx}" y="${beltY}" width="${sw}" height="${beltH}" fill="url(#${patternId})" opacity="0.3" />
        <rect x="${sx}" y="${beltY}" width="0.5" height="${beltH}" fill="rgba(0,0,0,0.3)" />
        <rect x="${sx + sw - 0.5}" y="${beltY}" width="0.5" height="${beltH}" fill="rgba(0,0,0,0.3)" />
      </g>
    `;
  }

  let barStripesSVG = '';
  if (bar !== 'none') {
    const barH = Math.round(beltH * 0.22);
    const barStripY = beltY + Math.round((beltH - barH) / 2);
    const leftWidth = barX;
    const rightStart = barX + barW;
    const rightWidth = size - barX - barW - 2;
    barStripesSVG = `
      <g>
        <rect x="2" y="${barStripY}" width="${leftWidth - 2}" height="${barH}" fill="url(#${hBarGradId})" />
        <rect x="2" y="${barStripY}" width="${leftWidth - 2}" height="${barH}" fill="url(#${patternId})" opacity="0.15" />
        <rect x="${rightStart}" y="${barStripY}" width="${rightWidth}" height="${barH}" fill="url(#${hBarGradId})" />
        <rect x="${rightStart}" y="${barStripY}" width="${rightWidth}" height="${barH}" fill="url(#${patternId})" opacity="0.15" />
        <rect x="2" y="${barStripY}" width="${leftWidth - 2}" height="0.5" fill="rgba(255,255,255,0.3)" />
        <rect x="${rightStart}" y="${barStripY}" width="${rightWidth}" height="0.5" fill="rgba(255,255,255,0.3)" />
        <rect x="2" y="${barStripY + barH - 0.5}" width="${leftWidth - 2}" height="0.5" fill="rgba(0,0,0,0.4)" />
        <rect x="${rightStart}" y="${barStripY + barH - 0.5}" width="${rightWidth}" height="0.5" fill="rgba(0,0,0,0.4)" />
      </g>
    `;
  }

  let framingSVG = '';
  if (isBlack) {
    const fw = Math.max(1.5, size * 0.025);
    framingSVG = `
      <rect x="${barX}" y="${beltY}" width="${fw}" height="${beltH}" fill="url(#${tapeGradId})" />
      <rect x="${barX + barW - fw}" y="${beltY}" width="${fw}" height="${beltH}" fill="url(#${tapeGradId})" />
    `;
  }

  const stitchOffset = Math.max(1.5, size * 0.04);
  const stitchDash = Math.max(2, size * 0.04);
  const stitchedEdges = `
    <rect x="${barX + barW + 2}" y="${beltY + stitchOffset}" width="${size - barW - barX - 6}" height="${beltH - (stitchOffset * 2)}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="0.8" stroke-dasharray="${stitchDash},${stitchDash}"/>
    <rect x="${barX + barW + 2}" y="${beltY + stitchOffset}" width="${size - barW - barX - 6}" height="${beltH - (stitchOffset * 2)}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.8" stroke-dasharray="${stitchDash},${stitchDash}" transform="translate(0,1)"/>
  `;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="belt-svg" style="overflow:visible;">
      ${defs}
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="url(#${gradId})" style="transition: fill 0.3s"/>
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="url(#${patternId})" />
      ${barStripesSVG}
      <rect x="${barX}" y="${beltY}" width="${barW}" height="${beltH}" fill="url(#${barGradId})" />
      <rect x="${barX}" y="${beltY}" width="${barW}" height="${beltH}" fill="url(#${patternId})" />
      ${framingSVG}
      ${stripesSVG}
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="1" transform="translate(0,1)"/>
      ${stitchedEdges}
    </svg>
  `;
}

function injectStylesAndFont() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById(STYLE_TAG_ID)) {
    const tag = document.createElement('style');
    tag.id = STYLE_TAG_ID;
    tag.textContent = CSS_TEXT;
    document.head.appendChild(tag);
  }
  if (!document.getElementById(FONT_LINK_ID)) {
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
  }
}

export default function BeltApprovalsPage() {
  const { member } = useAuth();
  const [allPromotions, setAllPromotions] = useState<BeltPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [acting, setActing] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    injectStylesAndFont();
    const prevBg = document.body.style.background;
    document.body.style.background = '#030305';
    return () => { document.body.style.background = prevBg; };
  }, []);

  // Auth guard — redirect to home if not staff
  useEffect(() => {
    if (!member) return;
    const role = ((member as any)?.role || '').toLowerCase();
    const ok = role.includes('owner') || role.includes('admin') || role.includes('coach') || role.includes('instructor');
    if (!ok) window.location.hash = '/';
  }, [member]);

  const load = () => {
    setLoading(true);
    beltGetPromotions()
      .then(list => setAllPromotions(list || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const pending = allPromotions.filter(p => p.status === 'pending');
  const history = allPromotions
    .filter(p => p.status !== 'pending')
    .sort((a, b) => {
      const ad = (a.approvedDate || a.date || '');
      const bd = (b.approvedDate || b.date || '');
      return bd.localeCompare(ad);
    });

  const handleVerdict = async (promotionId: string, approved: boolean) => {
    setActing(promotionId);
    try {
      await beltApprovePromotion(promotionId, approved);
      setDismissed(prev => new Set([...prev, promotionId]));
      setTimeout(() => {
        setAllPromotions(prev => prev.map(p =>
          p.id === promotionId ? { ...p, status: approved ? 'approved' : 'rejected' } : p
        ));
        setDismissed(prev => { const s = new Set(prev); s.delete(promotionId); return s; });
      }, 350);
    } catch {}
    setActing(null);
  };

  return (
    <div className="bapp-root" style={{ background: '#030305', minHeight: '100vh' }}>
      <div className="bapp-ambient">
        <div className="bapp-ambient-orb bapp-orb1" />
        <div className="bapp-ambient-orb bapp-orb2" />
      </div>
      <div className="bapp-page" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Top bar */}
        <div className="bapp-top-bar">
          <button className="bapp-back-btn" onClick={() => window.history.back()} aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="bapp-top-title" style={{ color: '#D4AF37' }}>Belt Approvals</span>
          <div style={{ width: 44 }} />
        </div>

        {/* Tabs */}
        <div className="bapp-tabs">
          <button className={`bapp-tab ${tab === 'pending' ? 'active' : 'inactive'}`} onClick={() => setTab('pending')}>
            Pending {pending.length > 0 && <span className="bapp-badge-count">{pending.length}</span>}
          </button>
          <button className={`bapp-tab ${tab === 'history' ? 'active' : 'inactive'}`} onClick={() => setTab('history')}>
            History
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bapp-empty">
            <div style={{ width: 40, height: 40, border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Pending tab */}
        {!loading && tab === 'pending' && (
          pending.length === 0 ? (
            <div className="bapp-empty">
              <div style={{ opacity: 0.3 }} dangerouslySetInnerHTML={{ __html: beltSVG('white', 0, 120) }} />
              <div className="bapp-empty-title">All caught up</div>
              <div className="bapp-empty-sub">No pending belt promotions</div>
            </div>
          ) : (
            pending.map((p, idx) => {
              const beltKey = (p.belt || 'white').toLowerCase();
              const bDef = BELT_DEFS[beltKey] || BELT_DEFS.white;
              const isDismissing = dismissed.has(p.id);
              const isActing = acting === p.id;
              const barVal: 'none' | 'white' | 'black' = (p.bar === 'white' || p.bar === 'black') ? p.bar : 'none';
              const stripes = Number(p.stripes) || 0;
              return (
                <div key={p.id} className={`bapp-card${isDismissing ? ' dismissing' : ''}`} style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="bapp-member-name">{p.memberName || p.memberEmail}</div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{p.memberEmail}</div>
                  <div className="bapp-belt-center">
                    <div className="bapp-belt-aura" style={{ background: `radial-gradient(circle, ${bDef.glow} 0%, transparent 70%)` }} />
                    <div dangerouslySetInnerHTML={{ __html: beltSVG(beltKey, stripes, 180, barVal) }} style={{ position: 'relative', zIndex: 1 }} />
                    <div className="bapp-belt-name" style={{ color: bDef.base }}>{bDef.name} Belt</div>
                    {stripes > 0 && <div style={{ fontSize: 12, color: '#D4AF37', marginTop: 2 }}>{stripes} stripe{stripes !== 1 ? 's' : ''}</div>}
                    {p.category && p.category !== 'Adult' && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{p.category}</div>}
                  </div>
                  <div className="bapp-meta">Requested: {p.date || 'Unknown date'}</div>
                  {p.note && <div className="bapp-note">"{p.note}"</div>}
                  <div className="bapp-actions">
                    <button className="bapp-btn-approve" onClick={() => handleVerdict(p.id, true)} disabled={!!acting || isDismissing}>
                      {isActing ? '…' : '✓ Approve'}
                    </button>
                    <button className="bapp-btn-deny" onClick={() => handleVerdict(p.id, false)} disabled={!!acting || isDismissing}>
                      {isActing ? '…' : '✕ Deny'}
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* History tab */}
        {!loading && tab === 'history' && (
          history.length === 0 ? (
            <div className="bapp-empty">
              <div className="bapp-empty-title">No history yet</div>
              <div className="bapp-empty-sub">Approved and denied promotions will appear here</div>
            </div>
          ) : (
            history.map(p => {
              const beltKey = (p.belt || 'white').toLowerCase();
              const bDef = BELT_DEFS[beltKey] || BELT_DEFS.white;
              const stripes = Number(p.stripes) || 0;
              return (
                <div key={p.id} className="bapp-history-row">
                  <div style={{ width: 10, height: 36, borderRadius: 4, background: bDef.base, flexShrink: 0, boxShadow: `0 0 8px ${bDef.glow}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#F8F8F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.memberName || p.memberEmail}</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{bDef.name} Belt{stripes > 0 ? ` · ${stripes} stripe${stripes !== 1 ? 's' : ''}` : ''} · {p.date || ''}</div>
                    {p.approvedBy && <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{p.status === 'approved' ? 'Approved' : 'Denied'} by {p.approvedBy}</div>}
                  </div>
                  <div className={p.status === 'approved' ? 'bapp-status-approved' : 'bapp-status-denied'}>
                    {p.status === 'approved' ? 'APPROVED' : 'DENIED'}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}

