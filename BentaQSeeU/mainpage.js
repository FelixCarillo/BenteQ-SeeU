/* =========================================================
   DATA
   The listing data lives in listings.js (window.LISTINGS).
   This file only reads it — the admin inventory manager
   can add, edit, or remove entries there without touching
   any of the rendering or filtering logic below.
   ========================================================= */
const items = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem('bq_listings_v1') || 'null');
    if (Array.isArray(stored)) return stored;
  } catch {}
  return Array.isArray(window.LISTINGS) ? window.LISTINGS : [];
})();

/* =========================================================
   STATE
   ========================================================= */
const viewCounts = new Map(items.map((item) => [item.id, item.viewCount]));

const state = {
  query: '',
  sort: 'newest',
  filters: {
    tags: new Set(),
    categories: new Set(),
    sellers: new Set(),
    priceMin: null,
    priceMax: null,
    dateFrom: null,
    dateTo: null
  }
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'mostViewed', label: 'Most Viewed' },
  { value: 'leastViewed', label: 'Least Viewed' },
  { value: 'priceAsc', label: 'Price Asc' },
  { value: 'priceDesc', label: 'Price Desc' }
];

const SORT_LABELS = {
  newest: 'Newest',
  oldest: 'Oldest',
  mostViewed: 'Most Viewed',
  leastViewed: 'Least Viewed',
  priceAsc: 'Price ↑',
  priceDesc: 'Price ↓'
};

const SORTERS = {
  newest: (a, b) => new Date(b.datePosted) - new Date(a.datePosted),
  oldest: (a, b) => new Date(a.datePosted) - new Date(b.datePosted),
  mostViewed: (a, b) => viewCounts.get(b.id) - viewCounts.get(a.id) || b.id - a.id,
  leastViewed: (a, b) => viewCounts.get(a.id) - viewCounts.get(b.id) || a.id - b.id,
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price
};

/* =========================================================
   DOM REFS
   ========================================================= */
const feed = document.getElementById('feed');
const searchInput = document.getElementById('search-input');
const filterButton = document.getElementById('filter-button');
const sortButton = document.getElementById('sort-button');

const filterOverlay = document.getElementById('filter-overlay');
const filterBody = document.getElementById('filter-body');
const filterApply = document.getElementById('filter-apply');
const filterReset = document.getElementById('filter-reset');

const sortOverlay = document.getElementById('sort-overlay');
const sortBody = document.getElementById('sort-body');

const burgerInput = document.getElementById('burger');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

/* =========================================================
   HELPERS
   ========================================================= */
function formatPrice(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0
  }).format(value);
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/* =========================================================
   FILTERING + SORTING
   ========================================================= */
function matchesQuery(item, q) {
  if (!q) return true;

  const haystack = [
    item.name,
    item.description,
    item.category,
    item.condition,
    item.badge,
    item.seller.name,
    item.seller.handle,
    item.seller.campus,
    ...item.tags
  ]
    .join(' ')
    .toLowerCase();

  return q.split(/\s+/).filter(Boolean).every((token) => haystack.includes(token));
}

function getVisibleItems() {
  const q = state.query.trim().toLowerCase();
  const f = state.filters;

  const list = items.filter((item) => {
    if (!matchesQuery(item, q)) return false;
    if (f.tags.size && !item.tags.some((tag) => f.tags.has(tag))) return false;
    if (f.categories.size && !f.categories.has(item.category)) return false;
    if (f.sellers.size && !f.sellers.has(item.seller.name)) return false;
    if (f.priceMin != null && item.price < f.priceMin) return false;
    if (f.priceMax != null && item.price > f.priceMax) return false;

    const posted = new Date(item.datePosted);
    if (f.dateFrom && posted < new Date(`${f.dateFrom}T00:00:00`)) return false;
    if (f.dateTo && posted > new Date(`${f.dateTo}T23:59:59`)) return false;

    return true;
  });

  list.sort(SORTERS[state.sort] || SORTERS.newest);
  return list;
}

function activeFilterCount() {
  const f = state.filters;
  let n = f.tags.size + f.categories.size + f.sellers.size;
  if (f.priceMin != null || f.priceMax != null) n += 1;
  if (f.dateFrom || f.dateTo) n += 1;
  return n;
}

/* =========================================================
   CARD TEMPLATE
   ========================================================= */
function createPostCard(item) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.dataset.id = item.id;

  card.innerHTML = `
    <header class="post-header">
      <img class="seller-avatar" src="${item.seller.avatar}" alt="${escapeHtml(item.seller.name)}" />
      <div class="seller-meta">
        <span class="seller-name">${escapeHtml(item.seller.name)}</span>
        <span class="seller-sub">${escapeHtml(item.seller.handle)} · ${escapeHtml(item.category)}</span>
      </div>
      <span class="view-count" data-id="${item.id}">👁 ${viewCounts.get(item.id)} views</span>
      <button class="card-close" type="button" aria-label="Collapse listing">×</button>
    </header>

    <div class="post-media">
      <div class="media-track" tabindex="0" aria-label="${escapeHtml(item.name)} photos">
        ${item.images
          .map(
            (src, i) =>
              `<img src="${src}" alt="${escapeHtml(item.name)} — photo ${i + 1}" ${
                i === 0 ? '' : 'loading="lazy"'
              } draggable="false" />`
          )
          .join('')}
      </div>
      <span class="media-counter">1/${item.images.length}</span>
      <div class="media-dots">
        ${item.images
          .map((_, i) => `<span class="media-dot${i === 0 ? ' active' : ''}"></span>`)
          .join('')}
      </div>
    </div>

    <div class="post-body">
      <div class="body-heading">
        <h3 class="item-name">${escapeHtml(item.name)}</h3>
        <span class="expand-hint" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </span>
      </div>
      <p class="item-desc">${escapeHtml(item.description)}</p>
      <div class="tags">
        <span class="tag">${escapeHtml(item.category)}</span>
        <span class="tag">${escapeHtml(item.condition)}</span>
        <span class="tag">${escapeHtml(item.badge)}</span>
      </div>
    </div>

    <div class="post-price-row">
      <span class="item-price">${formatPrice(item.price)}</span>
      <span class="seller-campus">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        </svg>
        ${escapeHtml(item.seller.campus)}
      </span>
    </div>

    <div class="post-actions">
      <a class="view-post-btn"
         href="${item.postUrl}"
         target="_blank"
         rel="noopener noreferrer"
         data-id="${item.id}">
        View Post on Facebook
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z"/>
          <path d="M5 5h5V3H3v18h18v-7h-2v5H5V5z"/>
        </svg>
      </a>
    </div>
  `;

  initMediaCarousel(card);
  initViewCounter(card, item);
  initCardExpand(card);

  return card;
}

/* ---------- Horizontal image carousel ---------- */
function initMediaCarousel(card) {
  const track = card.querySelector('.media-track');
  const dots = Array.from(card.querySelectorAll('.media-dot'));
  const counter = card.querySelector('.media-counter');
  const total = dots.length;
  let rafId = null;

  function update() {
    const width = track.clientWidth || 1;
    const rawIndex = Math.round(track.scrollLeft / width);
    const index = Math.max(0, Math.min(total - 1, rawIndex));

    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    counter.textContent = `${index + 1}/${total}`;
  }

  track.addEventListener(
    'scroll',
    () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    },
    { passive: true }
  );

  track.addEventListener('click', (event) => {
    const rect = track.getBoundingClientRect();
    const clickedLeft = event.clientX - rect.left < rect.width / 2;
    track.scrollBy({ left: clickedLeft ? -rect.width : rect.width, behavior: 'smooth' });
  });

  update();
}

/* ---------- "View Post" click counter ---------- */
function initViewCounter(card, item) {
  const button = card.querySelector('.view-post-btn');

  button.addEventListener('click', () => {
    const next = (viewCounts.get(item.id) || 0) + 1;
    viewCounts.set(item.id, next);

    document.querySelectorAll(`.view-count[data-id="${item.id}"]`).forEach((el) => {
      el.textContent = `👁 ${next} views`;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    });
  });
}

/* ---------- Tap to expand / collapse ---------- */
function initCardExpand(card) {
  card.addEventListener('click', (event) => {
    // Media carousel, the CTA link, and any anchors handle their own clicks
    if (event.target.closest('.post-media, .view-post-btn, a')) return;

    const willExpand = !card.classList.contains('is-expanded');

    if (willExpand) {
      // Only one expanded card at a time
      document.querySelectorAll('.post-card.is-expanded').forEach((other) => {
        if (other !== card) other.classList.remove('is-expanded');
      });
      card.classList.add('is-expanded');
    } else {
      card.classList.remove('is-expanded');
    }
  });
}

/* =========================================================
   FEED
   ========================================================= */
let visibleItems = [];
let itemCursor = 0;
let isLoadingMore = false;

const sentinelObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || isLoadingMore) return;

      sentinelObserver.unobserve(entry.target);
      isLoadingMore = true;

      setTimeout(() => {
        const added = appendSlides(2);
        if (added.length) observeLast(added[added.length - 1]);
        isLoadingMore = false;
      }, 220);
    });
  },
  { root: feed, threshold: 0 }
);

function observeLast(slide) {
  if (slide) sentinelObserver.observe(slide);
}

function appendSlides(count) {
  const created = [];
  const fragment = document.createDocumentFragment();

  // With fewer than 4 results, repeating them would look broken,
  // so we render them once and let the feed end.
  const canLoop = visibleItems.length >= 4;

  for (let i = 0; i < count; i += 1) {
    if (!canLoop && itemCursor >= visibleItems.length) break;

    const item = visibleItems[itemCursor % visibleItems.length];
    itemCursor += 1;

    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.appendChild(createPostCard(item));

    fragment.appendChild(slide);
    created.push(slide);
  }

  feed.appendChild(fragment);
  return created;
}

function buildEmptyState() {
  const el = document.createElement('div');
  el.className = 'empty-state';
  el.innerHTML = `
    <p class="empty-title">No listings found</p>
    <p class="empty-sub">Try a different search term, or loosen your filters.</p>
    <button class="btn-primary" type="button">Clear search &amp; filters</button>
  `;

  el.querySelector('button').addEventListener('click', resetEverything);
  return el;
}

function refresh() {
  visibleItems = getVisibleItems();
  itemCursor = 0;

  sentinelObserver.disconnect();
  feed.innerHTML = '';
  feed.scrollTop = 0;

  if (!visibleItems.length) {
    feed.appendChild(buildEmptyState());
  } else {
    const initial = appendSlides(3);
    observeLast(initial[initial.length - 1]);
  }

  updateControls();
}

/* =========================================================
   CONTROLS
   ========================================================= */
function updateControls() {
  const count = activeFilterCount();

  filterButton.classList.toggle('has-filters', count > 0);
  filterButton.querySelector('.text').textContent = count ? `Filter (${count})` : 'Filter';
  sortButton.querySelector('.text').textContent = `Sort: ${SORT_LABELS[state.sort]}`;
}

/* =========================================================
   OVERLAY PLUMBING
   ========================================================= */
function openOverlay(overlay) {
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeOverlay(overlay) {
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
}

function closeAllOverlays() {
  closeOverlay(filterOverlay);
  closeOverlay(sortOverlay);
}

[filterOverlay, sortOverlay].forEach((overlay) => {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeOverlay(overlay);
  });
});

document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => closeOverlay(btn.closest('.overlay')));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAllOverlays();
    setSidebar(false);
  }
});

/* =========================================================
   FILTER SHEET
   ========================================================= */
const FACETS = [
  { key: 'tags', title: 'Tags', placeholder: 'Search tags', values: (item) => item.tags },
  { key: 'categories', title: 'Categories', placeholder: 'Search categories', values: (item) => [item.category] },
  { key: 'sellers', title: 'Seller', placeholder: 'Search sellers', values: (item) => [item.seller.name] }
];

let draft = null;

function cloneFilters(source) {
  return {
    tags: new Set(source.tags),
    categories: new Set(source.categories),
    sellers: new Set(source.sellers),
    priceMin: source.priceMin,
    priceMax: source.priceMax,
    dateFrom: source.dateFrom,
    dateTo: source.dateTo
  };
}

function emptyFilters() {
  return {
    tags: new Set(),
    categories: new Set(),
    sellers: new Set(),
    priceMin: null,
    priceMax: null,
    dateFrom: null,
    dateTo: null
  };
}

function facetOptions(facet) {
  const counts = new Map();

  items.forEach((item) => {
    facet.values(item).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });

  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function buildChipList(facet) {
  return facetOptions(facet)
    .map(([value, count]) => {
      const checked = draft[facet.key].has(value) ? ' checked' : '';
      return `<label class="chip" data-search-text="${escapeHtml(value.toLowerCase())}">
        <input type="checkbox" value="${escapeHtml(value)}"${checked} />
        <span>${escapeHtml(value)}<em>${count}</em></span>
      </label>`;
    })
    .join('');
}

function buildFacetSection(facet) {
  return `<section class="sheet-section">
    <h3 class="sheet-title">${facet.title}</h3>
    <input class="sheet-search" type="search"
           placeholder="${facet.placeholder}"
           data-facet-search="${facet.key}"
           aria-label="${facet.placeholder}" />
    <div class="chip-list" data-facet="${facet.key}">${buildChipList(facet)}</div>
  </section>`;
}

function renderFilterBody() {
  filterBody.innerHTML =
    FACETS.map(buildFacetSection).join('') +
    `<section class="sheet-section">
      <h3 class="sheet-title">Price</h3>
      <div class="range-row">
        <label class="range-field"><span>From</span>
          <input type="number" min="0" inputmode="numeric" placeholder="0"
                 id="f-price-min" value="${draft.priceMin ?? ''}" />
        </label>
        <label class="range-field"><span>To</span>
          <input type="number" min="0" inputmode="numeric" placeholder="5000"
                 id="f-price-max" value="${draft.priceMax ?? ''}" />
        </label>
      </div>
    </section>
    <section class="sheet-section">
      <h3 class="sheet-title">Date</h3>
      <div class="range-row">
        <label class="range-field"><span>From</span>
          <input type="date" id="f-date-from" value="${draft.dateFrom ?? ''}" />
        </label>
        <label class="range-field"><span>To</span>
          <input type="date" id="f-date-to" value="${draft.dateTo ?? ''}" />
        </label>
      </div>
    </section>`;
}

filterBody.addEventListener('change', (event) => {
  const input = event.target;
  if (input.type !== 'checkbox') return;

  const list = input.closest('[data-facet]');
  if (!list) return;

  const key = list.dataset.facet;
  if (input.checked) draft[key].add(input.value);
  else draft[key].delete(input.value);
});

filterBody.addEventListener('input', (event) => {
  const el = event.target;

  if (el.dataset.facetSearch) {
    const key = el.dataset.facetSearch;
    const q = el.value.trim().toLowerCase();

    filterBody.querySelectorAll(`[data-facet="${key}"] .chip`).forEach((chip) => {
      chip.hidden = Boolean(q) && !chip.dataset.searchText.includes(q);
    });
    return;
  }

  switch (el.id) {
    case 'f-price-min': draft.priceMin = el.value === '' ? null : Number(el.value); break;
    case 'f-price-max': draft.priceMax = el.value === '' ? null : Number(el.value); break;
    case 'f-date-from': draft.dateFrom = el.value || null; break;
    case 'f-date-to': draft.dateTo = el.value || null; break;
  }
});

filterButton.addEventListener('click', () => {
  draft = cloneFilters(state.filters);
  renderFilterBody();
  openOverlay(filterOverlay);
});

filterReset.addEventListener('click', () => {
  draft = emptyFilters();
  renderFilterBody();
});

filterApply.addEventListener('click', () => {
  if (draft.priceMin != null && draft.priceMax != null && draft.priceMin > draft.priceMax) {
    [draft.priceMin, draft.priceMax] = [draft.priceMax, draft.priceMin];
  }
  if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) {
    [draft.dateFrom, draft.dateTo] = [draft.dateTo, draft.dateFrom];
  }

  state.filters = draft;
  closeOverlay(filterOverlay);
  refresh();
});

/* =========================================================
   SORT SHEET
   ========================================================= */
function renderSortBody() {
  sortBody.innerHTML = SORT_OPTIONS.map(
    (option) => `<button class="sort-option" type="button" role="radio"
        aria-checked="${state.sort === option.value}"
        data-sort="${option.value}">
      <span>${option.label}</span>
      <svg class="check" viewBox="0 0 24 24" width="20" height="20"
           fill="none" stroke="currentColor" stroke-width="3"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    </button>`
  ).join('');
}

sortBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-sort]');
  if (!button) return;

  state.sort = button.dataset.sort;
  closeOverlay(sortOverlay);
  refresh();
});

sortButton.addEventListener('click', () => {
  renderSortBody();
  openOverlay(sortOverlay);
});

/* =========================================================
   SEARCH BAR (debounced)
   ========================================================= */
let searchTimer = null;

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = searchInput.value;
    refresh();
  }, 180);
});

/* =========================================================
   BURGER → SIDEBAR
   ========================================================= */
function setSidebar(open) {
  sidebar.classList.toggle('is-open', open);
  sidebarOverlay.classList.toggle('is-open', open);
  sidebarOverlay.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('sidebar-open', open);

  if (burgerInput.checked !== open) burgerInput.checked = open;
}

burgerInput.addEventListener('change', () => setSidebar(burgerInput.checked));

sidebarOverlay.addEventListener('click', () => setSidebar(false));

// Sidebar nav → switch content view (About / FAQs / Benefits / Goals)
sidebar.querySelectorAll('.sidebar-nav a[data-page]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setSidebar(false);
    showContentPage(link.dataset.page);
  });
});

// Header logo + sidebar brand → back to marketplace
document.getElementById('header-home').addEventListener('click', showMarketplace);
document.getElementById('sidebar-home').addEventListener('click', () => {
  setSidebar(false);
  showMarketplace();
});

/* =========================================================
   CONTENT VIEW (About / FAQs / Benefits / Goals)
   ========================================================= */
let lastFeedScroll = 0;

function showContentPage(pageName) {
  const content = document.getElementById('content-view');
  if (!content) return;

  lastFeedScroll = feed.scrollTop;

  feed.hidden = true;
  document.querySelector('.sort-container').hidden = true;
  content.hidden = false;
  content.scrollTop = 0;

  content.querySelectorAll('.content-page').forEach((page) => {
    page.hidden = page.dataset.page !== pageName;
  });
}

function showMarketplace() {
  const content = document.getElementById('content-view');
  if (!content || content.hidden) return;

  content.hidden = true;
  document.querySelector('.sort-container').hidden = false;
  feed.hidden = false;
  feed.scrollTop = lastFeedScroll;
}

// In-page "Next: …" buttons inside content pages
document.querySelectorAll('#content-view [data-goto]').forEach((btn) => {
  btn.addEventListener('click', () => showContentPage(btn.dataset.goto));
});

// Content back button
document.getElementById('content-back').addEventListener('click', showMarketplace);

/* =========================================================
   RESET EVERYTHING
   ========================================================= */
function resetEverything() {
  state.query = '';
  searchInput.value = '';
  state.filters = emptyFilters();
  refresh();
}

/* =========================================================
   BOOT
   ========================================================= */
refresh();