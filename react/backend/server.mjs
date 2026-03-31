import express from 'express';
import cors from 'cors';
import { Innertube, UniversalCache } from 'youtubei.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: '*', methods: ['GET', 'OPTIONS'] }));
app.use(express.json());

// ─── Simple in-memory cache ──────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// ─── YouTube.js Sessions (mapped by locale) ──────────────────────────────────
const sessionCache = {};

async function getSession(hl = 'en', gl = 'US') {
  const key = `${hl}-${gl}`;
  if (sessionCache[key]) return sessionCache[key];

  console.log(`[YouTube.js] Creating InnerTube session for ${key}...`);
  const yt = await Innertube.create({
    hl,
    gl,
    generate_session_locally: true,
    cache: new UniversalCache(false),
    fetch: (input, init) => fetch(input, init),
  });
  console.log(`[YouTube.js] Session ready for ${key}!`);
  
  sessionCache[key] = yt;

  // Protect memory by limiting to 5 active locales
  const keys = Object.keys(sessionCache);
  if (keys.length > 5) {
    delete sessionCache[keys[0]];
  }

  return yt;
}

// Helper to safely stringify a value
function safeStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val.toString === 'function') {
    const s = val.toString();
    if (s === '[object Object]') return '';
    return s;
  }
  return String(val);
}

// Extract duration as formatted string from YouTube.js duration object or number
function safeDuration(dur) {
  if (!dur) return '';
  if (typeof dur === 'string') return dur;
  if (typeof dur === 'number') {
    const m = Math.floor(dur / 60);
    const s = dur % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  if (dur && typeof dur === 'object') {
    if (dur.text && typeof dur.text === 'string') return dur.text;
    if (dur.simple_text && typeof dur.simple_text === 'string') return dur.simple_text;
    const s = Object.prototype.toString.call(dur);
    if (s !== '[object Object]') return s;
    if (Array.isArray(dur.runs)) return dur.runs.map(r => r.text || '').join('');
  }
  return '';
}

// Helper to extract thumbnail URL
function getThumbnail(thumbnails) {
  if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) return null;
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0].url || null;
}

// Helper to extract channel ID from various possible locations in YouTube.js objects
function getChannelId(v) {
  const id = v.author?.id || v.channel_id || v.channelId || v.authorId || null;
  // Valid YouTube channel IDs always start with UC
  if (id && typeof id === 'string' && id.startsWith('UC')) return id;
  return null;
}

// Helper to extract channel name from various possible locations in YouTube.js objects
function getChannelName(v) {
  const name = v.author?.name || v.author?.text || v.author || null;
  if (name && typeof name === 'string' && name !== 'Unknown') return name;
  return null;
}

// Map video raw object to clean format
function mapVideo(v) {
  const channelId = getChannelId(v);
  const authorName = getChannelName(v);
  return {
    id: v.id,
    title: safeStr(v.title),
    author: authorName || 'Unknown Channel',
    channelId: channelId || '',
    thumbnail: getThumbnail(v.thumbnails),
    views: safeStr(v.view_count),
    duration: safeDuration(v.duration),
    publishedAt: safeStr(v.published),
    type: 'video',
  };
}

// Helper to map language code to name for better search queries
const langMap = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese',
  ko: 'Korean', ru: 'Russian', ar: 'Arabic', pt: 'Portuguese',
  ml: 'Malayalam', bn: 'Bengali', gu: 'Gujarati', mr: 'Marathi',
  ur: 'Urdu', it: 'Italian', nl: 'Dutch', tr: 'Turkish'
};
function getLangName(code) { return langMap[code] || code; }

// ─── HOME FEED ───────────────────────────────────────────────────────────────
// Returns 200+ videos by doing multiple search queries in parallel
app.get('/api/home', async (req, res) => {
  const { hl = 'en' } = req.query;
  try {
    const cacheKey = `home-${hl}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const langs = hl.split(',');
    const primaryLang = langs[0];
    const yt = await getSession(primaryLang);
    let videos = [];

    // Try home feed first
    try {
      const feed = await yt.getHomeFeed();
      const rawVideos = feed.videos && feed.videos.length > 0 ? feed.videos : [];
      if (rawVideos.length > 0) {
        videos = rawVideos.map(mapVideo).filter(v => v.id && v.title);
      }
    } catch (e) {
      console.warn('[/api/home] home feed failed:', e.message);
    }

    // Supplementary searches to reach 200+ videos, incorporating preferred languages
    const baseQueries = [
      'trending videos 2025',
      'most viewed youtube 2025',
      'popular music videos 2025',
      'viral videos 2025',
      'top gaming videos 2025',
      'news today',
      'technology reviews 2025',
      'comedy videos 2025',
      'sports highlights 2025',
    ];

    const supplementQueries = [];
    baseQueries.forEach(q => {
      langs.forEach(lang => {
        supplementQueries.push(`${getLangName(lang)} ${q}`);
      });
    });

    // Shuffle supplement queries so we don't just search one language first
    for (let i = supplementQueries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [supplementQueries[i], supplementQueries[j]] = [supplementQueries[j], supplementQueries[i]];
    }

    const existingIds = new Set(videos.map(v => v.id));
    const targetCount = 200;

    if (videos.length < targetCount) {
      // Pick top 15 queries to avoid overloading
      const queriesToRun = supplementQueries.slice(0, 15);
      const needMore = Math.ceil((targetCount - videos.length) / queriesToRun.length);
      const supplementResults = await Promise.allSettled(
        queriesToRun.map(q => yt.search(q).catch(() => null))
      );
      
      for (const result of supplementResults) {
        if (result.status === 'fulfilled' && result.value) {
          const newVideos = (result.value.videos || [])
            .map(mapVideo)
            .filter(v => v.id && v.title && !existingIds.has(v.id))
            .slice(0, needMore);
          newVideos.forEach(v => existingIds.add(v.id));
          videos.push(...newVideos);
        }
        if (videos.length >= targetCount) break;
      }
    }

    // Shuffle the videos for variety
    for (let i = videos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [videos[i], videos[j]] = [videos[j], videos[i]];
    }

    const result = { videos: videos.slice(0, 220), success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/home]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── HOME CATEGORY FEED ───────────────────────────────────────────────────────
app.get('/api/home/category', async (req, res) => {
  const { q, hl = 'en' } = req.query;
  if (!q || q === 'All') {
    return res.redirect(`/api/home?hl=${hl}`);
  }

  const cacheKey = `home-cat:${q}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const langs = hl.split(',');
    const primaryLang = langs[0];
    const yt = await getSession(primaryLang);
    
    let queries = [];
    langs.forEach(lang => {
      const ln = getLangName(lang);
      queries.push(`${ln} ${q}`);
      queries.push(`${ln} best ${q}`);
      queries.push(`${ln} popular ${q}`);
    });

    const existingIds = new Set();
    let videos = [];

    const results = await Promise.allSettled(
      queries.slice(0, 6).map(query => yt.search(query).catch(() => null))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const newVideos = (result.value.videos || [])
          .map(mapVideo)
          .filter(v => v.id && v.title && !existingIds.has(v.id));
        newVideos.forEach(v => existingIds.add(v.id));
        videos.push(...newVideos);
      }
    }

    for (let i = videos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [videos[i], videos[j]] = [videos[j], videos[i]];
    }

    const result = { videos: videos.slice(0, 60), success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/home/category]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── SHORTS FEED ─────────────────────────────────────────────────────────────
app.get('/api/shorts', async (req, res) => {
  const { hl = 'en' } = req.query;
  try {
    const cacheKey = `shorts-${hl}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const langs = hl.split(',');
    const yt = await getSession(langs[0]);
    
    const baseQueries = [
      'shorts viral 2025', 'funny shorts 2025', 'trending shorts music',
      'shorts comedy 2025', 'shorts dance 2025', 'shorts gaming 2025'
    ];
    
    const queries = [];
    baseQueries.forEach(q => {
      langs.forEach(lang => {
        queries.push(`${getLangName(lang)} ${q}`);
      });
    });

    for (let i = queries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queries[i], queries[j]] = [queries[j], queries[i]];
    }

    const existingIds = new Set();
    let shorts = [];

    const results = await Promise.allSettled(
      queries.slice(0, 10).map(q => yt.search(q, { type: 'video' }).catch(() => null))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const newShorts = (result.value.videos || [])
          .map(v => ({
            id: v.id,
            title: safeStr(v.title),
            author: v.author?.name || safeStr(v.author) || '',
            channelId: v.author?.id || '',
            thumbnail: getThumbnail(v.thumbnails),
            views: safeStr(v.view_count),
            duration: safeDuration(v.duration),
            type: 'short',
          }))
          .filter(v => v.id && v.title && !existingIds.has(v.id));
        newShorts.forEach(v => existingIds.add(v.id));
        shorts.push(...newShorts);
      }
    }

    for (let i = shorts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shorts[i], shorts[j]] = [shorts[j], shorts[i]];
    }

    const result = { shorts: shorts.slice(0, 160), success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/shorts]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── TRENDING ─────────────────────────────────────────────────────────────────
app.get('/api/trending', async (req, res) => {
  const { type = 'default', hl = 'en' } = req.query;
  const cacheKey = `trending:${type}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const categoryNames = {
    default: '',
    music: 'music',
    gaming: 'gaming',
    news: 'news',
    films: 'films',
    sports: 'sports',
    live: 'live',
  };

  try {
    const langs = hl.split(',');
    const yt = await getSession(langs[0]);
    
    const queries = [];
    const catName = categoryNames[type] || '';
    
    langs.forEach(lang => {
      const ln = getLangName(lang);
      if (catName) {
        queries.push(`${ln} trending ${catName}`);
        queries.push(`top ${ln} ${catName} this week`);
      } else {
        queries.push(`${ln} trending`);
        queries.push(`${ln} viral videos`);
      }
    });

    const existingIds = new Set();
    let videos = [];

    const results = await Promise.allSettled(
      queries.slice(0, 10).map(q => yt.search(q, { type: 'video' }).catch(() => null))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const newVideos = (result.value.videos || [])
          .map(mapVideo)
          .filter(v => v.id && v.title && !existingIds.has(v.id));
        newVideos.forEach(v => existingIds.add(v.id));
        videos.push(...newVideos);
      }
    }

    for (let i = videos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [videos[i], videos[j]] = [videos[j], videos[i]];
    }

    const response = { videos: videos.slice(0, 60), type, success: true };
    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('[/api/trending]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── SEARCH ──────────────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const { q, type = 'all', hl = 'en' } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required', success: false });

  const cacheKey = `search:${q}:${type}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const opts = {};
    if (type === 'video') opts.type = 'video';
    else if (type === 'channel') opts.type = 'channel';
    else if (type === 'playlist') opts.type = 'playlist';

    const search = await yt.search(q, opts);

    const videos = (search.videos || []).slice(0, 40).map(v => ({
      id: v.id,
      title: safeStr(v.title),
      author: v.author?.name || safeStr(v.author) || '',
      channelId: v.author?.id || '',
      thumbnail: getThumbnail(v.thumbnails),
      views: safeStr(v.view_count),
      duration: safeDuration(v.duration),
      publishedAt: safeStr(v.published),
      description: safeStr(v.description_snippet || v.description),
      type: 'video',
    }));

    const channels = (search.channels || []).slice(0, 10).map(c => ({
      id: c.id,
      name: c.author?.name || safeStr(c.title) || '',
      thumbnail: getThumbnail(c.author?.thumbnails || c.thumbnails),
      subscribers: safeStr(c.subscriber_count),
      videoCount: safeStr(c.video_count),
      description: safeStr(c.description_snippet || c.description),
      type: 'channel',
    }));

    const playlists = (search.playlists || []).slice(0, 10).map(p => ({
      id: p.id,
      title: safeStr(p.title),
      author: p.author?.name || safeStr(p.author) || '',
      thumbnail: getThumbnail(p.thumbnails),
      videoCount: safeStr(p.video_count),
      type: 'playlist',
    }));

    const result = { videos, channels, playlists, query: q, success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/search]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── SEARCH SUGGESTIONS ───────────────────────────────────────────────────────
app.get('/api/suggestions', async (req, res) => {
  const { q, hl = 'en' } = req.query;
  if (!q) return res.json({ suggestions: [], success: true });

  const cacheKey = `suggestions:${q}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const suggestions = await yt.getSearchSuggestions(q);
    const result = { suggestions: suggestions.slice(0, 8), success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/suggestions]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── VIDEO INFO ───────────────────────────────────────────────────────────────
app.get('/api/video/:id', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;
  const cacheKey = `video:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const info = await yt.getInfo(id);

    const b = info.basic_info;
    const si = info.secondary_info;
    const formats = info.streaming_data?.formats || [];
    
    const bestFormat = formats
      .filter(f => f.has_audio && f.has_video)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    
    // Attempt to extract real channel ID from multiple possible locations in VideoInfo
    const authorId = b.channel_id || si?.owner?.author?.id || info.primary_info?.author?.id || null;
    const finalChannelId = (authorId && typeof authorId === 'string' && authorId.startsWith('UC')) ? authorId : null;
    
    // Attempt to extract real channel name
    const authorName = si?.owner?.author?.name || b.author || info.primary_info?.author?.name || null;
    const finalAuthorName = (authorName && typeof authorName === 'string' && authorName !== 'Unknown') ? authorName : 'Unknown Channel';

    const videoData = {
      id,
      title: safeStr(b.title),
      description: safeStr(b.description),
      author: finalAuthorName,
      channelId: finalChannelId,
      views: b.view_count,
      likes: b.like_count,
      duration: b.duration,
      isLive: b.is_live,
      isShort: b.duration ? b.duration < 61 : false,
      thumbnail: getThumbnail(b.thumbnail),
      keywords: b.tags || [],
      category: safeStr(b.category),
      publishedAt: safeStr(b.start_timestamp),
      streamUrl: bestFormat?.url || null,
      type: 'video',
      success: true,
    };

    setCache(cacheKey, videoData);
    res.json(videoData);
  } catch (err) {
    console.error('[/api/video/:id]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── VIDEO RECOMMENDATIONS ────────────────────────────────────────────────────
app.get('/api/video/:id/recommendations', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;
  const cacheKey = `recommendations:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);

    // Get video info to extract title, category, keywords
    let title = '';
    let category = '';
    let tags = [];
    try {
      const info = await yt.getInfo(id);
      title = safeStr(info.basic_info.title);
      category = safeStr(info.basic_info.category);
      tags = (info.basic_info.tags || []).slice(0, 3);
    } catch (e) {}

    // Determine language name (e.g. "ta" -> "Tamil")
    const langCode = hl.split(',')[0];
    const langName = getLangName(langCode);
    const isNonEnglish = langCode !== 'en';

    // Map YouTube category to a search-friendly genre word
    const genreMap = {
      'Music': 'songs',
      'Entertainment': 'entertainment',
      'Comedy': 'comedy',
      'Film & Animation': 'movies',
      'Sports': 'sports highlights',
      'Gaming': 'gaming',
      'News & Politics': 'news',
      'People & Blogs': 'vlogs',
      'Science & Technology': 'tech',
      'Education': 'education',
      'Howto & Style': 'how to',
      'Travel & Events': 'travel',
    };
    const genre = genreMap[category] || 'videos';

    // Build language + category aware search queries
    let queries;
    if (isNonEnglish) {
      // e.g. Tamil user watching music: ["Tamil songs", "Tamil comedy 2025", "Tamil Kannaana"]
      const firstTag = tags[0] || title.split(' ')[0] || '';
      queries = [
        `${langName} ${genre}`,
        `${langName} ${genre} 2025`,
        firstTag ? `${langName} ${firstTag}` : null,
      ].filter(Boolean);
    } else {
      // English user: use video title terms + category
      const terms = title ? title.split(' ').slice(0, 4).join(' ') : 'popular videos';
      queries = [
        `${terms}`,
        `${category} ${genre} popular`,
      ];
    }

    // Deduplicate and limit to max 3 parallel requests (Vercel timeout safety)
    queries = [...new Set(queries.filter(q => q && q.length > 2))].slice(0, 3);

    const results = await Promise.allSettled(
      queries.map(q => yt.search(q, { type: 'video' }).catch(() => null))
    );

    const existingIds = new Set([id]);
    let videos = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        const newVideos = (r.value.videos || [])
          .map(mapVideo)
          .filter(v => v.id && v.title && !existingIds.has(v.id));
        newVideos.forEach(v => existingIds.add(v.id));
        videos.push(...newVideos);
      }
    }

    // Shuffle for variety
    for (let i = videos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [videos[i], videos[j]] = [videos[j], videos[i]];
    }

    const result = { videos: videos.slice(0, 100), success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/video/:id/recommendations]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── VIDEO COMMENTS ───────────────────────────────────────────────────────────
app.get('/api/video/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;
  const cacheKey = `comments:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const commentsData = await yt.getComments(id);

    const comments = (commentsData.contents || []).slice(0, 30).map(thread => {
      const c = thread.comment;
      return {
        id: c?.id || Math.random().toString(36).slice(2),
        author: c?.author?.name?.toString() || 'Unknown',
        authorAvatar: getThumbnail(c?.author?.thumbnails),
        content: c?.content?.toString() || '',
        likes: c?.vote_count?.toString() || '0',
        publishedAt: c?.published_time?.toString() || '',
        isOwner: c?.author_is_channel_owner || false,
        replyCount: thread.reply_count || 0,
      };
    });

    const result = { comments, success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/video/:id/comments]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── VIDEO TRANSCRIPT ─────────────────────────────────────────────────────────
app.get('/api/video/:id/transcript', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;
  const cacheKey = `transcript:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const info = await yt.getInfo(id);
    const transcriptData = await info.getTranscript();

    const segments = [];
    const body = transcriptData?.transcript?.content?.body;
    if (body?.initial_segments) {
      body.initial_segments.slice(0, 100).forEach(seg => {
        segments.push({
          text: safeStr(seg.snippet?.text || seg.snippet),
          startMs: seg.start_ms,
          endMs: seg.end_ms,
        });
      });
    }

    const result = { segments, success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/video/:id/transcript]', err.message);
    res.status(500).json({ error: err.message, segments: [], success: false });
  }
});

// ─── VIDEO DOWNLOAD ───────────────────────────────────────────────────────────
app.get('/api/video/:id/download', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;

  try {
    const yt = await getSession(hl);
    const info = await yt.getInfo(id);
    
    // Choose the best format with both video and audio
    const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    if (!format) {
      return res.status(404).send('No suitable download format found');
    }

    const title = safeStr(info.basic_info.title).replace(/[^a-zA-Z0-9]/g, '_') || id;
    res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.header('Content-Type', 'video/mp4');

    const stream = await info.download({ type: 'video+audio', quality: 'best' });
    
    // Pipe the download stream to the HTTP response
    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    console.error('[/api/video/:id/download]', err.message);
    res.status(500).send('Failed to download video');
  }
});

// ─── CHANNEL INFO ─────────────────────────────────────────────────────────────
app.get('/api/channel/:id', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;

  // Guard: only real YouTube channel IDs start with UC
  if (!id || id.startsWith('ch_') || (!id.startsWith('UC') && id.length < 20)) {
    console.warn(`[/api/channel/:id] Rejected invalid channel ID: ${id}`);
    return res.status(400).json({ id, name: 'Unknown Channel', success: false, error: 'Invalid channel ID' });
  }

  const cacheKey = `channel:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const channel = await yt.getChannel(id);
    const meta = channel.metadata;

    const result = {
      id,
      name: safeStr(meta.title),
      description: safeStr(meta.description),
      subscribers: safeStr(meta.subscriber_count),
      thumbnail: getThumbnail(meta.avatar),
      banner: getThumbnail(meta.banner),
      isFamilySafe: meta.is_family_safe,
      tags: meta.tags || [],
      success: true,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/channel/:id]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── CHANNEL VIDEOS ───────────────────────────────────────────────────────────
app.get('/api/channel/:id/videos', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;

  // Guard: only real YouTube channel IDs start with UC
  if (!id || id.startsWith('ch_') || (!id.startsWith('UC') && id.length < 20)) {
    console.warn(`[/api/channel/:id/videos] Rejected invalid channel ID: ${id}`);
    return res.status(400).json({ id, videos: [], success: false, error: 'Invalid channel ID' });
  }

  const cacheKey = `channel-videos:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const channel = await yt.getChannel(id);
    const videosPage = await channel.getVideos();

    const videos = (videosPage.videos || []).slice(0, 30).map(v => ({
      id: v.id,
      title: safeStr(v.title),
      thumbnail: getThumbnail(v.thumbnails),
      views: safeStr(v.view_count),
      duration: safeDuration(v.duration),
      publishedAt: safeStr(v.published),
      type: 'video',
    }));

    const result = { videos, success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/channel/:id/videos]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── CHANNEL SHORTS ───────────────────────────────────────────────────────────
app.get('/api/channel/:id/shorts', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;
  const cacheKey = `channel-shorts:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const channel = await yt.getChannel(id);
    const shortsPage = await channel.getShorts();

    const shorts = (shortsPage.videos || []).slice(0, 30).map(v => ({
      id: v.id,
      title: safeStr(v.title),
      thumbnail: getThumbnail(v.thumbnails),
      views: safeStr(v.view_count),
      duration: safeDuration(v.duration),
      type: 'short',
    }));

    const result = { shorts, success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/channel/:id/shorts]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── CHANNEL PLAYLISTS ────────────────────────────────────────────────────────
app.get('/api/channel/:id/playlists', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;
  const cacheKey = `channel-playlists:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const channel = await yt.getChannel(id);
    const playlistsPage = await channel.getPlaylists();

    const playlists = (playlistsPage.playlists || []).slice(0, 20).map(p => ({
      id: p.id,
      title: safeStr(p.title),
      thumbnail: getThumbnail(p.thumbnails),
      videoCount: safeStr(p.video_count),
      type: 'playlist',
    }));

    const result = { playlists, success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/channel/:id/playlists]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── CHANNEL ABOUT ────────────────────────────────────────────────────────────
app.get('/api/channel/:id/about', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;
  const cacheKey = `channel-about:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const channel = await yt.getChannel(id);
    const about = await channel.getAbout();

    const result = {
      country: safeStr(about.country),
      description: safeStr(about.description || about.metadata?.description),
      joinedDate: safeStr(about.joined_date),
      viewCount: safeStr(about.view_count),
      links: (about.links || []).map(l => ({
        title: safeStr(l.title),
        url: safeStr(l.url),
      })),
      success: true,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/channel/:id/about]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── PLAYLIST ─────────────────────────────────────────────────────────────────
app.get('/api/playlist/:id', async (req, res) => {
  const { id } = req.params;
  const { hl = 'en' } = req.query;
  const cacheKey = `playlist:${id}-${hl}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yt = await getSession(hl);
    const playlist = await yt.getPlaylist(id);

    const info = {
      id,
      title: safeStr(playlist.info?.title),
      description: safeStr(playlist.info?.description),
      author: safeStr(playlist.info?.author?.name),
      thumbnail: getThumbnail(playlist.info?.thumbnails),
      videoCount: safeStr(playlist.info?.total_items),
    };

    const videos = (playlist.videos || []).slice(0, 50).map(v => ({
      id: v.id,
      title: safeStr(v.title),
      author: v.author?.name || safeStr(v.author) || '',
      thumbnail: getThumbnail(v.thumbnails),
      duration: safeDuration(v.duration),
      type: 'video',
    }));

    const result = { info, videos, success: true };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[/api/playlist/:id]', err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const session = await getSession();
    res.json({
      status: 'ok',
      session: !!session,
      cacheSize: cache.size,
      uptime: process.uptime(),
      success: true,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message, success: false });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`\n🚀 YouTube.js API Server running at http://localhost:${PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   GET /api/home`);
    console.log(`   GET /api/home/category?q=<category>`);
    console.log(`   GET /api/shorts`);
    console.log(`   GET /api/trending?type=default|music|gaming|news|films|sports|live`);
    console.log(`   GET /api/search?q=<query>`);
    console.log(`   GET /api/suggestions?q=<query>`);
    console.log(`   GET /api/video/:id`);
    console.log(`   GET /api/video/:id/recommendations`);
    console.log(`   GET /api/video/:id/comments`);
    console.log(`   GET /api/video/:id/transcript`);
    console.log(`   GET /api/video/:id/download`);
    console.log(`   GET /api/channel/:id`);
    console.log(`   GET /api/channel/:id/videos`);
    console.log(`   GET /api/channel/:id/shorts`);
    console.log(`   GET /api/channel/:id/playlists`);
    console.log(`   GET /api/channel/:id/about`);
    console.log(`   GET /api/playlist/:id`);
    console.log(`   GET /api/health\n`);

    try {
      await getSession();
    } catch (err) {
      console.error('Session warmup failed:', err.message);
    }
  });
}

export default app;
