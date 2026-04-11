// Labyrinth BJJ Chat System — Data Layer
// Channel definitions, sample messages, belt hierarchy, and helpers

export const BELT_HIERARCHY = ["white", "blue", "purple", "brown", "black"];

// Gamified rank system — like a video game prestige system
export interface RankProfile {
  title: string;
  color: string;
  glow: string;
  badge: string; // emoji
  tier: number; // 0-4
  borderColor: string;
}

export const RANK_PROFILES: Record<string, RankProfile> = {
  // Adult ranks
  white: {
    title: "Beginner",
    color: "#EEEEEE",
    glow: "none",
    badge: "",
    tier: 0,
    borderColor: "#333",
  },
  blue: {
    title: "Warrior",
    color: "#1A5DAB",
    glow: "0 0 8px rgba(26,93,171,0.4)",
    badge: "\u2694\uFE0F",
    tier: 1,
    borderColor: "#1A5DAB",
  },
  purple: {
    title: "Elite",
    color: "#6A1B9A",
    glow: "0 0 12px rgba(106,27,154,0.5)",
    badge: "\u26A1",
    tier: 2,
    borderColor: "#6A1B9A",
  },
  brown: {
    title: "Master",
    color: "#6D4C2A",
    glow: "0 0 14px rgba(109,76,42,0.5)",
    badge: "\uD83D\uDD25",
    tier: 3,
    borderColor: "#C8A24C",
  },
  black: {
    title: "Grandmaster",
    color: "#C8A24C",
    glow: "0 0 20px rgba(200,162,76,0.6)",
    badge: "\uD83D\uDC51",
    tier: 4,
    borderColor: "#C8A24C",
  },
  // Kids ranks — same prestige system
  grey: {
    title: "Initiate",
    color: "#6B6B6B",
    glow: "0 0 6px rgba(107,107,107,0.3)",
    badge: "\uD83D\uDEE1\uFE0F",
    tier: 1,
    borderColor: "#6B6B6B",
  },
  gray: {
    title: "Initiate",
    color: "#6B6B6B",
    glow: "0 0 6px rgba(107,107,107,0.3)",
    badge: "\uD83D\uDEE1\uFE0F",
    tier: 1,
    borderColor: "#6B6B6B",
  },
  yellow: {
    title: "Striker",
    color: "#C49B1A",
    glow: "0 0 10px rgba(196,155,26,0.4)",
    badge: "\u2B50",
    tier: 2,
    borderColor: "#C49B1A",
  },
  orange: {
    title: "Challenger",
    color: "#C4641A",
    glow: "0 0 12px rgba(196,100,26,0.5)",
    badge: "\uD83D\uDD25",
    tier: 3,
    borderColor: "#C4641A",
  },
  green: {
    title: "Champion",
    color: "#2D8040",
    glow: "0 0 14px rgba(45,128,64,0.5)",
    badge: "\uD83C\uDFC6",
    tier: 4,
    borderColor: "#2D8040",
  },
};

export function getRankProfile(belt: string): RankProfile {
  return RANK_PROFILES[(belt || "white").toLowerCase().trim()] || RANK_PROFILES.white;
}

export interface Channel {
  id: string;
  name: string;
  group: "main" | "rank" | "kids-rank";
  type: "general" | "coaches" | "announcements" | "kids" | "rank" | "kids-rank";
  description: string;
  /** For rank channels, the minimum belt required */
  requiredBelt?: string;
  /** For kids rank channels, the belt family */
  kidsBeltFamily?: string;
  /** For main channels, who can access */
  accessType?: "all" | "coaches" | "kids" | "adult";
  /** Whether the channel is read-only for non-coaches */
  readOnly?: boolean;
  memberCount: number;
}

export interface Message {
  id: string;
  channelId: string;
  senderName: string;
  senderBelt: string;
  senderRole?: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

/**
 * Returns the index of a belt in the hierarchy.
 * -1 if not found.
 */
export function getBeltIndex(belt: string): number {
  return BELT_HIERARCHY.indexOf((belt || "white").toLowerCase().trim());
}

/**
 * Determines if a user with `userBelt` can access a channel requiring `channelBelt`.
 * Higher ranks can see all lower rank channels.
 */
export function canAccessChannel(userBelt: string, channelBelt: string): boolean {
  const userIdx = getBeltIndex(userBelt);
  const channelIdx = getBeltIndex(channelBelt);
  if (userIdx === -1 || channelIdx === -1) return false;
  return userIdx >= channelIdx;
}

/**
 * Returns which channels a user can access based on belt, type, and role.
 */
export function getAccessibleChannels(
  userBelt: string,
  userType: string,
  isCoach: boolean,
  isOwner: boolean = false,
  isModerator: boolean = false
): { channel: Channel; accessible: boolean; canPost: boolean }[] {
  return CHANNELS.map((channel) => {
    let accessible = true;
    let canPost = true;

    if (channel.type === "rank") {
      // Adult rank channels — only adults (and owner/mods) can see
      accessible = (userType === "Adult" || isOwner || isModerator) && canAccessChannel(userBelt, channel.requiredBelt || "white");
    } else if (channel.type === "kids-rank") {
      // Kids rank channels — only kids/parents can see, NOT adult members
      // Owner and moderators can see all
      accessible = isOwner || isModerator || userType === "Kid" || userType === "Parent";
    } else if (channel.type === "coaches") {
      accessible = isCoach || isOwner;
    } else if (channel.type === "kids") {
      accessible = userType === "Kid" || userType === "Parent" || isCoach || isOwner || isModerator;
    } else if (channel.accessType === "adult") {
      accessible = userType === "Adult" || isCoach || isOwner;
    }

    // Announcements: read-only for non-coaches
    if (channel.readOnly && !isCoach && !isOwner) {
      canPost = false;
    }

    return { channel, accessible, canPost };
  });
}

export const CHANNELS: Channel[] = [
  // Main channels
  {
    id: "adults",
    name: "Adults",
    group: "main",
    type: "general",
    description: "All adult members",
    accessType: "adult",
    memberCount: 87,
  },
  {
    id: "kids-parents",
    name: "Kids & Parents",
    group: "main",
    type: "kids",
    description: "Kids members and their parents",
    accessType: "kids",
    memberCount: 34,
  },
  {
    id: "coaches",
    name: "Coaches",
    group: "main",
    type: "coaches",
    description: "Coaches only",
    accessType: "coaches",
    memberCount: 6,
  },
  {
    id: "announcements",
    name: "Announcements",
    group: "main",
    type: "announcements",
    description: "Academy announcements",
    accessType: "all",
    readOnly: true,
    memberCount: 128,
  },
  // Belt rank channels
  {
    id: "white-belts",
    name: "White Belts",
    group: "rank",
    type: "rank",
    requiredBelt: "white",
    description: "White belts and above",
    memberCount: 128,
  },
  {
    id: "blue-belts",
    name: "Blue Belts",
    group: "rank",
    type: "rank",
    requiredBelt: "blue",
    description: "Blue belts and above",
    memberCount: 64,
  },
  {
    id: "purple-belts",
    name: "Purple Belts",
    group: "rank",
    type: "rank",
    requiredBelt: "purple",
    description: "Purple belts and above",
    memberCount: 28,
  },
  {
    id: "brown-belts",
    name: "Brown Belts",
    group: "rank",
    type: "rank",
    requiredBelt: "brown",
    description: "Brown belts and above",
    memberCount: 12,
  },
  {
    id: "black-belts",
    name: "Black Belts",
    group: "rank",
    type: "rank",
    requiredBelt: "black",
    description: "Black belts only",
    memberCount: 5,
  },
  // Kids rank channels (grouped by belt family)
  {
    id: "kids-white",
    name: "White Belts (Kids)",
    group: "kids-rank",
    type: "kids-rank",
    kidsBeltFamily: "white",
    description: "Kids white belts",
    memberCount: 22,
  },
  {
    id: "kids-grey",
    name: "Grey Belts",
    group: "kids-rank",
    type: "kids-rank",
    kidsBeltFamily: "grey",
    description: "Grey belt family (grey/white, grey, grey/black)",
    memberCount: 14,
  },
  {
    id: "kids-yellow",
    name: "Yellow Belts",
    group: "kids-rank",
    type: "kids-rank",
    kidsBeltFamily: "yellow",
    description: "Yellow belt family",
    memberCount: 11,
  },
  {
    id: "kids-orange",
    name: "Orange Belts",
    group: "kids-rank",
    type: "kids-rank",
    kidsBeltFamily: "orange",
    description: "Orange belt family",
    memberCount: 8,
  },
  {
    id: "kids-green",
    name: "Green Belts",
    group: "kids-rank",
    type: "kids-rank",
    kidsBeltFamily: "green",
    description: "Green belt family",
    memberCount: 5,
  },
];

let messageIdCounter = 0;
function makeMsg(
  channelId: string,
  senderName: string,
  senderBelt: string,
  text: string,
  minutesAgo: number,
  isSystem?: boolean
): Message {
  messageIdCounter++;
  return {
    id: `msg-${messageIdCounter}`,
    channelId,
    senderName,
    senderBelt,
    text,
    timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
    isSystem,
  };
}

/**
 * Generates sample messages for all channels so the chat isn't empty.
 */
export function generateSampleMessages(): Record<string, Message[]> {
  messageIdCounter = 0;
  return {
    adults: [
      makeMsg("adults", "Mike R.", "blue", "Who's coming to open mat Sunday?", 120),
      makeMsg("adults", "Sarah K.", "purple", "I'll be there 🤙", 95),
      makeMsg("adults", "Jake T.", "white", "Bringing my friend for a trial", 42),
    ],
    "kids-parents": [
      makeMsg("kids-parents", "Lisa M.", "white", "What time does the kids class start on Fridays?", 200),
      makeMsg("kids-parents", "Coach Dan", "black", "4:45 PM for the little ones, 5:15 for ages 7-12", 185),
      makeMsg("kids-parents", "Tom W.", "white", "My son loved yesterday's class!", 60),
    ],
    coaches: [
      makeMsg("coaches", "Coach Dan", "black", "Curriculum update: focusing on guard retention this week", 300),
      makeMsg("coaches", "Coach Alex", "brown", "Noted. I'll prep drills for Tuesday", 270),
    ],
    announcements: [
      makeMsg("announcements", "Labyrinth BJJ", "black", "🏆 Labyrinth ranked #9 nationally! Congrats to all competitors", 1440, true),
      makeMsg("announcements", "Labyrinth BJJ", "black", "Spring schedule update: Saturday comp class now starts at 9 AM", 480, true),
    ],
    "white-belts": [
      makeMsg("white-belts", "Carlos G.", "white", "Any tips for surviving mount?", 180),
      makeMsg("white-belts", "Dave P.", "blue", "Elbows tight, bridge and shrimp!", 155),
      makeMsg("white-belts", "Emma L.", "white", "Just got my first stripe 🎉", 30),
    ],
    "blue-belts": [
      makeMsg("blue-belts", "Ryan S.", "blue", "Working on my half guard game", 240),
      makeMsg("blue-belts", "Mia C.", "purple", "Have you tried the knee shield?", 210),
    ],
    "purple-belts": [
      makeMsg("purple-belts", "Sarah K.", "purple", "Anyone drilling berimbolo transitions?", 500),
      makeMsg("purple-belts", "Coach Alex", "brown", "I can show some setups after class Thursday", 460),
    ],
    "brown-belts": [
      makeMsg("brown-belts", "Coach Alex", "brown", "Working on my competition game plan for Pans", 600),
      makeMsg("brown-belts", "James H.", "brown", "Let's get some rounds in this week", 540),
    ],
    "black-belts": [
      makeMsg("black-belts", "Coach Dan", "black", "Seminar with visiting professor next month — details coming soon", 720),
    ],
    "kids-white": [
      makeMsg("kids-white", "Mason D.", "white", "First class today! So excited", 45),
      makeMsg("kids-white", "Olivia W.", "white", "Welcome Mason! You're gonna love it", 30),
    ],
    "kids-grey": [
      makeMsg("kids-grey", "Sophia R.", "grey", "I got my grey belt today!!! 🎉", 90),
      makeMsg("kids-grey", "Ethan M.", "grey", "Congrats! See you at class tomorrow", 75),
    ],
    "kids-yellow": [
      makeMsg("kids-yellow", "Liam K.", "yellow", "Working on my takedowns for the tournament", 200),
      makeMsg("kids-yellow", "Ava T.", "yellow", "Good luck! You got this 💪", 180),
    ],
    "kids-orange": [
      makeMsg("kids-orange", "Noah P.", "orange", "Coach said we're doing spider guard this week", 300),
    ],
    "kids-green": [
      makeMsg("kids-green", "Isabella C.", "green", "One more stripe to green/black!", 400),
    ],
  };
}

// ────────────────────────────────────────────
// Future GAS API endpoints (add to api.ts):
// action: "chatGetChannels" -> returns accessible channels
// action: "chatGetMessages" -> { channel } -> returns messages
// action: "chatSendMessage" -> { channel, text, senderName, senderBelt } -> sends message
// ────────────────────────────────────────────
