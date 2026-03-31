import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import VideoCard from '../components/VideoCard';
import ShortsShelf from '../components/ShortsShelf';
import { VideoGridSkeleton } from '../components/LoadingSpinner';
import { isLongVideo } from '../utils/helpers';

import { useApp } from '../context/AppContext';

const BASE_CHIPS = [
  'All', 'Music', 'Gaming', 'Live', 'News', 'Mixes', 'Lo-fi music', 
  'Podcasts', 'Comedy', 'Sports', 'Films', 'Cooking', 'Fashion', 
  'Tech', 'Science', 'Travel', 'Fitness', 'Cars', 'Animals', 
  'Education', 'Animation', 'Horror', 'Documentary', 'Vlogging', 
  'DIY', 'Art', 'Dance', 'Nature', 'History', 'Recently uploaded',
];

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeChip = searchParams.get('chip') || 'All';
  const { searchMetrics } = useApp();

  const [categoryVideos, setCategoryVideos] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const chipsRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);

  // Home feeds
  const { data: homeData, loading: homeLoading, error: homeError } = useApi('/api/home');
  const { data: shortsData } = useApi('/api/shorts'); // specifically fetch actual shorts

  // Compute combined chips dynamically
  const displayChips = useMemo(() => {
    const dynamicTags = Object.entries(searchMetrics || {})
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]) // highest first
      .map(([tag]) => tag.charAt(0).toUpperCase() + tag.slice(1));
      
    const uniqueDynamic = dynamicTags.filter(
      dt => !BASE_CHIPS.some(c => c.toLowerCase() === dt.toLowerCase())
    );
    return ['All', ...uniqueDynamic, ...BASE_CHIPS.slice(1)];
  }, [searchMetrics]);

  // Fetch category data when chip changes
  useEffect(() => {
    if (activeChip === 'All') {
      setCategoryVideos(null);
      return;
    }
    setCategoryLoading(true);
    apiFetch(`/api/home/category?q=${encodeURIComponent(activeChip)}`)
      .then(d => { setCategoryVideos(d.videos || []); })
      .catch(() => { setCategoryVideos([]); })
      .finally(() => setCategoryLoading(false));
  }, [activeChip]);

  function handleChipClick(chip) {
    if (chip === 'All') {
      navigate('/');
    } else {
      navigate(`/?chip=${encodeURIComponent(chip)}`);
    }
  }

  // Chips scroll logic
  function handleChipsScroll() {
    const el = chipsRef.current;
    if (!el) return;
    setShowLeftScroll(el.scrollLeft > 0);
    setShowRightScroll(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }

  function scrollChips(dir) {
    const el = chipsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 200, behavior: 'smooth' });
  }

  const videosToShow = useMemo(() => {
    const raw = activeChip === 'All' ? (homeData?.videos || []) : (categoryVideos || []);
    const shuffled = [...raw].filter(isLongVideo);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [homeData, categoryVideos, activeChip]);

  const isLoading = activeChip === 'All' ? homeLoading : categoryLoading;
  const error = activeChip === 'All' ? homeError : null;

  // Split: first 16 regular videos, then shorts shelf (using genuine shorts), then remaining
  const mainVideos1 = videosToShow.slice(0, 16);
  const shortsShelf = (shortsData?.shorts || []).slice(0, 20); // Real shorts
  const mainVideos2 = videosToShow.slice(16);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Category Chips */}
      <div className="yt-chips-wrap">
        {showLeftScroll && (
          <button className="yt-chips-arrow yt-chips-arrow-left" onClick={() => scrollChips(-1)} aria-label="Scroll left">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
          </button>
        )}
        <div
          className="yt-chips-inner"
          ref={chipsRef}
          onScroll={handleChipsScroll}
        >
          {displayChips.map(chip => (
            <button
              key={chip}
              className={`yt-chip${chip.toLowerCase() === activeChip.toLowerCase() ? ' active' : ''}`}
              onClick={() => handleChipClick(chip)}
              id={`chip-${chip.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {chip}
            </button>
          ))}
        </div>
        {showRightScroll && (
          <button className="yt-chips-arrow yt-chips-arrow-right" onClick={() => scrollChips(1)} aria-label="Scroll right">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px 0' }}>
        {error && (
          <div style={{ padding: '16px 24px', background: 'rgba(255,0,0,0.08)', color: 'var(--yt-red)', borderRadius: 12, margin: '0 24px 16px' }}>
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <VideoGridSkeleton count={20} />
        ) : (
          <>
            {/* Primary Grid */}
            {mainVideos1.length > 0 && (
              <div className="yt-video-grid">
                {mainVideos1.map(video => (
                  <VideoCard key={`p1-${video.id}`} video={video} />
                ))}
              </div>
            )}

            {/* Shorts Shelf */}
            {(shortsShelf.length > 0) && (
              <ShortsShelf shorts={shortsShelf} />
            )}

            {/* Secondary Grid */}
            {mainVideos2.length > 0 && (
              <div className="yt-video-grid">
                {mainVideos2.map(video => (
                  <VideoCard key={`p2-${video.id}`} video={video} />
                ))}
              </div>
            )}

            {!isLoading && videosToShow.length === 0 && !error && (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--yt-text-secondary)' }}>
                <div style={{ fontSize: 48, margin: '0 auto 16px' }}></div>
                <p style={{ fontSize: 16 }}>No videos found for "{activeChip}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


