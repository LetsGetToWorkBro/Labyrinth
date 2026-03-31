import { createContext, useContext, useState, useCallback } from "react";

export interface GuestProfile {
  name: string;
  belt: string;
  type: "Adult" | "Kid";
}

interface GuestProfileContextType {
  guest: GuestProfile | null;
  setGuest: (profile: GuestProfile) => void;
  clearGuest: () => void;
  hasProfile: boolean;
}

const GuestProfileContext = createContext<GuestProfileContextType | null>(null);

export function GuestProfileProvider({ children }: { children: React.ReactNode }) {
  const [guest, setGuestState] = useState<GuestProfile | null>(null);

  const setGuest = useCallback((profile: GuestProfile) => {
    setGuestState(profile);
  }, []);

  const clearGuest = useCallback(() => {
    setGuestState(null);
  }, []);

  return (
    <GuestProfileContext.Provider value={{ guest, setGuest, clearGuest, hasProfile: !!guest }}>
      {children}
    </GuestProfileContext.Provider>
  );
}

export function useGuestProfile() {
  const ctx = useContext(GuestProfileContext);
  if (!ctx) throw new Error("useGuestProfile must be used within GuestProfileProvider");
  return ctx;
}
