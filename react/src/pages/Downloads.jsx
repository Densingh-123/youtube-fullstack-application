import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import VideoCard from '../components/VideoCard';
import { VideoGridSkeleton } from '../components/LoadingSpinner';

export default function Downloads() {
  const { downloads, removeDownload, clearDownloads } = useApp();
  const navigate = useNavigate();
  const { data, loading } = useApi('/api/home');
  const recs = (data?.videos || []).slice(0, 16);

  const isEmpty = !downloads || downloads.length === 0;

  function formatViews(views) {
    if (!views) return '';
    const str = String(views).replace(/[^0-9]/g, '');
    const n = parseInt(str, 10);
    if (isNaN(n)) return '';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M views';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K views';
    return n + ' views';
  }

  return (
    <div className="yt-page">
      <div className="yt-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'flex', color: 'var(--yt-blue)' }}><DownloadIcon size={32} /></span>
          <h1 className="yt-page-title">Downloads</h1>
        </div>
        {!isEmpty && (
          <button
            className="yt-action-btn"
            onClick={clearDownloads}
            style={{ marginLeft: 'auto', color: 'var(--yt-red)' }}
          >
            Clear all
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="yt-page-empty">
          <div className="yt-page-empty-icon" style={{ color: 'var(--yt-text-secondary)' }}>
            <DownloadIcon size={64} />
          </div>
          <h2>No downloads yet</h2>
          <p>Videos you download will appear here. You can watch them offline anytime.</p>
          <button className="yt-sign-in-btn" onClick={() => navigate('/')}>Browse videos</button>
        </div>
      ) : (
        <div className="yt-downloads-list">
          {downloads.map(video => (
            <div key={`${video.id}-${video.downloadedAt}`} className="yt-download-item">
              <div className="yt-download-thumb-wrap" onClick={() => navigate(`/video/${video.id}`)}>
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} className="yt-download-thumb" />
                ) : (
                  <div className="yt-download-thumb-placeholder">
                    <DownloadIcon size={32} />
                  </div>
                )}
                {video.duration && <span className="yt-video-duration">{video.duration}</span>}
                {/* Offline badge */}
                <span className="yt-offline-badge">
                  <OfflineIcon />
                  Offline
                </span>
              </div>
              <div className="yt-download-info">
                <div className="yt-download-title" onClick={() => navigate(`/video/${video.id}`)}>
                  {video.title}
                </div>
                <div className="yt-download-meta">
                  <span>{video.author}</span>
                  {video.views && <span> • {formatViews(video.views)}</span>}
                </div>
                <div className="yt-download-date">
                  Downloaded {video.downloadedAt ? new Date(video.downloadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
                <div className="yt-download-actions">
                  <button
                    className="yt-action-btn"
                    onClick={() => navigate(`/video/${video.id}`)}
                    title="Play video"
                  >
                    <PlayIcon /> Play
                  </button>
                  <button
                    className="yt-action-btn"
                    onClick={() => removeDownload && removeDownload(video.id)}
                    title="Remove download"
                    style={{ color: 'var(--yt-red)' }}
                  >
                    <TrashIcon /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended for Download */}
      <div className="yt-downloads-recs" style={{ marginTop: 40, borderTop: '1px solid var(--yt-border)', paddingTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Recommended to Download</h2>
        <div className="yt-video-grid">
          {loading ? (
            <VideoGridSkeleton count={8} />
          ) : (
            recs.map(video => <VideoCard key={`rec-${video.id}`} video={video} />)
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadIcon({ size = 24 }) { return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>; }
function OfflineIcon() { return <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" /></svg>; }
function PlayIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>; }
