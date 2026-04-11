import { useState, useEffect } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getStreamStatus, getStreamArchive, getEmbedUrl, getLiveBadgeStyle } from "@/lib/streaming";
import type { StreamStatus, ArchiveEntry } from "@/lib/streaming";

export default function LivePage() {
  const [stream, setStream] = useState<StreamStatus>({
    isLive: false, videoId: '', videoUrl: '', className: '',
    instructor: '', startedAt: '', durationMinutes: 0, thumbnail: '',
  });
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStreamStatus().then(setStream).finally(() => setLoading(false));
    const interval = setInterval(() => {
      getStreamStatus().then(setStream);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getStreamArchive(activeCategory || undefined).then(setArchives);
  }, [activeCategory]);

  if (loading) {
    return (
      <div className="app-content">
        <ScreenHeader title="Live" subtitle="Class Streaming" />
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 13, color: '#555' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-content">
      <ScreenHeader title="Live" subtitle="Class Streaming" />

      <div className="px-5 pb-6">
        {/* Now Live section */}
        {stream.isLive && (
          <div style={{ margin: '0 0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ ...getLiveBadgeStyle() }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'livePulse 1.5s ease-in-out infinite' }} />
                LIVE
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0' }}>{stream.className}</span>
              <span style={{ fontSize: 12, color: '#666' }}>w/ {stream.instructor}</span>
            </div>

            {/* YouTube embed */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 14, overflow: 'hidden', background: '#0D0D0D' }}>
              <iframe
                src={getEmbedUrl(stream.videoId)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={stream.className}
              />
            </div>

            {/* Stream info bar */}
            <div style={{ display: 'flex', gap: 16, marginTop: 10, padding: '10px 14px', background: '#141414', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: '#888' }}>🕐 {stream.durationMinutes}m in</div>
              <div style={{ fontSize: 12, color: '#888' }}>{stream.instructor}</div>
            </div>
          </div>
        )}

        {/* Not Live — empty state */}
        {!stream.isLive && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#141414', borderRadius: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', marginBottom: 6 }}>No Live Class</div>
            <div style={{ fontSize: 13, color: '#555' }}>When a class goes live, it will appear here automatically.</div>
          </div>
        )}

        {/* Archive Section */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: 14 }}>Class Archive</div>

          {/* Category filter tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
            {['All', 'Gi', 'No-Gi', 'Kids', 'Comp', 'Open Mat'].map(cat => (
              <button key={cat}
                onClick={() => setActiveCategory(cat === 'All' ? '' : cat)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none',
                  background: activeCategory === (cat === 'All' ? '' : cat) ? '#C8A24C' : '#141414',
                  color: activeCategory === (cat === 'All' ? '' : cat) ? '#000' : '#888',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}
              >{cat}</button>
            ))}
          </div>

          {/* Archive grid */}
          {archives.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#555', fontSize: 13 }}>
              No recordings yet — past streams will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {archives.map(entry => (
                <a key={entry.archiveId} href={entry.videoUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', gap: 12, background: '#141414', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', alignItems: 'stretch' }}>
                  {/* Thumbnail */}
                  <div style={{ width: 120, flexShrink: 0, background: '#0D0D0D', position: 'relative' }}>
                    {entry.thumbnail ? (
                      <img src={entry.thumbnail} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎥</div>
                    )}
                    {/* Play overlay */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="12" viewBox="0 0 10 12" fill="#fff"><polygon points="0,0 10,6 0,12" /></svg>
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, padding: '10px 12px 10px 0' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F0', marginBottom: 4, lineHeight: 1.3 }}>{entry.title}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{entry.date} · {entry.duration}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>w/ {entry.instructor}</div>
                    {entry.category && (
                      <span style={{ display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#1A1A1A', color: '#C8A24C', border: '1px solid #2A2A2A' }}>{entry.category}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
