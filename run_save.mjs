import { Innertube, UniversalCache } from 'youtubei.js';
import { writeFileSync } from 'fs';

const lines = [];
const log = (msg) => { lines.push(msg); process.stdout.write(msg + '\n'); };

log('============================================================');
log('  YouTube.js v17 -- LIVE DEMO');
log('  Framework: Pure Node.js + TypeScript library (NO web framework)');
log('  No API Key Required | MIT License | 100% Free');
log('============================================================');

(async () => {
  try {
    log('\n[STEP 1] Creating InnerTube session...');
    const yt = await Innertube.create({
      generate_session_locally: true,
      cache: new UniversalCache(false)
    });
    log('  Session created OK. No API key needed!');

    log('\n[STEP 2] Searching: "YouTube Shorts funny 2024"');
    const search = await yt.search('YouTube Shorts funny 2024');
    log('  Found ' + search.videos.length + ' videos');
    for (let i = 0; i < Math.min(5, search.videos.length); i++) {
      const v = search.videos[i];
      log('  [' + (i+1) + '] ' + (v.title ? v.title.toString() : 'N/A') + ' | ID: ' + v.id);
    }

    log('\n[STEP 3] Autocomplete suggestions for "shorts"');
    const sugg = await yt.getSearchSuggestions('shorts');
    sugg.slice(0, 6).forEach((s, i) => log('  ' + (i+1) + '. ' + s));

    if (search.videos.length > 0) {
      const id = search.videos[0].id;
      log('\n[STEP 4] Fetching info for video ID: ' + id);
      const info = await yt.getBasicInfo(id);
      const b = info.basic_info;
      log('  Title    : ' + b.title);
      log('  Author   : ' + b.author);
      log('  Views    : ' + (b.view_count ? b.view_count.toLocaleString() : 'N/A'));
      log('  Likes    : ' + (b.like_count ? b.like_count.toLocaleString() : 'N/A'));
      log('  Duration : ' + b.duration + ' seconds');
      log('  Is Short : ' + (b.duration < 61 ? 'YES (under 61s)' : 'NO'));
      const desc = b.description ? b.description.toString().replace(/\n/g,' ').slice(0, 150) : '';
      log('  Desc     : ' + desc);

      log('\n[STEP 5] Fetching comments for same video...');
      try {
        const comments = await yt.getComments(id);
        log('  Got ' + comments.contents.length + ' comment threads');
        for (let i = 0; i < Math.min(3, comments.contents.length); i++) {
          const c = comments.contents[i];
          const author = c.comment?.author?.name?.toString() || 'Unknown';
          const text = c.comment?.content?.toString().slice(0, 80) || '';
          log('  Comment ' + (i+1) + ' by ' + author + ': ' + text);
        }
      } catch (e) {
        log('  (Comments: ' + e.message + ')');
      }
    }

    log('\n[STEP 6] Fetching MrBeast channel (UCX6OQ3DkcsbYNE6H8uQQuVA)...');
    const ch = await yt.getChannel('UCX6OQ3DkcsbYNE6H8uQQuVA');
    log('  Channel  : ' + ch.metadata.title);
    log('  Subs     : ' + ch.metadata.subscriber_count);

    log('\n  Latest Videos:');
    const vids = await ch.getVideos();
    vids.videos.slice(0, 5).forEach((v, i) => {
      log('  [' + (i+1) + '] ' + (v.title ? v.title.toString() : 'N/A') + ' | ID: ' + v.id);
    });

    log('\n  Shorts from Channel:');
    try {
      const shorts = await ch.getShorts();
      if (shorts.videos && shorts.videos.length > 0) {
        shorts.videos.slice(0, 5).forEach((v, i) => {
          log('  [' + (i+1) + '] ' + (v.title ? v.title.toString() : 'N/A') + ' | ID: ' + v.id);
        });
      } else {
        log('  (No shorts returned)');
      }
    } catch (e) {
      log('  (Shorts: ' + e.message + ')');
    }

    log('\n============================================================');
    log('  ALL DONE! YouTube.js is LIVE and working!');
    log('  Framework : Pure TypeScript/Node.js library (NOT React/Next/Express)');
    log('  API Key   : NOT required');
    log('  Cost      : FREE (MIT License)');
    log('============================================================');

    writeFileSync('./demo_output.txt', lines.join('\n'), 'utf8');
    log('\n  Full output saved to: demo_output.txt');

  } catch (err) {
    log('\nERROR: ' + err.message);
    writeFileSync('./demo_output.txt', lines.join('\n') + '\nERROR: ' + err.message, 'utf8');
  }
})();
