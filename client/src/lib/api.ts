// Labyrinth BJJ API Service Layer
// All API calls go through a single Google Apps Script endpoint
// The endpoint is dynamic — set per selected location at login

import * as Sentry from "@sentry/react";
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
  totalPoints?: number; // XP from GAS TotalPoints column
  currentStreak?: number; // Current training streak in weeks
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
    Sentry.captureException(err, {
      tags: { action, layer: 'gas' },
      extra: { retryCount, payloadKeys: Object.keys(payload || {}) },
    });
    console.error(`gasCall ${action} failed:`, err);
    throw err;
  }
}

// sessionStorage cache for read-only GAS calls
export async function cachedGasCall(
  action: string,
  payload: Record<string, any> = {},
  ttlMs: number = 60_000
): Promise<any> {
  const key = `gas_${action}_${JSON.stringify(payload)}`;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < ttlMs) return data;
    }
  } catch {}
  const result = await gasCall(action, payload);
  try {
    sessionStorage.setItem(key, JSON.stringify({ data: result, ts: Date.now() }));
  } catch {}
  return result;
}

// ─── Auth ─────────────────────────────────────────────────────────

/** Derive isAdmin from the role field returned by GAS */
export function normalizeAdminRole(profile: any): MemberProfile {
  const role = (profile?.role || "").toLowerCase();
  const isAdmin = role === "owner" || role === "admin" || role === "coach" || role === "instructor";

  // Coerce Google Sheets string booleans to real booleans
  // GAS returns "TRUE"/"FALSE" strings from sheet cells
  const coerceBool = (val: any): boolean => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const v = val.trim().toLowerCase();
      return v === 'true' || v === '1' || v === 'yes' || v === 'y';
    }
    if (typeof val === 'number') return val !== 0;
    return !!val;
  };

  return {
    ...profile,
    role: profile?.role || "",
    isAdmin,
    waiverSigned: coerceBool(profile?.waiverSigned),
    agreementSigned: coerceBool(profile?.agreementSigned),
    isPrimary: coerceBool(profile?.isPrimary),
  };
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
  const email = member?.email || '';
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
  return gasCall('bookTrialClass', data);
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
  senderProfilePic?: string;
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
  const cacheKey = `lbjj_chat_msgs_${channel}`;
  const MSG_TTL = 30_000;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < MSG_TTL) return data;
    }
  } catch {}

  try {
    const result = await gasCall("chatGetMessages", { channel, limit, token: token || "" });
    const messages = result.messages || [];
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: messages, ts: Date.now() })); } catch {}
    return messages;
  } catch (err) {
    console.error("chatGetMessages failed:", err);
    return [];
  }
}

export async function chatSendMessage(channel: string, text: string, senderProfilePic?: string): Promise<{ success: boolean; messageId?: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    const pic = (senderProfilePic || '').slice(0, 500);
    const result = await gasCall("chatSendMessage", { channel, text, token, senderProfilePic: pic });
    try { sessionStorage.removeItem(`lbjj_chat_msgs_${channel}`); } catch {}
    return result;
  } catch (err) {
    console.error("chatSendMessage failed:", err);
    return { success: false };
  }
}

const CHANNEL_CACHE_KEY = 'lbjj_chat_channels';
const CHANNEL_CACHE_TTL = 60_000;

export async function chatGetChannels(): Promise<ChatChannel[]> {
  const token = getToken();

  try {
    const cached = sessionStorage.getItem(CHANNEL_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CHANNEL_CACHE_TTL) return data;
    }
  } catch {}

  try {
    const result = await gasCall("chatGetChannels", { token: token || "" });
    const channels = result.channels || [];
    try { sessionStorage.setItem(CHANNEL_CACHE_KEY, JSON.stringify({ data: channels, ts: Date.now() })); } catch {}
    return channels;
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

export async function beltDeletePromotion(promotionId: string): Promise<{ success: boolean }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) throw new Error("Not authenticated");
  return gasCall('beltDeletePromotion', { token, promotionId });
}

export async function beltUpdatePromotion(data: { promotionId: string; belt: string; stripes: number; date: string; note: string }): Promise<{ success: boolean }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  return gasCall('beltUpdatePromotion', { token, ...data });
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

// ─── Coach Notes ─────────────────────────────────────────────────

export async function saveCoachNote(data: { memberEmail: string; note: string; date: string }): Promise<{ success: boolean }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  return gasCall('saveCoachNote', { token, ...data });
}

export async function getCoachNotes(memberEmail: string): Promise<Array<{ date: string; note: string; coach: string }>> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  try {
    const result = await gasCall('getCoachNotes', { token, memberEmail });
    return result?.notes || [];
  } catch { return []; }
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
  totalPoints?: number;
  profilePic?: string;
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
    // Always bypass sessionStorage cache — GAS now reads live data without server cache
    const cacheKey = `gas_getLeaderboard_${JSON.stringify({ type: 'weekly' })}`;
    try { sessionStorage.removeItem(cacheKey); } catch {}
    const result = await gasCall("getLeaderboard", { type: 'weekly' });
    // Handle both leaderboard.gs format and legacy format
    const raw = result?.leaderboard || result?.scores || result?.entries || [];
    // Normalize numeric fields — GAS may return strings from sheet cells
    const entries = raw.map((e: any) => ({
      ...e,
      classCount:  typeof e.classCount  === 'string' ? parseInt(e.classCount,  10) || 0 : (e.classCount  ?? 0),
      totalPoints: typeof e.totalPoints === 'string' ? parseInt(e.totalPoints, 10) || 0 : (e.totalPoints ?? 0),
      wins:        typeof e.wins        === 'string' ? parseInt(e.wins,        10) || 0 : (e.wins        ?? 0),
      score:       typeof e.score       === 'string' ? parseInt(e.score,       10) || 0 : (e.score       ?? 0),
    }));
    return entries;
  } catch (err) {
    console.error("getLeaderboard failed:", err);
    return [];
  }
}

// ─── Presence ────────────────────────────────────────────────────

// Presence heartbeat — call every 60s while app is active
export async function updatePresence(): Promise<void> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return;
  try {
    await gasCall('updatePresence', { token });
  } catch {}
}

// ─── Channel Members ─────────────────────────────────────────────

export interface ChannelMember {
  name: string;
  email: string;
  belt: string;
  role: string;
  totalPoints?: number;
  lastSeen?: string; // ISO timestamp
  badgeCount?: number;
  profilePic?: string;
}

// ─── Pinned Announcements ────────────────────────────────────────

export interface PinnedAnnouncement {
  message: string;
  title?: string;
  badge?: string;
  link?: string;
  linkLabel?: string;
  ts: string;
  pinnedBy?: string;
}

export async function getPinnedAnnouncement(): Promise<PinnedAnnouncement | null> {
  try {
    const result = await gasCall('getPinnedAnnouncement', {});
    return result?.announcement || null;
  } catch { return null; }
}

export async function clearPinnedAnnouncement(): Promise<void> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  await gasCall('clearPinnedAnnouncement', { token });
}

export async function pinAnnouncement(data: {
  message: string;
  title?: string;
  badge?: string;
  link?: string;
  linkLabel?: string;
}): Promise<{ success: boolean }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    return await gasCall('pinAnnouncement', { token, ...data });
  } catch { return { success: false }; }
}

export async function chatGetChannelMembers(channelId: string): Promise<ChannelMember[]> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  try {
    const cacheKey = `lbjj_ch_members_${channelId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < 120_000) return data; // 2 min cache
    }
    const result = await gasCall('chatGetChannelMembers', { token, channelId });
    const members = result?.members || [];
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: members, ts: Date.now() })); } catch {}
    return members;
  } catch { return []; }
}

// ─── Member Stats Sync ───────────────────────────────────────────────────────
// Writes XP + streak back to the Members sheet so data persists across devices.
// Called after every check-in and on app boot (if token valid).

export async function saveMemberStats(data: {
  xp: number;
  streak: number;
  maxStreak: number;
}): Promise<{ success: boolean; totalPoints?: number; currentStreak?: number; maxStreak?: number }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try {
    const result = await gasCall('saveMemberStats', { token, ...data });
    return result;
  } catch (err) {
    console.warn('saveMemberStats failed (non-critical):', err);
    return { success: false };
  }
}

// ─── Achievement Sync ─────────────────────────────────────────────────────────
// Upserts locally-earned achievements to the MemberBadges sheet on GAS.
// Idempotent — GAS deduplicates by (email, key).

export async function syncAchievements(achievements: Array<{
  key: string;
  label: string;
  icon: string;
  earnedAt?: string;
  triggerValue?: string | number;
}>): Promise<{ success: boolean; written?: number }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token || achievements.length === 0) return { success: false };
  try {
    const result = await gasCall('syncAchievements', { token, achievements });
    return result;
  } catch (err) {
    console.warn('syncAchievements failed (non-critical):', err);
    return { success: false };
  }
}

// ─── Leaderboard (force-fresh) ────────────────────────────────────────────────
// Bypasses client-side sessionStorage cache and requests a live read from GAS.
// Used after check-in to reflect the user's new check-in immediately.

export async function getLeaderboardFresh(): Promise<LeaderboardEntry[]> {
  try {
    // Invalidate sessionStorage cache for this action
    try {
      const key = `gas_getLeaderboard_${JSON.stringify({ type: 'weekly' })}`;
      sessionStorage.removeItem(key);
    } catch {}
    const result = await gasCall('getLeaderboard', { type: 'weekly', forceRefresh: true });
    return result?.leaderboard || result?.scores || result?.entries || [];
  } catch (err) {
    console.error('getLeaderboardFresh failed:', err);
    return [];
  }
}

// ─── Direct Messages ────────────────────────────────────────────────

export interface DmMessage {
  id: string;
  sender: string;
  senderEmail: string;
  senderBelt: string;
  senderTotalPoints: number;
  senderProfilePic?: string;
  text: string;
  timestamp: string;
  read: boolean;
  isMe: boolean;
}

export interface DmConversation {
  partnerEmail: string;
  partnerName: string;
  partnerBelt?: string;
  partnerProfilePic?: string;
  lastText: string;
  lastTs: string;
  unread: boolean;
}

export async function dmSend(toEmail: string, text: string): Promise<{ success: boolean; messageId?: string }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { success: false };
  try { return await gasCall('dmSend', { token, toEmail, text }); } catch { return { success: false }; }
}

export async function dmGetThread(otherEmail: string, limit = 60): Promise<DmMessage[]> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return [];
  try {
    const res = await gasCall('dmGetThread', { token, otherEmail, limit });
    return res?.messages || [];
  } catch { return []; }
}

export async function dmMarkRead(fromEmail: string): Promise<void> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return;
  try { await gasCall('dmMarkRead', { token, fromEmail }); } catch {}
}

export async function dmGetUnread(): Promise<{ count: number; threads: { fromEmail: string; fromName: string; count: number; lastText: string; lastTs: string }[] }> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return { count: 0, threads: [] };
  try {
    const res = await gasCall('dmGetUnread', { token });
    return { count: res?.count || 0, threads: res?.threads || [] };
  } catch { return { count: 0, threads: [] }; }
}

export async function dmGetConversations(): Promise<DmConversation[]> {
  const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
  if (!token) return [];
  try {
    const res = await gasCall('dmGetConversations', { token });
    return res?.conversations || [];
  } catch { return []; }
}

export async function getRecentUsers(windowMs = 3600000): Promise<ChannelMember[]> {
  try {
    const res = await gasCall('getRecentUsers', { windowMs });
    return (res?.members || []) as ChannelMember[];
  } catch { return []; }
}
