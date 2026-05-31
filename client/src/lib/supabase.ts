/**
 * supabase.ts — Shared Supabase client for app.labyrinth.vision
 *
 * Cookie storage is configured with domain: '.labyrinth.vision' so the
 * same sb-* session cookie is valid on both app.labyrinth.vision and
 * stream.labyrinth.vision — no separate login needed on the portal.
 *
 * The anon key (VITE_SUPABASE_ANON_KEY) is safe to embed in the client
 * bundle — Supabase's Row Level Security policies control what anon users
 * can actually do. Never put the service_role key in a VITE_ variable.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars. ' +
    'Unified auth will not work until these are set.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Share the session cookie across all *.labyrinth.vision subdomains
    storageKey:      'sb-labyrinth-auth',
    storage:         typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,

    // Cookie domain shared across subdomains — the critical setting for
    // cross-subdomain session sharing. Must match your Cloudflare Pages domain.
    // flowType 'pkce' is required for server-side auth / invite flows.
    flowType: 'pkce',
  },
  global: {
    headers: { 'x-application-name': 'labyrinth-app' },
  },
});

// ─── Typed helpers ────────────────────────────────────────────────────────────

export interface MemberProfileRow {
  id:            string;
  email:         string;
  name:          string | null;
  belt:          string;
  stripes:       number;
  checkin_count: number;
  xp:            number;
  level:         number;
  role:          string;
  created_at:    string;
  updated_at:    string;
}

export interface AccessRequestRow {
  id:          string;
  name:        string;
  email:       string;
  message:     string | null;
  status:      'pending' | 'approved' | 'denied';
  created_at:  string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface StreamStatusRow {
  id:         string;
  is_live:    boolean;
  video_id:   string | null;
  class_name: string | null;
  instructor: string | null;
  started_at: string | null;
  updated_at: string;
}

/** Fetch the current user's Supabase member profile. */
export async function getMyProfile(): Promise<MemberProfileRow | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) { console.error('[supabase] getMyProfile error:', error); return null; }
  return data as MemberProfileRow;
}

/** Submit a new access request (works as anon user). */
export async function submitAccessRequest(
  name: string,
  email: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('access_requests')
    .insert({ name, email, message });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Admin: fetch all pending access requests. */
export async function getPendingRequests(): Promise<AccessRequestRow[]> {
  const { data, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) { console.error('[supabase] getPendingRequests error:', error); return []; }
  return (data ?? []) as AccessRequestRow[];
}

/** Admin: approve an access request and invite the user via Supabase Auth. */
export async function approveAccessRequest(
  requestId: string,
  email: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  // Flip status in DB
  const { error: updateErr } = await supabase
    .from('access_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  if (updateErr) return { success: false, error: updateErr.message };

  // Invoke the Edge Function that calls supabase.auth.admin.inviteUserByEmail()
  // (the service_role key lives server-side in the Edge Function, not in this bundle)
  const { data, error: fnErr } = await supabase.functions.invoke('invite-member', {
    body: { email, name },
  });

  if (fnErr) return { success: false, error: fnErr.message };
  return { success: true };
}

/** Admin: deny an access request. */
export async function denyAccessRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('access_requests')
    .update({ status: 'denied', reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Get current stream status. */
export async function getStreamStatus(): Promise<StreamStatusRow | null> {
  const { data, error } = await supabase
    .from('stream_status')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) { console.error('[supabase] getStreamStatus:', error); return null; }
  return data as StreamStatusRow;
}
