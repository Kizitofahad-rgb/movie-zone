// src/services/streamSources.js
// Multi-server stream resolver + clean pop-out window helper.
// Used by src/pages/MovieDetail.jsx

/**
 * Returns an ordered list of stream sources for a given TMDB id.
 *
 * @param {'movie'|'tv'} type
 * @param {string|number} id      TMDB id
 * @param {number} season         only used when type === 'tv'
 * @param {number} episode        only used when type === 'tv'
 * @returns {Array<{
 *   id: string,
 *   name: string,
 *   badge?: string,
 *   speed?: string,
 *   rating?: string,
 *   description?: string,
 *   url: string,
 *   isDirect?: boolean           // true = raw .m3u8/.mp4 → plays in HLSVideoPlayer
 * }>}
 */
export const getStreamSources = (type, id, season = 1, episode = 1) => {
  const movieId = String(id);

  if (type === 'tv') {
    return [
      {
        id: 'smashy',
        name: 'SmashyStream Pro',
        badge: 'HD',
        speed: 'Fast',
        rating: '4.8',
        description: 'Adaptive HLS · Multi-audio',
        url: `https://embed.smashystream.com/playere.php?tmdb=${movieId}&season=${season}&episode=${episode}`,
      },
      {
        id: 'vidsrc',
        name: 'VidSrc',
        badge: 'HD',
        speed: 'Medium',
        rating: '4.5',
        description: 'Backup mirror',
        url: `https://vidsrc.to/embed/tv/${movieId}/${season}/${episode}`,
      },
      {
        id: '2embed',
        name: '2Embed',
        badge: 'SD',
        speed: 'Fast',
        rating: '4.2',
        description: 'Low-bandwidth fallback',
        url: `https://www.2embed.cc/embedtv/${movieId}&s=${season}&e=${episode}`,
      },
      {
        id: 'multi',
        name: 'MultiEmbed',
        badge: 'HD',
        speed: 'Fast',
        rating: '4.6',
        description: 'Multi-language support',
        url: `https://multiembed.mov/?video_id=${movieId}&tmdb=1&s=${season}&e=${episode}`,
      },
    ];
  }

  return [
    {
      id: 'smashy',
      name: 'SmashyStream Pro',
      badge: 'HD',
      speed: 'Fast',
      rating: '4.8',
      description: 'Adaptive HLS · Multi-audio',
      url: `https://embed.smashystream.com/playere.php?tmdb=${movieId}`,
    },
    {
      id: 'vidsrc',
      name: 'VidSrc',
      badge: 'HD',
      speed: 'Medium',
      rating: '4.5',
      description: 'Backup mirror',
      url: `https://vidsrc.to/embed/movie/${movieId}`,
    },
    {
      id: '2embed',
      name: '2Embed',
      badge: 'SD',
      speed: 'Fast',
      rating: '4.2',
      description: 'Low-bandwidth fallback',
      url: `https://www.2embed.cc/embed/${movieId}`,
    },
    {
      id: 'multi',
      name: 'MultiEmbed',
      badge: 'HD',
      speed: 'Fast',
      rating: '4.6',
      description: 'Multi-language support',
      url: `https://multiembed.mov/?video_id=${movieId}&tmdb=1`,
    },
  ];
};

/**
 * Opens a clean pop-out window containing ONLY the iframe player.
 * Because it's a top-level document, it's 100% immune to
 * iframe sandbox / X-Frame-Options restrictions.
 *
 * @param {string} url
 * @param {string} title
 */
export const openCinemaPopOut = (url, title = 'Movie Zone Cinema') => {
  if (!url) return;

  const w = window.open(
    '',
    '_blank',
    'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,noopener=no'
  );

  if (!w) {
    alert('Pop-up blocked. Please allow pop-ups for this site.');
    return;
  }

  const safeTitle = String(title).replace(/[<>&"]/g, '');

  w.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
      `<title>${safeTitle}</title>` +
      `<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}` +
      `iframe{display:block;width:100vw;height:100vh;border:0}</style>` +
      `</head><body>` +
      `<iframe src="${url}" allowfullscreen ` +
      `allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"></iframe>` +
      `</body></html>`
  );
  w.document.close();
};

export default { getStreamSources, openCinemaPopOut };
