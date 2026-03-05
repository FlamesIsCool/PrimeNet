/**
 * PrimeNet - Watch / Player Page Logic
 */

const VIDKING_COLOR = 'ffffff';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const type = params.get('type') || 'movie';
  let season = parseInt(params.get('season') || '1', 10);
  let episode = parseInt(params.get('episode') || '1', 10);

  if (!id) {
    document.getElementById('playerLoadingText').textContent = 'No content specified.';
    return;
  }

  /* ---- Load content details ---- */
  let details;
  try {
    details = type === 'tv' ? await API.getTVDetails(id) : await API.getMovieDetails(id);
  } catch (err) {
    console.error('Failed to load details:', err);
    document.getElementById('playerLoadingText').textContent = 'Failed to load content.';
    return;
  }

  /* ---- Build embed URL ---- */
  function buildEmbedURL() {
    if (type === 'tv') {
      return API.vidkingTVURL(id, season, episode, {
        color: VIDKING_COLOR,
        nextEpisode: true,
        episodeSelector: true,
      });
    }
    return API.vidkingMovieURL(id, { color: VIDKING_COLOR });
  }

  /* ---- Set player src ---- */
  const playerFrame = document.getElementById('playerFrame');
  const playerLoading = document.getElementById('playerLoading');

  function loadPlayer() {
    if (playerLoading) playerLoading.classList.remove('hidden');
    playerFrame.src = buildEmbedURL();
    updateURL();
  }

  if (playerFrame) {
    playerFrame.addEventListener('load', () => {
      if (playerLoading) playerLoading.classList.add('hidden');
    });
    loadPlayer();
  }

  /* ---- Populate player info ---- */
  const title = getTitle(details);
  const year = formatYear(getReleaseDate(details));
  const rating = formatRating(details.vote_average);
  const genres = (details.genres || []).map(g => g.name).slice(0, 3).join(' · ');
  const runtime = type === 'movie' ? formatRuntime(details.runtime) : '';
  const overview = details.overview || '';

  document.getElementById('playerTitle').textContent = title;
  document.title = `${title} — PrimeNet`;

  const playerBackdrop = document.getElementById('playerBackdropImg');
  if (playerBackdrop && details.backdrop_path) {
    playerBackdrop.style.backgroundImage = `url(${API.backdrop(details.backdrop_path, 'w1280')})`;
  }

  const playerMeta = document.getElementById('playerMeta');
  if (playerMeta) {
    playerMeta.innerHTML = `
      <span class="player-rating"><span class="star">★</span> ${rating}</span>
      <span>${year}</span>
      ${runtime ? `<span>${runtime}</span>` : ''}
      ${genres ? `<span>${genres}</span>` : ''}
      <span class="card-badge">${type === 'tv' ? 'TV Series' : 'Movie'}</span>
    `;
  }

  const playerOverview = document.getElementById('playerOverview');
  if (playerOverview) playerOverview.textContent = overview;

  /* ---- TV: Episode Selector ---- */
  if (type === 'tv') {
    const episodeSection = document.getElementById('episodeSection');
    if (episodeSection) episodeSection.classList.remove('hidden');

    /* Populate seasons dropdown */
    const seasonSelect = document.getElementById('seasonSelect');
    const totalSeasons = details.number_of_seasons || 1;
    if (seasonSelect) {
      for (let s = 1; s <= totalSeasons; s++) {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = `Season ${s}`;
        if (s === season) opt.selected = true;
        seasonSelect.appendChild(opt);
      }
      seasonSelect.addEventListener('change', () => {
        season = parseInt(seasonSelect.value, 10);
        episode = 1;
        loadEpisodes();
        loadPlayer();
      });
    }

    loadEpisodes();
  }

  async function loadEpisodes() {
    const episodeGrid = document.getElementById('episodeGrid');
    if (!episodeGrid) return;
    episodeGrid.innerHTML = '<div class="text-muted" style="padding:20px">Loading episodes...</div>';

    try {
      const seasonData = await API.getTVSeason(id, season);
      episodeGrid.innerHTML = '';
      const episodes = seasonData.episodes || [];

      if (episodes.length === 0) {
        episodeGrid.innerHTML = '<div class="text-muted" style="padding:20px">No episodes found.</div>';
        return;
      }

      episodes.forEach(ep => {
        const card = document.createElement('div');
        card.className = `episode-card${ep.episode_number === episode ? ' active' : ''}`;
        const thumbUrl = ep.still_path ? API.img(ep.still_path, 'w300') : null;

        card.innerHTML = `
          <div class="episode-thumb">
            ${thumbUrl ? `<img src="${thumbUrl}" alt="Episode ${ep.episode_number}" loading="lazy">` : '<div style="width:100%;height:100%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;font-size:22px">🎬</div>'}
            <div class="ep-play">▶</div>
          </div>
          <div class="episode-details">
            <div class="episode-num">S${season} E${ep.episode_number}</div>
            <div class="episode-title">${escHtml(ep.name || `Episode ${ep.episode_number}`)}</div>
            <div class="episode-desc">${escHtml(ep.overview || '')}</div>
            ${ep.runtime ? `<div class="episode-runtime">${formatRuntime(ep.runtime)}</div>` : ''}
          </div>
        `;

        card.addEventListener('click', () => {
          episode = ep.episode_number;
          document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          loadPlayer();
          // Scroll player into view
          document.querySelector('.player-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        episodeGrid.appendChild(card);
      });
    } catch (err) {
      episodeGrid.innerHTML = '<div class="text-muted" style="padding:20px">Failed to load episodes.</div>';
    }
  }

  /* ---- Update URL without reload ---- */
  function updateURL() {
    const newParams = new URLSearchParams({ id, type });
    if (type === 'tv') {
      newParams.set('season', season);
      newParams.set('episode', episode);
    }
    const newURL = `${window.location.pathname}?${newParams.toString()}`;
    history.replaceState(null, '', newURL);
  }

  /* ---- Related content ---- */
  try {
    const relatedGrid = document.getElementById('relatedGrid');
    if (relatedGrid && details.similar) {
      const related = details.similar.results?.slice(0, 10) || [];
      related.forEach(item => {
        item.media_type = type;
        relatedGrid.appendChild(buildCard(item));
      });
    }
  } catch (e) { /* ignore */ }

  /* ---- Progress tracking from player ---- */
  window.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg?.type === 'PLAYER_EVENT' && msg.data?.event === 'timeupdate') {
        const { id: contentId, mediaType, season: s, episode: e, timestamp, currentTime } = msg.data;
        if (contentId && mediaType) {
          const key = `progress_${mediaType}_${contentId}${s ? `_s${s}e${e}` : ''}`;
          localStorage.setItem(key, JSON.stringify({ currentTime, timestamp, season: s, episode: e }));
        }
      }
    } catch { /* ignore */ }
  });
});
