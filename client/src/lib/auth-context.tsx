import { createContext, useContext, useState, useCallback } from "react";
import type { MemberProfile, FamilyMember } from "./api";
import { setToken, setMemberData, clearAuth, memberLogin as apiLogin, memberGetProfile, memberSwitchProfile as apiSwitchProfile, setActiveLocation, gasCall } from "./api";
import { getSavedLocationId } from "./locations";

interface AuthContextType {
  isAuthenticated: boolean;
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
  const [member, setMemberState] = useState<MemberProfile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Derived — true when role is owner / admin / coach / instructor
  const isAdmin = !!(member?.isAdmin);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Ensure the correct location endpoint is set before logging in
      setActiveLocation(getSavedLocationId());
      const result = await apiLogin(email, password);
      if (result.success && result.token && result.member) {
        setToken(result.token);
        localStorage.setItem('lbjj_session_token', result.token);
        setIsAuthenticated(true);
        setMemberState(result.member);
        setMemberData(result.member);
        localStorage.setItem('lbjj_member_profile', JSON.stringify(result.member));
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
          localStorage.setItem('lbjj_member_profile', JSON.stringify(normalized));
          if (normalized.familyMembers) setFamilyMembers(normalized.familyMembers);
          localStorage.setItem('lbjj_member_email', email);
          return { success: true };
        }
      }
      // No saved token — need password login first
      return { success: false, error: 'no_saved_token' };
    } catch {
      return { success: false, error: 'Connection error' };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    localStorage.removeItem('lbjj_session_token');
    localStorage.removeItem('lbjj_member_profile');
    localStorage.removeItem('lbjj_game_stats_v2');
    localStorage.removeItem('lbjj_checkins_today');
    localStorage.removeItem('lbjj_weekly_training');
    setIsAuthenticated(false);
    setMemberState(null);
    setFamilyMembers([]);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await memberGetProfile();
      setMemberState(profile);
      setMemberData(profile);
      localStorage.setItem('lbjj_member_profile', JSON.stringify(profile));
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
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, member, familyMembers, login, loginWithPasskey, logout, refreshProfile, setMember, switchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
