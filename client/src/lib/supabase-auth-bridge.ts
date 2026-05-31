/**
 * supabase-auth-bridge.ts
 *
 * Bridges GAS (Google Apps Script) session tokens with Supabase Auth.
 *
 * PROBLEM: The main app authenticates via GAS + custom JWT tokens.
 * The stream portal needs Supabase Auth for cross-subdomain sessions.
 *
 * SOLUTION: After a successful GAS login, call syncGasSessionToSupabase().
 * This signs the user into Supabase using a Magic Link OTP via the
 * supabase.auth.signInWithOtp() flow — but since we can't wait for email,
 * we use a custom token exchange via the Edge Function.
 *
 * SIMPLER ALTERNATIVE (what we actually use here):
 * We call supabase.auth.signInWithPassword() with the same email/password.
 * Members must use the same credentials on both systems. After the Supabase
 * project is set up and users are imported/invited, this "double login" is
 * transparent — it happens in the background after the GAS login succeeds.
 *
 * On app open with biometric: we skip GAS entirely and use Supabase session
 * (stored refresh_token in Preferences) to re-authenticate.
 */

import { supabase } from "@/lib/supabase";
import {
  saveRefreshTokenForBiometric,
  rotateBiometricRefreshToken,
  isBiometricEnabled,
} from "@/lib/biometric-auth";

/**
 * Called after a successful GAS password login.
 *
 * Signs the user into Supabase in the background so that:
 *  1. The sb-* cookie is set for stream.labyrinth.vision to read
 *  2. The Supabase refresh_token is saved to Preferences for biometric login
 *
 * Failures are silently swallowed — GAS auth is the source of truth.
 * Supabase is additive.
 */
export async function syncGasSessionToSupabase(
  email: string,
  password: string
): Promise<void> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // User may not exist in Supabase yet (new invite not yet accepted).
      // This is expected for existing GAS members — not a bug.
      console.warn("[supabase-bridge] Supabase sign-in failed (user may not be invited yet):", error.message);
      return;
    }
    if (data.session) {
      // Persist refresh token for biometric — overwrites previous token after rotation
      await saveRefreshTokenForBiometric(data.session.refresh_token, email);
      console.info("[supabase-bridge] Supabase session synced for", email);
    }
  } catch (err) {
    // Never throw — GAS login already succeeded
    console.warn("[supabase-bridge] Unexpected error:", err);
  }
}

/**
 * Listen for Supabase token refreshes and rotate the stored biometric token.
 * Call this once on app startup. It's a no-op if biometric is not enabled.
 */
export function startBiometricTokenRotation(): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "TOKEN_REFRESHED" && session?.refresh_token) {
      const enabled = await isBiometricEnabled();
      if (enabled) {
        await rotateBiometricRefreshToken(session.refresh_token);
      }
    }
  });
  return () => subscription.unsubscribe();
}

/**
 * Sign out from Supabase when the user logs out of the GAS session.
 * Also clears the shared sb-* cookie on .labyrinth.vision.
 */
export async function signOutSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch (err) {
    console.warn("[supabase-bridge] signOut error:", err);
  }
}
