export function VideoCardSkeleton() {
  return (
    <div className="yt-video-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton skeleton-thumb" />
      <div className="yt-video-card-info">
        <div className="skeleton skeleton-avatar" />
        <div className="yt-video-card-meta">
          <div className="skeleton skeleton-line w100" />
          <div className="skeleton skeleton-line w80" />
          <div className="skeleton skeleton-line w60" />
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 12 }) {
  return (
    <div className="yt-video-grid">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SearchResultSkeleton({ count = 6 }) {
  return (
    <div style={{ padding: '0 24px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0' }}>
          <div className="skeleton" style={{ width: 360, minWidth: 360, aspectRatio: '16/9', borderRadius: 12 }} />
          <div style={{ flex: 1, padding: '4px 0' }}>
            <div className="skeleton skeleton-line w100" style={{ height: 20, marginBottom: 10 }} />
            <div className="skeleton skeleton-line w60" style={{ marginBottom: 10 }} />
            <div className="skeleton skeleton-line w40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChannelSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ width: '100%', height: 180 }} />
      <div style={{ display: 'flex', gap: 24, padding: '24px' }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-line w60" style={{ height: 28, marginBottom: 10 }} />
          <div className="skeleton skeleton-line w40" style={{ marginBottom: 8 }} />
          <div className="skeleton skeleton-line w30" />
        </div>
      </div>
    </div>
  );
}

export function RelatedVideoSkeleton({ count = 8 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, padding: 4 }}>
          <div className="skeleton" style={{ width: 168, minWidth: 168, aspectRatio: '16/9', borderRadius: 8 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line w100" style={{ marginBottom: 6 }} />
            <div className="skeleton skeleton-line w80" style={{ marginBottom: 6 }} />
            <div className="skeleton skeleton-line w60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--yt-chip-bg)',
        borderTopColor: 'var(--yt-red)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
