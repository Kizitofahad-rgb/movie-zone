import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const REPORT_PATH = resolve('scripts/source-report.json');
const TIMEOUT_MS = 5_000;

// Keep these test URLs in sync with getSources() in src/pages/MovieDetail.jsx.
const sources = [
  { name: 'Videasy', movieUrl: 'https://player.videasy.net/movie/550?color=00d4ff&autoplay=true', tvUrl: 'https://player.videasy.net/tv/1399/1/1?color=00d4ff&nextEpisode=true&autoplay=true' },
  { name: 'VidFast', movieUrl: 'https://vidfast.pro/movie/550?autoPlay=true&theme=00d4ff', tvUrl: 'https://vidfast.pro/tv/1399/1/1?autoPlay=true&theme=00d4ff' },
  { name: 'PStream', movieUrl: 'https://iframe.pstream.org/embed/tmdb/movie-550', tvUrl: 'https://iframe.pstream.org/embed/tmdb/tv-1399-1-1' },
  { name: 'VidLink', movieUrl: 'https://vidlink.pro/movie/550?primaryColor=00d4ff&secondaryColor=ffd700&player=jw&autoplay=true', tvUrl: 'https://vidlink.pro/tv/1399/1/1?primaryColor=00d4ff&secondaryColor=ffd700&player=jw&autoplay=true&nextbutton=true' },
  { name: 'AutoEmbed', movieUrl: 'https://player.autoembed.cc/embed/movie/550', tvUrl: 'https://player.autoembed.cc/embed/tv/1399/1/1' },
  { name: 'MultiEmbed', movieUrl: 'https://multiembed.mov/?video_id=550&tmdb=1', tvUrl: 'https://multiembed.mov/?video_id=1399&tmdb=1&s=1&e=1' },
];

async function request(url, method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Movie-Zone-Source-Monitor/1.0', Accept: 'text/html,application/xhtml+xml' },
    });
    return { ok: response.status >= 200 && response.status < 400, responseTime: Math.round(performance.now() - startedAt), statusCode: response.status };
  } catch (error) {
    return { ok: false, responseTime: Math.round(performance.now() - startedAt), error: error.name === 'AbortError' ? 'Request timed out' : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function testUrl(url) {
  const headResult = await request(url, 'HEAD');
  // Some embed hosts reject HEAD requests even when their player is available.
  return headResult.ok ? headResult : request(url, 'GET');
}

const reportSources = await Promise.all(sources.map(async (source) => {
  const [movie, tv] = await Promise.all([testUrl(source.movieUrl), testUrl(source.tvUrl)]);
  const working = movie.ok && tv.ok;
  return {
    ...source,
    status: working ? 'working' : 'dead',
    responseTime: Math.max(movie.responseTime, tv.responseTime),
    movieStatus: movie.statusCode ?? null,
    tvStatus: tv.statusCode ?? null,
    error: working ? null : movie.error || tv.error || 'One or more URLs returned an error response.',
  };
}));

const report = { lastChecked: new Date().toISOString(), sources: reportSources };
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

console.table(reportSources.map((source) => ({
  Source: source.name,
  Status: source.status === 'working' ? 'WORKING ✅' : 'DEAD ❌',
  'Response time': `${source.responseTime} ms`,
  Movie: source.movieStatus ?? 'error',
  TV: source.tvStatus ?? 'error',
})));

const deadCount = reportSources.filter((source) => source.status === 'dead').length;
console.log(`\nSource check complete: ${reportSources.length - deadCount} working, ${deadCount} dead.`);
if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `dead_count=${deadCount}\n`, { flag: 'a' });
