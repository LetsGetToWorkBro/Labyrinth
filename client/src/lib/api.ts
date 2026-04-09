// Labyrinth BJJ API Service Layer
// All API calls go through a single Google Apps Script endpoint

const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwkxkV6XlqKy3DDot_MTfb40WeAfd6KMgBwgcrCNStEFM5vcAQNYG9eR2OOFpCwJ3AJ/exec";

// CSV endpoints for public data
const SHEET_BASE = "https://docs.google.com/spreadsheets/d/1rUtzsV6l1fHcgYuCjaqCh-oG2XosggrW1el3aqaDOME/gviz/tq?tqx=out:csv";
export const CSV_ENDPOINTS = {
  events: `${SHEET_BASE}&sheet=Events`,
  registrations: `${SHEET_BASE}&sheet=Registrations&headers=0`,
  config: `${SHEET_BASE}&sheet=Config`,
  athletes: `${SHEET_BASE}&sheet=Athletes`,
};

// Token management using React state (no localStorage in sandbox)
let authToken: string | null = null;
let memberData: MemberProfile | null = null;

export function getToken(): string | null {
  return authToken;
}

export function setToken(token: string | null) {
  authToken = token;
}

export function getMemberData(): MemberProfile | null {
  return memberData;
}

export function setMemberData(data: MemberProfile | null) {
  memberData = data;
}

export function clearAuth() {
  authToken = null;
  memberData = null;
}

export interface FamilyMember {
  name: string;
  belt: string;
  type: string;
  membership: string;
  row: number;
  isPrimary: boolean;
}

export interface MemberProfile {
  name: string;
  email: string;
  phone: string;
  belt: string;
  plan: string;
  membership: string;
  status: string;
  waiverSigned: boolean;
  waiverDate: string;
  agreementSigned: boolean;
  agreementDate: string;
  cardBrand: string;
  cardLast4: string;
  cardExpiration: string;
  joinDate: string;
  type: string;
  row?: number;
  isPrimary?: boolean;
  familyMembers?: FamilyMember[];
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  member?: MemberProfile;
  error?: string;
}

export interface SaunaStatus {
  active: Array<{
    name: string;
    checkIn: string;
    duration: number;
    minutes?: number;
  }>;
  todayCount: number;
}

export interface SaunaMember {
  name: string;
  phone: string;
  email: string;
  membership: string;
  belt: string;
  type: string;
}

export interface TournamentEvent {
  date: string;
  name: string;
  org: string;
  location: string;
  link: string;
  priority: string;
  source: string;
  endDate: string;
}

export interface Registration {
  eventName: string;
  athleteName: string;
  beltRank: string;
  registeredDate: string;
  division: string;
  weightClass: string;
  sourcePlatform: string;
}

export interface Athlete {
  name: string;
  slug: string;
  wins: number;
  losses: number;
  winRate: number;
  rating: number;
  belt: string;
  tier: string;
  golds: number;
  subRate: number;
  profileUrl: string;
  lastUpdated: string;
}

export interface AcademyConfig {
  [key: string]: { value: string; lastUpdated: string };
}

// API call helper - GAS uses GET with encoded payload
async function gasCall(action: string, payload: Record<string, any> = {}): Promise<any> {
  // Build payload WITH action inside (matches how the member portal sends it)
  const fullPayload = { action, ...payload };
  const encodedPayload = encodeURIComponent(JSON.stringify(fullPayload));
  const url = `${GAS_ENDPOINT}?action=${encodeURIComponent(action)}&payload=${encodedPayload}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    // GAS web apps redirect (302) — fetch with redirect:follow handles this
    // But the final response might not have ok=true in all cases
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      // If response isn't JSON, it might be an error page
      console.error("Non-JSON response from GAS:", text.substring(0, 200));
      throw new Error("Invalid response from server");
    }
  } catch (err: any) {
    console.error(`gasCall ${action} failed:`, err);
    throw err;
  }
}

// Auth API calls
export async function memberLogin(email: string, password: string): Promise<LoginResponse> {
  const result = await gasCall("memberLogin", { email, password });
  if (result.success && result.token) {
    setToken(result.token);
    setMemberData(result.member);
  }
  return result;
}

export async function memberCompleteSetup(token: string, email: string, password: string): Promise<any> {
  return gasCall("memberCompleteSetup", { token, email, password });
}

export async function memberGetProfile(): Promise<MemberProfile> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const result = await gasCall("memberGetProfile", { token });
  // GAS returns { success, member: {...} } OR flat fields for legacy deployments
  const profile = result.member ?? (result.success !== false ? result : null);
  if (profile) {
    setMemberData(profile);
    return profile;
  }
  throw new Error(result.error || "Failed to fetch profile");
}

export async function memberSwitchProfile(targetRow: number): Promise<MemberProfile> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const result = await gasCall("memberSwitchProfile", { token, targetRow });
  const profile = result.member ?? (result.success !== false ? result : null);
  if (profile && result.success !== false) {
    setMemberData(profile);
    return profile;
  }
  throw new Error(result.error || "Failed to switch profile");
}

export async function memberUpdateProfile(phone: string): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return gasCall("memberUpdateProfile", { token, phone });
}

export async function memberCreateSetupLink(): Promise<{ url: string }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return gasCall("memberCreateSetupLink", { token });
}

export async function memberSaveWaiver(signerName: string, signatureData: string, participantType: string): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return gasCall("memberSaveWaiver", { token, signerName, signatureData, participantType });
}

// Sauna API calls
export async function getSaunaMembers(): Promise<SaunaMember[]> {
  const result = await gasCall("members");
  return result.members || [];
}

export async function getSaunaStatus(): Promise<SaunaStatus> {
  const result = await gasCall("status");
  return result;
}

export async function saunaCheckin(name: string): Promise<any> {
  return gasCall("checkin", { action: "checkin", name });
}

export async function saunaCheckout(name: string): Promise<any> {
  return gasCall("checkout", { action: "checkout", name });
}

// Booking API
export async function bookTrialClass(data: {
  name: string;
  email: string;
  phone: string;
  className: string;
  classDay: string;
  classTime: string;
  classDate: string;
}): Promise<any> {
  const encodedPayload = encodeURIComponent(JSON.stringify(data));
  const url = `${GAS_ENDPOINT}?payload=${encodedPayload}`;
  const response = await fetch(url, { method: "GET", redirect: "follow" });
  return response.json();
}

// CSV fetch helper
export async function fetchCSV(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CSV fetch failed: ${response.status}`);
  return response.text();
}

// Parse CSV helper with PapaParse
export function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const results: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h.trim().replace(/^"|"$/g, "")] = (values[idx] || "").trim().replace(/^"|"$/g, "");
    });
    results.push(obj);
  }
  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ─── Chat API ───────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  sender: string;
  senderBelt: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: string;
  lastMessage: string;
  lastTimestamp: string;
  canPost: boolean;
}

export async function chatGetMessages(channel: string, limit = 50): Promise<ChatMessage[]> {
  const token = getToken();
  try {
    const result = await gasCall("chatGetMessages", { channel, limit, token: token || "" });
    return result.messages || [];
  } catch (err) {
    console.error("chatGetMessages failed:", err);
    return [];
  }
}

export async function chatSendMessage(channel: string, text: string): Promise<{ success: boolean; messageId?: string }> {
  const token = getToken();
  if (!token) return { success: false };
  try {
    return await gasCall("chatSendMessage", { channel, text, token });
  } catch (err) {
    console.error("chatSendMessage failed:", err);
    return { success: false };
  }
}

export async function chatGetChannels(): Promise<ChatChannel[]> {
  const token = getToken();
  try {
    const result = await gasCall("chatGetChannels", { token: token || "" });
    return result.channels || [];
  } catch (err) {
    console.error("chatGetChannels failed:", err);
    return [];
  }
}

// ─── Belt Journey API ───────────────────────────────────────────────

export interface BeltPromotion {
  id: string;
  memberEmail: string;
  belt: string;
  stripes: number;
  date: string;
  note: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedDate?: string;
}

export async function beltSavePromotion(data: {
  belt: string;
  stripes: number;
  date: string;
  note: string;
}): Promise<{ success: boolean; promotionId?: string }> {
  const token = getToken();
  if (!token) return { success: false };
  try {
    return await gasCall("beltSavePromotion", { ...data, token });
  } catch (err) {
    console.error("beltSavePromotion failed:", err);
    return { success: false };
  }
}

export async function beltGetPromotions(): Promise<BeltPromotion[]> {
  const token = getToken();
  if (!token) return [];
  try {
    const result = await gasCall("beltGetPromotions", { token });
    return result.promotions || [];
  } catch (err) {
    console.error("beltGetPromotions failed:", err);
    return [];
  }
}

export async function beltApprovePromotion(promotionId: string, approved: boolean): Promise<{ success: boolean }> {
  const token = getToken();
  if (!token) return { success: false };
  try {
    return await gasCall("beltApprovePromotion", { promotionId, approved, token });
  } catch (err) {
    console.error("beltApprovePromotion failed:", err);
    return { success: false };
  }
}
