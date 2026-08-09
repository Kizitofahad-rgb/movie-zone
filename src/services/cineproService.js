const CINEPRO_BASE_URL = import.meta.env.VITE_CINEPRO_URL;

// Ping CinePro every 14 minutes to prevent Render.com free tier from sleeping.
// Call this once when app loads.
export const keepCineproAwake = () => {
  const ping = async () => {
    try {
      await fetch(`${CINEPRO_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      console.log('✅ CinePro ping OK');
    } catch {
      console.log('⚠️ CinePro ping failed — may be sleeping');
    }
  };

  // Ping immediately on load
  ping();

  // Then every 14 minutes (Render sleeps at 15min)
  setInterval(ping, 14 * 60 * 1000);
};

// Pre-warm CinePro when user lands on a movie page so it's ready by Watch time
export const prewarmCinepro = async () => {
  try {
    await fetch(`${CINEPRO_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // silent — just warming up
  }
};

export const getMovieStreams = async (tmdbId) => {
  try {
    const response = await fetch(
      `${CINEPRO_BASE_URL}/stream/movie/${tmdbId}`,
      { signal: AbortSignal.timeout(25000) }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    // CinePro returns array of sources — return as-is
    return Array.isArray(data) ? data : (data.sources || data.streams || []);
  } catch (err) {
    console.error('CinePro movie streams error:', err);
    return [];
  }
};

export const getTVStreams = async (tmdbId, season, episode) => {
  try {
    const response = await fetch(
      `${CINEPRO_BASE_URL}/stream/tv/${tmdbId}/${season}/${episode}`,
      { signal: AbortSignal.timeout(25000) }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : (data.sources || data.streams || []);
  } catch (err) {
    console.error('CinePro TV streams error:', err);
    return [];
  }
};

export default { getMovieStreams, getTVStreams, keepCineproAwake, prewarmCinepro };
