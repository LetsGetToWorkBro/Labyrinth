/**
 * biometric-auth.ts — Supabase-backed biometric login for Capacitor
 *
 * Flow:
 *  1. First password login → saveRefreshTokenForBiometric() stores the
 *     Supabase refresh_token securely in @capacitor/preferences (NOT localStorage).
 *  2. On subsequent app opens → tryBiometricLogin():
 *       a. BiometricAuth.checkBiometry()  — is it available?
 *       b. BiometricAuth.authenticate()   — Face ID / fingerprint prompt
 *       c. Load stored refresh_token
 *       d. supabase.auth.setSession({ refresh_token, access_token: '' })
 *          (Supabase will auto-exchange refresh_token → new access_token)
 *  3. Edge cases:
 *       - Not available → returns { available: false }
 *       - Token expired  → returns { expired: true }  → caller shows password form
 *       - User cancels   → returns { cancelled: true } → caller shows password form
 *
 * capacitor-native-biometric is already in package.json.
 * This module also works as a web stub (returns unavailable) so it never
 * crashes the desktop/Vite dev server build.
 */

import { Preferences } from "@capacitor/preferences";
import { supabase } from "@/lib/supabase";

// capacitor-native-biometric is the package that's already installed
// (not @capacitor-community/biometric-auth — check package.json)
let NativeBiometric: any = null;
(async () => {
  try {
    const mod = await import("capacitor-native-biometric");
    NativeBiometric = mod.NativeBiometric;
  } catch {
    // Web / unsupported platform — biometric will be unavailable
  }
})();

const PREF_BIOMETRIC_ENABLED = "sb_biometric_enabled";
const PREF_REFRESH_TOKEN      = "sb_refresh_token";
const PREF_USER_EMAIL         = "sb_biometric_email";

export interface BiometricResult {
  success:   boolean;
  available?: boolean;   // false → not enrolled / no hardware
  cancelled?: boolean;   // true → user tapped Cancel
  expired?:  boolean;   // true → token is no longer valid, re-login required
  error?:    string;
}

/** Returns true when the device has enrolled biometrics and the user has opted in. */
export async function isBiometricEnabled(): Promise<boolean> {
  const { value } = await Preferences.get({ key: PREF_BIOMETRIC_ENABLED });
  return value === "true";
}

/** Returns true when biometrics are physically available on this device. */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!NativeBiometric) return false;
  try {
    const result = await NativeBiometric.isAvailable();
    return !!result?.isAvailable;
  } catch {
    return false;
  }
}

/**
 * Called after a successful password login.
 * Stores the Supabase refresh_token in Capacitor Preferences so future
 * biometric logins can call setSession() without asking for a password.
 */
export async function saveRefreshTokenForBiometric(
  refreshToken: string,
  email: string
): Promise<void> {
  await Promise.all([
    Preferences.set({ key: PREF_REFRESH_TOKEN,      value: refreshToken }),
    Preferences.set({ key: PREF_USER_EMAIL,          value: email }),
    Preferences.set({ key: PREF_BIOMETRIC_ENABLED,   value: "true" }),
  ]);
}

/** Clear stored biometric credentials (e.g. on logout or when user disables it). */
export async function clearBiometricCredentials(): Promise<void> {
  await Promise.all([
    Preferences.remove({ key: PREF_REFRESH_TOKEN }),
    Preferences.remove({ key: PREF_USER_EMAIL }),
    Preferences.remove({ key: PREF_BIOMETRIC_ENABLED }),
  ]);
}

/**
 * Main entry point: attempt biometric login on app open.
 *
 * @param promptReason Text shown in the biometric prompt (e.g. "Sign in to Labyrinth BJJ")
 */
export async function tryBiometricLogin(
  promptReason = "Sign in to Labyrinth BJJ"
): Promise<BiometricResult> {
  // 1. Check hardware / enrollment
  if (!NativeBiometric) {
    return { success: false, available: false };
  }

  let hwCheck: any;
  try {
    hwCheck = await NativeBiometric.isAvailable();
  } catch {
    return { success: false, available: false };
  }
  if (!hwCheck?.isAvailable) {
    return { success: false, available: false };
  }

  // 2. Check user opted in and has a stored token
  const enabled = await isBiometricEnabled();
  if (!enabled) {
    return { success: false, available: true }; // available but not opted in
  }

  const { value: refreshToken } = await Preferences.get({ key: PREF_REFRESH_TOKEN });
  if (!refreshToken) {
    // Token was wiped (e.g. logout) — can't use biometric, need password
    return { success: false, expired: true };
  }

  // 3. Prompt Face ID / fingerprint
  try {
    await NativeBiometric.verifyIdentity({
      reason: promptReason,
      title:  "Labyrinth BJJ",
      subtitle: "Use Face ID or fingerprint to sign in",
      description: "",
      negativeButtonText: "Use Password",
      useFallback: false,
    });
  } catch (err: any) {
    const code = err?.code ?? err?.errorCode ?? "";
    // Codes: BIOMETRIC_DISMISSED / USER_FALLBACK / AUTHENTICATION_FAILED
    if (
      String(code).includes("DISMISS") ||
      String(code).includes("CANCEL") ||
      String(err?.message ?? "").toLowerCase().includes("cancel")
    ) {
      return { success: false, cancelled: true };
    }
    return { success: false, error: err?.message ?? "Biometric auth failed" };
  }

  // 4. Exchange the refresh_token for a live Supabase session
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token:  "",       // Supabase ignores this and exchanges the refresh token
      refresh_token: refreshToken,
    });

    if (error || !data?.session) {
      // Token has expired or been revoked — clear it and ask for password
      await clearBiometricCredentials();
      return { success: false, expired: true };
    }

    // Store the new (rotated) refresh token so next login also works
    const newRefresh = data.session.refresh_token;
    if (newRefresh && newRefresh !== refreshToken) {
      await Preferences.set({ key: PREF_REFRESH_TOKEN, value: newRefresh });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Session restore failed" };
  }
}

/**
 * Call this after every successful Supabase session to rotate the stored
 * refresh token. Supabase rotates refresh tokens on every use — if you don't
 * update storage, the next biometric login will fail with an expired token.
 */
export async function rotateBiometricRefreshToken(newRefreshToken: string): Promise<void> {
  const enabled = await isBiometricEnabled();
  if (!enabled) return;
  await Preferences.set({ key: PREF_REFRESH_TOKEN, value: newRefreshToken });
}
