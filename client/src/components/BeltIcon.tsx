// Belt SVG icon component — maps belt name + stripes to the accurate belt graphic
// Anatomy: body → rank bar (with stripe tapes) → tail → knot loop
// Kids two-tone: horizontal stripe through body and tail, stops at rank bar
//
// Dynamic import map — only the requested belt+stripes SVG is ever fetched.

import { useState, useEffect } from "react";

type SvgLoader = () => Promise<{ default: string }>;

// Each belt key maps to [0s, 1s, 2s, 3s, 4s] loaders.
// Keys mirror the original BELT_VARIANTS exactly.
const BELT_VARIANTS: Record<string, SvgLoader[]> = {
  // Adult
  white: [
    () => import("@assets/adult_white.svg"),
    () => import("@assets/adult_white_1s.svg"),
    () => import("@assets/adult_white_2s.svg"),
    () => import("@assets/adult_white_3s.svg"),
    () => import("@assets/adult_white_4s.svg"),
  ],
  blue: [
    () => import("@assets/adult_blue.svg"),
    () => import("@assets/adult_blue_1s.svg"),
    () => import("@assets/adult_blue_2s.svg"),
    () => import("@assets/adult_blue_3s.svg"),
    () => import("@assets/adult_blue_4s.svg"),
  ],
  purple: [
    () => import("@assets/adult_purple.svg"),
    () => import("@assets/adult_purple_1s.svg"),
    () => import("@assets/adult_purple_2s.svg"),
    () => import("@assets/adult_purple_3s.svg"),
    () => import("@assets/adult_purple_4s.svg"),
  ],
  brown: [
    () => import("@assets/adult_brown.svg"),
    () => import("@assets/adult_brown_1s.svg"),
    () => import("@assets/adult_brown_2s.svg"),
    () => import("@assets/adult_brown_3s.svg"),
    () => import("@assets/adult_brown_4s.svg"),
  ],
  black: [
    () => import("@assets/adult_black.svg"),
    () => import("@assets/adult_black_1s.svg"),
    () => import("@assets/adult_black_2s.svg"),
    () => import("@assets/adult_black_3s.svg"),
    () => import("@assets/adult_black_4s.svg"),
  ],
  red: (() => {
    const l: SvgLoader = () => import("@assets/adult_red.svg");
    return [l, l, l, l, l];
  })(),
  "red/black": (() => {
    const l: SvgLoader = () => import("@assets/adult_red_black.svg");
    return [l, l, l, l, l];
  })(),
  "red-black": (() => {
    const l: SvgLoader = () => import("@assets/adult_red_black.svg");
    return [l, l, l, l, l];
  })(),
  coral: (() => {
    const l: SvgLoader = () => import("@assets/adult_red_black.svg");
    return [l, l, l, l, l];
  })(),
  "red/white": (() => {
    const l: SvgLoader = () => import("@assets/adult_red_white.svg");
    return [l, l, l, l, l];
  })(),
  "red-white": (() => {
    const l: SvgLoader = () => import("@assets/adult_red_white.svg");
    return [l, l, l, l, l];
  })(),
  // Kids solid
  "kids-white": [
    () => import("@assets/kids_white.svg"),
    () => import("@assets/kids_white_1s.svg"),
    () => import("@assets/kids_white_2s.svg"),
    () => import("@assets/kids_white_3s.svg"),
    () => import("@assets/kids_white_4s.svg"),
  ],
  grey: [
    () => import("@assets/kids_grey.svg"),
    () => import("@assets/kids_grey_1s.svg"),
    () => import("@assets/kids_grey_2s.svg"),
    () => import("@assets/kids_grey_3s.svg"),
    () => import("@assets/kids_grey_4s.svg"),
  ],
  gray: [
    () => import("@assets/kids_grey.svg"),
    () => import("@assets/kids_grey_1s.svg"),
    () => import("@assets/kids_grey_2s.svg"),
    () => import("@assets/kids_grey_3s.svg"),
    () => import("@assets/kids_grey_4s.svg"),
  ],
  yellow: [
    () => import("@assets/kids_yellow.svg"),
    () => import("@assets/kids_yellow_1s.svg"),
    () => import("@assets/kids_yellow_2s.svg"),
    () => import("@assets/kids_yellow_3s.svg"),
    () => import("@assets/kids_yellow_4s.svg"),
  ],
  orange: [
    () => import("@assets/kids_orange.svg"),
    () => import("@assets/kids_orange_1s.svg"),
    () => import("@assets/kids_orange_2s.svg"),
    () => import("@assets/kids_orange_3s.svg"),
    () => import("@assets/kids_orange_4s.svg"),
  ],
  green: [
    () => import("@assets/kids_green.svg"),
    () => import("@assets/kids_green_1s.svg"),
    () => import("@assets/kids_green_2s.svg"),
    () => import("@assets/kids_green_3s.svg"),
    () => import("@assets/kids_green_4s.svg"),
  ],
  // Kids two-tone
  "grey/white": [
    () => import("@assets/kids_grey_white.svg"),
    () => import("@assets/kids_grey_white_1s.svg"),
    () => import("@assets/kids_grey_white_2s.svg"),
    () => import("@assets/kids_grey_white_3s.svg"),
    () => import("@assets/kids_grey_white_4s.svg"),
  ],
  "grey-white": [
    () => import("@assets/kids_grey_white.svg"),
    () => import("@assets/kids_grey_white_1s.svg"),
    () => import("@assets/kids_grey_white_2s.svg"),
    () => import("@assets/kids_grey_white_3s.svg"),
    () => import("@assets/kids_grey_white_4s.svg"),
  ],
  "grey/black": [
    () => import("@assets/kids_grey_black.svg"),
    () => import("@assets/kids_grey_black_1s.svg"),
    () => import("@assets/kids_grey_black_2s.svg"),
    () => import("@assets/kids_grey_black_3s.svg"),
    () => import("@assets/kids_grey_black_4s.svg"),
  ],
  "grey-black": [
    () => import("@assets/kids_grey_black.svg"),
    () => import("@assets/kids_grey_black_1s.svg"),
    () => import("@assets/kids_grey_black_2s.svg"),
    () => import("@assets/kids_grey_black_3s.svg"),
    () => import("@assets/kids_grey_black_4s.svg"),
  ],
  "yellow/white": [
    () => import("@assets/kids_yellow_white.svg"),
    () => import("@assets/kids_yellow_white_1s.svg"),
    () => import("@assets/kids_yellow_white_2s.svg"),
    () => import("@assets/kids_yellow_white_3s.svg"),
    () => import("@assets/kids_yellow_white_4s.svg"),
  ],
  "yellow-white": [
    () => import("@assets/kids_yellow_white.svg"),
    () => import("@assets/kids_yellow_white_1s.svg"),
    () => import("@assets/kids_yellow_white_2s.svg"),
    () => import("@assets/kids_yellow_white_3s.svg"),
    () => import("@assets/kids_yellow_white_4s.svg"),
  ],
  "yellow/black": [
    () => import("@assets/kids_yellow_black.svg"),
    () => import("@assets/kids_yellow_black_1s.svg"),
    () => import("@assets/kids_yellow_black_2s.svg"),
    () => import("@assets/kids_yellow_black_3s.svg"),
    () => import("@assets/kids_yellow_black_4s.svg"),
  ],
  "yellow-black": [
    () => import("@assets/kids_yellow_black.svg"),
    () => import("@assets/kids_yellow_black_1s.svg"),
    () => import("@assets/kids_yellow_black_2s.svg"),
    () => import("@assets/kids_yellow_black_3s.svg"),
    () => import("@assets/kids_yellow_black_4s.svg"),
  ],
  "orange/white": [
    () => import("@assets/kids_orange_white.svg"),
    () => import("@assets/kids_orange_white_1s.svg"),
    () => import("@assets/kids_orange_white_2s.svg"),
    () => import("@assets/kids_orange_white_3s.svg"),
    () => import("@assets/kids_orange_white_4s.svg"),
  ],
  "orange-white": [
    () => import("@assets/kids_orange_white.svg"),
    () => import("@assets/kids_orange_white_1s.svg"),
    () => import("@assets/kids_orange_white_2s.svg"),
    () => import("@assets/kids_orange_white_3s.svg"),
    () => import("@assets/kids_orange_white_4s.svg"),
  ],
  "orange/black": [
    () => import("@assets/kids_orange_black.svg"),
    () => import("@assets/kids_orange_black_1s.svg"),
    () => import("@assets/kids_orange_black_2s.svg"),
    () => import("@assets/kids_orange_black_3s.svg"),
    () => import("@assets/kids_orange_black_4s.svg"),
  ],
  "orange-black": [
    () => import("@assets/kids_orange_black.svg"),
    () => import("@assets/kids_orange_black_1s.svg"),
    () => import("@assets/kids_orange_black_2s.svg"),
    () => import("@assets/kids_orange_black_3s.svg"),
    () => import("@assets/kids_orange_black_4s.svg"),
  ],
  "green/white": [
    () => import("@assets/kids_green_white.svg"),
    () => import("@assets/kids_green_white_1s.svg"),
    () => import("@assets/kids_green_white_2s.svg"),
    () => import("@assets/kids_green_white_3s.svg"),
    () => import("@assets/kids_green_white_4s.svg"),
  ],
  "green-white": [
    () => import("@assets/kids_green_white.svg"),
    () => import("@assets/kids_green_white_1s.svg"),
    () => import("@assets/kids_green_white_2s.svg"),
    () => import("@assets/kids_green_white_3s.svg"),
    () => import("@assets/kids_green_white_4s.svg"),
  ],
  "green/black": [
    () => import("@assets/kids_green_black.svg"),
    () => import("@assets/kids_green_black_1s.svg"),
    () => import("@assets/kids_green_black_2s.svg"),
    () => import("@assets/kids_green_black_3s.svg"),
    () => import("@assets/kids_green_black_4s.svg"),
  ],
  "green-black": [
    () => import("@assets/kids_green_black.svg"),
    () => import("@assets/kids_green_black_1s.svg"),
    () => import("@assets/kids_green_black_2s.svg"),
    () => import("@assets/kids_green_black_3s.svg"),
    () => import("@assets/kids_green_black_4s.svg"),
  ],
};

// Simple in-memory cache so repeated renders don't re-import
const srcCache = new Map<string, string>();

interface BeltIconProps {
  belt: string;
  stripes?: number;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function BeltIcon({ belt, stripes = 0, width = 60, height, className, style }: BeltIconProps) {
  const key = (belt || "white").toLowerCase().trim();
  const stripeIdx = Math.max(0, Math.min(4, stripes));
  const cacheKey = `${key}_${stripeIdx}`;
  const h = height || Math.round(width * 0.233);

  const [src, setSrc] = useState<string | null>(srcCache.get(cacheKey) ?? null);

  useEffect(() => {
    const cached = srcCache.get(cacheKey);
    if (cached) {
      setSrc(cached);
      return;
    }

    let cancelled = false;
    const variants = BELT_VARIANTS[key] || BELT_VARIANTS.white;
    const loader = variants[stripeIdx];
    loader()
      .then((m) => {
        srcCache.set(cacheKey, m.default);
        if (!cancelled) setSrc(m.default);
      })
      .catch(() => {
        // Fallback to white belt
        BELT_VARIANTS.white[0]().then((m) => {
          srcCache.set(cacheKey, m.default);
          if (!cancelled) setSrc(m.default);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [key, stripeIdx, cacheKey]);

  if (!src) {
    return (
      <div
        style={{ width, height: h, display: "inline-block", ...style }}
        className={className}
        data-testid={`belt-icon-${key}`}
      />
    );
  }

  return (
    <img
      src={src}
      alt={`${belt} belt${stripes > 0 ? ` ${stripes} stripe${stripes > 1 ? "s" : ""}` : ""}`}
      width={width}
      height={h}
      className={className}
      style={{ display: "inline-block", ...style }}
      data-testid={`belt-icon-${key}`}
    />
  );
}

// All available belt keys for the belt selector
export const ADULT_BELT_OPTIONS = ["white", "blue", "purple", "brown", "black"];
export const KIDS_BELT_OPTIONS = [
  "kids-white",
  "grey/white", "grey", "grey/black",
  "yellow/white", "yellow", "yellow/black",
  "orange/white", "orange", "orange/black",
  "green/white", "green", "green/black",
];

export const BELT_DISPLAY_NAMES: Record<string, string> = {
  white: "White",
  blue: "Blue",
  purple: "Purple",
  brown: "Brown",
  black: "Black",
  "kids-white": "White",
  "grey/white": "Grey / White",
  grey: "Grey",
  "grey/black": "Grey / Black",
  "yellow/white": "Yellow / White",
  yellow: "Yellow",
  "yellow/black": "Yellow / Black",
  "orange/white": "Orange / White",
  orange: "Orange",
  "orange/black": "Orange / Black",
  "green/white": "Green / White",
  green: "Green",
  "green/black": "Green / Black",
};
