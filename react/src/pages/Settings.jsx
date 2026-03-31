import { useState } from 'react';
import { useApp } from '../context/AppContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
  { code: 'kn', label: 'Kannada' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'bn', label: 'Bengali' },
  { code: 'mr', label: 'Marathi' },
  { code: 'pa', label: 'Punjabi' },
];

const THEMES = [
  { id: 'olive', label: 'Olive', color: '#5a6e3e' },
  { id: 'rose', label: 'Rose', color: '#c26b72' },
  { id: 'ocean', label: 'Ocean', color: '#2a7fa5' },
  { id: 'sunset', label: 'Sunset', color: '#d4693a' },
  { id: 'amethyst', label: 'Amethyst', color: '#7b5ea7' },
  { id: 'monochrome', label: 'Monochrome', color: '#555' },
  { id: 'forest', label: 'Forest', color: '#2c5e2a' },
  { id: 'gold', label: 'Gold', color: '#c79a2d' },
];

const SECTIONS = [
  { id: 'account', label: 'Account', icon: <AccountIcon /> },
  { id: 'appearance', label: 'Appearance', icon: <PaletteIcon /> },
  { id: 'language', label: 'Language', icon: <LanguageIcon /> },
  { id: 'playback', label: 'Playback & Performance', icon: <PlaybackIcon /> },
  { id: 'privacy', label: 'Privacy', icon: <PrivacyIcon /> },
  { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('account');
  const { theme, setTheme, preferredLanguages, setPreferredLanguage } = useApp();

  function toggleLang(code) {
    if (preferredLanguages.includes(code)) {
      const next = preferredLanguages.filter(l => l !== code);
      setPreferredLanguage(next.length ? next : ['en']);
    } else {
      setPreferredLanguage([...preferredLanguages, code]);
    }
  }

  return (
    <div className="yt-settings-page">
      {/* Page Header */}
      <div className="yt-settings-header">
        <h1 className="yt-settings-title">Settings</h1>
      </div>

      <div className="yt-settings-body">
        {/* Left Sidebar Navigation */}
        <nav className="yt-settings-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`yt-settings-nav-item${activeSection === s.id ? ' active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className="yt-settings-nav-icon">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Panel */}
        <div className="yt-settings-panel">

          {/* Account */}
          {activeSection === 'account' && (
            <div className="yt-settings-section">
              <h2 className="yt-settings-section-title">Account</h2>
              <div className="yt-settings-card">
                <div className="yt-settings-row">
                  <div className="yt-settings-row-label">
                    <div className="yt-settings-label-title">Your account</div>
                    <div className="yt-settings-label-sub">Anonymous session — your data is synced privately.</div>
                  </div>
                  <div className="yt-settings-row-val">
                    <div className="yt-settings-avatar">Y</div>
                  </div>
                </div>
              </div>
              <div className="yt-settings-card">
                <div className="yt-settings-row">
                  <div className="yt-settings-row-label">
                    <div className="yt-settings-label-title">Watch history</div>
                    <div className="yt-settings-label-sub">Your watch history is saved on this device.</div>
                  </div>
                  <a href="/feed/history" className="yt-settings-link-btn">Manage history</a>
                </div>
                <div className="yt-settings-row">
                  <div className="yt-settings-row-label">
                    <div className="yt-settings-label-title">Liked videos</div>
                    <div className="yt-settings-label-sub">Videos you've liked.</div>
                  </div>
                  <a href="/feed/liked" className="yt-settings-link-btn">View liked</a>
                </div>
                <div className="yt-settings-row">
                  <div className="yt-settings-row-label">
                    <div className="yt-settings-label-title">Watch later</div>
                    <div className="yt-settings-label-sub">Videos saved for later.</div>
                  </div>
                  <a href="/feed/watch_later" className="yt-settings-link-btn">View list</a>
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="yt-settings-section">
              <h2 className="yt-settings-section-title">Appearance</h2>
              <div className="yt-settings-card">
                <div className="yt-settings-sub-title">Active theme</div>
                <div className="yt-settings-current-theme">
                  {THEMES.find(t => t.id === theme)?.label || 'Gold'}
                </div>
                <div className="yt-settings-theme-grid">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      className={`yt-settings-theme-swatch${theme === t.id ? ' selected' : ''}`}
                      onClick={() => setTheme(t.id)}
                      title={t.label}
                    >
                      <div className="yt-swatch-color" style={{ background: t.color }} />
                      <span className="yt-swatch-label">{t.label}</span>
                      {theme === t.id && (
                        <span className="yt-swatch-check">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Language */}
          {activeSection === 'language' && (
            <div className="yt-settings-section">
              <h2 className="yt-settings-section-title">Language & Content</h2>
              <div className="yt-settings-card">
                <div className="yt-settings-sub-title">Preferred content languages</div>
                <p className="yt-settings-label-sub" style={{ marginBottom: 16 }}>
                  Content across Home, Trending, Shorts, and all categories will be tailored to your selected languages.
                </p>
                <div className="yt-settings-lang-grid">
                  {LANGUAGES.map(l => {
                    const active = preferredLanguages.includes(l.code);
                    return (
                      <button
                        key={l.code}
                        className={`yt-settings-lang-btn${active ? ' active' : ''}`}
                        onClick={() => toggleLang(l.code)}
                      >
                        {active && (
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        )}
                        {l.label}
                      </button>
                    );
                  })}
                </div>
                <div className="yt-settings-active-langs">
                  Active: <strong>{preferredLanguages.map(c => LANGUAGES.find(l => l.code === c)?.label || c).join(', ')}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Playback */}
          {activeSection === 'playback' && (
            <div className="yt-settings-section">
              <h2 className="yt-settings-section-title">Playback & Performance</h2>
              <div className="yt-settings-card">
                <SettingsToggle label="Autoplay next video" sub="Automatically play the next video." defaultChecked />
                <SettingsToggle label="Always show captions" sub="Display captions when available." />
                <SettingsToggle label="Include auto-generated captions" sub="Include auto-generated captions in search." defaultChecked />
                <SettingsToggle label="Animated thumbnails" sub="Preview video content on hover." defaultChecked />
              </div>
            </div>
          )}

          {/* Privacy */}
          {activeSection === 'privacy' && (
            <div className="yt-settings-section">
              <h2 className="yt-settings-section-title">Privacy</h2>
              <div className="yt-settings-card">
                <SettingsToggle label="Save watch history" sub="Videos you watch will be saved to your history." defaultChecked />
                <SettingsToggle label="Save search history" sub="Searches will be saved for recommendations." defaultChecked />
                <SettingsToggle label="Personalized ads" sub="Allow YouTube to use your data for ads." />
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="yt-settings-section">
              <h2 className="yt-settings-section-title">Notifications</h2>
              <div className="yt-settings-card">
                <SettingsToggle label="Subscriptions" sub="Get notified from channels you subscribed to." defaultChecked />
                <SettingsToggle label="Recommended videos" sub="Get notifications for recommended videos." defaultChecked />
                <SettingsToggle label="Activity on my comments" sub="Reply and like notifications on your comments." defaultChecked />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsToggle({ label, sub, defaultChecked = false }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="yt-settings-toggle-row">
      <div className="yt-settings-row-label">
        <div className="yt-settings-label-title">{label}</div>
        <div className="yt-settings-label-sub">{sub}</div>
      </div>
      <button
        className={`yt-toggle-switch${on ? ' on' : ''}`}
        onClick={() => setOn(v => !v)}
        aria-checked={on}
        role="switch"
      >
        <div className="yt-toggle-thumb" />
      </button>
    </div>
  );
}

// Icons
function AccountIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>; }
function PaletteIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>; }
function LanguageIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>; }
function PlaybackIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>; }
function PrivacyIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>; }
function BellIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>; }
