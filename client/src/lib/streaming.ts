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
    return (result as any)?.archives || [];
  } catch {
    return [];
  }
}

export function getEmbedUrl(videoId: string): string {
  if (!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
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
