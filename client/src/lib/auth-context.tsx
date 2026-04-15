import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { MemberProfile, FamilyMember } from "./api";
import { setToken, setMemberData, clearAuth, memberLogin as apiLogin, memberGetProfile, memberSwitchProfile as apiSwitchProfile, setActiveLocation, gasCall } from "./api";
import { getSavedLocationId } from "./locations";

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

  // Derived — true when role is owner / admin / coach / instructor
  const isAdmin = !!(member?.isAdmin);

  // Optimistic session restore from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('lbjj_session_token');
    const savedProfileRaw = localStorage.getItem('lbjj_member_profile');

    // Token max-age check — force re-auth after 30 days
    const tokenCreated = parseInt(localStorage.getItem('lbjj_token_created') || '0');
    const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
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
        // Optimistically authenticate — show home screen immediately
        setToken(savedToken);
        setMemberData(savedProfile);
        setMemberState(savedProfile);
        setIsAuthenticated(true);
        if (savedProfile.familyMembers) setFamilyMembers(savedProfile.familyMembers);
        setIsLoading(false);

        // If cached profile claims isAdmin, re-verify with server in background
        if (savedProfile?.isAdmin) {
          memberGetProfile().then((freshProfile: any) => {
            if (!freshProfile?.isAdmin) {
              // Cached profile was stale/tampered — update profile but don't log out
              setMemberData({ ...savedProfile, isAdmin: false });
              setMemberState({ ...savedProfile, isAdmin: false });
              localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage({ ...savedProfile, isAdmin: false })));
            }
          }).catch(() => {
            // Network error — keep cached profile, will retry on next load
          });
        }

        // Background validation — if invalid, log out silently
        gasCall('memberGetProfile', { token: savedToken }).then((res: any) => {
          if (res?.success === false && !res?.member) {
            // Session invalid — log out
            clearAuth();
            localStorage.removeItem('lbjj_session_token');
            localStorage.removeItem('lbjj_member_profile');
            setIsAuthenticated(false);
            setMemberState(null);
            setFamilyMembers([]);
          } else {
            // Refresh member data from server
            const raw = res?.member || res;
            if (raw) {
              const normalized = { ...raw, role: raw?.role || '', isAdmin: ['owner', 'admin', 'coach', 'instructor'].includes((raw?.role || '').toLowerCase()) };
              setMemberState(normalized);
              setMemberData(normalized);
              localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(normalized)));
              if (normalized.familyMembers) setFamilyMembers(normalized.familyMembers);
            }
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
        localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(result.member)));
        setFamilyMembers(result.member.familyMembers || []);
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
      // Try to restore session using saved token
      const savedToken = localStorage.getItem('lbjj_session_token');
      if (savedToken) {
        const result = await gasCall('memberGetProfile', { token: savedToken });
        if (result?.success !== false && (result?.member || result)) {
          setToken(savedToken);
          const raw = result.member || result;
          const normalized = { ...raw, role: raw?.role || '', isAdmin: ['owner', 'admin', 'coach', 'instructor'].includes((raw?.role || '').toLowerCase()) };
          setIsAuthenticated(true);
          setMemberState(normalized);
          setMemberData(normalized);
          localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(normalized)));
          if (normalized.familyMembers) setFamilyMembers(normalized.familyMembers);
          return { success: true };
        }
      }
      // No saved token — need password login first
      return { success: false, error: 'Biometric login unavailable — please sign in with password' };
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
    localStorage.removeItem('lbjj_game_stats_v2');
    localStorage.removeItem('lbjj_checkins_today');
    localStorage.removeItem('lbjj_weekly_training');
    localStorage.removeItem('lbjj_saved_pass');
    localStorage.removeItem('lbjj_home_cache');
    setIsAuthenticated(false);
    setMemberState(null);
    setFamilyMembers([]);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await memberGetProfile();
      setMemberState(profile);
      setMemberData(profile);
      localStorage.setItem('lbjj_member_profile', JSON.stringify(sanitizeProfileForStorage(profile)));
      if (profile.familyMembers) setFamilyMembers(profile.familyMembers);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  }, []);

  const setMember = useCallback((m: MemberProfile) => {
    setMemberState(m);
    setMemberData(m);
    if (m.familyMembers) setFamilyMembers(m.familyMembers);
  }, []);

  const switchProfile = useCallback(async (targetRow: number) => {
    try {
      const profile = await apiSwitchProfile(targetRow);
      setMemberState(profile);
      setMemberData(profile);
      if (profile.familyMembers) setFamilyMembers(profile.familyMembers);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to switch profile" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, isAdmin, member, familyMembers, login, loginWithPasskey, logout, refreshProfile, setMember, switchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
