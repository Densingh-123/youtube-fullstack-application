import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const { data: dbData, loading: dbLoading, syncToFirebase } = useFirebaseSync();

  // ─── Local States (Synced with Firebase) ──────────────────────────────────
  const [theme, setThemeState] = useState(localStorage.getItem('yt_theme') || 'gold');
  const [searchMetrics, setSearchMetrics] = useState({});
  const [subscriptions, setSubscriptions] = useState([]);
  const [preferredLanguages, setPreferredLanguages] = useState(['en']);
  const [history, setHistory] = useState([]);
  const [likedVideos, setLikedVideos] = useState([]);
  const [watchLater, setWatchLater] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [miniPlayerVideo, setMiniPlayerVideo] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ─── Sanitization Helpers ────────────────────────────────────────────────
  const sanitizeThumb = useCallback((thumb, videoId) => {
    if (!thumb) return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
    if (typeof thumb === 'string') return thumb;
    if (Array.isArray(thumb)) {
      const sorted = [...thumb].sort((a, b) => (b.width || 0) - (a.width || 0));
      return sorted[0]?.url || null;
    }
    if (thumb && typeof thumb === 'object') return thumb.url || null;
    return null;
  }, []);

  const sanitizeVideo = useCallback((video) => {
    if (!video || !video.id) return null;
    return {
      id: String(video.id),
      title: typeof video.title === 'string' ? video.title : String(video.title?.text || video.title || 'Unnamed Video'),
      author: typeof video.author === 'string' ? video.author : String(video.author?.name || video.author || 'Unknown Channel'),
      channelId: typeof video.channelId === 'string' ? video.channelId : (video.authorId || ''),
      thumbnail: sanitizeThumb(video.thumbnail, video.id),
      duration: typeof video.duration === 'string' ? video.duration : String(video.duration || ''),
      views: typeof video.views === 'string' ? video.views : String(video.views || ''),
      isShort: !!video.isShort,
      likedAt: video.likedAt || undefined,
      watchedAt: video.watchedAt || undefined,
      addedAt: video.addedAt || undefined
    };
  }, [sanitizeThumb]);

  // Hydrate from Firebase when data changes
  useEffect(() => {
    if (dbData) {
      if (dbData.theme) {
        setThemeState(dbData.theme);
        localStorage.setItem('yt_theme', dbData.theme);
      }
      if (dbData.searchMetrics) setSearchMetrics(dbData.searchMetrics);
      
      // Subscriptions self-healing
      if (dbData.subscriptions) {
        const raw = dbData.subscriptions;
        const cleaned = raw.filter(ch => ch && ch.id && typeof ch.id === 'string' && ch.id.startsWith('UC'));
        setSubscriptions(cleaned);
        if (cleaned.length !== raw.length) syncToFirebase({ subscriptions: cleaned });
      }

      // Library self-healing (History, Liked, Watch Later, Playlists)
      const heal = (list) => (list || []).map(sanitizeVideo).filter(Boolean);
      
      if (dbData.history) setHistory(heal(dbData.history));
      if (dbData.likedVideos) setLikedVideos(heal(dbData.likedVideos));
      if (dbData.watchLater) setWatchLater(heal(dbData.watchLater));
      
      if (dbData.userPlaylists) {
        const healedPlaylists = (dbData.userPlaylists || []).map(pl => ({
          ...pl,
          title: pl.title || 'Unnamed Playlist',
          videos: heal(pl.videos)
        }));
        setUserPlaylists(healedPlaylists);
      }

      if (dbData.preferredLanguages) setPreferredLanguages(dbData.preferredLanguages);
      if (dbData.notifications) setNotifications(dbData.notifications);
      if (dbData.downloads) setDownloads(dbData.downloads);
    }
  }, [dbData, sanitizeVideo, syncToFirebase]);

  // ─── Theme & Language Preferences ─────────────────────────────────────────
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('yt_theme', newTheme);
    syncToFirebase({ theme: newTheme });
  }, [syncToFirebase]);

  const setPreferredLanguage = useCallback((langs) => {
    setPreferredLanguages(langs);
    localStorage.setItem('yt_languages', JSON.stringify(langs));
    syncToFirebase({ preferredLanguages: langs });
  }, [syncToFirebase]);

  // ─── Search Metrics (Dynamic Tags Logger) ───────────────────────────────
  const logSearch = useCallback((query) => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearchMetrics(prev => {
      const updated = { ...prev, [q]: (prev[q] || 0) + 1 };
      syncToFirebase({ searchMetrics: updated });
      return updated;
    });
  }, [syncToFirebase]);

  // ─── Subscriptions ────────────────────────────────────────────────────────
  const subscribe = useCallback((channel) => {
    // Only store real YouTube channels (UC...) — never fake ch_ IDs
    if (!channel.id || !channel.id.startsWith('UC')) return;
    const safeChannel = {
      id: String(channel.id),
      name: typeof channel.name === 'string' ? channel.name : String(channel.name || 'Unknown'),
      thumbnail: (() => {
        const t = channel.thumbnail;
        if (!t) return null;
        if (typeof t === 'string') return t;
        if (Array.isArray(t)) { const s = [...t].sort((a,b)=>(b.width||0)-(a.width||0)); return s[0]?.url || null; }
        if (t && typeof t === 'object') return t.url || null;
        return null;
      })(),
    };
    setSubscriptions(prev => {
      if (prev.some(c => c.id === safeChannel.id)) return prev;
      const updated = [safeChannel, ...prev];
      syncToFirebase({ subscriptions: updated });
      addNotification({
        id: Date.now().toString(),
        type: 'subscription',
        title: `You subscribed to ${safeChannel.name}`,
        channelId: safeChannel.id,
        channelName: safeChannel.name,
        channelThumbnail: safeChannel.thumbnail,
        timestamp: new Date().toISOString(),
        read: false,
      });
      return updated;
    });
  }, [syncToFirebase]);

  const unsubscribe = useCallback((channelId) => {
    setSubscriptions(prev => {
      const updated = prev.filter(c => c.id !== channelId);
      syncToFirebase({ subscriptions: updated });
      return updated;
    });
  }, [syncToFirebase]);

  const isSubscribed = useCallback((channelId) => {
    return subscriptions.some(c => c.id === channelId);
  }, [subscriptions]);

  // ─── History ──────────────────────────────────────────────────────────────
  const addToHistory = useCallback((video) => {
    const safeVideo = sanitizeVideo(video);
    if (!safeVideo) return;
    setHistory(prev => {
      const filtered = prev.filter(v => v.id !== safeVideo.id);
      const updated = [{ ...safeVideo, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 200);
      syncToFirebase({ history: updated });
      return updated;
    });
  }, [syncToFirebase, sanitizeVideo]);

  const removeFromHistory = useCallback((videoId) => {
    setHistory(prev => {
      const updated = prev.filter(v => v.id !== videoId);
      syncToFirebase({ history: updated });
      return updated;
    });
  }, [syncToFirebase]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    syncToFirebase({ history: [] });
  }, [syncToFirebase]);

  // ─── Liked Videos ─────────────────────────────────────────────────────────
  const likeVideo = useCallback((video) => {
    const safeVideo = sanitizeVideo(video);
    if (!safeVideo) return;
    setLikedVideos(prev => {
      const exists = prev.some(v => v.id === safeVideo.id);
      const updated = exists
        ? prev.filter(v => v.id !== safeVideo.id)
        : [{ ...safeVideo, likedAt: new Date().toISOString() }, ...prev];
      syncToFirebase({ likedVideos: updated });
      return updated;
    });
  }, [syncToFirebase, sanitizeVideo]);

  const isLiked = useCallback((videoId) => {
    return likedVideos.some(v => v.id === videoId);
  }, [likedVideos]);

  // ─── Watch Later ──────────────────────────────────────────────────────────
  const addToWatchLater = useCallback((video) => {
    const safeVideo = sanitizeVideo(video);
    if (!safeVideo) return;
    setWatchLater(prev => {
      if (prev.some(v => v.id === safeVideo.id)) return prev;
      const updated = [{ ...safeVideo, addedAt: new Date().toISOString() }, ...prev];
      syncToFirebase({ watchLater: updated });
      return updated;
    });
  }, [syncToFirebase, sanitizeVideo]);

  const removeFromWatchLater = useCallback((videoId) => {
    setWatchLater(prev => {
      const updated = prev.filter(v => v.id !== videoId);
      syncToFirebase({ watchLater: updated });
      return updated;
    });
  }, [syncToFirebase]);

  const isInWatchLater = useCallback((videoId) => {
    return watchLater.some(v => v.id === videoId);
  }, [watchLater]);

  // ─── Notifications ────────────────────────────────────────────────────────
  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 50);
      syncToFirebase({ notifications: updated });
      return updated;
    });
  }, [syncToFirebase]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      syncToFirebase({ notifications: updated });
      return updated;
    });
  }, [syncToFirebase]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    syncToFirebase({ notifications: [] });
  }, [syncToFirebase]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ─── Downloads ────────────────────────────────────────────────────────────
  const addDownload = useCallback((video) => {
    setDownloads(prev => {
      const filtered = prev.filter(v => v.id !== video.id);
      const updated = [{ ...video, downloadedAt: new Date().toISOString() }, ...filtered];
      syncToFirebase({ downloads: updated });
      return updated;
    });
  }, [syncToFirebase]);

  const removeDownload = useCallback((videoId) => {
    setDownloads(prev => {
      const updated = prev.filter(v => v.id !== videoId);
      syncToFirebase({ downloads: updated });
      return updated;
    });
  }, [syncToFirebase]);

  const clearDownloads = useCallback(() => {
    setDownloads([]);
    syncToFirebase({ downloads: [] });
  }, [syncToFirebase]);

  // ─── Playlists ────────────────────────────────────────────────────────────
  const createPlaylist = useCallback((name) => {
    const playlist = {
      id: `pl_${Date.now()}`,
      title: name,
      videos: [],
      createdAt: new Date().toISOString(),
      thumbnail: null,
    };
    setUserPlaylists(prev => {
      const updated = [playlist, ...prev];
      syncToFirebase({ userPlaylists: updated });
      return updated;
    });
    return playlist;
  }, [syncToFirebase]);


  const addVideoToPlaylist = useCallback((playlistId, video) => {
    const safeVideo = sanitizeVideo(video);
    if (!safeVideo) return;
    setUserPlaylists(prev => {
      const updated = prev.map(pl => {
        if (pl.id !== playlistId) return pl;
        if (pl.videos.some(v => v.id === safeVideo.id)) return pl;
        return {
          ...pl,
          videos: [safeVideo, ...pl.videos],
          thumbnail: pl.thumbnail || safeVideo.thumbnail,
        };
      });
      syncToFirebase({ userPlaylists: updated });
      return updated;
    });
  }, [syncToFirebase, sanitizeVideo]);

  const value = {
    // Theme & Search
    theme, setTheme,
    searchMetrics, logSearch,
    // Language (Now Array)
    preferredLanguage: preferredLanguages.join(','),
    preferredLanguages,
    setPreferredLanguage,
    // Subscriptions
    subscriptions, subscribe, unsubscribe, isSubscribed,
    // History
    history, addToHistory, removeFromHistory, clearHistory,
    // Liked
    likedVideos, likeVideo, isLiked,
    // Watch Later
    watchLater, addToWatchLater, removeFromWatchLater, isInWatchLater,
    // Notifications
    notifications, addNotification, markAllNotificationsRead, clearNotifications, unreadCount,
    // Playlists
    userPlaylists, createPlaylist, addVideoToPlaylist,
    // Downloads
    downloads, addDownload, removeDownload, clearDownloads,
    // Miniplayer (Global)
    miniPlayerVideo, setMiniPlayerVideo,
    dbLoading
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
