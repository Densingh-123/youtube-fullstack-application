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

function formatDuration(sec) {
  if (!sec || typeof sec !== 'number') return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function History() {
  const { history, removeFromHistory, clearHistory, dbLoading } = useApp();
  const navigate = useNavigate();

  const filteredHistory = history.filter(v => v.id);
  const cover = filteredHistory.find(v => v.thumbnail)?.thumbnail;

  return (
    <div className="lib-page">
      {/* Hero Header */}
      <div className="lib-hero">
        <div className="lib-hero-cover history-gradient">
          {cover && <img src={cover} alt="cover" className="lib-hero-cover-img" />}
          <div className="lib-hero-cover-overlay" />
          <div className="lib-hero-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
              <path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v4l4-4-4-4v2zm1 10H12V8h-2v7h4v-2z"/>
            </svg>
          </div>
        </div>
        <div className="lib-hero-info">
          <span className="lib-hero-label">Library</span>
          <h1 className="lib-hero-title">Watch History</h1>
          <p className="lib-hero-count">{dbLoading ? 'Loading…' : `${filteredHistory.length} video${filteredHistory.length !== 1 ? 's' : ''}`}</p>
          <div className="lib-hero-actions">
            {history.length > 0 && (
              <>
                <button className="lib-btn-primary" onClick={() => navigate(`/video/${filteredHistory[0].id}`)}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Play all
                </button>
                <button className="lib-btn-ghost" onClick={clearHistory}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  Clear all
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="lib-list">
        {dbLoading && (
          <div className="lib-loading">
            {[...Array(6)].map((_, i) => (
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
        {!dbLoading && filteredHistory.length === 0 && (
          <div className="lib-empty">
            <svg viewBox="0 0 24 24" width="72" height="72" fill="currentColor" opacity=".25">
              <path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v4l4-4-4-4v2zm1 10H12V8h-2v7h4v-2z"/>
            </svg>
            <h3>No watch history yet</h3>
            <p>Videos you watch will appear here.</p>
            <button className="lib-btn-primary" onClick={() => navigate('/')}>Browse videos</button>
          </div>
        )}
        {!dbLoading && filteredHistory.map((video, i) => (
          <LibraryRow
            key={video.id + (video.watchedAt || i)}
            video={video}
            index={i + 1}
            meta={timeAgo(video.watchedAt)}
            metaLabel="Watched"
            onRemove={() => removeFromHistory(video.id)}
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
