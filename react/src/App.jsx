import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import VideoDetail from './pages/VideoDetail';
import Channel from './pages/Channel';
import Playlist from './pages/Playlist';
import Shorts from './pages/Shorts';
import Subscriptions from './pages/Subscriptions';
import Profile from './pages/Profile';
import History from './pages/History';
import Playlists from './pages/Playlists';
import YourVideos from './pages/YourVideos';
import WatchLater from './pages/WatchLater';
import LikedVideos from './pages/LikedVideos';
import Trending from './pages/Trending';
import Music from './pages/Music';
import Gaming from './pages/Gaming';
import News from './pages/News';
import Films from './pages/Films';
import Live from './pages/Live';
import Sports from './pages/Sports';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Downloads from './pages/Downloads';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';

function ScrollRestoration() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ScrollTopBtn() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);
  if (!visible) return null;
  return (
    <button
      className="scroll-top-btn"
      id="scroll-top-btn"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}

function NotFound() {
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--yt-text)' }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}></div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>This page isn't available</h2>
      <p style={{ color: 'var(--yt-text-secondary)', marginBottom: 24 }}>Sorry about that. Try searching for something else.</p>
      <a href="/" style={{ display: 'inline-block', padding: '10px 20px', border: '1px solid var(--yt-border)', borderRadius: 20, color: 'var(--yt-text)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
        Go to Home
      </a>
    </div>
  );
}

function GlobalMiniPlayer() {
  const { miniPlayerVideo, setMiniPlayerVideo } = useApp();
  const navigate = useNavigate();
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartInfo = useRef(null);

  if (!miniPlayerVideo) return null;

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    dragStartInfo.current = { startX: e.clientX, startY: e.clientY, initPosX: pos.x, initPosY: pos.y };
    setIsDragging(false); // don't trigger click if dragging
  };

  const handlePointerMove = (e) => {
    if (!dragStartInfo.current) return;
    const dx = dragStartInfo.current.startX - e.clientX;
    const dy = dragStartInfo.current.startY - e.clientY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setIsDragging(true);
    setPos({ x: Math.max(0, dragStartInfo.current.initPosX + dx), y: Math.max(0, dragStartInfo.current.initPosY + dy) });
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    dragStartInfo.current = null;
    if (!isDragging) {
      setMiniPlayerVideo(null);
      navigate(`/video/${miniPlayerVideo.id}`);
    }
    setTimeout(() => setIsDragging(false), 0);
  };
  
  return (
    <div style={{ position: 'fixed', bottom: pos.y, right: pos.x, width: 360, height: 202, background: '#000', borderRadius: 12, overflow: 'hidden', zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid var(--yt-border)', transition: isDragging ? 'none' : 'box-shadow 0.2s' }}>
      <iframe
        src={`https://www.youtube.com/embed/${miniPlayerVideo.id}?autoplay=1&start=${miniPlayerVideo.start || 0}&rel=0&controls=0`}
        width="100%" height="100%" frameBorder="0" allow="autoplay; encrypted-media"
        style={{ pointerEvents: 'none' }}
      />
      <div 
        style={{ position: 'absolute', inset: 0, cursor: isDragging ? 'grabbing' : 'pointer' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <button 
        onClick={(e) => { e.stopPropagation(); setMiniPlayerVideo(null); }}
        style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.8)', color: '#fff', border: 'none', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
      >
        ✕
      </button>
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const isVideoPage = location.pathname.startsWith('/video');
  
  // Track manual toggle state vs automatic route-based state
  const [sidebarMode, setSidebarMode] = useState(isVideoPage ? 'mini' : 'full');
  const [hasManuallyToggled, setHasManuallyToggled] = useState(false);

  useEffect(() => {
    if (!hasManuallyToggled) {
      setSidebarMode(isVideoPage ? 'mini' : 'full');
    }
  }, [isVideoPage, hasManuallyToggled]);

  // Reset manual toggle when changing major routes so it goes back to default
  useEffect(() => {
    setHasManuallyToggled(false);
  }, [location.pathname]);

  function toggleSidebar() {
    setHasManuallyToggled(true);
    setSidebarMode(m => m === 'full' ? 'mini' : 'full');
  }

  // If video page and mini sidebar mode, don't show the mini sidebar in the layout flow
  // (In YouTube, it hides completely or overlays)
  // But for simple consistency, we'll just let it be mini or hidden. 
  // Let's implement what user asked: "just show the icon" (mini sidebar)

  return (
    <AuthProvider>
      <AppProvider>
        <div className="yt-app">
          <Navbar onMenuClick={toggleSidebar} />
          <div className="yt-main-wrap">
            <Sidebar mode={sidebarMode} />
            <main className={`yt-content ${sidebarMode === 'mini' ? 'mini-sidebar' : ''}`} id="main-content">
              <ScrollRestoration />
              <Routes>
                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Main */}
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/shorts" element={<Shorts />} />
                <Route path="/video/:id" element={<VideoDetail />} />
                <Route path="/channel/:id" element={<Channel />} />
                <Route path="/playlist/:id" element={<Playlist />} />

                {/* Feed pages */}
                <Route path="/feed/subscriptions" element={<Subscriptions />} />
                <Route path="/feed/history" element={<History />} />
                <Route path="/feed/playlists" element={<Playlists />} />
                <Route path="/feed/my_videos" element={<YourVideos />} />
                <Route path="/feed/watch_later" element={<WatchLater />} />
                <Route path="/feed/liked" element={<LikedVideos />} />
                <Route path="/you" element={<Profile />} />

                {/* Explore pages */}
                <Route path="/feed/trending" element={<Trending />} />
                <Route path="/feed/music" element={<Music />} />
                <Route path="/feed/gaming" element={<Gaming />} />
                <Route path="/feed/news" element={<News />} />
                <Route path="/feed/films" element={<Films />} />
                <Route path="/feed/live" element={<Live />} />
                <Route path="/feed/sports" element={<Sports />} />

                {/* Settings */}
                <Route path="/settings" element={<Settings />} />
                {/* Downloads */}
                <Route path="/feed/downloads" element={<Downloads />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          <ScrollTopBtn />
          <GlobalMiniPlayer />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
