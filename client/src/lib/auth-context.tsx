import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { MemberProfile, FamilyMember } from "./api";
import { setToken, setMemberData, clearAuth, memberLogin as apiLogin, memberGetProfile, memberSwitchProfile as apiSwitchProfile, setActiveLocation, gasCall, normalizeAdminRole, syncAchievements } from "./api";
import { ALL_ACHIEVEMENTS } from "./achievements";
import { getSavedLocationId } from "./locations";
import { setPfp, bulkSetPfp } from "./pfpCache";
import { applyBeltTheme } from "./beltTheme";

function syncBeltTheme(m: any) {
  if (!m || !m.name) return;
  const beltVal = (m.belt || 'white');
  const barVal  = (m.bar  || 'none');
  applyBeltTheme(beltVal, barVal === 'none' ? undefined : barVal);
}

function cacheMemberPfp(m: any) {
  if (!m?.email) return;
  const pic = m.profilePic || m.profilePicBase64 || localStorage.getItem('lbjj_profile_picture') || '';
  if (pic) setPfp(m.email, pic);
  if (Array.isArray(m.familyMembers)) bulkSetPfp(m.familyMembers);
}

// Fetch admin-configured app config from GAS and cache in sessionStorage.
// sessionStorage is used deliberately — localStorage can be pre-set by a user
// trying to bypass the check-in window. sessionStorage is wiped on tab close.
function fetchAndCacheAppConfig() {
  // Fetch both app config (check-in window) and geo config (lat/lng/radius) in parallel
  Promise.all([
    gasCall('getAppConfig', {}),
    gasCall('getGeoConfig', {}),
  ]).then(([cfg, geo]: [any, any]) => {
    // Check-in window
    const mins = parseInt(cfg?.checkinWindowMinutes, 10);
    if (Number.isFinite(mins) && mins > 0) {
      try { sessionStorage.setItem('lbjj_checkin_window', String(mins)); } catch {}
    }
    const gateEnabled = cfg?.checkinGateEnabled !== false;
    try { sessionStorage.setItem('lbjj_checkin_gate_enabled', gateEnabled ? '1' : '0'); } catch {}

    // Geo-lock config — cache into localStorage so geo.ts can read it
    if (geo?.success !== false) {
      const geoConfig = {
        enabled:     !!geo?.geoEnabled,
        lat:         parseFloat(geo?.geoLat  ?? geo?.config?.lat  ?? 0) || 0,
        lng:         parseFloat(geo?.geoLng  ?? geo?.config?.lng  ?? 0) || 0,
        radiusYards: parseInt(geo?.geoRadiusYards ?? geo?.config?.radiusYards ?? 500) || 500,
      };
      try { localStorage.setItem('lbjj_geo_config', JSON.stringify(geoConfig)); } catch {}
    }
  }).catch(() => {});
}

// One-time re-sync for members with stale GAS XP data
// Fires silently on first app open after the POST→GET GAS fix (2026-04-25)
const RESYNC_AFTER = 1745632800000; // Apr 25 2026 18:00 UTC (approx when GET fix deployed)
const RESYNC_KEY = 'lbjj_xp_resync_done_v2';

// One-time migration: wipe lbjj_achievement_xp_claimed entries that were
// written by the broken pre-fix build (before Apr 26 2026 02:00 UTC).
// Those claims marked keys as claimed but never awarded XP, so we reset
// so users can re-claim and actually receive their XP + animation.
const ACH_CLAIM_MIGRATION_KEY = 'lbjj_ach_claim_migrated_v1';
const ACH_CLAIM_MIGRATION_AFTER = 1745632800000; // same cutoff as XP resync
function migrateAchievementClaims() {
  try {
    const done = parseInt(localStorage.getItem(ACH_CLAIM_MIGRATION_KEY) || '0');
    if (done > ACH_CLAIM_MIGRATION_AFTER) return; // already migrated
    // Clear the claimed set so every achievement can be re-claimed
    localStorage.removeItem('lbjj_achievement_xp_claimed');
    localStorage.setItem(ACH_CLAIM_MIGRATION_KEY, Date.now().toString());
  } catch {}
}

function triggerXPResyncIfNeeded() {
  try {
    const lastResync = parseInt(localStorage.getItem(RESYNC_KEY) || '0');
    if (lastResync > RESYNC_AFTER) return; // already resynced post-fix

    const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
    const localXP = Math.max(stats.xp || 0, stats.totalXP || 0);
    if (localXP === 0) return; // nothing to sync

    const token = localStorage.getItem('lbjj_session_token');
    if (!token) return;

    // Fire-and-forget — import inline to avoid circular deps
    import('@/lib/api').then(({ gasCall }) => {
      gasCall('saveMemberStats', {
        token,
        totalPoints: localXP,
        currentStreak: stats.currentStreak || 0,
        maxStreak: stats.maxStreak || 0,
        classesAttended: stats.classesAttended || 0,
        source: 'resync_v2',
      }).then(() => {
        localStorage.setItem(RESYNC_KEY, Date.now().toString());
        console.log('[XP resync] synced', localXP, 'XP to GAS');
      }).catch(() => {});
    });
  } catch {}
}

function sanitizeProfileForStorage(profile: any) {
  if (!profile) return profile;
  const sanitized = { ...profile };
  // Remove payment card details — not needed client-side beyond display
  delete sanitized.StripeCustomerID;
  delete sanitized.StripeSubscriptionID;
  // Keep cardLast4, cardBrand, cardExpiration for display purposes
  return sanitized;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isAdminVerified: boolean;
  member: MemberProfile | null;
  familyMembers: FamilyMember[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPasskey: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setMember: (member: MemberProfile) => void;
  switchProfile: (targetRow: number) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [member, setMemberState] = useState<MemberProfile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Re-fetch app config (check-in window, geo settings) whenever the app
  // comes back to the foreground or every 5 minutes while active.
  // This ensures admin setting changes propagate without requiring sign-out.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchAndCacheAppConfig();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(fetchAndCacheAppConfig, 5 * 60 * 1000); // every 5 min
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);
  // Only true once GAS has confirmed isAdmin — localStorage cache alone is not trusted.
  // Use this for gating admin routes/UI; use isAdmin for quick UX hints only.
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  // Derived — true when role is owner / admin / coach / instructor
  const isAdmin = !!(member?.isAdmin);

  // Optimistic session restore from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('lbjj_session_token');
    const savedProfileRaw = localStorage.getItem('lbjj_member_profile');

    // Token max-age — GAS validates server-side; client re-auths after 365 days
    const tokenCreated = parseInt(localStorage.getItem('lbjj_token_created') || '0');
    const TOKEN_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
    if (tokenCreated && Date.now() - tokenCreated > TOKEN_MAX_AGE_MS) {
      localStorage.removeItem('lbjj_session_token');
      localStorage.removeItem('lbjj_token_created');
      localStorage.removeItem('lbjj_member_profile');
      setIsLoading(false);
      return;
    }

    if (savedToken && savedProfileRaw) {
      try {
        const savedProfile = JSON.parse(savedProfileRaw);
        // Attach locally cached profile picture if present
        const cachedPic = localStorage.getItem('lbjj_profile_picture');
        if (cachedPic && !savedProfile.profilePic) {
          savedProfile.profilePic = cachedPic;
        }
        // Optimistically authenticate — show home screen immediately
        setToken(savedToken);
        setMemberData(savedProfile);
        setMemberState(savedProfile);
        setIsAuthenticated(true);
        if (savedProfile.familyMembers) setFamilyMembers(savedProfile.familyMembers);
        cacheMemberPfp(savedProfile);
        syncBeltTheme(savedProfile);
        setIsLoading(false);
        fetchAndCacheAppConfig();
        migrateAchievementClaims();
        triggerXPResyncIfNeeded();

        // If cached profile claims isAdmin, re-verify with server in background
        if (savedProfile?.isAdmin) {
          memberGetProfile().then((freshProfile: any) => {
            if (!freshProfile?.isAdmin) {
              // Cached profile was stale/tampered — update profile but don't log out
              setMemberData({ ...savedProfile, isAdmin: false });
              setMemberState({ ...savedProfile, isAdmin: false });
              setIsAdminVerified(false);
              localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage({ ...savedProfile, isAdmin: false })));
            } else {
              setIsAdminVerified(true);
            }
          }).catch(() => {
            // Network error — keep cached profile, will retry on next load
          });
        }

        // Background validation — refresh profile but NEVER log out
        // Logging out here causes black screen / unexpected auth loss
        // GAS validates every call server-side, so client-side expiry is redundant
        gasCall('memberGetProfile', { token: savedToken }).then((res: any) => {
          const raw = res?.member || (res && typeof res === 'object' && res.name ? res : null);
          if (res?.success === false && !raw) {
            // Token stale — keep user logged in with cached profile, don't boot them
            // The next explicit action (check-in, etc.) will get a fresh token via GAS
            return;
          }
          if (raw && typeof raw === 'object' && (raw.name || raw.email)) {
            // Always run through normalizeAdminRole so waiverSigned/agreementSigned
            // GAS strings ("TRUE"/"FALSE"/1/0) get coerced to booleans
            const normalized = normalizeAdminRole(raw);
            setMemberState(normalized);
            setMemberData(normalized);
            setIsAdminVerified(!!normalized.isAdmin);
            localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(normalized)));
            if (normalized.familyMembers) setFamilyMembers(normalized.familyMembers);
            cacheMemberPfp(normalized);
            syncBeltTheme(normalized);
          }
        }).catch(() => {
          // Network error during validation — keep optimistic state (user may be offline)
        });
        return;
      } catch {}
    }

    // No saved session — show login screen
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Ensure the correct location endpoint is set before logging in
      setActiveLocation(getSavedLocationId());
      const result = await apiLogin(email, password);
      if (result.success && result.token && result.member) {
        setToken(result.token);
        localStorage.setItem('lbjj_session_token', result.token);
        localStorage.setItem('lbjj_token_created', Date.now().toString());
        setIsAuthenticated(true);
        setMemberState(result.member);
        setMemberData(result.member);
        // Fresh server response — isAdmin is trusted here.
        setIsAdminVerified(!!result.member.isAdmin);
        localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(result.member)));
        setFamilyMembers(result.member.familyMembers || []);
        cacheMemberPfp(result.member);
        syncBeltTheme(result.member);
        fetchAndCacheAppConfig();
        // Sync locally-earned achievements to GAS on login (fire-and-forget)
        try {
          const earned: string[] = JSON.parse(localStorage.getItem('lbjj_achievements') || '[]');
          if (earned.length > 0) {
            const toSync = earned.map((key: string) => {
              const def = ALL_ACHIEVEMENTS.find(a => a.key === key);
              return def ? { key, label: def.label, icon: def.icon, earnedAt: new Date().toISOString() } : null;
            }).filter(Boolean) as Array<{ key: string; label: string; icon: string; earnedAt: string }>;
            syncAchievements(toSync).catch(() => {});
          }
        } catch {}
        return { success: true };
      }
      return { success: false, error: result.error || "Invalid credentials" };
    } catch (err: any) {
      return { success: false, error: err.message || "Login failed" };
    }
  }, []);

  const loginWithPasskey = useCallback(async (email: string) => {
    try {
      setActiveLocation(getSavedLocationId());
      fetchAndCacheAppConfig();
      const savedToken = localStorage.getItem('lbjj_session_token');

      // Fast path: if we have a saved token, optimistically restore from cached profile
      // and validate in the background (same as the app startup flow)
      const cachedProfileRaw = localStorage.getItem('lbjj_member_profile');
      if (savedToken && cachedProfileRaw) {
        try {
          const cachedProfile = JSON.parse(cachedProfileRaw);
          if (cachedProfile && cachedProfile.name) {
            // Restore session immediately from cache
            setToken(savedToken);
            const normalized = normalizeAdminRole(cachedProfile);
            setIsAuthenticated(true);
            setMemberState(normalized);
            setMemberData(normalized);
            if (normalized.familyMembers) setFamilyMembers(normalized.familyMembers);
            cacheMemberPfp(normalized);
            syncBeltTheme(normalized);
            migrateAchievementClaims();
            triggerXPResyncIfNeeded();

            // Refresh token timestamp so biometric logins always extend the session
            localStorage.setItem('lbjj_token_created', Date.now().toString());

            // Background re-validate against GAS (non-blocking)
            // NEVER log out here — biometric already proved identity.
            // If token is stale, try to renew it silently instead.
            gasCall('memberGetProfile', { token: savedToken }).then(async (res: any) => {
              if (res?.success === false && !res?.member) {
                // Token stale — try silent renewal instead of logout
                try {
                  const renewal = await gasCall('memberRenewToken', { token: savedToken, email });
                  if (renewal?.success && renewal?.token) {
                    localStorage.setItem('lbjj_session_token', renewal.token);
                    localStorage.setItem('lbjj_token_created', Date.now().toString());
                    setToken(renewal.token);
                    const raw = renewal.member;
                    if (raw && typeof raw === 'object' && raw.name) {
                      const fresh = normalizeAdminRole(raw);
                      setMemberState(fresh);
                      setMemberData(fresh);
                      setIsAdminVerified(!!fresh.isAdmin);
                      localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(fresh)));
                      if (fresh.familyMembers) setFamilyMembers(fresh.familyMembers);
                      cacheMemberPfp(fresh);
                      syncBeltTheme(fresh);
                    }
                  }
                  // If renewal also fails — keep cached state, don't boot the user
                } catch { /* keep cached state */ }
              } else {
                const raw = res?.member || res;
                if (raw && typeof raw === 'object' && raw.name) {
                  const fresh = normalizeAdminRole(raw);
                  setMemberState(fresh);
                  setMemberData(fresh);
                  setIsAdminVerified(!!fresh.isAdmin);
                  localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(fresh)));
                  if (fresh.familyMembers) setFamilyMembers(fresh.familyMembers);
                  cacheMemberPfp(fresh);
                  syncBeltTheme(fresh);
                }
              }
            }).catch(() => { /* network error — keep cached state */ });

            return { success: true };
          }
        } catch { /* corrupt cache — fall through to network */ }
      }

      // No cache — try GAS directly
      if (savedToken) {
        const result = await gasCall('memberGetProfile', { token: savedToken });
        if (result?.success !== false) {
          const raw = result?.member || result;
          if (raw && typeof raw === 'object' && raw.name) {
            setToken(savedToken);
            const normalized = normalizeAdminRole(raw);
            setIsAuthenticated(true);
            setMemberState(normalized);
            setMemberData(normalized);
            setIsAdminVerified(!!normalized.isAdmin);
            localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(normalized)));
            if (normalized.familyMembers) setFamilyMembers(normalized.familyMembers);
            cacheMemberPfp(normalized);
            syncBeltTheme(normalized);
            return { success: true };
          }
        }
        // Token rejected by GAS — try to renew it
        try {
          const renewal = await gasCall('memberRenewToken', { token: savedToken, email });
          if (renewal?.success && renewal?.token) {
            const newToken = renewal.token;
            localStorage.setItem('lbjj_session_token', newToken);
            localStorage.setItem('lbjj_token_created', Date.now().toString());
            const renewedProfile = renewal.member || await gasCall('memberGetProfile', { token: newToken });
            const raw = renewedProfile?.member || renewedProfile;
            if (raw && typeof raw === 'object' && raw.name) {
              setToken(newToken);
              const normalized = normalizeAdminRole(raw);
              setIsAuthenticated(true);
              setMemberState(normalized);
              setMemberData(normalized);
              setIsAdminVerified(!!normalized.isAdmin);
              localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(normalized)));
              if (normalized.familyMembers) setFamilyMembers(normalized.familyMembers);
              cacheMemberPfp(normalized);
              syncBeltTheme(normalized);
              return { success: true };
            }
          }
        } catch { /* renewal failed — fall through */ }
        localStorage.removeItem('lbjj_session_token');
        localStorage.removeItem('lbjj_member_profile');
      }

      return { success: false, error: 'Session expired — please sign in with your password' };
    } catch {
      return { success: false, error: 'Connection error' };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    localStorage.removeItem('lbjj_session_token');
    localStorage.removeItem('lbjj_token_created');
    localStorage.removeItem('lbjj_member_profile');
    localStorage.removeItem('lbjj_member_email');
    localStorage.removeItem('lbjj_checkins_today');
    localStorage.removeItem('lbjj_weekly_training');
    localStorage.removeItem('lbjj_saved_pass');
    localStorage.removeItem('lbjj_home_cache');
    localStorage.removeItem('lbjj_home_leaderboard');
    localStorage.removeItem('lbjj_stream_status');
    // lbjj_streak_cache intentionally preserved — it's device-local and survives sign-out
    // lbjj_profile_picture intentionally preserved — it's device-local and survives sign-out
    // lbjj_game_stats_v2 intentionally preserved — XP/level progress is device-local and survives sign-out
    // lbjj_achievements / lbjj_achievement_xp_claimed intentionally preserved — earned achievements persist
    // lbjj_checkin_history intentionally preserved — device-local check-in history survives sign-out
    localStorage.removeItem('lbjj_belt_promotions_cache');
    localStorage.removeItem('lbjj_classes_cache');
    setIsAuthenticated(false);
    setMemberState(null);
    setFamilyMembers([]);
    setIsAdminVerified(false);
    // Clear family session so picker re-shows on next login
    try { sessionStorage.removeItem('lbjj_family_picked'); } catch {}
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await memberGetProfile();
      setMemberState(profile);
      setMemberData(profile);
      setIsAdminVerified(!!profile.isAdmin);
      localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(profile)));
      if (profile.familyMembers) setFamilyMembers(profile.familyMembers);
      cacheMemberPfp(profile);
      syncBeltTheme(profile);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  }, []);

  const setMember = useCallback((m: MemberProfile) => {
    setMemberState(m);
    setMemberData(m);
    if (m.familyMembers) setFamilyMembers(m.familyMembers);
    cacheMemberPfp(m);
    syncBeltTheme(m);
  }, []);

  const switchProfile = useCallback(async (targetRow: number) => {
    try {
      const profile = await apiSwitchProfile(targetRow);
      setMemberState(profile);
      setMemberData(profile);
      if (profile.familyMembers) setFamilyMembers(profile.familyMembers);
      cacheMemberPfp(profile);
      syncBeltTheme(profile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to switch profile" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, isAdmin, isAdminVerified, member, familyMembers, login, loginWithPasskey, logout, refreshProfile, setMember, switchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
