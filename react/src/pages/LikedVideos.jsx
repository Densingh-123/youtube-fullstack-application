import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ShortsShelf from '../components/ShortsShelf';
import { isLongVideo } from '../utils/helpers';


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

export default function LikedVideos() {
  const { likedVideos, likeVideo, dbLoading } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  // Use explicit isShort flag first; only fall back to duration if isShort is undefined
  function classifyLikedVideo(v) {
    if (v.isShort === true) return 'short';
    if (v.isShort === false) return 'video';
    // Legacy entries without isShort flag — use duration
    return isLongVideo(v) ? 'video' : 'short';
  }

  const filteredLiked = likedVideos.filter(v => v.id);
  const likedLong = filteredLiked.filter(v => classifyLikedVideo(v) === 'video');
  const likedShorts = filteredLiked.filter(v => classifyLikedVideo(v) === 'short');

  const cover = filteredLiked.find(v => v.thumbnail)?.thumbnail;

  return (
    <div className="lib-page">
      {/* Hero Header */}
      <div className="lib-hero">
        <div className="lib-hero-cover liked-gradient">
          {cover && <img src={cover} alt="cover" className="lib-hero-cover-img" />}
          <div className="lib-hero-cover-overlay" />
          <div className="lib-hero-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
            </svg>
          </div>
        </div>
        <div className="lib-hero-info">
          <span className="lib-hero-label">Playlist</span>
          <h1 className="lib-hero-title">Liked Videos</h1>
          <p className="lib-hero-count">{dbLoading ? 'Loading…' : `${filteredLiked.length} video${filteredLiked.length !== 1 ? 's' : ''}`}</p>
          <div className="lib-hero-actions">
            {likedVideos.length > 0 && (
              <button className="lib-btn-primary" onClick={() => navigate(`/video/${likedVideos[0].id}`)}>
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
        {!dbLoading && filteredLiked.length === 0 && (
          <div className="lib-empty">
            <svg viewBox="0 0 24 24" width="72" height="72" fill="currentColor" opacity=".25">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
            </svg>
            <h3>No liked videos yet</h3>
            <p>Like videos as you find them — they'll show up here.</p>
            <button className="lib-btn-primary" onClick={() => navigate('/')}>Browse videos</button>
          </div>
        )}

        {!dbLoading && filteredLiked.length > 0 && (
          <div style={{ padding: '16px 24px', display: 'flex', gap: 12, borderBottom: '1px solid var(--yt-border)' }}>
            <button className={`yt-chip${activeTab === 'all' ? ' active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
            {likedLong.length > 0 && <button className={`yt-chip${activeTab === 'videos' ? ' active' : ''}`} onClick={() => setActiveTab('videos')}>Videos</button>}
            {likedShorts.length > 0 && <button className={`yt-chip${activeTab === 'shorts' ? ' active' : ''}`} onClick={() => setActiveTab('shorts')}>Shorts</button>}
          </div>
        )}
        
        <div style={{ paddingTop: 16 }}>
          {!dbLoading && (activeTab === 'all' || activeTab === 'videos') && likedLong.map((video, i) => (
            <LibraryRow
              key={video.id}
              video={video}
              index={i + 1}
              meta={timeAgo(video.likedAt)}
              metaLabel="Liked"
              onRemove={() => likeVideo(video)}
            />
          ))}

          {!dbLoading && (activeTab === 'all' || activeTab === 'shorts') && likedShorts.length > 0 && (
            <div style={{ marginTop: 24, padding: '0 24px' }}>
              {activeTab === 'all' && <h2 style={{ fontSize: 20, marginBottom: 16 }}>Liked Shorts</h2>}
              <ShortsShelf shorts={likedShorts} />
            </div>
          )}
        </div>
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
        aria-label="Unlike"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  );
}
