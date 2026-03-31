import { createContext, useContext, useState, useCallback } from "react";
import type { MemberProfile } from "./api";
import { setToken, setMemberData, clearAuth, memberLogin as apiLogin, memberGetProfile } from "./api";

interface AuthContextType {
  isAuthenticated: boolean;
  member: MemberProfile | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setMember: (member: MemberProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [member, setMemberState] = useState<MemberProfile | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await apiLogin(email, password);
      if (result.success && result.token && result.member) {
        setIsAuthenticated(true);
        setMemberState(result.member);
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
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await memberGetProfile();
      setMemberState(profile);
      setMemberData(profile);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  }, []);

  const setMember = useCallback((m: MemberProfile) => {
    setMemberState(m);
    setMemberData(m);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, member, login, logout, refreshProfile, setMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
