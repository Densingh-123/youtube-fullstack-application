import { useNavigate } from 'react-router-dom';

function timeSince(publishedStr) {
  if (!publishedStr) return '';
  if (typeof publishedStr === 'string' && publishedStr.includes('ago')) return publishedStr;
  return publishedStr;
}

function formatViews(views) {
  if (!views) return '';
  const str = String(views).replace(/[^0-9]/g, '');
  const n = parseInt(str, 10);
  if (isNaN(n)) return views;
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B views';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M views';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K views';
  return n + ' views';
}

export default function VideoCard({ video, layout = 'grid' }) {
  const navigate = useNavigate();

  if (!video || !video.id) return null;

  function handleClick() { navigate(`/video/${video.id}`); }
  function handleChannelClick(e) {
    e.stopPropagation();
    if (video.channelId) navigate(`/channel/${video.channelId}`);
  }

  const isLive = video.isLive || (video.views && String(video.views).includes('watching'));
  const initial = (video.author || video.channel || '?')[0]?.toUpperCase() || '?';

  return (
    <div className={`yt-video-card ${layout === 'list' ? 'list' : ''}`} onClick={handleClick}>
      <div className="yt-video-card-thumb-wrap">
        {video.thumbnail ? (
          <img className="yt-video-card-thumb" src={video.thumbnail} alt={video.title} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--yt-chip-bg)' }} />
        )}
        {video.duration && !isLive && (
          <span className="yt-video-duration">{video.duration}</span>
        )}
        {isLive && (
          <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'var(--yt-red)', color: 'white', padding: '3px 4px', borderRadius: 4, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />LIVE
          </span>
        )}
        
        {/* Hover preview mock actions */}
        <div className="yt-video-hover-actions">
          <button className="yt-action-icon-btn"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></button>
          <button className="yt-action-icon-btn"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg></button>
        </div>
      </div>
      
      <div className="yt-video-card-info">
        {layout === 'list' && (
          <div style={{ display: 'none' }} />
        )}
        
        <div className="yt-video-card-avatar" onClick={handleChannelClick} style={layout === 'list' ? { width: 24, height: 24, fontSize: 13, marginRight: 8, marginTop: 0 } : {}}>
          {initial}
        </div>
        
        <div className="yt-video-card-meta">
          <div className="yt-video-card-title">{video.title || 'Unknown Video'}</div>
          
          {layout === 'list' ? (
            <>
              <div className="yt-video-card-stats" style={{ marginBottom: 4 }}>
                {formatViews(video.views)}{video.views && video.publishedAt ? ' • ' : ''}{timeSince(video.publishedAt)}
              </div>
              {/* Skip repeated avatar, author is enough here */}
              <div className="yt-video-card-channel" onClick={handleChannelClick}>{video.author}</div>
              {video.description && <div className="yt-video-card-desc">{video.description}</div>}
            </>
          ) : (
            <>
              <div className="yt-video-card-channel" onClick={handleChannelClick}>{video.author}</div>
              <div className="yt-video-card-stats">
                {formatViews(video.views)}{video.views && video.publishedAt ? ' • ' : ''}{timeSince(video.publishedAt)}
              </div>
            </>
          )}
        </div>
        
        {layout !== 'list' && (
          <button style={{ background: 'transparent', alignSelf: 'flex-start', color: 'var(--yt-text)' }} aria-label="More">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
