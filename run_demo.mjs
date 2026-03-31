import { Innertube, UniversalCache } from 'youtubei.js';

console.log('============================================================');
console.log('       YouTube.js (youtubei.js) v17 -- LIVE DEMO');
console.log('       Framework: Node.js ESM + TypeScript Library');
console.log('       No API Key | No Paid Service | 100% Free MIT');
console.log('============================================================');

(async () => {
  try {

    // STEP 1: Create Session  ----------------------------------------
    console.log('\n[STEP 1/5] Creating InnerTube session...');
    const yt = await Innertube.create({
      generate_session_locally: true,
      cache: new UniversalCache(false)
    });
    console.log('  >> Session created successfully! No API key needed.\n');

    // STEP 2: Search Videos  -----------------------------------------
    console.log('[STEP 2/5] Searching for "YouTube Shorts funny 2024"...');
    const searchResults = await yt.search('YouTube Shorts funny 2024');
    console.log('  >> Found ' + searchResults.videos.length + ' results:');

    searchResults.videos.slice(0, 5).forEach((v, i) => {
      const title = v.title ? v.title.toString() : 'N/A';
      const author = v.author ? v.author.name : 'N/A';
      console.log('  ' + (i+1) + '. Title : ' + title);
      console.log('     ID    : ' + v.id);
      console.log('     Author: ' + author);
    });

    // STEP 3: Search Suggestions  ------------------------------------
    console.log('\n[STEP 3/5] Getting autocomplete suggestions for "shorts"...');
    const suggestions = await yt.getSearchSuggestions('shorts');
    console.log('  >> Suggestions:');
    suggestions.slice(0, 6).forEach((s, i) => {
      console.log('  ' + (i+1) + '. ' + s);
    });

    // STEP 4: Get Video Info  ----------------------------------------
    if (searchResults.videos.length > 0) {
      const firstId = searchResults.videos[0].id;
      console.log('\n[STEP 4/5] Fetching full info for video: ' + firstId + ' ...');
      const info = await yt.getBasicInfo(firstId);
      const b = info.basic_info;
      console.log('  >> Video Details:');
      console.log('  Title      : ' + b.title);
      console.log('  Channel    : ' + b.author);
      console.log('  Views      : ' + (b.view_count ? b.view_count.toLocaleString() : 'N/A'));
      console.log('  Likes      : ' + (b.like_count ? b.like_count.toLocaleString() : 'N/A'));
      console.log('  Duration   : ' + b.duration + ' seconds');
      console.log('  Is Live    : ' + b.is_live);
      const desc = b.description ? b.description.toString().slice(0, 120) : '';
      console.log('  Description: ' + desc + '...');
    }

    // STEP 5: Channel Info  ------------------------------------------
    console.log('\n[STEP 5/5] Fetching MrBeast channel info...');
    const channel = await yt.getChannel('UCX6OQ3DkcsbYNE6H8uQQuVA');
    console.log('  >> Channel Info:');
    console.log('  Name       : ' + channel.metadata.title);
    console.log('  Subscribers: ' + channel.metadata.subscriber_count);
    const cdesc = channel.metadata.description ? channel.metadata.description.slice(0, 100) : '';
    console.log('  Description: ' + cdesc + '...');

    const videos = await channel.getVideos();
    console.log('\n  Latest Videos from Channel:');
    videos.videos.slice(0, 5).forEach((v, i) => {
      const t = v.title ? v.title.toString() : 'N/A';
      console.log('  ' + (i+1) + '. ' + t + ' [ID: ' + v.id + ']');
    });

    // Shorts from channel
    console.log('\n  Shorts from Channel:');
    const shorts = await channel.getShorts();
    shorts.videos.slice(0, 5).forEach((v, i) => {
      const t = v.title ? v.title.toString() : 'N/A';
      console.log('  ' + (i+1) + '. ' + t + ' [ID: ' + v.id + ']');
    });

    console.log('\n============================================================');
    console.log('  ALL DONE! YouTube.js is working perfectly.');
    console.log('  No API key was used. 100% Free. MIT License.');
    console.log('============================================================');

  } catch (err) {
    console.error('\nERROR:', err.message);
  }
})();
