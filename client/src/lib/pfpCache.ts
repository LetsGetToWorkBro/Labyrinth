// Global in-memory + localStorage PFP cache
// Key: email (lowercased), Value: base64 PFP string
const CACHE_KEY = 'lbjj_pfp_cache';
const MEM: Record<string, string> = {};

try {
  const raw = localStorage.getItem(CACHE_KEY);
  if (raw) Object.assign(MEM, JSON.parse(raw));
} catch {}

export function setPfp(email: string, pic: string) {
  if (!email || !pic) return;
  const k = email.toLowerCase().trim();
  if (MEM[k] === pic) return;
  MEM[k] = pic;
  try {
    const s = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    s[k] = pic;
    localStorage.setItem(CACHE_KEY, JSON.stringify(s));
  } catch {}
}

export function getPfp(email: string): string | undefined {
  if (!email) return undefined;
  return MEM[email.toLowerCase().trim()];
}

export function bulkSetPfp(members: any[]) {
  if (!Array.isArray(members)) return;
  members.forEach(m => {
    const pic = m?.profilePic || m?.profilePicBase64 || m?.pfp || m?.ProfilePic;
    const email = m?.email || m?.Email;
    if (email && pic) setPfp(email, pic);
  });
}
