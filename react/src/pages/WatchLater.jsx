import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

function formatViews(views) {
  if (!views) return '';
  const str = String(views).replace(/[^0-9]/g, '');
  const n = parseInt(str, 10);
  if (isNaN(n)) return views;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M views';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K views';
  return n + ' views';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function WatchLater() {
  const { watchLater, removeFromWatchLater, dbLoading } = useApp();
  const navigate = useNavigate();

  const filteredWL = watchLater.filter(v => v.id);
  const cover = filteredWL.find(v => v.thumbnail)?.thumbnail;
  const totalDuration = filteredWL.reduce((acc, v) => acc + (typeof v.duration === 'number' ? v.duration : 0), 0);
  const totalMin = Math.floor(totalDuration / 60);

  return (
    <div className="lib-page">
      {/* Hero Header */}
      <div className="lib-hero">
        <div className="lib-hero-cover watchlater-gradient">
          {cover && <img src={cover} alt="cover" className="lib-hero-cover-img" />}
          <div className="lib-hero-cover-overlay" />
          <div className="lib-hero-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
            </svg>
          </div>
        </div>
        <div className="lib-hero-info">
          <span className="lib-hero-label">Playlist</span>
          <h1 className="lib-hero-title">Watch Later</h1>
          <p className="lib-hero-count">
            {dbLoading ? 'Loading…' : `${filteredWL.length} video${filteredWL.length !== 1 ? 's' : ''}${totalMin > 0 ? ` · ${totalMin} min` : ''}`}
          </p>
          <div className="lib-hero-actions">
            {watchLater.length > 0 && (
              <button className="lib-btn-primary" onClick={() => navigate(`/video/${filteredWL[0].id}`)}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Play all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="lib-list">
        {dbLoading && (
          <div className="lib-loading">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="lib-skeleton-row">
                <div className="lib-skeleton-thumb" />
                <div className="lib-skeleton-lines">
                  <div className="lib-skeleton-line wide" />
                  <div className="lib-skeleton-line narrow" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!dbLoading && filteredWL.length === 0 && (
          <div className="lib-empty">
            <svg viewBox="0 0 24 24" width="72" height="72" fill="currentColor" opacity=".25">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
            </svg>
            <h3>Your queue is empty</h3>
            <p>Save videos to watch when you have time.</p>
            <button className="lib-btn-primary" onClick={() => navigate('/')}>Browse videos</button>
          </div>
        )}
        {!dbLoading && filteredWL.map((video, i) => (
          <LibraryRow
            key={video.id}
            video={video}
            index={i + 1}
            meta={timeAgo(video.addedAt)}
            metaLabel="Saved"
            onRemove={() => removeFromWatchLater(video.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LibraryRow({ video, index, meta, metaLabel, onRemove }) {
  const navigate = useNavigate();
  const thumb = video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  return (
    <div className="lib-row" onClick={() => navigate(`/video/${video.id}`)}>
      <span className="lib-row-index">{index}</span>
      <div className="lib-row-thumb">
        <img src={thumb} alt={video.title} loading="lazy" />
        {video.duration && <span className="lib-row-duration">{typeof video.duration === 'number' ? `${Math.floor(video.duration/60)}:${String(video.duration%60).padStart(2,'0')}` : video.duration}</span>}
      </div>
      <div className="lib-row-info">
        <div className="lib-row-title">{video.title}</div>
        <div className="lib-row-channel">{video.author}</div>
        <div className="lib-row-meta">{video.views ? `${formatViews(video.views)} • ` : ''}{meta ? `${metaLabel} ${meta}` : ''}</div>
      </div>
      <button
        className="lib-row-remove"
        onClick={e => { e.stopPropagation(); onRemove(); }}
        aria-label="Remove"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  );
}
