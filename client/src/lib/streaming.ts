import { gasCall } from "@/lib/api";

export interface StreamStatus {
  isLive: boolean;
  videoId: string;
  videoUrl: string;
  className: string;
  instructor: string;
  startedAt: string;
  durationMinutes: number;
  thumbnail: string;
}

export interface ArchiveEntry {
  date: string;
  title: string;
  videoId: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  category: string;
  instructor: string;
  archiveId: string;
}

const STREAM_CACHE_KEY = 'lbjj_stream_status';
const CACHE_TTL = 15 * 1000; // 15 seconds

export async function getStreamStatus(): Promise<StreamStatus> {
  // Check cache first
  try {
    const cached = JSON.parse(localStorage.getItem(STREAM_CACHE_KEY) || '{}');
    if (cached.fetchedAt && Date.now() - cached.fetchedAt < CACHE_TTL) {
      return cached.data;
    }
  } catch {}

  try {
    const result = await gasCall('getStreamStatus', {});
    const data = result as StreamStatus;
    localStorage.setItem(STREAM_CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
    return data;
  } catch (err) {
    console.error('[streaming] getStreamStatus error:', err);
    return { isLive: false, videoId: '', videoUrl: '', className: '', instructor: '', startedAt: '', durationMinutes: 0, thumbnail: '' };
  }
}

export function clearStreamCache() {
  localStorage.removeItem(STREAM_CACHE_KEY);
}

export async function getStreamArchive(category?: string): Promise<ArchiveEntry[]> {
  try {
    const result = await gasCall('getStreamArchive', category ? { category } : {});
    console.log('[getStreamArchive] result:', result);
    return (result as any)?.archives || [];
  } catch (e) {
    console.error('[getStreamArchive] failed:', e);
    return [];
  }
}

export function getEmbedUrl(videoId: string): string {
  if (!videoId) return '';
  // YouTube video IDs are exactly 11 characters: letters, digits, hyphens, underscores
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    console.warn('[streaming] Invalid video ID rejected:', videoId);
    return '';
  }
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
}

export interface NextUpItem {
  id: string;
  label: string;
  time: string;
  title: string;
  instructor: string;
  category: string;
}

export async function getNextStreams(): Promise<NextUpItem[]> {
  try {
    const result = await gasCall('getScheduleClasses', {});
    const classes = result?.classes || result?.schedule || [];
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const todayIdx = now.getDay();

    function toMins(t: any): number | null {
      if (!t) return null;
      if (typeof t === 'number' && t > 0 && t < 1) return Math.round(t * 24 * 60);
      const s = String(t).trim();
      const iso = s.match(/\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2}):/);
      if (iso) {
        const utcMins = parseInt(iso[1]) * 60 + parseInt(iso[2]);
        return (utcMins - 8 * 60 + 24 * 60) % (24 * 60);
      }
      const m12 = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (m12) {
        let h = parseInt(m12[1]);
        const mn = parseInt(m12[2]);
        if (m12[3].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (m12[3].toUpperCase() === 'AM' && h === 12) h = 0;
        return h * 60 + mn;
      }
      const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
      if (m24) return parseInt(m24[1]) * 60 + parseInt(m24[2]);
      return null;
    }

    function minsToTime(m: number): string {
      const h = Math.floor(m / 60), mn = m % 60;
      const period = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 || 12;
      return `${h12}:${mn.toString().padStart(2, '0')} ${period}`;
    }

    const upcoming: NextUpItem[] = [];
    for (let dayOffset = 0; dayOffset < 7 && upcoming.length < 4; dayOffset++) {
      const checkIdx = (todayIdx + dayOffset) % 7;
      const checkDay = DAYS[checkIdx];
      const dayClasses = classes.filter((c: any) => {
        const d = String(c.Day || c.day || '').trim();
        return d.toLowerCase() === checkDay.toLowerCase();
      });
      for (const c of dayClasses) {
        const mins = toMins(c.Time || c.time);
        if (mins === null) continue;
        if (dayOffset === 0 && mins <= nowMins + 5) continue;
        const title = String(c.Title || c.title || 'Class');
        const instructor = String(c.Instructor || c.instructor || 'Anthony Curry');
        const lower = title.toLowerCase();
        const category = lower.includes('kid') || lower.includes('teen') ? 'Kids'
          : lower.includes('no-gi') || lower.includes('grappling') || lower.includes('wrestling') ? 'No-Gi'
          : lower.includes('comp') ? 'Comp' : 'Gi';
        const label = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : checkDay.slice(0, 3);
        upcoming.push({
          id: `${checkDay}-${mins}`,
          label, time: minsToTime(mins), title, instructor, category
        });
        if (upcoming.length >= 4) break;
      }
    }
    return upcoming;
  } catch (e) {
    console.error('[streaming] getNextStreams error:', e);
    return [];
  }
}

export function getLiveBadgeStyle() {
  return {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: 5,
    background: '#EF444420',
    border: '1px solid #EF444440',
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    color: '#EF4444',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  };
}
