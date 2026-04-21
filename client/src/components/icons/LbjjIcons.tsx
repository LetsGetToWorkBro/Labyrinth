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
 *   - size: width/height="1em" by default — scales with font-size
 *   - Colors: currentColor (inherits) or explicit CSS vars
 *
 * Usage:
 *   <FireIcon />               — 1em × 1em, currentColor
 *   <FireIcon size={24} />     — explicit px
 *   <FireIcon color="#C8A24C" />
 *   <GoldMedalIcon size={24} />
 *
 * NOTE: Generic icons (Home, Trophy, Star, Lock, etc.) have been
 * removed — use lucide-react directly. Only BJJ-specific or
 * visually-distinct icons remain here.
 */

import React from "react";
import { Trophy as LucideTrophy, AlertTriangle as LucideAlertTriangle, Lock as LucideLock } from "lucide-react";

// Compat re-exports for GamesPage.tsx (out-of-scope this audit).
// New code should import these directly from lucide-react.
export const TrophyIcon = LucideTrophy;
export const WarningIcon = LucideAlertTriangle;
export const LockIcon = LucideLock;

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

// ─── BJJ-specific / kept custom icons ────────────────────────────────────────

/** REDESIGNED — Clean flame silhouette, 2 elements. Replaces 🔥. */
export function FireIcon(props: IconProps) {
  return base(
    props,
    <>
      <path
        d="M12 2c0 0-5 5.5-5 10a5 5 0 0 0 10 0C17 7.5 12 2 12 2z"
        fill={props.color ?? "currentColor"}
        stroke="none"
      />
      <path
        d="M12 9c0 0-2 2.5-2 5a2 2 0 0 0 4 0c0-2-2-5-2-5z"
        fill="#000"
        fillOpacity={0.25}
        stroke="none"
      />
    </>,
    "0 0 24 24"
  );
}

/** REDESIGNED — Circle with subtle fill + centered checkmark. 2 elements. */
export function CheckCircleFilledIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={props.color ?? "currentColor"}
        fillOpacity={0.1}
      />
      <path d="M7.5 12.5l3 3 6-6" strokeWidth={props.strokeWidth ?? 2} />
    </>,
    "0 0 24 24"
  );
}

/** REDESIGNED — Calendar + rounded tabs + divider + corner spark. 4 elements. */
export function CalendarSparkIcon(props: IconProps) {
  return base(
    props,
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4" />
      <path d="M3 10h18" />
      <path d="M17 15l.75 1.5L19.25 17l-1.5.5L17 19l-.75-1.5L14.75 17l1.5-.5z" />
    </>,
    "0 0 24 24"
  );
}

/** REDESIGNED — Rounded body + d-pad cross + two face-button dots. 4 elements. */
export function GamepadIcon(props: IconProps) {
  return base(
    props,
    <>
      <rect x="2" y="7" width="20" height="12" rx="5" />
      <path d="M7 13h4M9 11v4" />
      <circle cx="16" cy="12" r="0.9" fill={props.color ?? "currentColor"} stroke="none" />
      <circle cx="18.5" cy="14" r="0.9" fill={props.color ?? "currentColor"} stroke="none" />
    </>,
    "0 0 24 24"
  );
}

/** KEPT — Previously SaunaIcon was called for the Sauna page. REDESIGNED — thermometer + 3 steam curves. 5 elements. */
export function SaunaIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M12 14V7a2 2 0 1 1 4 0v7a4 4 0 1 1-4 0z" />
      <path d="M14 10v4" strokeWidth={2.5} />
      <path d="M6 6c1-1 1-2 0-3" opacity={0.7} />
      <path d="M9 5c1-1 1-2 0-3" opacity={0.7} />
      <path d="M4 10c1-1 1-2 0-3" opacity={0.7} />
    </>,
    "0 0 24 24"
  );
}

// HomeIcon            — REMOVED → use lucide-react <Home />
// ChatBubbleIcon      — REMOVED → use lucide-react <MessageCircle />
// TrophyIcon          — REMOVED → use lucide-react <Trophy />
// MegaphoneIcon       — REMOVED → use lucide-react <Megaphone />
// LockIcon            — REMOVED → use lucide-react <Lock />
// ChartBarsIcon       — REMOVED → use lucide-react <BarChart2 />
// WaveIcon            — REMOVED (was broken, unused after audit)

// ─── Medal Icons (no <text>, paths only) ─────────────────────────────────────

/** REDESIGNED — Ribbon + circle + numeral "1" drawn as paths. No <text>. */
export function GoldMedalIcon(props: IconProps) {
  const c = props.color ?? "#C8A24C";
  const size = props.size ?? "1em";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={props.className}
      style={props.style}
      aria-label={props["aria-label"]}
      aria-hidden={props["aria-label"] ? undefined : "true"}
      role={props["aria-label"] ? "img" : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 2l-4 6 4 2 2-4z" fill={c} opacity={0.75} />
      <path d="M16 2l4 6-4 2-2-4z" fill={c} opacity={0.9} />
      <circle cx="12" cy="16" r="6" fill={c} fillOpacity={0.18} stroke={c} strokeWidth={1.5} />
      {/* "1" — vertical stroke + small top serif */}
      <path d="M12 13v6M10.5 14l1.5-1" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** REDESIGNED — Ribbon + circle + numeral "2" drawn as paths. No <text>. */
export function SilverMedalIcon(props: IconProps) {
  const c = props.color ?? "#9CA3AF";
  const size = props.size ?? "1em";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={props.className}
      style={props.style}
      aria-label={props["aria-label"]}
      aria-hidden={props["aria-label"] ? undefined : "true"}
      role={props["aria-label"] ? "img" : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 2l-4 6 4 2 2-4z" fill={c} opacity={0.75} />
      <path d="M16 2l4 6-4 2-2-4z" fill={c} opacity={0.9} />
      <circle cx="12" cy="16" r="6" fill={c} fillOpacity={0.15} stroke={c} strokeWidth={1.5} />
      {/* "2" — top arc + diagonal stroke + base */}
      <path d="M10 14.5a2 2 0 1 1 4 0c0 1-4 2.5-4 4.5h4" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** REDESIGNED — Ribbon + circle + numeral "3" drawn as paths. No <text>. */
export function BronzeMedalIcon(props: IconProps) {
  const c = props.color ?? "#B45309";
  const size = props.size ?? "1em";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={props.className}
      style={props.style}
      aria-label={props["aria-label"]}
      aria-hidden={props["aria-label"] ? undefined : "true"}
      role={props["aria-label"] ? "img" : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 2l-4 6 4 2 2-4z" fill={c} opacity={0.75} />
      <path d="M16 2l4 6-4 2-2-4z" fill={c} opacity={0.9} />
      <circle cx="12" cy="16" r="6" fill={c} fillOpacity={0.15} stroke={c} strokeWidth={1.5} />
      {/* "3" — two right-facing arcs stacked */}
      <path d="M10 14a2 2 0 1 1 2 2.5M10 19a2 2 0 1 0 2-2.5" stroke={c} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ─── Belt Rank Dots ──────────────────────────────────────────────────────────

interface BeltDotProps {
  color: string;
  size?: number | string;
  border?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** KEPT AS-IS — inline belt rank dot, used in chat/rank lists. */
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
      <circle cx="6" cy="6" r="1.5" fill="white" opacity={0.15} />
    </svg>
  );
}

// ─── BJJ position icons (Games page — out of scope, kept as-is) ───────────────

/** Standing position — GamesPage only, untouched. */
export function StandingIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 7.5v7" />
      <path d="M8 10.5l4-1 4 1" />
      <path d="M12 14.5l-2.5 5M12 14.5l2.5 5" />
    </>,
    "0 0 24 24"
  );
}

/** Guard/shield position — GamesPage only, untouched. */
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

/** Sweep/rotate — GamesPage only, untouched. */
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

/** Lightning bolt / takedown energy — GamesPage only, untouched. */
export function BoltIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M13 2L4.5 13.5H11L10 22 19.5 10H13L13 2z" fill={props.color ?? "currentColor"} stroke="none" />
    </>,
    "0 0 24 24"
  );
}

/** Skull/submission — GamesPage only, untouched. */
export function SubmissionIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M8 19v-3a4 4 0 0 1 8 0v3" />
      <path d="M6 13a6 6 0 1 1 12 0v1H6v-1z" />
      <circle cx="9.5" cy="11" r="1.5" fill={props.color ?? "currentColor"} stroke="none" opacity={0.7} />
      <circle cx="14.5" cy="11" r="1.5" fill={props.color ?? "currentColor"} stroke="none" opacity={0.7} />
      <path d="M9 19h1.5v2H9zM13.5 19H15v2h-1.5z" fill={props.color ?? "currentColor"} stroke="none" opacity={0.5} />
    </>,
    "0 0 24 24"
  );
}

// WarningIcon  — REMOVED → use lucide-react <AlertTriangle />
// StarIcon     — REMOVED → use lucide-react <Star />
// SwordsIcon   — REMOVED → use lucide-react <Swords />
// SwordIcon    — REMOVED → use lucide-react <Sword />
// SunIcon      — REMOVED → use lucide-react <Sun />
// MoonIcon     — REMOVED → use lucide-react <Moon />
// AchievedIcon — REMOVED → use lucide-react <CheckCircle2 />
// ChevronDownIcon  — REMOVED → use lucide-react <ChevronDown />
// ChevronRightIcon — REMOVED → use lucide-react <ChevronRight />

/** Struggle / Half guard — GamesPage only, untouched. */
export function GrapplingIcon(props: IconProps) {
  return base(
    props,
    <>
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

/** Scorpion / S-mount — GamesPage only, untouched. */
export function ScorpionIcon(props: IconProps) {
  return base(
    props,
    <>
      <ellipse cx="12" cy="12" rx="4" ry="6" />
      <path d="M8 9l-4-2 2 3" />
      <path d="M16 9l4-2-2 3" />
      <path d="M12 18c0 0 3 1 4 4-1 0-2-1-4-1s-3 1-4 1c1-3 4-4 4-4z" />
    </>,
    "0 0 24 24"
  );
}

/** Heel hook — GamesPage only, untouched. */
export function HeelHookIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M8 4C8 4 5 7 5 12c0 3 1 5 2 6h8c1-1 2-3 2-6V8c0-2-1-3-2-3" />
      <path d="M8 18c1 1 6 1 7 0" />
      <path d="M9 4c0-1.5 2-2 3-1" />
      <path d="M16 9c2 1 2 3 0 4" strokeWidth={1.5} />
    </>,
    "0 0 24 24"
  );
}

/** Fist / punch power — GamesPage only, untouched. */
export function FistIcon(props: IconProps) {
  return base(
    props,
    <>
      <rect x="6" y="9" width="12" height="9" rx="3" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      <path d="M6 13h12" opacity={0.3} />
    </>,
    "0 0 24 24"
  );
}

/** Escape — GamesPage only, untouched. */
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

/** Pass — GamesPage only, untouched. */
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

/** High mount — GamesPage only, untouched. */
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

/** Triangle submission — GamesPage only, untouched. */
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

/** Exhaustion — GamesPage only, untouched. */
export function ExhaustionIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l2 2-2 2M11 9l-2 2 2 2" strokeWidth={1.5} />
      <path d="M13 9l2 2-2 2M15 9l-2 2 2 2" strokeWidth={1.5} />
      <path d="M8 16c1-1 2-1 4 0s3 1 4 0" strokeWidth={1.5} />
    </>,
    "0 0 24 24"
  );
}

/** Berimbolo — GamesPage only, untouched. */
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

/** Eagle — GamesPage only, untouched. */
export function EagleIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M2 10c0 0 4-4 8-4s8 4 8 4" />
      <path d="M4 12l8-2 8 2" />
      <path d="M12 6v10" />
      <path d="M9 16l3 4 3-4" />
      <circle cx="12" cy="5" r="1.5" fill={props.color ?? "currentColor"} stroke="none" />
    </>,
    "0 0 24 24"
  );
}

/** Sprawl — GamesPage only, untouched. */
export function SprawlIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M5 12h14" strokeWidth={2.5} />
      <path d="M8 12l-2-4M8 12l-3 4" />
      <path d="M16 12l2-4M16 12l3 4" />
      <circle cx="19" cy="12" r="1.5" />
      <path d="M5 12C3 13 2 15 3 17" strokeWidth={1} />
    </>,
    "0 0 24 24"
  );
}

/** Chess pawn — GamesPage only, untouched. */
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

// ─── Kept BJJ-specific custom icons ──────────────────────────────────────────

/** REDESIGNED — Clock with ticks + hands pointing near midnight. 5 elements. */
export function ClockCountdownIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3.5v1.5M12 19v1.5M3.5 12H5M19 12h1.5" strokeWidth={1.5} />
      <path d="M12 12L8.5 8" />
      <path d="M12 12V7" />
      <circle cx="12" cy="12" r="1" fill={props.color ?? "currentColor"} stroke="none" />
    </>,
    "0 0 24 24"
  );
}

/** REDESIGNED — Classic shield outline + 6-point snowflake. 4 elements. */
export function ShieldFreezeIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M12 2l8 4v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V6l8-4z" />
      <path d="M12 8v8M8.27 10l7.46 4M15.73 10l-7.46 4" />
      <path d="M10.5 9.2L12 8l1.5 1.2M10.5 14.8L12 16l1.5-1.2" strokeWidth={1} opacity={0.8} />
      <path d="M9 11.5l-1 .5 1 .5M15 11.5l1 .5-1 .5" strokeWidth={1} opacity={0.8} />
    </>,
    "0 0 24 24"
  );
}

/** REDESIGNED — BJJ kimono: body + crossing V-lapels + belt. 4 elements. */
export function GiIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M4 21V8l4-5h8l4 5v13z" />
      <path d="M8 3l4 7 4-7" />
      <path d="M12 10v11" />
      <path d="M4 14h16" strokeWidth={2} />
    </>,
    "0 0 24 24"
  );
}
