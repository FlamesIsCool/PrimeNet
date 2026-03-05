/**
 * PrimeNet - Browse / Discover Page Logic
 * Used for both movies.html and tv.html
 */

document.addEventListener('DOMContentLoaded', async () => {
  const isTV = document.body.dataset.page === 'tv';
  const PAGE_SIZE = 20;
  let currentPage = 1;
  let currentGenre = '';
  let currentSort = 'popularity.desc';
  let isLoading = false;

  /* ---- Populate genre chips ---- */
  try {
    const genreData = isTV ? await API.getTVGenres() : await API.getMovieGenres();
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter) {
      const all = document.createElement('button');
      all.className = 'genre-chip active';
      all.textContent = 'All';
      all.dataset.id = '';
      genreFilter.appendChild(all);

      genreData.genres.forEach(g => {
        const chip = document.createElement('button');
        chip.className = 'genre-chip';
        chip.textContent = g.name;
        chip.dataset.id = g.id;
        genreFilter.appendChild(chip);
      });

      genreFilter.addEventListener('click', (e) => {
        const chip = e.target.closest('.genre-chip');
        if (!chip) return;
        genreFilter.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentGenre = chip.dataset.id;
        currentPage = 1;
        loadContent(true);
      });
    }
  } catch (e) {
    console.error('Genre load error:', e);
  }

  /* ---- Sort select ---- */
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      currentPage = 1;
      loadContent(true);
    });
  }

  /* ---- Initial load ---- */
  loadContent(true);

  /* ---- Load More ---- */
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => loadContent(false));
  }

  async function loadContent(reset = false) {
    if (isLoading) return;
    isLoading = true;

    const grid = document.getElementById('contentGrid');
    const loadMoreWrap = document.getElementById('loadMoreWrap');

    if (reset && grid) {
      grid.innerHTML = '';
      // Show skeletons
      for (let i = 0; i < 12; i++) {
        const sk = document.createElement('div');
        sk.className = 'skeleton-card';
        sk.innerHTML = `<div class="skeleton skeleton-poster"></div><div class="skeleton skeleton-text"></div>`;
        grid.appendChild(sk);
      }
    }

    try {
      const params = {
        page: currentPage,
        sort_by: currentSort,
      };
      if (currentGenre) params.with_genres = currentGenre;

      const data = isTV
        ? await API.discoverTV(params)
        : await API.discoverMovies(params);

      if (reset && grid) grid.innerHTML = '';

      const results = data.results || [];
      results.forEach(item => {
        if (!item.poster_path) return;
        item.media_type = isTV ? 'tv' : 'movie';
        if (grid) grid.appendChild(buildCard(item));
      });

      currentPage++;

      if (loadMoreWrap) {
        const hasMore = data.page < data.total_pages;
        loadMoreWrap.style.display = hasMore ? 'flex' : 'none';
      }

    } catch (err) {
      console.error('Content load error:', err);
      if (reset && grid) grid.innerHTML = '<p style="color:#666;padding:40px">Failed to load content. Please try again.</p>';
    } finally {
      isLoading = false;
    }
  }
});
