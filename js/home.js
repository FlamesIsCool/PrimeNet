/**
 * PrimeNet - Homepage Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  /* ----- Skeleton placeholders ----- */
  const rowIds = ['trendingRow', 'popularMoviesRow', 'topRatedRow', 'popularTVRow', 'airingTodayRow', 'upcomingRow'];
  rowIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.appendChild(buildSkeletonCard(8));
  });

  try {
    /* ----- Parallel fetches ----- */
    const [
      trendingAll,
      popularMovies,
      topRated,
      popularTV,
      airingToday,
      upcoming,
    ] = await Promise.all([
      API.getTrendingAll('week'),
      API.getPopularMovies(),
      API.getTopRatedMovies(),
      API.getPopularTV(),
      API.getAiringTodayTV(),
      API.getUpcomingMovies(),
    ]);

    /* ----- Hero ----- */
    const heroItems = trendingAll.results.filter(i => i.backdrop_path).slice(0, 6);
    initHero(heroItems);

    /* ----- Content Rows ----- */
    buildCarousel('trendingRow', trendingAll.results, { badge: 'Trending', badgeClass: 'trending' });
    buildCarousel('popularMoviesRow', popularMovies.results, { badge: 'Popular' });
    buildCarousel('topRatedRow', topRated.results, { badge: 'Top Rated' });
    buildCarousel('popularTVRow', popularTV.results);
    buildCarousel('airingTodayRow', airingToday.results, { badge: 'Live', badgeClass: 'new' });
    buildCarousel('upcomingRow', upcoming.results, { badge: 'Coming Soon', badgeClass: 'new' });

  } catch (err) {
    console.error('Homepage load error:', err);
  }
});
