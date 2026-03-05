/**
 * PrimeNet - UI Component Builder
 * Shared rendering utilities used across all pages
 */

/* ===========================
   Card Renderer
   =========================== */
function buildCard(item, opts = {}) {
  const type = getMediaType(item);
  const title = getTitle(item);
  const year = formatYear(getReleaseDate(item));
  const rating = formatRating(item.vote_average);
  const posterPath = API.img(item.poster_path, 'w342');

  const card = document.createElement('div');
  card.className = `card${opts.wide ? ' card-wide' : ''}`;
  card.dataset.id = item.id;
  card.dataset.type = type;

  card.innerHTML = `
    <div class="card-poster-wrap">
      ${posterPath
        ? `<img class="card-poster" src="${posterPath}" alt="${escHtml(title)}" loading="lazy">`
        : `<div class="card-poster-placeholder">🎬</div>`
      }
      <div class="card-overlay">
        <div class="card-play-btn">&#9654;</div>
        <div class="card-rating"><span class="star">★</span>${rating}</div>
      </div>
      ${opts.badge ? `<div class="card-badge ${opts.badgeClass || ''}">${escHtml(opts.badge)}</div>` : ''}
    </div>
    <div class="card-info">
      <div class="card-title" title="${escHtml(title)}">${escHtml(title)}</div>
      <div class="card-meta">
        <span>${year}</span>
        ${type === 'tv' ? '<span>TV</span>' : '<span>Movie</span>'}
      </div>
    </div>
  `;

  card.addEventListener('click', () => openModal(item));
  return card;
}

function buildSkeletonCard(count = 1) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton-card';
    el.innerHTML = `
      <div class="skeleton skeleton-poster"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text-sm"></div>
    `;
    frag.appendChild(el);
  }
  return frag;
}

/* ===========================
   Carousel / Row Builder
   =========================== */
function buildCarousel(containerId, items, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach(item => container.appendChild(buildCard(item, opts)));
  initCarouselNav(container);
}

function initCarouselNav(track) {
  const wrapper = track.closest('.carousel-wrapper');
  if (!wrapper) return;
  const prevBtn = wrapper.querySelector('.carousel-nav.prev .carousel-nav-btn');
  const nextBtn = wrapper.querySelector('.carousel-nav.next .carousel-nav-btn');
  if (!prevBtn || !nextBtn) return;

  const scrollAmount = () => track.clientWidth * 0.75;

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });
}

/* ===========================
   Hero Builder
   =========================== */
let heroItems = [];
let heroIndex = 0;
let heroTimer = null;

function initHero(items) {
  heroItems = items.slice(0, 6);
  heroIndex = 0;
  renderHeroSlide(0);
  startHeroTimer();
  buildHeroDots();
}

function renderHeroSlide(idx) {
  const item = heroItems[idx];
  if (!item) return;

  const backdrop = document.getElementById('heroBg');
  const title = document.getElementById('heroTitle');
  const desc = document.getElementById('heroDesc');
  const meta = document.getElementById('heroMeta');
  const watchBtn = document.getElementById('heroWatchBtn');
  const detailBtn = document.getElementById('heroDetailBtn');
  const badge = document.getElementById('heroBadge');

  if (backdrop) {
    const bg = API.backdrop(item.backdrop_path, 'original');
    backdrop.style.backgroundImage = bg ? `url(${bg})` : 'none';
  }
  if (title) title.textContent = getTitle(item);
  if (desc) desc.textContent = item.overview || '';
  if (badge) badge.textContent = getMediaType(item) === 'tv' ? '📺 TV Series' : '🎬 Movie';

  if (meta) {
    const rating = formatRating(item.vote_average);
    const year = formatYear(getReleaseDate(item));
    meta.innerHTML = `
      <span class="rating"><span>★</span> ${rating}</span>
      <span class="separator">·</span>
      <span class="year">${year}</span>
      ${item.vote_count ? `<span class="separator">·</span><span>${item.vote_count.toLocaleString()} votes</span>` : ''}
    `;
  }

  if (watchBtn) {
    watchBtn.onclick = () => {
      const type = getMediaType(item);
      if (type === 'tv') {
        window.location.href = `watch.html?id=${item.id}&type=tv&season=1&episode=1`;
      } else {
        window.location.href = `watch.html?id=${item.id}&type=movie`;
      }
    };
  }

  if (detailBtn) {
    detailBtn.onclick = () => openModal(item);
  }

  updateHeroDots(idx);
}

function buildHeroDots() {
  const dotsEl = document.getElementById('heroDots');
  if (!dotsEl) return;
  dotsEl.innerHTML = '';
  heroItems.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = `hero-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => {
      heroIndex = i;
      renderHeroSlide(i);
      resetHeroTimer();
    });
    dotsEl.appendChild(dot);
  });
}

function updateHeroDots(idx) {
  const dots = document.querySelectorAll('.hero-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

function startHeroTimer() {
  heroTimer = setInterval(() => {
    heroIndex = (heroIndex + 1) % heroItems.length;
    renderHeroSlide(heroIndex);
  }, 7000);
}

function resetHeroTimer() {
  clearInterval(heroTimer);
  startHeroTimer();
}

/* ===========================
   Modal
   =========================== */
async function openModal(item) {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) {
    // Navigate to watch page directly if no modal
    const type = getMediaType(item);
    window.location.href = `watch.html?id=${item.id}&type=${type}`;
    return;
  }

  const type = getMediaType(item);
  let details;
  try {
    details = type === 'tv' ? await API.getTVDetails(item.id) : await API.getMovieDetails(item.id);
  } catch {
    details = item;
  }

  const title = getTitle(details);
  const year = formatYear(getReleaseDate(details));
  const rating = formatRating(details.vote_average);
  const overview = details.overview || 'No description available.';
  const genres = (details.genres || []).map(g => g.name).join(', ');
  const backdropUrl = API.backdrop(details.backdrop_path, 'w1280');
  const runtime = type === 'movie' ? formatRuntime(details.runtime) : (details.episode_run_time?.[0] ? formatRuntime(details.episode_run_time[0]) : '');

  document.getElementById('modalBackdropImg').src = backdropUrl || '';
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalOverview').textContent = overview;

  const modalMeta = document.getElementById('modalMeta');
  modalMeta.innerHTML = `
    <span class="modal-rating"><span class="star">★</span> ${rating}</span>
    <span>${year}</span>
    ${runtime ? `<span>${runtime}</span>` : ''}
    ${genres ? `<span>${genres}</span>` : ''}
    <span class="card-badge">${type === 'tv' ? 'TV Series' : 'Movie'}</span>
  `;

  const watchBtn = document.getElementById('modalWatchBtn');
  if (watchBtn) {
    watchBtn.onclick = () => {
      closeModal();
      if (type === 'tv') {
        window.location.href = `watch.html?id=${details.id}&type=tv&season=1&episode=1`;
      } else {
        window.location.href = `watch.html?id=${details.id}&type=movie`;
      }
    };
  }

  const infoGrid = document.getElementById('modalInfoGrid');
  if (infoGrid) {
    const director = type === 'movie'
      ? (details.credits?.crew?.find(c => c.job === 'Director')?.name || '')
      : '';
    const cast = (details.credits?.cast || []).slice(0, 4).map(c => c.name).join(', ');
    const seasons = type === 'tv' ? (details.number_of_seasons || '') : '';

    infoGrid.innerHTML = `
      ${director ? `<div class="modal-info-item"><label>Director</label><span>${escHtml(director)}</span></div>` : ''}
      ${cast ? `<div class="modal-info-item"><label>Cast</label><span>${escHtml(cast)}</span></div>` : ''}
      ${genres ? `<div class="modal-info-item"><label>Genres</label><span>${escHtml(genres)}</span></div>` : ''}
      ${seasons ? `<div class="modal-info-item"><label>Seasons</label><span>${seasons}</span></div>` : ''}
      ${details.vote_count ? `<div class="modal-info-item"><label>Votes</label><span>${details.vote_count.toLocaleString()}</span></div>` : ''}
      ${details.status ? `<div class="modal-info-item"><label>Status</label><span>${escHtml(details.status)}</span></div>` : ''}
    `;
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ===========================
   Utility
   =========================== */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

/* ===========================
   Navbar scroll behavior
   =========================== */
function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ===========================
   Back to Top
   =========================== */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ===========================
   Search toggle in navbar
   =========================== */
function initNavSearch() {
  const toggle = document.getElementById('searchToggle');
  const box = document.getElementById('searchBox');
  const input = document.getElementById('navSearchInput');

  if (!toggle || !box) return;

  toggle.addEventListener('click', () => {
    box.classList.toggle('open');
    if (box.classList.contains('open') && input) {
      setTimeout(() => input.focus(), 100);
    }
  });

  document.addEventListener('click', (e) => {
    if (!box.contains(e.target) && e.target !== toggle) {
      box.classList.remove('open');
    }
  });

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  }

  const navSearchBtn = document.getElementById('navSearchBtn');
  if (navSearchBtn && input) {
    navSearchBtn.addEventListener('click', () => {
      if (input.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  }
}

/* Init on load */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initBackToTop();
  initNavSearch();

  // Modal close handlers
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});
