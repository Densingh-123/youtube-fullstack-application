// Generic API fetch hook with loading/error state and client-side cache
import { useState, useEffect, useRef } from 'react';

const apiCache = new Map();

// Use deployed backend URL if env var is set, otherwise use /api (Vite proxy)
const API_BASE = import.meta.env.VITE_API_URL || '';

function applyLang(path) {
  if (!path) return path;
  let lang = 'en';
  try { 
    const langsStr = localStorage.getItem('yt_languages');
    if (langsStr) {
      const parsed = JSON.parse(langsStr);
      if (Array.isArray(parsed) && parsed.length > 0) lang = parsed.join(',');
    } else {
      lang = localStorage.getItem('yt_language') || 'en'; 
    }
  } catch {}
  return path.includes('?') ? `${path}&hl=${lang}` : `${path}?hl=${lang}`;
}

export function useApi(path) {
  const localizedPath = applyLang(path);
  const url = localizedPath ? `${API_BASE}${localizedPath}` : null;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Return cached
    if (apiCache.has(url)) {
      setData(apiCache.get(url));
      setLoading(false);
      setError(null);
      return;
    }

    // Abort previous
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (!d.success) throw new Error(d.error || 'API error');
        apiCache.set(url, d);
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// Standalone fetch for one-off calls
export async function apiFetch(path) {
  const localizedPath = applyLang(path);
  const url = `${API_BASE}${localizedPath}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  if (!d.success) throw new Error(d.error || 'API error');
  return d;
}
