import { useNavigate } from 'react-router-dom';

export default function ShortsShelf({ shorts }) {
  const navigate = useNavigate();

  if (!shorts || shorts.length === 0) return null;

  return (
    <div className="yt-shorts-shelf" style={{ marginBottom: 24 }}>
      <div className="yt-shorts-shelf-header" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px', marginBottom: 16, fontSize: 20, fontWeight: 700 }}>
        <ShortsIcon />
        <span>Shorts</span>
      </div>
      <div className="yt-shorts-shelf-grid" style={{ display: 'flex', gap: 16, padding: '0 24px', overflowX: 'auto', paddingBottom: 16, snapType: 'x mandatory' }}>
        {shorts.map(video => (
          <div
            key={`short-${video.id}`}
            className="yt-short-card"
            style={{ minWidth: 210, width: 210, cursor: 'pointer', flexShrink: 0, scrollSnapAlign: 'start' }}
            onClick={() => navigate(`/shorts?id=${video.id}`)}
            id={`short-${video.id}`}
          >
            <div className="yt-short-card-thumb" style={{ position: 'relative', aspectRatio: '9/16', borderRadius: 12, overflow: 'hidden', background: 'var(--yt-hover)' }}>
              {video.thumbnail && (
                <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              )}
              <div className="yt-short-card-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="white"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <div className="yt-short-card-info" style={{ marginTop: 12 }}>
              <div className="yt-short-card-title" style={{ fontSize: 16, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {video.title}
              </div>
              <div className="yt-short-card-views" style={{ fontSize: 13, color: 'var(--yt-text-secondary)', marginTop: 4 }}>
                {video.views || ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 24px', marginTop: 8 }}>
        <button 
          onClick={() => navigate('/shorts')}
          className="yt-icon-btn"
          style={{ width: '100%', padding: '10px 0', borderRadius: 20, background: 'var(--yt-chip-bg)', fontWeight: 500, fontSize: 14, border: 'none', color: 'var(--yt-text)', cursor: 'pointer' }}
        >
          Show more
        </button>
      </div>
    </div>
  );
}

function ShortsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--yt-red)">
      <path d="M17.77 10.32l-1.2-.5L18 9c1.07-.43 1.58-1.67 1.15-2.74-.43-1.07-1.67-1.58-2.74-1.15l-8 3.26c-1.07.43-1.58 1.67-1.15 2.74.43.92 1.37 1.44 2.34 1.3l1.2.5L9 13c-1.07.43-1.58 1.67-1.15 2.74.4.96 1.38 1.54 2.38 1.38l1.5.62v1.26c0 1.1.9 2 2 2h.54c1.1 0 2-.9 2-2v-1.76c.91-.37 1.54-1.26 1.54-2.24 0-.72-.31-1.37-.81-1.82l-.76-.31L16 14c1.07-.43 1.58-1.67 1.15-2.74-.2-.48-.56-.86-1.38-1.06v.12zm-3.77 4.43c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
    </svg>
  );
}
