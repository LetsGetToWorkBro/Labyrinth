// Belt color mapping
export const BELT_COLORS: Record<string, string> = {
  white: "#F0F0F0",
  blue: "#3B6FD8",
  purple: "#8B4FBF",
  brown: "#8B5E3C",
  black: "#555555",
  grey: "#888888",
  gray: "#888888",
  yellow: "#D4A843",
  orange: "#D4783C",
  green: "#3CAF50",
};

export const BELT_TEXT_COLORS: Record<string, string> = {
  white: "#0A0A0A",
  blue: "#FFFFFF",
  purple: "#FFFFFF",
  brown: "#FFFFFF",
  black: "#CCCCCC",
  grey: "#FFFFFF",
  gray: "#FFFFFF",
  yellow: "#0A0A0A",
  orange: "#FFFFFF",
  green: "#FFFFFF",
};

// Org colors for tournaments
export const ORG_COLORS: Record<string, string> = {
  JJWL: "#22c55e",
  IBJJF: "#3b82f6",
  ADCC: "#f59e0b",
  AGF: "#6b7280",
  NAGA: "#6b7280",
};

export function getOrgColor(org: string): string {
  const upper = (org || "").toUpperCase().trim();
  return ORG_COLORS[upper] || "#6b7280";
}

export function getBeltColor(belt: string): string {
  return BELT_COLORS[(belt || "white").toLowerCase().trim()] || "#F0F0F0";
}

export function getBeltTextColor(belt: string): string {
  return BELT_TEXT_COLORS[(belt || "white").toLowerCase().trim()] || "#0A0A0A";
}

// Tier styling
export const TIER_COLORS: Record<string, string> = {
  "S-Tier": "#C8A24C",
  "Elite": "#8B4FBF",
  "Advanced": "#3B6FD8",
  "Prospect": "#22c55e",
  "Novice": "#6b7280",
  "Beginner": "#444444",
};

export function getTierColor(tier: string): string {
  return TIER_COLORS[tier] || "#6b7280";
}

// Class schedule data
export interface ClassScheduleItem {
  day: string;
  time: string;
  name: string;
  type: "gi" | "nogi" | "comp" | "open" | "wrestling";
  category: "adult" | "kids";
  instructor?: string;   // GAS field: "instructor" — coach name displayed as "w/ Coach [Name]"
  capacity?: number;     // GAS field: "capacity" — max spots for this class
  enrolled?: number;     // GAS field: "enrolled" — current enrolled count
}

export const CLASS_SCHEDULE: ClassScheduleItem[] = [
  // ── Monday ──────────────────────────────────────────────────
  { day: "Monday", time: "6:30 AM",  name: "Adult BJJ",              type: "gi",       category: "adult", instructor: "Anthony Curry" },
  { day: "Monday", time: "11:00 AM", name: "Adult BJJ",              type: "gi",       category: "adult", instructor: "Anthony Curry" },
  { day: "Monday", time: "4:45 PM",  name: "Kids BJJ (3-6)",         type: "gi",       category: "kids",  instructor: "Anthony Curry" },
  { day: "Monday", time: "5:15 PM",  name: "Kids BJJ (7-12)",        type: "gi",       category: "kids",  instructor: "Anthony Curry" },
  { day: "Monday", time: "6:30 PM",  name: "Adult BJJ",              type: "gi",       category: "adult", instructor: "Anthony Curry" },

  // ── Tuesday ─────────────────────────────────────────────────
  { day: "Tuesday", time: "6:30 AM",  name: "Adult BJJ",               type: "nogi",     category: "adult", instructor: "Anthony Curry"  },
  { day: "Tuesday", time: "5:15 PM",  name: "Kids Grappling (7-12)",   type: "nogi",     category: "kids",  instructor: "Anthony Curry"  },
  { day: "Tuesday", time: "5:15 PM",  name: "Teens Grappling (12-15)", type: "nogi",     category: "kids",  instructor: "Anthony Curry"  },
  { day: "Tuesday", time: "6:30 PM",  name: "Adult BJJ",               type: "nogi",     category: "adult", instructor: "Anthony Curry"  },

  // ── Wednesday ───────────────────────────────────────────────
  { day: "Wednesday", time: "11:00 AM", name: "Adult BJJ",               type: "nogi",     category: "adult", instructor: "Anthony Curry" },
  { day: "Wednesday", time: "4:45 PM",  name: "Kids BJJ (3-6)",          type: "gi",       category: "kids",  instructor: "Anthony Curry" },
  { day: "Wednesday", time: "5:15 PM",  name: "Kids BJJ (7-12)",         type: "gi",       category: "kids",  instructor: "Anthony Curry" },
  { day: "Wednesday", time: "6:30 PM",  name: "Adult BJJ",               type: "gi",       category: "adult", instructor: "Anthony Curry" },
  { day: "Wednesday", time: "7:30 PM",  name: "Wrestling (7-17)",        type: "wrestling", category: "kids",  instructor: "Malik Pickett" },

  // ── Thursday ────────────────────────────────────────────────
  { day: "Thursday", time: "6:30 AM",  name: "Adult BJJ",               type: "nogi",     category: "adult", instructor: "Christian Solano" },
  { day: "Thursday", time: "5:15 PM",  name: "Kids Grappling (7-12)",   type: "nogi",     category: "kids",  instructor: "Anthony Curry"    },
  { day: "Thursday", time: "5:15 PM",  name: "Teens Grappling (12-15)", type: "nogi",     category: "kids",  instructor: "Anthony Curry"    },
  { day: "Thursday", time: "6:30 PM",  name: "Adult BJJ",               type: "nogi",     category: "adult", instructor: "Anthony Curry"    },
  { day: "Thursday", time: "7:30 PM",  name: "Wrestling (7-17)",        type: "wrestling", category: "kids",  instructor: "Malik Pickett"    },

  // ── Friday ──────────────────────────────────────────────────
  { day: "Friday", time: "6:30 AM",  name: "Adult BJJ",               type: "gi",   category: "adult", instructor: "Jake Maronge"    },
  { day: "Friday", time: "11:00 AM", name: "Adult BJJ",               type: "gi",   category: "adult", instructor: "Anthony Curry"   },
  { day: "Friday", time: "4:45 PM",  name: "Kids BJJ (3-6)",          type: "gi",   category: "kids",  instructor: "Anthony Curry"   },
  { day: "Friday", time: "5:15 PM",  name: "Kids BJJ Comp (7-12)",    type: "comp", category: "kids",  instructor: "Anthony Curry"   },
  { day: "Friday", time: "5:15 PM",  name: "Teens BJJ Comp (12-15)",  type: "comp", category: "kids",  instructor: "Anthony Curry"   },
  { day: "Friday", time: "6:30 PM",  name: "Adult Comp",              type: "comp", category: "adult", instructor: "Anthony Curry"   },

  // ── Saturday ────────────────────────────────────────────────
  { day: "Saturday", time: "9:00 AM",  name: "Adult Comp",              type: "comp", category: "adult", instructor: "Anthony Curry" },
  { day: "Saturday", time: "10:00 AM", name: "Kids Grappling (7-12)",   type: "nogi", category: "kids",  instructor: "Anthony Curry" },
  { day: "Saturday", time: "11:00 AM", name: "Adult & Teens",           type: "nogi", category: "adult", instructor: "Anthony Curry" },
  { day: "Saturday", time: "12:00 PM", name: "Kids Grappling (7-12)",   type: "nogi", category: "kids",  instructor: "Anthony Curry" },
  { day: "Saturday", time: "12:00 PM", name: "Teens Grappling (12-15)", type: "nogi", category: "kids",  instructor: "Anthony Curry" },

  // ── Sunday ──────────────────────────────────────────────────
  { day: "Sunday", time: "10:30 AM", name: "Open Mat",          type: "open",      category: "adult", instructor: "Anthony Curry" },
  { day: "Sunday", time: "12:00 PM", name: "Pans Prep",         type: "comp",      category: "kids",  instructor: "Anthony Curry" },
  { day: "Sunday", time: "1:00 PM",  name: "Wrestling (7-17)",  type: "wrestling", category: "kids",  instructor: "Malik Pickett" },
];

export const CLASS_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  gi:        { bg: "rgba(59, 111, 216, 0.15)", text: "#5B8FE8",  label: "Gi"        },
  nogi:      { bg: "rgba(34, 197, 94, 0.15)",  text: "#4ADE80",  label: "No-Gi"     },
  comp:      { bg: "rgba(200, 162, 76, 0.15)", text: "#C8A24C",  label: "Comp"      },
  open:      { bg: "rgba(200, 162, 76, 0.08)", text: "#999999",  label: "Open Mat"  },
  wrestling: { bg: "rgba(234, 130, 50, 0.15)", text: "#EA8232",  label: "Wrestling" },
};

export const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
