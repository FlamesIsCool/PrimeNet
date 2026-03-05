/**
 * PrimeNet - Search Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';

  const searchInput = document.getElementById('mainSearchInput');
  if (searchInput) searchInput.value = query;

  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = searchInput?.value.trim();
      if (val) {
        window.location.href = `search.html?q=${encodeURIComponent(val)}`;
      }
    });
  }

  if (!query) {
    renderDefaultState();
    return;
  }

  document.title = `"${query}" — PrimeNet`;
  const countEl = document.getElementById('resultsCount');
  const allGrid = document.getElementById('allResultsGrid');
  const moviesGrid = document.getElementById('moviesGrid');
  const tvGrid = document.getElementById('tvGrid');

  if (countEl) countEl.innerHTML = `Searching for <strong>"${escHtml(query)}"</strong>...`;

  try {
    const data = await API.searchMulti(query);
    const results = (data.results || []).filter(i => i.media_type !== 'person' && (i.poster_path || i.backdrop_path));

    if (countEl) {
      countEl.innerHTML = results.length > 0
        ? `<strong>${results.length}</strong> results for <strong>"${escHtml(query)}"</strong>`
        : `No results found for <strong>"${escHtml(query)}"</strong>`;
    }

    const movies = results.filter(i => i.media_type === 'movie' || (!i.media_type && i.release_date));
    const tvShows = results.filter(i => i.media_type === 'tv' || (!i.media_type && i.first_air_date));

    if (allGrid) results.forEach(item => allGrid.appendChild(buildCard(item)));
    if (moviesGrid) movies.forEach(item => moviesGrid.appendChild(buildCard(item)));
    if (tvGrid) tvShows.forEach(item => tvGrid.appendChild(buildCard(item)));

    // Update tab counts
    const tabAll = document.getElementById('tabAll');
    const tabMovies = document.getElementById('tabMovies');
    const tabTV = document.getElementById('tabTV');
    if (tabAll) tabAll.textContent = `All (${results.length})`;
    if (tabMovies) tabMovies.textContent = `Movies (${movies.length})`;
    if (tabTV) tabTV.textContent = `TV Shows (${tvShows.length})`;

  } catch (err) {
    if (countEl) countEl.textContent = 'Search failed. Please try again.';
    console.error('Search error:', err);
  }

  /* Tab switching */
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.panel;
      panels.forEach(p => p.classList.toggle('hidden', p.id !== target));
    });
  });
});

function renderDefaultState() {
  document.title = 'Search — PrimeNet';
  const countEl = document.getElementById('resultsCount');
  if (countEl) countEl.textContent = 'Start typing to search for movies and TV shows.';
}
