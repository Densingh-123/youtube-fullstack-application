import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function PlaylistModal({ video, onClose }) {
  const { watchLater, addToWatchLater, removeFromWatchLater, userPlaylists, createPlaylist, addVideoToPlaylist } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const modalRef = useRef(null);

  const inWatchLater = watchLater.some(v => v.id === video.id);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  function handleWatchLaterToggle() {
    if (inWatchLater) {
      removeFromWatchLater(video.id);
    } else {
      addToWatchLater(video);
    }
  }

  function handlePlaylistToggle(pl) {
    const exists = pl.videos.some(v => v.id === video.id);
    if (!exists) {
      addVideoToPlaylist(pl.id, video);
    }
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const pl = createPlaylist(newTitle.trim());
    addVideoToPlaylist(pl.id, video);
    setNewTitle('');
    setShowCreate(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        ref={modalRef}
        style={{ background: 'rgba(0,0,0,0.7)', width: 280, borderRadius: 12, display: 'flex', flexDirection: 'column', color: 'var(--yt-text)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', padding: '16px 0', border: '1px solid var(--yt-border)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 12px', borderBottom: '1px solid var(--yt-border)' }}>
          <span style={{ fontSize: 18, fontWeight: 500 }}>Save video to...</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--yt-text)', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div style={{ maxHeight: 200, overflowY: 'auto', padding: '8px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', cursor: 'pointer', gap: 16 }}>
            <input 
              type="checkbox" 
              checked={inWatchLater} 
              onChange={handleWatchLaterToggle}
              style={{ width: 18, height: 18, accentColor: 'var(--yt-blue)' }} 
            />
            <span style={{ fontSize: 16 }}>Watch later</span>
          </label>
          
          {userPlaylists.map(pl => {
            const inThis = pl.videos.some(v => v.id === video.id);
            return (
              <label key={pl.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', cursor: 'pointer', gap: 16 }}>
                <input 
                  type="checkbox" 
                  checked={inThis} 
                  onChange={() => handlePlaylistToggle(pl)}
                  style={{ width: 18, height: 18, accentColor: 'var(--yt-blue)' }} 
                />
                <span style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.title}</span>
              </label>
            )
          })}
        </div>

        <div style={{ borderTop: '1px solid var(--yt-border)', padding: '12px 16px 0', marginTop: 'auto' }}>
          {!showCreate ? (
            <button 
              onClick={() => setShowCreate(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--yt-text)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 16, padding: '8px 8px' }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              Create new playlist
            </button>
          ) : (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--yt-text-secondary)' }}>Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Enter playlist title..."
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--yt-text)', color: 'var(--yt-text)', padding: '4px 0', outline: 'none', fontSize: 15 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="submit" 
                  disabled={!newTitle.trim()}
                  style={{ background: 'transparent', border: 'none', color: newTitle.trim() ? '#3ea6ff' : 'var(--yt-text-disabled)', cursor: newTitle.trim() ? 'pointer' : 'default', fontWeight: 500, padding: '8px 12px' }}
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
