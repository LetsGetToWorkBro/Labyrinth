import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { beltGetPromotions, beltSavePromotion, beltDeletePromotion, beltUpdatePromotion } from "@/lib/api";

interface Promotion {
  id: string;
  belt: string;
  stripes: number;
  date: string;
  note: string;
  status: "pending" | "approved" | "rejected";
}

const BELT_DEFS: Record<string, { base: string; light: string; dark: string; darkest: string; glow: string; name: string }> = {
  white:  { base: '#E5E5E5', light: '#FFFFFF', dark: '#B0B0B0', darkest: '#888888', glow: 'rgba(255,255,255,0.4)', name: 'White' },
  blue:   { base: '#1A56DB', light: '#4A7FF0', dark: '#103A99', darkest: '#0A2266', glow: 'rgba(26,86,219,0.5)',  name: 'Blue' },
  purple: { base: '#7E3AF2', light: '#A26DF8', dark: '#521BA6', darkest: '#2E0F5C', glow: 'rgba(126,58,242,0.5)', name: 'Purple' },
  brown:  { base: '#92400E', light: '#B85E24', dark: '#632A08', darkest: '#381603', glow: 'rgba(146,64,14,0.5)',  name: 'Brown' },
  black:  { base: '#222222', light: '#444444', dark: '#111111', darkest: '#000000', glow: 'rgba(200,162,76,0.4)', name: 'Black' },
};

const BELT_NAMES: Record<string, string> = {
  white: 'White Belt', blue: 'Blue Belt', purple: 'Purple Belt', brown: 'Brown Belt', black: 'Black Belt',
};

const BELT_AVG: Record<string, number> = { white: 18, blue: 30, purple: 30, brown: 24 };
const BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black'];

const STYLE_TAG_ID = 'belt-forge-v6-styles';
const FONT_LINK_ID = 'belt-forge-v6-font';

const CSS_TEXT = `
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
`;

let svgUidCounter = 0;
function beltSVG(belt: string, stripes = 0, size = 64, isLivePreview = false): string {
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

  const gradId = 'grad-' + belt + '-' + svgUidCounter;
  const barGradId = 'barGrad-' + belt + '-' + svgUidCounter;
  const tapeGradId = 'tapeGrad-' + svgUidCounter;
  const patternId = 'weave-' + svgUidCounter;

  const liveStyles = isLivePreview ? `
    <style>
      .bjv6-anim-stripe { transform-box: fill-box; transform-origin: center; animation: bjv6-slap-on 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
    </style>
  ` : '';

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
    const delay = isLivePreview ? `animation-delay: ${i * 0.08}s;` : '';
    const cls = isLivePreview ? 'bjv6-anim-stripe' : '';
    stripesSVG += `
      <g class="${cls}" style="${delay}">
        <rect x="${sx}" y="${beltY}" width="${sw}" height="${beltH}" fill="url(#${tapeGradId})" />
        <rect x="${sx}" y="${beltY}" width="${sw}" height="${beltH}" fill="url(#${patternId})" opacity="0.3" />
        <rect x="${sx}" y="${beltY}" width="0.5" height="${beltH}" fill="rgba(0,0,0,0.3)" />
        <rect x="${sx + sw - 0.5}" y="${beltY}" width="0.5" height="${beltH}" fill="rgba(0,0,0,0.3)" />
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
      ${liveStyles}
      ${defs}
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="url(#${gradId})" style="transition: fill 0.3s"/>
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="url(#${patternId})" />
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

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function monthsBetween(d1: string, d2: string): number {
  return Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}
function totalTimeStr(promos: Promotion[]): string {
  if (promos.length < 2) return '';
  const m = monthsBetween(promos[0].date, promos[promos.length - 1].date);
  if (m < 12) return m + 'mo';
  const y = Math.floor(m / 12), r = m % 12;
  return r ? y + 'y ' + r + 'm' : y + 'y';
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
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;800&display=swap';
    document.head.appendChild(link);
  }
}

function HeroCard({ current, promotions }: { current: Promotion; promotions: Promotion[] }) {
  const c = BELT_DEFS[current.belt] || BELT_DEFS.white;
  const tt = totalTimeStr(promotions);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    const wrap = wrapRef.current;
    if (!card || !wrap) return;
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -6;
      const rotY = ((x - cx) / cx) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    const onLeave = () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };
    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);
    return () => {
      wrap.removeEventListener('mousemove', onMove);
      wrap.removeEventListener('mouseleave', onLeave);
    };
  }, [current.belt, current.stripes]);

  return (
    <div className="bjv6-hero-wrapper" ref={wrapRef}>
      <div
        className="bjv6-hero-card"
        ref={cardRef}
        style={{
          boxShadow: `0 30px 60px ${hexToRgba(c.base, 0.2)}, inset 0 1px 1px rgba(255,255,255,0.3)`,
          borderTop: '1px solid rgba(255,255,255,0.4)',
        }}
      >
        <div
          className="bjv6-hero-bg-shimmer"
          style={{
            background: `radial-gradient(circle at top left, ${hexToRgba(c.base, 0.4)}, transparent 60%), radial-gradient(circle at bottom right, ${hexToRgba(c.dark, 0.6)}, transparent 60%)`,
          }}
        />
        <div className="bjv6-hero-content">
          <div className="bjv6-hero-eyebrow" style={{ color: c.light }}>
            {current.status === 'pending' ? 'Pending Rank' : 'Current Rank'}
          </div>
          <div className="bjv6-hero-body">
            <div className="bjv6-hero-belt-wrap">
              <div className="bjv6-hero-belt-aura" style={{ background: `radial-gradient(circle, ${c.glow}, transparent 70%)` }} />
              <div
                className="bjv6-belt-svg-wrap"
                dangerouslySetInnerHTML={{ __html: beltSVG(current.belt, current.stripes, 110) }}
              />
            </div>
            <div>
              <div className="bjv6-hero-rank">{BELT_NAMES[current.belt] || 'Belt'}</div>
              {current.stripes > 0 && (
                <div className="bjv6-hero-stripes" style={{ color: c.light }}>
                  {current.stripes} stripe{current.stripes > 1 ? 's' : ''}
                </div>
              )}
              <div className="bjv6-hero-since">
                Since {new Date(current.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          {tt && (
            <div className="bjv6-hero-stats">
              <div className="bjv6-hero-stat">
                <div className="bjv6-hero-stat-val">{tt}</div>
                <div className="bjv6-hero-stat-lbl">On the mats</div>
              </div>
              <div className="bjv6-hero-stat">
                <div className="bjv6-hero-stat-val" style={{ color: c.light }}>{promotions.length}</div>
                <div className="bjv6-hero-stat-lbl">Promotions</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineNode({ p, i, isCurrent, onEdit, onDeleteCard }: { p: Promotion; i: number; isCurrent: boolean; onEdit: (id: string) => void; onDeleteCard: (id: string) => void }) {
  const pColor = (BELT_DEFS[p.belt] || BELT_DEFS.white).base;
  const [confirming, setConfirming] = useState(false);
  const cardStyle = {
    ['--node-color-30' as any]: hexToRgba(pColor, 0.3),
    ['--node-color-15' as any]: hexToRgba(pColor, 0.15),
    ['--node-color-10' as any]: hexToRgba(pColor, 0.1),
  } as React.CSSProperties;
  return (
    <div className="bjv6-belt-node" style={{ animationDelay: `${i * 100}ms` }}>
      <div className="bjv6-node-left">
        <div className="bjv6-node-orb-wrap">
          {isCurrent && <div className="bjv6-current-star">★</div>}
          <div
            className={`bjv6-node-orb ${isCurrent ? 'bjv6-current' : ''}`}
            style={{ ['--node-color' as any]: pColor } as React.CSSProperties}
            onClick={() => onEdit(p.id)}
            dangerouslySetInnerHTML={{ __html: beltSVG(p.belt, p.stripes, 46) }}
          />
        </div>
      </div>
      <div
        className={`bjv6-node-card ${isCurrent ? 'bjv6-current' : ''}`}
        style={cardStyle}
      >
        <div className="bjv6-node-card-row1">
          <div onClick={() => onEdit(p.id)} style={{ flex: 1, cursor: 'pointer' }}>
            <span className="bjv6-node-belt-name">{BELT_NAMES[p.belt] || 'Belt'}</span>
            {p.stripes > 0 && <span className="bjv6-node-stripes">{p.stripes}s</span>}
          </div>
          {confirming ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteCard(p.id); setConfirming(false); }}
                style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.05em' }}
                aria-label="Confirm delete"
              >YES</button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.05em' }}
                aria-label="Cancel delete"
              >NO</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(p.id); }}
                style={{ background: 'transparent', border: 'none', color: '#444', padding: 4, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                aria-label="Edit promotion"
              >
                <svg className="bjv6-node-edit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
                style={{ background: 'transparent', border: 'none', color: '#DC2626', padding: 4, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                aria-label="Delete promotion"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="bjv6-node-date">
          {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <span className={`bjv6-status-pill ${p.status === 'approved' ? 'bjv6-status-approved' : 'bjv6-status-pending'}`}>
          <span className="bjv6-dot-pip" />
          {p.status === 'approved' ? 'Verified' : 'Pending'}
        </span>
        {p.note && (
          <div className="bjv6-coach-note">
            <p>"{p.note}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ForgeSheet({
  open, isEditing, belt, stripes, date, note, onSetBelt, onSetStripes, onSetDate, onSetNote,
  onClose, onSave, onDelete, saving,
}: {
  open: boolean; isEditing: boolean; belt: string; stripes: number; date: string; note: string;
  onSetBelt: (b: string) => void; onSetStripes: (s: number) => void;
  onSetDate: (d: string) => void; onSetNote: (n: string) => void;
  onClose: () => void; onSave: () => void; onDelete: () => void; saving: boolean;
}) {
  const c = BELT_DEFS[belt] || BELT_DEFS.white;
  const liveSvgKey = `${belt}-${stripes}`;
  return (
    <div
      className={`bjv6-form-backdrop ${open ? 'bjv6-open' : ''}`}
      onClick={(e) => { if ((e.target as HTMLElement).classList.contains('bjv6-form-backdrop')) onClose(); }}
    >
      <div className="bjv6-form-sheet">
        <div className="bjv6-forge-stage">
          <div className="bjv6-forge-drag" />
          <button className="bjv6-forge-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className="bjv6-forge-spotlight" style={{ background: c.base }} />
          <div
            key={liveSvgKey}
            className="bjv6-forge-belt-container"
            dangerouslySetInnerHTML={{ __html: beltSVG(belt, stripes, 180, true) }}
          />
        </div>

        <div className="bjv6-forge-controls">
          <div className="bjv6-forge-label">
            <span>Color Foundation</span>
            <span style={{ color: '#FFF' }}>{c.name}</span>
          </div>
          <div className="bjv6-swatch-row">
            {BELT_ORDER.map((b) => (
              <button
                key={b}
                className={`bjv6-swatch-btn ${b === belt ? 'bjv6-active' : ''}`}
                style={{ ['--swatch-color' as any]: BELT_DEFS[b].base } as React.CSSProperties}
                onClick={() => { onSetBelt(b); if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10); }}
                aria-label={BELT_DEFS[b].name}
              />
            ))}
          </div>

          <div className="bjv6-forge-label">
            <span>Rank Stripes</span>
            <span style={{ color: 'var(--gold)' }}>{stripes}</span>
          </div>
          <div className="bjv6-stripe-segments">
            <div className="bjv6-stripe-slider" style={{ transform: `translateX(${stripes * 100}%)` }} />
            {[0, 1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`bjv6-stripe-seg ${s === stripes ? 'bjv6-active' : ''}`}
                onClick={() => { onSetStripes(s); if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 30, 20]); }}
              >
                {s}
              </div>
            ))}
          </div>

          <div className="bjv6-forge-label">Date Earned</div>
          <input
            type="date"
            className="bjv6-date-input"
            value={date}
            onChange={(e) => onSetDate(e.target.value)}
          />

          <div className="bjv6-forge-label">Coach's Note (Optional)</div>
          <textarea
            className="bjv6-note-input"
            rows={2}
            placeholder="e.g. Promoted by Coach Anthony"
            value={note}
            onChange={(e) => onSetNote(e.target.value)}
          />

          {isEditing && (
            <button className="bjv6-btn-delete" onClick={onDelete}>Delete Promotion</button>
          )}

          <div className="bjv6-forge-actions">
            <button className="bjv6-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="bjv6-btn-save" onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Log Promotion'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ceremony({ belt, show, onClose }: { belt: string | null; show: boolean; onClose: () => void; }) {
  if (!belt) return null;
  const c = BELT_DEFS[belt] || BELT_DEFS.white;
  const ossText = belt === 'white' ? '#000' : '#FFF';
  return (
    <div
      className={`bjv6-ceremony ${show ? 'bjv6-show' : ''}`}
      onClick={onClose}
      style={{ color: c.light }}
    >
      <div className="bjv6-god-rays" style={{ color: c.base }} />
      <div className="bjv6-ceremony-content">
        <div className="bjv6-ceremony-eyebrow">New Promotion</div>
        <div
          className="bjv6-ceremony-belt"
          dangerouslySetInnerHTML={{ __html: beltSVG(belt, 0, 220) }}
        />
        <div className="bjv6-ceremony-name">{BELT_NAMES[belt]}</div>
        <div className="bjv6-ceremony-sub">Coach verification pending.</div>
        <button
          className="bjv6-ceremony-oss"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            background: `linear-gradient(135deg, ${c.light}, ${c.base})`,
            color: ossText,
            boxShadow: `0 10px 30px ${c.glow}, inset 0 2px 5px rgba(255,255,255,0.4)`,
          }}
        >
          OSS 🤙
        </button>
      </div>
    </div>
  );
}

export default function BeltJourneyPage({ onBack }: { onBack?: () => void } = {}) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [forgeBelt, setForgeBelt] = useState<string>('white');
  const [forgeStripes, setForgeStripes] = useState<number>(0);
  const [forgeDate, setForgeDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [forgeNote, setForgeNote] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [ceremonyBelt, setCeremonyBelt] = useState<string | null>(null);
  const [ceremonyShow, setCeremonyShow] = useState(false);
  const connectorRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Inject styles + font + body bg
  useEffect(() => {
    injectStylesAndFont();
    const prevBg = document.body.style.background;
    document.body.style.background = '#030305';
    return () => { document.body.style.background = prevBg; };
  }, []);

  const loadPromotions = useCallback(async () => {
    try {
      const list = await beltGetPromotions();
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(localStorage.getItem('lbjj_belt_deleted_ids') || '[]'); } catch {}
      const mapped = (list || [])
        .filter((p: any) => !deletedIds.includes(p.id))
        .map((p: any) => ({
          id: String(p.id),
          belt: String(p.belt || 'white').toLowerCase(),
          stripes: Number(p.stripes) || 0,
          date: typeof p.date === 'string' ? p.date.split('T')[0] : String(p.date),
          note: p.note || '',
          status: (p.status || 'pending') as Promotion['status'],
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setPromotions(mapped);
      try {
        localStorage.setItem('lbjj_belt_promotions_cache', JSON.stringify(mapped));
        localStorage.setItem('lbjj_belt_promotions', JSON.stringify(mapped));
      } catch {}
    } catch (err) {
      console.error('beltGetPromotions failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('lbjj_belt_promotions_cache') || localStorage.getItem('lbjj_belt_promotions');
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length) {
          setPromotions(list);
          setLoading(false);
        }
      }
    } catch {}
    loadPromotions();
  }, [loadPromotions]);

  // Animate connector heights after render
  useEffect(() => {
    const r = requestAnimationFrame(() => {
      connectorRefs.current.forEach((el) => {
        const pct = el.dataset.pct;
        if (pct) el.style.height = `${pct}%`;
      });
    });
    return () => cancelAnimationFrame(r);
  }, [promotions]);

  const openAdd = () => {
    setEditingId(null);
    setForgeBelt('white');
    setForgeStripes(0);
    setForgeDate(new Date().toISOString().split('T')[0]);
    setForgeNote('');
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const p = promotions.find((x) => x.id === id);
    if (!p) return;
    setEditingId(p.id);
    setForgeBelt(p.belt);
    setForgeStripes(p.stripes);
    setForgeDate(p.date);
    setForgeNote(p.note || '');
    setOpen(true);
  };

  const closeForm = () => setOpen(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const isNew = !editingId;
    try {
      if (editingId) {
        await beltUpdatePromotion({
          promotionId: editingId,
          belt: forgeBelt,
          stripes: forgeStripes,
          date: forgeDate,
          note: forgeNote,
        });
      } else {
        await beltSavePromotion({
          belt: forgeBelt,
          stripes: forgeStripes,
          date: forgeDate,
          note: forgeNote,
        });
      }
      setOpen(false);
      await loadPromotions();
      if (isNew) {
        setCeremonyBelt(forgeBelt);
        setCeremonyShow(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([80, 400, 80, 150, 40, 80, 40]);
        }
      }
    } catch (err) {
      console.error('save promotion failed', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteById = async (id: string) => {
    try {
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(localStorage.getItem('lbjj_belt_deleted_ids') || '[]'); } catch {}
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('lbjj_belt_deleted_ids', JSON.stringify(deletedIds));
      }
      setPromotions((prev) => {
        const next = prev.filter((p) => p.id !== id);
        try {
          localStorage.setItem('lbjj_belt_promotions_cache', JSON.stringify(next));
          localStorage.setItem('lbjj_belt_promotions', JSON.stringify(next));
        } catch {}
        return next;
      });
      await beltDeletePromotion(id);
      await loadPromotions();
    } catch (err) {
      console.error('delete promotion failed', err);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    const id = editingId;
    setOpen(false);
    await deleteById(id);
  };

  const handleCloseCeremony = () => {
    setCeremonyShow(false);
    setTimeout(() => setCeremonyBelt(null), 500);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else if (typeof window !== 'undefined') {
      window.location.hash = '/';
    }
  };

  const hasPromotions = promotions.length > 0;
  const current = hasPromotions
    ? [...promotions].sort((a, b) => {
        const ai = BELT_ORDER.indexOf(a.belt);
        const bi = BELT_ORDER.indexOf(b.belt);
        if (ai !== bi) return bi - ai;
        return b.stripes - a.stripes;
      })[0]
    : null;

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <div className="bjv6-root">
      <div className="bjv6-ambient">
        <div className="bjv6-ambient-orb bjv6-orb1" />
        <div className="bjv6-ambient-orb bjv6-orb2" />
      </div>

      <div className="bjv6-page">
        <div className="bjv6-top-bar">
          <button className="bjv6-back-btn" onClick={handleBack} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="bjv6-top-title">Belt Journey</div>
          <div style={{ width: 44 }} />
        </div>

        {loading && !hasPromotions && (
          <div className="bjv6-skeleton">
            <div className="bjv6-skeleton-card" style={{ height: 220 }} />
            <div className="bjv6-skeleton-card" />
            <div className="bjv6-skeleton-card" />
            <div className="bjv6-skeleton-card" />
          </div>
        )}

        {!loading && !hasPromotions && (
          <div className="bjv6-empty">
            <div className="bjv6-empty-title">The Journey Begins</div>
            <div className="bjv6-empty-sub">Every black belt started right where you are.</div>
          </div>
        )}

        {hasPromotions && current && (
          <>
            <HeroCard current={current} promotions={promotions} />

            <div className="bjv6-section-row">
              <div className="bjv6-section-lbl">The Path</div>
              <div className="bjv6-section-count">{promotions.length} logged</div>
            </div>

            <div className="bjv6-timeline">
              {promotions.map((p, i) => {
                const isCurrent = i === promotions.length - 1;
                const node = (
                  <TimelineNode
                    key={`node-${p.id}`}
                    p={p}
                    i={i}
                    isCurrent={isCurrent}
                    onEdit={openEdit}
                    onDeleteCard={deleteById}
                  />
                );
                if (i < promotions.length - 1) {
                  const nextP = promotions[i + 1];
                  const m = monthsBetween(p.date, nextP.date);
                  const avg = BELT_AVG[p.belt] || 24;
                  const isEarly = m < avg;
                  const pct = Math.min(100, (m / avg) * 100);
                  const fromColor = (BELT_DEFS[p.belt] || BELT_DEFS.white).base;
                  const toColor = (BELT_DEFS[nextP.belt] || BELT_DEFS.white).base;
                  return (
                    <React.Fragment key={`frag-${p.id}`}>
                      {node}
                      <div className="bjv6-connector-wrap">
                        <div className="bjv6-connector-line">
                          <div
                            className="bjv6-connector-fill"
                            ref={(el) => {
                              if (el) {
                                el.dataset.pct = String(pct);
                                connectorRefs.current.set(i, el);
                              } else {
                                connectorRefs.current.delete(i);
                              }
                            }}
                            style={{
                              background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
                              color: toColor,
                            }}
                          />
                        </div>
                        <div className={`bjv6-connector-badge ${isEarly ? 'bjv6-early' : ''}`}>
                          {m}mo{isEarly ? ' · early ⚡' : ''}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }
                return (
                  <React.Fragment key={`frag-${p.id}`}>
                    {node}
                    <div className="bjv6-connector-wrap">
                      <div className="bjv6-connector-trail" />
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>

      {portalTarget && createPortal(
        <div className="bjv6-bottom-bar">
          <button className="bjv6-bottom-add-btn" onClick={openAdd}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>{promotions.length === 0 ? 'Log My First Belt' : 'Add Promotion'}</span>
          </button>
        </div>,
        portalTarget
      )}

      {portalTarget && createPortal(
        <ForgeSheet
          open={open}
          isEditing={!!editingId}
          belt={forgeBelt}
          stripes={forgeStripes}
          date={forgeDate}
          note={forgeNote}
          onSetBelt={setForgeBelt}
          onSetStripes={setForgeStripes}
          onSetDate={setForgeDate}
          onSetNote={setForgeNote}
          onClose={closeForm}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={saving}
        />,
        portalTarget
      )}

      {portalTarget && createPortal(
        <Ceremony belt={ceremonyBelt} show={ceremonyShow} onClose={handleCloseCeremony} />,
        portalTarget
      )}
    </div>
  );
}
