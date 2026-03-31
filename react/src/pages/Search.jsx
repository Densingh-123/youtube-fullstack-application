import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import VideoCard from '../components/VideoCard';
import { VideoGridSkeleton } from '../components/LoadingSpinner';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');
  const navigate = useNavigate();

  const { data, loading, error } = useApi(q ? `/api/search?q=${encodeURIComponent(q)}` : null);

  if (!q) {
    return (
      <div className="yt-page-empty" style={{ paddingTop: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2>Search for videos</h2>
        <p>Type something in the search bar above to get started.</p>
      </div>
    );
  }

  const videos = data?.videos || [];
  const channels = data?.channels || [];
  const playlists = data?.playlists || [];

  return (
    <div className="yt-search-page">
      <div className="yt-search-header">
        <button className="yt-search-filter-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15 17h6v1h-6v-1zm-4-4h10v1H11v-1zm-4-4h14v1H7V9zm-4-4h18v1H3V5zm0 14v1h6v-1H3zm0-4v1h10v-1H3zm0-4v1h14v-1H3z"/></svg>
          Filters
        </button>
      </div>

      <div className="yt-search-results">
        {error && (
          <div style={{ padding: 24, color: 'var(--yt-red)' }}>{error}</div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <VideoGridSkeleton count={8} />
          </div>
        ) : (
          <>
            {channels.slice(0, 1).map(c => (
              <div key={c.id} className="yt-search-channel-card" onClick={() => navigate(`/channel/${c.id}`)}>
                <div className="yt-search-channel-avatar">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt={c.name} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
                      {(c.name || 'C')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="yt-search-channel-info">
                  <div className="yt-search-channel-name">{c.name}</div>
                  <div className="yt-search-channel-meta">
                    {c.subscribers || ''} • {c.videoCount || ''}
                  </div>
                  <div className="yt-search-channel-desc">{c.description || ''}</div>
                </div>
                <button className="yt-subscribe-btn">Subscribe</button>
              </div>
            ))}

            {channels.length > 0 && <div className="yt-search-divider" />}

            {videos.map(v => (
              <VideoCard key={v.id} video={v} layout="list" />
            ))}

            {videos.length === 0 && channels.length === 0 && !error && (
              <div className="yt-page-empty">
                <div className="yt-page-empty-icon">🔍</div>
                <h2>No results found</h2>
                <p>Try different keywords or remove search filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
