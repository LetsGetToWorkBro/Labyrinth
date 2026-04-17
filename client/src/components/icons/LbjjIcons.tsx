/**
 * LbjjIcons.tsx — Labyrinth BJJ Custom Icon System
 *
 * Design System:
 *   - Style: Lucide-compatible stroke icons
 *   - stroke-width: 1.5
 *   - stroke-linecap: round
 *   - stroke-linejoin: round
 *   - fill: none (strokes), currentColor (fills)
 *   - viewBox: 0 0 24 24 for all standard icons
 *   - viewBox: 0 0 48 48 for badge/achievement icons
 *   - size: width/height="1em" by default — scales with font-size
 *   - Colors: currentColor (inherits) or explicit CSS vars
 *
 * Usage:
 *   <FireIcon />               — 1em × 1em, currentColor
 *   <FireIcon size={24} />     — explicit px
 *   <FireIcon color="#C8A24C" />
 *   <GoldMedalIcon size={24} />
 */

import React from "react";

interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

function base(
  props: IconProps,
  children: React.ReactNode,
  viewBox = "0 0 24 24"
) {
  const {
    size = "1em",
    color = "currentColor",
    strokeWidth = 1.5,
    className,
    style,
    "aria-label": ariaLabel,
    "aria-hidden": ariaHidden,
  } = props;

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : ariaHidden ?? "true"}
      role={ariaLabel ? "img" : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

// ─── Emoji Replacements ──────────────────────────────────────────────────────

/** Replaces 🔥 — animated flame for streak widget */
export function FireIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Outer flame body */}
      <path d="M12 2C12 2 9 7 9 11c0 1.5.5 2.8 1.2 3.8C9.5 13.8 9 12.5 9 11c0-2 1-4 1-4S8 9 7 12c0 3.3 2.2 6 5 6s5-2.7 5-6c0-3.5-3-5-3-5s1 2 1 4c-.6-.7-1-1.8-1-3C14 5.5 12 2 12 2z" fill={props.color ?? "currentColor"} stroke="none" opacity={0.9} />
      {/* Inner highlight */}
      <path d="M12 8c0 0-1.5 2-1.5 4 0 .9.3 1.7.8 2.3C12 13 12.5 11.5 12.5 10.5c0-1.5-.5-2.5-.5-2.5z" fill="none" stroke={props.color ?? "currentColor"} strokeWidth={0.8} opacity={0.4} />
    </>,
    "0 0 24 24"
  );
}

/** Replaces ✅ and ✓ — animated check in a circle for success states */
export function CheckCircleFilledIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="10" fill={props.color ?? "currentColor"} stroke="none" opacity={0.15} />
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 12.5l3 3 6-6" strokeWidth={props.strokeWidth ?? 2} />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 📅 — calendar with a spark */
export function CalendarSparkIcon(props: IconProps) {
  return base(
    props,
    <>
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M8 2v3M16 2v3M3 9h18" />
      <path d="M8 13h1M12 13h1M16 13h1M8 17h1M12 17h1" strokeWidth={2} strokeLinecap="round" />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 🎮 — game controller, cleaner geometry than Lucide Gamepad2 */
export function GamepadIcon(props: IconProps) {
  return base(
    props,
    <>
      <rect x="2" y="7" width="20" height="13" rx="5" />
      {/* Left D-pad cross */}
      <path d="M8 11v4M6 13h4" strokeWidth={props.strokeWidth ?? 1.5} />
      {/* Right buttons */}
      <circle cx="16" cy="11" r="1" fill={props.color ?? "currentColor"} stroke="none" />
      <circle cx="18" cy="13.5" r="1" fill={props.color ?? "currentColor"} stroke="none" />
      <circle cx="14" cy="13.5" r="1" fill={props.color ?? "currentColor"} stroke="none" />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 📊 — bar chart, more expressive than BarChart2 */
export function ChartBarsIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M4 20V12" />
      <path d="M9 20V8" />
      <path d="M14 20V14" />
      <path d="M19 20V4" />
      <path d="M2 20h20" />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 🧖 — sauna / thermometer with steam */
export function SaunaIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Thermometer bulb + stem */}
      <circle cx="12" cy="18" r="3" />
      <path d="M12 15V7" />
      <rect x="10.5" y="7" width="3" height="9" rx="1.5" />
      {/* Heat/temperature fill indicator */}
      <path d="M12 15V11" stroke={props.color ?? "currentColor"} strokeWidth={2.5} />
      {/* Steam waves */}
      <path d="M8 4c0 0 1-1 0-2" strokeWidth={1.2} opacity={0.6} />
      <path d="M12 3c0 0 1-1 0-2" strokeWidth={1.2} opacity={0.6} />
      <path d="M16 4c0 0 1-1 0-2" strokeWidth={1.2} opacity={0.6} />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 🏠 — home icon, cleaner than Lucide Home */
export function HomeIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H15v-6H9v6H4a1 1 0 0 1-1-1V10.5z" />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 💬 — chat bubble with energy */
export function ChatBubbleIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h8M8 13h5" strokeWidth={props.strokeWidth ?? 1.5} opacity={0.6} />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 🏆 — trophy, more expressive */
export function TrophyIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      <path d="M4 22h16M12 17v5" />
      <path d="M9 17c0-1.7 1.3-3 3-3s3 1.3 3 3" />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 📢 — megaphone/announcement */
export function MegaphoneIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l3 4v-9L6 12H4a1 1 0 0 0-1-1z" />
      <path d="M9 9l9-5v14L9 13" />
      <path d="M13 9v6" strokeWidth={1} opacity={0.5} />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 🔒 — padlock for locked states */
export function LockIcon(props: IconProps) {
  return base(
    props,
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1" fill={props.color ?? "currentColor"} stroke="none" />
    </>,
    "0 0 24 24"
  );
}

/** Replaces 👋 — wave / greeting */
export function WaveIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M8 12c0 0-2.5-2.5-2.5-5.5A2.5 2.5 0 0 1 11 6c.5 1 .5 2.5-.5 3.5" />
      <path d="M11 9c0 0 .5-2 2-2s2.5 1 2.5 3" />
      <path d="M5 16c0 0-2-2-2-5 0-1.5 1-2.5 2-2.5" />
      <path d="M9 21c2 1 4 .5 6-1s4-4 4-7c0-2-1-3.5-2-3.5" />
    </>,
    "0 0 24 24"
  );
}

// ─── Medal Icons (replaces 🥇 🥈 🥉) ─────────────────────────────────────────

/** Gold medal — replaces 🥇 */
export function GoldMedalIcon(props: IconProps) {
  const c = props.color ?? "#C8A24C";
  return (
    <svg
      width={props.size ?? "1em"}
      height={props.size ?? "1em"}
      viewBox="0 0 24 24"
      fill="none"
      className={props.className}
      style={props.style}
      aria-label={props["aria-label"]}
      aria-hidden={props["aria-label"] ? undefined : "true"}
      role={props["aria-label"] ? "img" : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ribbon left */}
      <path d="M9 2l-4 6h6L9 2z" fill={c} opacity={0.7} />
      {/* Ribbon right */}
      <path d="M15 2l4 6h-6L15 2z" fill={c} opacity={0.85} />
      {/* Medal circle */}
      <circle cx="12" cy="16" r="6" fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} />
      {/* "1" text-equivalent — bold vertical bar */}
      <text x="12" y="20" textAnchor="middle" fontSize="7" fontWeight="800" fill={c} stroke="none">1</text>
    </svg>
  );
}

/** Silver medal — replaces 🥈 */
export function SilverMedalIcon(props: IconProps) {
  const c = props.color ?? "#9CA3AF";
  return (
    <svg
      width={props.size ?? "1em"}
      height={props.size ?? "1em"}
      viewBox="0 0 24 24"
      fill="none"
      className={props.className}
      style={props.style}
      aria-label={props["aria-label"]}
      aria-hidden={props["aria-label"] ? undefined : "true"}
      role={props["aria-label"] ? "img" : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 2l-4 6h6L9 2z" fill={c} opacity={0.7} />
      <path d="M15 2l4 6h-6L15 2z" fill={c} opacity={0.85} />
      <circle cx="12" cy="16" r="6" fill={c} opacity={0.12} stroke={c} strokeWidth={1.5} />
      <text x="12" y="20" textAnchor="middle" fontSize="7" fontWeight="800" fill={c} stroke="none">2</text>
    </svg>
  );
}

/** Bronze medal — replaces 🥉 */
export function BronzeMedalIcon(props: IconProps) {
  const c = props.color ?? "#B45309";
  return (
    <svg
      width={props.size ?? "1em"}
      height={props.size ?? "1em"}
      viewBox="0 0 24 24"
      fill="none"
      className={props.className}
      style={props.style}
      aria-label={props["aria-label"]}
      aria-hidden={props["aria-label"] ? undefined : "true"}
      role={props["aria-label"] ? "img" : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 2l-4 6h6L9 2z" fill={c} opacity={0.7} />
      <path d="M15 2l4 6h-6L15 2z" fill={c} opacity={0.85} />
      <circle cx="12" cy="16" r="6" fill={c} opacity={0.12} stroke={c} strokeWidth={1.5} />
      <text x="12" y="20" textAnchor="middle" fontSize="7" fontWeight="800" fill={c} stroke="none">3</text>
    </svg>
  );
}

// ─── Belt Rank Dots (replaces colored circle emojis ⚪🔵🟣🟤⬛) ─────────────

interface BeltDotProps {
  color: string;
  size?: number | string;
  border?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Inline belt rank dot — replaces colored circle emojis in chat/rank lists */
export function BeltDot({ color, size = "1em", border, className, style }: BeltDotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="6.5" fill={color} stroke={border ?? color} strokeWidth="1.5" />
      {/* subtle inner shine */}
      <circle cx="6" cy="6" r="1.5" fill="white" opacity={0.15} />
    </svg>
  );
}

// ─── BJJ position icons (replaces emoji in games) ────────────────────────────

/** Standing position — replaces 🧍 */
export function StandingIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Head */}
      <circle cx="12" cy="5" r="2.5" />
      {/* Body */}
      <path d="M12 7.5v7" />
      {/* Arms */}
      <path d="M8 10.5l4-1 4 1" />
      {/* Legs */}
      <path d="M12 14.5l-2.5 5M12 14.5l2.5 5" />
    </>,
    "0 0 24 24"
  );
}

/** Guard/shield position — replaces 🛡️ */
export function ShieldIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M12 2L3 6v6c0 5 4 9 9 10 5-1 9-5 9-10V6L12 2z" />
      <path d="M9 12l2 2 4-4" strokeWidth={props.strokeWidth ?? 2} />
    </>,
    "0 0 24 24"
  );
}

/** Mount/dominant position — replaces ⚔️ */
export function SwordsIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M14.5 9.5l-5 5" />
      <path d="M3 3l5 5M16 3l-5 5" />
      <path d="M3 21l7-7" />
      <path d="M21 3l-7 7" />
      <path d="M17 21l-3-3 4-4 3 3-4 4z" />
      <path d="M3 17l3 3-4 4z" opacity={0.5} />
    </>,
    "0 0 24 24"
  );
}

/** Sweep/rotate — replaces 🔄 */
export function SweepIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>,
    "0 0 24 24"
  );
}

/** Lightning bolt / takedown energy — replaces ⚡ */
export function BoltIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M13 2L4.5 13.5H11L10 22 19.5 10H13L13 2z" fill={props.color ?? "currentColor"} stroke="none" />
    </>,
    "0 0 24 24"
  );
}

/** Skull/submission — replaces 💀 */
export function SubmissionIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Skull dome */}
      <path d="M8 19v-3a4 4 0 0 1 8 0v3" />
      <path d="M6 13a6 6 0 1 1 12 0v1H6v-1z" />
      {/* Eye sockets */}
      <circle cx="9.5" cy="11" r="1.5" fill={props.color ?? "currentColor"} stroke="none" opacity={0.7} />
      <circle cx="14.5" cy="11" r="1.5" fill={props.color ?? "currentColor"} stroke="none" opacity={0.7} />
      {/* Jaw teeth */}
      <path d="M9 19h1.5v2H9zM13.5 19H15v2h-1.5z" fill={props.color ?? "currentColor"} stroke="none" opacity={0.5} />
    </>,
    "0 0 24 24"
  );
}

/** Warning / sudden death — replaces ⚠️ */
export function WarningIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" strokeWidth={2} strokeLinecap="round" />
    </>,
    "0 0 24 24"
  );
}

/** Star / rating — replaces ⭐ */
export function StarIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={props.color ?? "currentColor"} stroke="none" />
    </>,
    "0 0 24 24"
  );
}

/** Struggle / Half guard — replaces 🤼 */
export function GrapplingIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Two figures grappling */}
      <circle cx="8" cy="5" r="2" />
      <circle cx="16" cy="5" r="2" />
      <path d="M6 7c0 0 2 1.5 4 1.5S14 7 14 7" />
      <path d="M10 8.5c0 0 2 1 4 2.5s3 3.5 3 3.5" />
      <path d="M8 8.5c0 0-1 1.5-2 3s-1 3.5-1 3.5" />
      <path d="M5 15l3 5M19 15l-3 5" />
    </>,
    "0 0 24 24"
  );
}

/** Scorpion / S-mount — replaces 🦂 */
export function ScorpionIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Body */}
      <ellipse cx="12" cy="12" rx="4" ry="6" />
      {/* Claws */}
      <path d="M8 9l-4-2 2 3" />
      <path d="M16 9l4-2-2 3" />
      {/* Tail curl */}
      <path d="M12 18c0 0 3 1 4 4-1 0-2-1-4-1s-3 1-4 1c1-3 4-4 4-4z" />
    </>,
    "0 0 24 24"
  );
}

/** Heel — replaces 🦶 for heel hook */
export function HeelHookIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Foot shape */}
      <path d="M8 4C8 4 5 7 5 12c0 3 1 5 2 6h8c1-1 2-3 2-6V8c0-2-1-3-2-3" />
      {/* Toes */}
      <path d="M8 18c1 1 6 1 7 0" />
      <path d="M9 4c0-1.5 2-2 3-1" />
      {/* Hook indicator */}
      <path d="M16 9c2 1 2 3 0 4" strokeWidth={1.5} />
    </>,
    "0 0 24 24"
  );
}

/** Fist / punch power — replaces 💪 */
export function FistIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Fist silhouette */}
      <rect x="6" y="9" width="12" height="9" rx="3" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      <path d="M6 13h12" opacity={0.3} />
    </>,
    "0 0 24 24"
  );
}

/** Back arrow — replaces ↩️ for escape moves */
export function EscapeIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h11a4 4 0 0 1 0 8h-1" />
    </>,
    "0 0 24 24"
  );
}

/** Forward arrow — replaces ➡️ for pass/advance */
export function PassIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M15 10l4 4-4 4" />
      <path d="M3 12h16" />
      <path d="M3 6h8M3 18h8" opacity={0.4} />
    </>,
    "0 0 24 24"
  );
}

/** Mountain / high mount — replaces 🏔️ */
export function MountIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3 20l7-13 4 7 2-3 5 9H3z" />
      <path d="M14.5 7.5l2.5-2 2 2.5" strokeWidth={1} opacity={0.5} />
    </>,
    "0 0 24 24"
  );
}

/** Triangle submission — replaces 📐 */
export function TriangleIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M12 3L22 20H2L12 3z" />
      <path d="M12 10l3 5H9l3-5z" fill={props.color ?? "currentColor"} stroke="none" opacity={0.3} />
    </>,
    "0 0 24 24"
  );
}

/** Dizziness / exhaustion — replaces 😵 */
export function ExhaustionIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="9" />
      {/* X eyes */}
      <path d="M9 9l2 2-2 2M11 9l-2 2 2 2" strokeWidth={1.5} />
      <path d="M13 9l2 2-2 2M15 9l-2 2 2 2" strokeWidth={1.5} />
      {/* Wavy mouth */}
      <path d="M8 16c1-1 2-1 4 0s3 1 4 0" strokeWidth={1.5} />
    </>,
    "0 0 24 24"
  );
}

/** Spiral / berimbolo — replaces 🌀 */
export function BerimsboloIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M12 3a9 9 0 1 1-9 9" />
      <path d="M12 7a5 5 0 1 0 5 5" />
      <path d="M12 11a1 1 0 1 1-1 1" />
      <path d="M3 12l-2-2 2-2" />
    </>,
    "0 0 24 24"
  );
}

/** Eagle / flying triangle — replaces 🦅 */
export function EagleIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Wings spread */}
      <path d="M2 10c0 0 4-4 8-4s8 4 8 4" />
      <path d="M4 12l8-2 8 2" />
      {/* Body */}
      <path d="M12 6v10" />
      {/* Tail */}
      <path d="M9 16l3 4 3-4" />
      {/* Head */}
      <circle cx="12" cy="5" r="1.5" fill={props.color ?? "currentColor"} stroke="none" />
    </>,
    "0 0 24 24"
  );
}

/** Lizard / sprawl — replaces 🦎 */
export function SprawlIcon(props: IconProps) {
  return base(
    props,
    <>
      {/* Body horizontal */}
      <path d="M5 12h14" strokeWidth={2.5} />
      {/* Legs */}
      <path d="M8 12l-2-4M8 12l-3 4" />
      <path d="M16 12l2-4M16 12l3 4" />
      {/* Head */}
      <circle cx="19" cy="12" r="1.5" />
      {/* Tail */}
      <path d="M5 12C3 13 2 15 3 17" strokeWidth={1} />
    </>,
    "0 0 24 24"
  );
}

// ─── Status / UI Icons ────────────────────────────────────────────────────────

/** Replaces ✅ / achieved badge pill */
export function AchievedIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" strokeWidth={2} />
    </>,
    "0 0 24 24"
  );
}

/** Replaces the nav customizer dropdown chevron */
export function ChevronDownIcon(props: IconProps) {
  return base(
    props,
    <path d="M6 9l6 6 6-6" />,
    "0 0 24 24"
  );
}

/** Replaces right arrow / "View All →" chevron */
export function ChevronRightIcon(props: IconProps) {
  return base(
    props,
    <path d="M9 6l6 6-6 6" />,
    "0 0 24 24"
  );
}

/** Replaces ♟️ — chess pawn for games tab */
export function PawnIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="6" r="3" />
      <path d="M9 9c0 0-1 2-1 4h8c0-2-1-4-1-4" />
      <path d="M7 20h10M8 20l1-7h6l1 7" />
    </>,
    "0 0 24 24"
  );
}
