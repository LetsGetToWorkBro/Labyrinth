// Labyrinth BJJ API Service Layer
// All API calls go through a single Google Apps Script endpoint
// The endpoint is dynamic — set per selected location at login

import { getActiveGasUrl, getSavedLocationId, saveLocationId } from "./locations";

// GAS cold-starts take ~22s — timeout must clear that
const GAS_TIMEOUT_MS = 35000;
const GAS_MAX_RETRIES = 2;

// Active GAS endpoint — updates when user selects a location
let _gasEndpoint: string = getActiveGasUrl(getSavedLocationId());

/** Show a brief DOM toast when session expires (can't use React hooks from here) */
function showSessionExpiredToast() {
  const el = document.createElement('div');
  el.textContent = 'Session expired — please log in again';
  el.style.cssText = `
    position:fixed;top:env(safe-area-inset-top,12px);left:50%;transform:translateX(-50%);
    z-index:99999;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;
    background:#1A1A1A;color:#C8A24C;border:1px solid #333;box-shadow:0 4px 20px rgba(0,0,0,0.5);
    animation:slideDown .3s ease-out;
  `;
  const style = document.createElement('style');
  style.textContent = '@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); style.remove(); }, 3500);
}

/** Called when user picks a location on the login screen */
export function setActiveLocation(locationId: string): void {
  saveLocationId(locationId);
  _gasEndpoint = getActiveGasUrl(locationId);
}

export function getActiveLocationId(): string {
  return getSavedLocationId();
}

// CSV endpoints for public data
const SHEET_BASE = "https://docs.google.com/spreadsheets/d/1rUtzsV6l1fHcgYuCjaqCh-oG2XosggrW1el3aqaDOME/gviz/tq?tqx=out:csv";
export const CSV_ENDPOINTS = {
  events: `${SHEET_BASE}&sheet=Events`,
  registrations: `${SHEET_BASE}&sheet=Registrations&headers=0`,
  config: `${SHEET_BASE}&sheet=Config`,
  athletes: `${SHEET_BASE}&sheet=Athletes`,
};

// Token management
let authToken: string | null = null;
let memberData: MemberProfile | null = null;

export function getToken(): string | null { return authToken; }
export function setToken(token: string | null) { authToken = token; }
export function getMemberData(): MemberProfile | null { return memberData; }
export function setMemberData(data: MemberProfile | null) { memberData = data; }
export function clearAuth() { authToken = null; memberData = null; }

// ─── Types ────────────────────────────────────────────────────────

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
  // Admin role fields — set from the Members sheet "Role" column
  role?: string;       // 'owner' | 'admin' | 'coach' | 'instructor' | ''
  isAdmin?: boolean;   // true when role is owner/admin/coach
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

// ─── Admin types ──────────────────────────────────────────────────

export interface AdminMember {
  ID: string;
  Name: string;
  Email: string;
  Phone: string;
  Plan: string;
  Status: string;
  StartDate: string;
  BillingDate: string;
  StripeCustomerID: string;
  StripeSubscriptionID: string;
  Notes: string;
  Belt: string;
  Type: string;
  Role: string;
  _row?: number;
}

export interface AdminDashboard {
  activeMembers: number;
  totalMembers: number;
  mrr: number;
  monthlyPaid: number;
  monthlyScheduled: number;
  failedPayments: number;
  newMembers: number;
  upcomingTrials: number;
  overduePayments: Array<{ name: string; amount: number; date: string; description: string }>;
  recentPayments: Array<{ name: string; amount: number; status: string; date: string; type: string }>;
  recentBookings: Array<{ name: string; classType: string; date: string; status: string; email?: string; phone?: string }>;
}

export interface MemberComm {
  date: string;
  type: string;
  subject: string;
  message: string;
  recipientName?: string;
}

// ─── GAS call helper (with cold-start retry) ─────────────────────

export async function gasCall(action: string, payload: Record<string, any> = {}, retryCount = 0): Promise<any> {
  const fullPayload = { action, ...payload };
  const jsonPayload = JSON.stringify(fullPayload);

  // Use POST for large payloads (signatures, signed docs) — GET has ~8KB URL limit
  // A canvas signature PNG in base64 is typically 20-100KB, way over the limit
  const isLarge = jsonPayload.length > 4000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GAS_TIMEOUT_MS);

  try {
    let response: Response;
    if (isLarge) {
      // POST as text/plain — GAS reads via e.postData.contents
      response = await fetch(_gasEndpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: jsonPayload,
        redirect: "follow",
        signal: controller.signal,
      });
    } else {
      const url = `${_gasEndpoint}?action=${encodeURIComponent(action)}&payload=${encodeURIComponent(jsonPayload)}`;
      response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }

    clearTimeout(timer);
    const text = await response.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      console.error(`gasCall ${action} non-JSON:`, text.substring(0, 200));
      throw new Error("Invalid response from server");
    }

    // Session expiry detection — clear auth and redirect to login
    if (result && (result.code === 401 || (result.error && typeof result.error === 'string' && result.error.includes('Session expired')))) {
      localStorage.removeItem('lbjj_session_token');
      localStorage.removeItem('lbjj_member_profile');
      // Show a brief toast before redirecting
      showSessionExpiredToast();
      window.location.hash = '#/login';
      throw new Error('Session expired');
    }

    return result;
  } catch (err: any) {
    clearTimeout(timer);
    const isTimeout = err.name === "AbortError" || err.name === "TimeoutError";
    const isNetwork = err.name === "TypeError";
    if ((isTimeout || isNetwork) && retryCount < GAS_MAX_RETRIES) {
      console.warn(`gasCall ${action} retry ${retryCount + 1}/${GAS_MAX_RETRIES}`);
      return gasCall(action, payload, retryCount + 1);
    }
    console.error(`gasCall ${action} failed:`, err);
    throw err;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────

/** Derive isAdmin from the role field returned by GAS */
function normalizeAdminRole(profile: any): MemberProfile {
  const role = (profile?.role || "").toLowerCase();
  const isAdmin = role === "owner" || role === "admin" || role === "coach" || role === "instructor";
  return { ...profile, role: profile?.role || "", isAdmin };
}

export async function memberLogin(email: string, password: string): Promise<LoginResponse> {
  const result = await gasCall("memberLogin", { email, password });
  if (result.success && result.token) {
    setToken(result.token);
    const normalized = normalizeAdminRole(result.member);
    setMemberData(normalized);
    return { ...result, member: normalized };
  }
  return result;
}

export async function memberCompleteSetup(token: string, email: string, password: string): Promise<any> {
  return gasCall("memberCompleteSetup", { token, email, password });
}

export async function memberGetProfile(): Promise<MemberProfile> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) throw new Error("Not authenticated");
  const result = await gasCall("memberGetProfile", { token });
  const raw = result.member ?? (result.success !== false ? result : null);
  if (raw) {
    const profile = normalizeAdminRole(raw);
    setMemberData(profile);
    return profile;
  }
  throw new Error(result.error || "Failed to fetch profile");
}

export async function memberSwitchProfile(targetRow: number): Promise<MemberProfile> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) throw new Error("Not authenticated");
  const result = await gasCall("memberSwitchProfile", { token, targetRow });
  const raw = result.member ?? (result.success !== false ? result : null);
  if (raw && result.success !== false) {
    const profile = normalizeAdminRole(raw);
    setMemberData(profile);
    return profile;
  }
  throw new Error(result.error || "Failed to switch profile");
}

export async function memberUpdateProfile(phone: string): Promise<any> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) throw new Error("Not authenticated");
  return gasCall("memberUpdateProfile", { token, phone });
}

export async function memberCreateSetupLink(): Promise<{ url: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) throw new Error("Not authenticated");
  return gasCall("memberCreateSetupLink", { token });
}

export async function memberSaveWaiver(signerName: string, signatureData: string, participantType: string): Promise<any> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) throw new Error("Not authenticated");
  return gasCall("memberSaveWaiver", { token, signerName, signatureData, documentType: 'waiver', participantType });
}

export async function memberSaveAgreement(signerName: string, signatureData: string, planName?: string): Promise<any> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) throw new Error("Not authenticated");
  return gasCall("memberSaveAgreement", { token, signerName, signatureData, planName: planName || "" });
}

// ─── Check-in History ────────────────────────────────────────────

export async function getMemberCheckIns(): Promise<any[]> {
  const token = getToken() || '';
  const member = getMemberData();
  const email = member?.email || localStorage.getItem('lbjj_member_email') || '';
  try {
    const result = await gasCall('getMemberCheckIns', { token, email });
    return result?.checkIns || result?.bookings || [];
  } catch { return []; }
}

// ─── Sauna ────────────────────────────────────────────────────────

export async function getSaunaMembers(): Promise<SaunaMember[]> {
  const result = await gasCall("members");
  return result.members || [];
}

export async function getSaunaStatus(): Promise<SaunaStatus> {
  return gasCall("status");
}

export async function saunaCheckin(name: string): Promise<any> {
  return gasCall("checkin", { action: "checkin", name });
}

export async function saunaCheckout(name: string): Promise<any> {
  return gasCall("checkout", { action: "checkout", name });
}

// ─── Booking ──────────────────────────────────────────────────────

export async function bookTrialClass(data: {
  name: string; email: string; phone: string;
  className: string; classDay: string; classTime: string; classDate: string;
}): Promise<any> {
  const encodedPayload = encodeURIComponent(JSON.stringify(data));
  const url = `${_gasEndpoint}?payload=${encodedPayload}`;
  const response = await fetch(url, { method: "GET", redirect: "follow" });
  return response.json();
}

// ─── CSV helpers ──────────────────────────────────────────────────

export async function fetchCSV(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CSV fetch failed: ${response.status}`);
  return response.text();
}

export function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h.trim().replace(/^"|"$/g, "")] = (values[idx] || "").trim().replace(/^"|"$/g, "");
    });
    return obj;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current); current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ─── Live Chat ────────────────────────────────────────────────────

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
  accessible: boolean;
  canPost: boolean;
  lastMessage: string;
  lastTimestamp: string;
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
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
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

// ─── Belt Journey ─────────────────────────────────────────────────

export interface BeltPromotion {
  id: string;
  memberEmail: string;
  memberName: string;
  belt: string;
  stripes: number;
  date: string;
  note: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedDate?: string;
}

export async function beltSavePromotion(data: { belt: string; stripes: number; date: string; note: string }): Promise<{ success: boolean; promotionId?: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    return await gasCall("beltSavePromotion", { ...data, token });
  } catch (err) {
    console.error("beltSavePromotion failed:", err);
    return { success: false };
  }
}

export async function beltGetPromotions(): Promise<BeltPromotion[]> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
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
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    return await gasCall("beltApprovePromotion", { promotionId, approved, token });
  } catch (err) {
    console.error("beltApprovePromotion failed:", err);
    return { success: false };
  }
}

// ─── Admin endpoints ──────────────────────────────────────────────
// These call the same GAS backend as admin.labyrinth.vision.
// The token is the member session token; GAS validates role server-side.

export async function adminGetDashboard(): Promise<AdminDashboard | null> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return null;
  try {
    const result = await gasCall("getDashboard", { token });
    return result;
  } catch (err) {
    console.error("adminGetDashboard failed:", err);
    return null;
  }
}

export async function adminGetMembers(): Promise<AdminMember[]> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return [];
  try {
    const result = await gasCall("getMembers", { token });
    return result.members || [];
  } catch (err) {
    console.error("adminGetMembers failed:", err);
    return [];
  }
}

export async function adminUpdateMember(data: Partial<AdminMember> & { ID: string }): Promise<{ success: boolean; error?: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    return await gasCall("updateMember", { ...data, token });
  } catch (err) {
    console.error("adminUpdateMember failed:", err);
    return { success: false };
  }
}

export async function adminGetMemberComms(memberName: string, memberEmail: string): Promise<MemberComm[]> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return [];
  try {
    const result = await gasCall("getMemberComms", { memberName, memberEmail, memberPhone: "", token });
    return result.comms || [];
  } catch (err) {
    console.error("adminGetMemberComms failed:", err);
    return [];
  }
}

export async function adminSaveNote(memberName: string, memberEmail: string, note: string): Promise<{ success: boolean }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    return await gasCall("saveNote", { memberName, memberEmail, note, token });
  } catch (err) {
    console.error("adminSaveNote failed:", err);
    return { success: false };
  }
}

export async function adminGetBookings(): Promise<any[]> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return [];
  try {
    const result = await gasCall("getTrialBookings", { token });
    return result.bookings || [];
  } catch (err) {
    console.error("adminGetBookings failed:", err);
    return [];
  }
}

// ─── Card Management ────────────────────────────────────────────

export interface PaymentCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export async function memberGetCards(): Promise<PaymentCard[]> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return [];
  try {
    const result = await gasCall("memberGetFamilyCards", { token });
    return result.cards || [];
  } catch (err) {
    console.error("memberGetCards failed:", err);
    return [];
  }
}

export async function memberSetDefaultCard(paymentMethodId: string): Promise<{ success: boolean; error?: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    return await gasCall("memberSetDefaultCard", { token, paymentMethodId });
  } catch (err) {
    console.error("memberSetDefaultCard failed:", err);
    return { success: false };
  }
}

export async function memberRemoveCard(paymentMethodId: string): Promise<{ success: boolean; error?: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    return await gasCall("memberRemoveCard", { token, paymentMethodId });
  } catch (err) {
    console.error("memberRemoveCard failed:", err);
    return { success: false };
  }
}

export async function memberAddCard(): Promise<{ success: boolean; url?: string; error?: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    const result = await gasCall("memberAddCard", {
      token,
      successUrl: window.location.origin + window.location.pathname + "?cardAdded=1",
      cancelUrl:  window.location.origin + window.location.pathname,
    });
    return { success: !!result?.checkoutUrl, url: result?.checkoutUrl };
  } catch (err) {
    console.error("memberAddCard failed:", err);
    return { success: false };
  }
}

// ─── Messaging (admin only) ────────────────────────────────────────────────

export type MessageTarget = "all" | "active" | "trials" | "failed";

export async function adminSendEmail(
  subject: string,
  htmlBody: string,
  target: MessageTarget,
  scheduledFor?: string // ISO string — GAS needs a scheduleBlast action for deferred sending
): Promise<{ success: boolean; sentCount?: number; errors?: string[]; error?: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    return await gasCall("sendMassEmail", { subject, htmlBody, target, token, ...(scheduledFor ? { scheduledFor } : {}) });
  } catch (err) {
    console.error("adminSendEmail failed:", err);
    return { success: false, error: "Connection error" };
  }
}

export async function adminSendSMS(
  message: string,
  target: MessageTarget,
  scheduledFor?: string // ISO string — GAS needs a scheduleBlast action for deferred sending
): Promise<{ success: boolean; sentCount?: number; errors?: string[]; error?: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    return await gasCall("sendMassSMS", { message, target, token, ...(scheduledFor ? { scheduledFor } : {}) });
  } catch (err) {
    console.error("adminSendSMS failed:", err);
    return { success: false, error: "Connection error" };
  }
}

// ─── Game Leaderboard ─────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  name: string;
  wins: number;
  losses: number;
  winRate: number;
  bestStreak: number;
  topRank: string;
  isMe?: boolean;
  belt?: string;
  classCount?: number;
  score?: number;
}

export async function saveGameScore(data: {
  wins: number; losses: number; streak: number;
  bestStreak: number; topRankName: string;
}): Promise<{ success: boolean }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    return await gasCall("saveGameScore", { ...data, token });
  } catch (err) {
    console.error("saveGameScore failed:", err);
    return { success: false };
  }
}

// ─── Schedule Classes ────────────────────────────────────────────

export async function getScheduleClasses(): Promise<any[]> {
  try {
    const result = await gasCall('getScheduleClasses', {});
    if (result?.success && Array.isArray(result.classes)) {
      return result.classes;
    }
    return [];
  } catch {
    return [];
  }
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const result = await gasCall("getLeaderboard", { type: 'weekly' });
    // Handle both leaderboard.gs format and legacy format
    const entries = result?.leaderboard || result?.scores || result?.entries || [];
    return entries;
  } catch (err) {
    console.error("getLeaderboard failed:", err);
    return [];
  }
}
