import { useParams, Link } from 'react-router-dom';
import { useApi, apiFetch } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import { VideoGridSkeleton } from '../components/LoadingSpinner';

export default function Playlist() {
  const { id } = useParams();
  const { userPlaylists, preferredLanguages } = useApp();
  const isLocal = id?.startsWith('pl_');
  
  const [recPl, setRecPl] = useState(null);
  
  useEffect(() => {
    if (id === 'pl_recommended') {
      apiFetch(`/api/trending?type=music`)
        .then(d => {
          if (d.videos) {
            setRecPl({
              id: 'pl_recommended',
              title: 'Recommended Music',
              videos: d.videos.slice(0, 20),
              thumbnail: d.videos[0]?.thumbnail || null
            });
          }
        }).catch(console.error);
    }
  }, [id, preferredLanguages]);

  const localPl = id === 'pl_recommended' ? recPl : (isLocal ? userPlaylists.find(p => p.id === id) : null);

  const { data, loading, error } = useApi(!isLocal && id ? `/api/playlist/${id}` : null);

  if ((loading && !isLocal) || (id === 'pl_recommended' && !recPl)) return (
    <div className="yt-page">
      <div style={{ padding: 40 }}><VideoGridSkeleton count={1} /></div>
    </div>
  );

  if (error && !isLocal) return (
    <div className="yt-page">
      <div style={{ padding: 40, color: 'var(--yt-red)' }}>{error}</div>
    </div>
  );

  const playlistData = isLocal ? localPl : data;
  if (!playlistData) return null;

  let { title = 'Unnamed Playlist', author = 'You', authorId = '', views, lastUpdated, videos: rawVideos = [] } = playlistData;
  if (title === 'Unknown Playlist') title = 'Unnamed Playlist';
  const videos = (rawVideos || []).filter(v => v.id);

  return (
    <div className="yt-page" style={{ display: 'flex', gap: 24, padding: 24, maxWidth: 1800, margin: '0 auto', alignItems: 'flex-start' }}>

      {/* Left fixed panel */}
      <div className="yt-playlist-sidebar" style={{ width: 360, flexShrink: 0, position: 'sticky', top: 80 }}>
        <div style={{ background: 'var(--yt-chip-bg)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Thumb */}
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative' }}>
            {videos?.[0]?.thumbnail ? (
              <img src={videos[0].thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px)', opacity: 0.8 }} alt="" />
            ) : null}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {videos?.[0]?.thumbnail && (
                <img src={videos[0].thumbnail} style={{ width: 'auto', height: '100%', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} alt={title} />
              )}
            </div>
          </div>
          {/* Info */}
          <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--yt-text)' }}>{title}</h1>
            <div style={{ margin: '16px 0' }}>
              {authorId ? (
                <Link to={`/channel/${authorId}`} style={{ fontWeight: 600, color: 'var(--yt-text)' }}>{author}</Link>
              ) : (
                <span style={{ fontWeight: 600, color: 'var(--yt-text)' }}>{author}</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--yt-text-secondary)', marginBottom: 24 }}>
              Playlist • {videos.length || 0} videos
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Link
                to={videos[0] ? `/video/${videos[0].id}` : '#'}
                className="yt-action-pill"
                style={{ flex: 1, height: 36, borderRadius: 18, background: 'var(--yt-text)', color: 'var(--yt-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 500, opacity: videos.length ? 1 : 0.5, pointerEvents: videos.length ? 'auto' : 'none', textDecoration: 'none' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                Play all
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right list */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 16 }}>
        {videos.map((video, idx) => (
          <div key={video.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--yt-border)' }}>
            <div style={{ color: 'var(--yt-text-secondary)', fontSize: 13, width: 24, textAlign: 'center' }}>{idx + 1}</div>
            <div style={{ flex: 1 }}>
              <VideoCard video={video} layout="list" />
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <div className="yt-page-empty">
            <p>This playlist is empty.</p>
          </div>
        )}
      </div>

    </div>
  );
}
