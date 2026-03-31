import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { apiFetch } from '../hooks/useApi';

export default function Playlists() {
  const { userPlaylists, createPlaylist, preferredLanguages } = useApp();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    apiFetch(`/api/trending?type=music`)
      .then(d => {
        if (d.videos) setRecommended(d.videos.slice(0, 20));
      })
      .catch(console.error);
  }, [preferredLanguages]);

  const recommendedPlaylist = {
    id: 'pl_recommended',
    title: 'Recommended Music',
    videos: recommended,
    thumbnail: recommended[0]?.thumbnail || null,
  };

  const displayPlaylists = [];
  if (recommended.length > 0) displayPlaylists.push(recommendedPlaylist);
  displayPlaylists.push(...userPlaylists);

  function handleCreate() {
    if (!newName.trim()) return;
    createPlaylist(newName.trim());
    setNewName('');
    setShowCreate(false);
  }

  return (
    <div className="yt-page">
      <div className="yt-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="yt-page-title">Playlists</h1>
        <button
          className="yt-subscribe-btn"
          onClick={() => setShowCreate(true)}
          style={{ background: 'transparent', border: '1px solid var(--yt-border)', color: 'var(--yt-text)' }}
        >
          + New playlist
        </button>
      </div>

      {showCreate && (
        <div className="yt-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="yt-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>New playlist</h3>
            <input
              className="yt-modal-input"
              placeholder="Playlist name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="yt-action-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="yt-subscribe-btn" onClick={handleCreate} disabled={!newName.trim()}>Create</button>
            </div>
          </div>
        </div>
      )}

      {displayPlaylists.length === 0 ? (
        <div className="yt-page-empty">
          <div className="yt-page-empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor"><path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z" /></svg>
          </div>
          <h2>No playlists yet</h2>
          <p>Create your first playlist and start adding videos.</p>
        </div>
      ) : (
        <div className="yt-video-grid" style={{ padding: '0 24px' }}>
          {displayPlaylists.map(pl => (
            <div key={pl.id} className="yt-video-card">
              <div
                className="yt-video-card-thumb-wrap"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/playlist/${pl.id}`)}
              >
                {pl.thumbnail || (pl.videos && pl.videos.length > 0 && pl.videos[0].thumbnail) ? (
                  <img className="yt-video-card-thumb" src={pl.thumbnail || pl.videos[0].thumbnail} alt={pl.title} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--yt-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="var(--yt-text)"><path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z" /></svg>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, background: 'rgba(0,0,0,0.7)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 12, fontWeight: 600 }}>
                  <PlaylistPlayIcon />
                  {pl.videos.length} videos
                </div>
              </div>
              <div 
                className="yt-video-card-info" 
                style={{ cursor: 'pointer' }} 
                onClick={() => navigate(`/playlist/${pl.id}`)}
              >
                <div className="yt-video-card-meta">
                  <div className="yt-video-card-title">{pl.title}</div>
                  <div className="yt-video-card-stats">{pl.videos ? pl.videos.length : 0} video{pl.videos?.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaylistPlayIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h13v-2H2v2zm15 0v6l5-3-5-3z" /></svg>;
}
