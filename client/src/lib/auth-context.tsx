import { createContext, useContext, useState, useCallback } from "react";
import type { MemberProfile, FamilyMember } from "./api";
import { setToken, setMemberData, clearAuth, memberLogin as apiLogin, memberGetProfile, memberSwitchProfile as apiSwitchProfile, setActiveLocation } from "./api";
import { getSavedLocationId } from "./locations";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  member: MemberProfile | null;
  familyMembers: FamilyMember[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
        setIsAuthenticated(true);
        setMemberState(result.member);
        setFamilyMembers(result.member.familyMembers || []);
        return { success: true };
      }
      return { success: false, error: result.error || "Invalid credentials" };
    } catch (err: any) {
      return { success: false, error: err.message || "Login failed" };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setIsAuthenticated(false);
    setMemberState(null);
    setFamilyMembers([]);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await memberGetProfile();
      setMemberState(profile);
      setMemberData(profile);
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
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, member, familyMembers, login, logout, refreshProfile, setMember, switchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
