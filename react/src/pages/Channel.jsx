import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import VideoCard from '../components/VideoCard';
import LoadingSpinner, { VideoGridSkeleton } from '../components/LoadingSpinner';

export default function Channel() {
  const { id } = useParams();
  const [tab, setTab] = useState('videos');

  const { isSubscribed, subscribe, unsubscribe } = useApp();

  const { data: channel, loading: chLoading, error: chError } = useApi(id ? `/api/channel/${id}` : null);
  const { data: videosData, loading: vLoading } = useApi(tab === 'videos' && id ? `/api/channel/${id}/videos` : null);
  const { data: shortsData, loading: sLoading } = useApi(tab === 'shorts' && id ? `/api/channel/${id}/shorts` : null);
  const { data: playlistsData, loading: pLoading } = useApi(tab === 'playlists' && id ? `/api/channel/${id}/playlists` : null);
  const { data: aboutData, loading: aLoading } = useApi(tab === 'about' && id ? `/api/channel/${id}/about` : null);

  if (chLoading) return (
    <div style={{ padding: '40px 24px' }}>
      <VideoGridSkeleton count={1} />
    </div>
  );

  if (chError) return (
    <div style={{ padding: '40px 24px', color: 'var(--yt-red)' }}>
      <div className="error-box">⚠️ {chError}</div>
    </div>
  );

  if (!channel) return null;

  const subscribed = isSubscribed(id);

  function handleSubscribe() {
    if (subscribed) {
      unsubscribe(id);
    } else {
      subscribe({ id: channel.id, name: channel.name, thumbnail: channel.thumbnail });
    }
  }

  const isLoading = vLoading || sLoading || pLoading || aLoading;
  const initial = (channel.name || '?')[0].toUpperCase();

  return (
    <div className="fade-in yt-channel-page">
      {/* Banner */}
      <div className="yt-channel-banner-wrap">
        <div className="yt-channel-banner">
          {channel.banner ? (
            <img src={channel.banner} alt={`${channel.name} banner`} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--yt-chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.2 }}>
              📺
            </div>
          )}
        </div>
      </div>

      {/* Profile strip */}
      <div className="yt-channel-profile-strip">
        <div className="yt-channel-profile-content">
          <div className="yt-channel-avatar-lg">
            {channel.thumbnail ? (
              <img src={channel.thumbnail} alt={channel.name} />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="yt-channel-info-lg">
            <h1 className="yt-channel-name-lg">{channel.name}</h1>
            <div className="yt-channel-stats-lg">
              {channel.handle || `@${channel.name.replace(/\s+/g, '').toLowerCase()}`} ‧ {channel.subscribers || '0 subscribers'}
            </div>
            {channel.description && (
              <div className="yt-channel-desc-preview">
                {channel.description} {'>'}
              </div>
            )}
            <div className="yt-channel-actions">
              <button
                className={`yt-subscribe-btn-lg${subscribed ? ' subscribed' : ''}`}
                onClick={handleSubscribe}
              >
                {subscribed ? (
                  <>
                    <BellIcon />
                    Subscribed
                  </>
                ) : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="yt-channel-tabs">
        {[
          { key: 'videos', label: 'Videos' },
          { key: 'shorts', label: 'Shorts' },
          { key: 'playlists', label: 'Playlists' },
          { key: 'about', label: 'About' },
        ].map(t => (
          <button
            key={t.key}
            className={`yt-channel-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 24px', maxWidth: 1800, margin: '0 auto' }}>
        {isLoading && <div style={{ paddingTop: 24 }}><VideoGridSkeleton count={8} /></div>}

        {/* Videos Tab */}
        {tab === 'videos' && !vLoading && (
          <div className="yt-channel-tab-content">
            {videosData?.videos?.length > 0 ? (
              <div className="yt-video-grid">
                {videosData.videos.map(v => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            ) : (
              <div className="yt-page-empty">
                <p>This channel has no videos.</p>
              </div>
            )}
          </div>
        )}

        {/* Shorts Tab */}
        {tab === 'shorts' && !sLoading && (
          <div className="yt-channel-tab-content">
            {shortsData?.shorts?.length > 0 ? (
              <div className="yt-shorts-grid">
                {shortsData.shorts.map(v => (
                  <div key={v.id} className="yt-short-card-lg">
                    <Link to={`/video/${v.id}`} className="yt-short-card-lg-thumb">
                      <img src={v.thumbnail} alt={v.title} loading="lazy" />
                      <div className="yt-short-card-lg-overlay">
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="white"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </Link>
                    <Link to={`/video/${v.id}`} className="yt-short-card-lg-title">{v.title}</Link>
                    <div className="yt-short-card-lg-views">{v.views || ''}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="yt-page-empty">
                <p>This channel has no shorts.</p>
              </div>
            )}
          </div>
        )}

        {/* Playlists Tab */}
        {tab === 'playlists' && !pLoading && (
          <div className="yt-channel-tab-content">
            {playlistsData?.playlists?.length > 0 ? (
              <div className="yt-video-grid">
                {playlistsData.playlists.map(pl => (
                  <Link key={pl.id} to={`/playlist/${pl.id}`} className="yt-playlist-card">
                    <div className="yt-playlist-card-thumb">
                      {pl.thumbnail ? (
                        <img src={pl.thumbnail} alt={pl.title} loading="lazy" />
                      ) : (
                        <div style={{ background: 'var(--yt-chip-bg)', width: '100%', height: '100%' }} />
                      )}
                      <div className="yt-playlist-card-overlay">
                        <PlaylistIcon />
                        {pl.videoCount}
                      </div>
                    </div>
                    <div className="yt-playlist-card-title">{pl.title}</div>
                    <div className="yt-playlist-card-meta">View full playlist</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="yt-page-empty">
                <p>This channel has no playlists.</p>
              </div>
            )}
          </div>
        )}

        {/* About Tab */}
        {tab === 'about' && !aLoading && aboutData && (
          <div className="yt-channel-about-content">
            <div className="yt-channel-about-main">
              <h2 className="yt-channel-about-title">Description</h2>
              <div className="yt-channel-about-desc">
                {channel.description || 'No description available.'}
              </div>
            </div>
            
            <div className="yt-channel-about-sidebar">
              <h2 className="yt-channel-about-title">Stats</h2>
              <div className="yt-channel-about-stat-list">
                <div className="yt-channel-about-stat-item">Joined {aboutData.joinedDate || 'Unknown'}</div>
                <div className="yt-channel-about-stat-item">{aboutData.viewCount || '0'} views</div>
                {aboutData.country && (
                  <div className="yt-channel-about-stat-item">Location: {aboutData.country}</div>
                )}
              </div>
              
              {aboutData.links?.length > 0 && (
                <>
                  <h2 className="yt-channel-about-title" style={{ marginTop: 24 }}>Links</h2>
                  <div className="yt-channel-about-links">
                    {aboutData.links.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="yt-channel-about-link">
                        {l.title || l.url}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BellIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: 6 }}><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>;
}
function PlaylistIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h13v-2H2v2zm15 0v6l5-3-5-3z"/></svg>;
}
