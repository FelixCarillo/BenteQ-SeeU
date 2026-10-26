document.addEventListener('DOMContentLoaded', () => {
  const session = requireAdmin();
  if (!session) return;

  const tbody = document.getElementById('inv-tbody');
  const tableEl = document.getElementById('inv-table');
  const searchInput = document.getElementById('inv-search');
  const addBtn = document.getElementById('add-listing-btn');
  const selectAllBtn = document.getElementById('select-all-btn');
  const selectAllCheck = document.getElementById('select-all-checkbox');
  const deleteSelectedBtn = document.getElementById('delete-selected-btn');
  const selectedCountEl = document.getElementById('selected-count');
  const emptyEl = document.getElementById('inv-empty');
  const resetBtn = document.getElementById('reset-btn');
  const logoutBtn = document.getElementById('logout-btn');

  const imageModal = document.getElementById('image-modal');
  const imageGallery = document.getElementById('image-gallery');
  const detailsModal = document.getElementById('details-modal');
  const detailsBody = document.getElementById('details-body');
  const detailsFooter = document.getElementById('details-footer');
  const confirmModal = document.getElementById('confirm-modal');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  const state = {
    query: '',
    selected: new Set(),
    pendingDelete: null
  };

  logoutBtn.addEventListener('click', () => { clearSession(); location.replace('AdminLogin.html'); });
  addBtn.addEventListener('click', () => { location.href = 'AdminPostListing.html'; });

  resetBtn.addEventListener('click', () => {
    askConfirm('Reset all listings to the default set from listings.js? Any custom listings will be lost.', ['__reset__']);
  });

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value.trim().toLowerCase();
    render();
  });

  selectAllBtn.addEventListener('click', toggleSelectAll);
  selectAllCheck.addEventListener('change', () => {
    if (selectAllCheck.checked) filteredListings().forEach((it) => state.selected.add(Number(it.id)));
    else state.selected.clear();
    render();
  });

  deleteSelectedBtn.addEventListener('click', () => {
    const ids = [...state.selected];
    if (!ids.length) return;
    askConfirm(`Delete ${ids.length} listing${ids.length > 1 ? 's' : ''}? This cannot be undone.`, ids);
  });

  confirmDeleteBtn.addEventListener('click', () => {
    const action = state.pendingDelete;
    if (!action) return;
    if (action.ids[0] === '__reset__') {
      AdminDB.reset();
    } else {
      AdminDB.removeMany(action.ids);
    }
    state.selected.clear();
    state.pendingDelete = null;
    closeModal(confirmModal);
    render();
  });

  [imageModal, detailsModal, confirmModal].forEach((modal) => {
    modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal); });
    modal.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(modal));
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') [imageModal, detailsModal, confirmModal].forEach(closeModal);
  });

  // ---- render ----
  function filteredListings() {
    const all = AdminDB.getAll();
    if (!state.query) return all;
    return all.filter((it) => {
      const hay = [
        it.name, it.category, it.condition, it.badge,
        it.seller?.name, it.seller?.handle, it.seller?.campus,
        ...(it.tags || [])
      ].join(' ').toLowerCase();
      return hay.includes(state.query);
    });
  }

  function render() {
    const list = filteredListings();
    const allIds = new Set(AdminDB.getAll().map((it) => Number(it.id)));
    for (const id of [...state.selected]) if (!allIds.has(id)) state.selected.delete(id);

    tbody.innerHTML = '';
    if (!list.length) {
      emptyEl.hidden = false;
      tableEl.hidden = true;
    } else {
      emptyEl.hidden = true;
      tableEl.hidden = false;
      for (const item of list) tbody.appendChild(buildRow(item));
    }
    updateSelectionUi();
  }

  function buildRow(item) {
    const tr = document.createElement('tr');
    const id = Number(item.id);
    const thumb = item.images?.[0] || '';
    tr.dataset.id = id;
    tr.innerHTML = `
      <td class="col-check">
        <input type="checkbox" class="row-check" data-id="${id}" aria-label="Select listing" />
      </td>
      <td class="col-thumb">
        <button type="button" class="thumb-btn" data-action="images" data-id="${id}" aria-label="View images">
          <img src="${escapeHtml(thumb)}" alt="" loading="lazy" />
        </button>
      </td>
      <td class="col-name">
        <div class="row-name">${escapeHtml(item.name)}</div>
        <div class="row-sub">${escapeHtml(item.category)} · ${escapeHtml(item.condition)}</div>
      </td>
      <td class="col-seller">
        <div class="row-seller">${escapeHtml(item.seller?.name || '—')}</div>
        <div class="row-sub">${escapeHtml(item.seller?.campus || '')}</div>
      </td>
      <td class="col-date">${formatDate(item.datePosted)}</td>
      <td class="col-views">${item.viewCount ?? 0}</td>
      <td class="col-actions">
        <button type="button" class="row-btn" data-action="details" data-id="${id}">Details</button>
        <button type="button" class="row-btn" data-action="images" data-id="${id}">Images</button>
        <a class="row-btn" href="AdminPostListing.html?id=${id}">Edit</a>
        <a class="row-btn" href="${escapeHtml(item.postUrl || '#')}" target="_blank" rel="noopener noreferrer">Post</a>
        <button type="button" class="row-btn row-btn-danger" data-action="delete" data-id="${id}">Delete</button>
      </td>
    `;
    return tr;
  }

  tbody.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    if (action === 'details') openDetails(id);
    else if (action === 'images') openImages(id);
    else if (action === 'delete') {
      const name = AdminDB.find(id)?.name || 'this listing';
      askConfirm(`Delete "${name}"? This cannot be undone.`, [id]);
    }
  });

  tbody.addEventListener('change', (event) => {
    const check = event.target.closest('.row-check');
    if (!check) return;
    const id = Number(check.dataset.id);
    if (check.checked) state.selected.add(id); else state.selected.delete(id);
    updateSelectionUi();
  });

  function toggleSelectAll() {
    const list = filteredListings();
    const allSelected = list.length > 0 && list.every((it) => state.selected.has(Number(it.id)));
    if (allSelected) state.selected.clear();
    else list.forEach((it) => state.selected.add(Number(it.id)));
    render();
  }

  function updateSelectionUi() {
    const count = state.selected.size;
    selectedCountEl.textContent = count;
    deleteSelectedBtn.hidden = count === 0;
    deleteSelectedBtn.disabled = count === 0;

    const list = filteredListings();
    const allChecked = list.length > 0 && list.every((it) => state.selected.has(Number(it.id)));
    const someChecked = list.some((it) => state.selected.has(Number(it.id)));
    selectAllCheck.checked = allChecked;
    selectAllCheck.indeterminate = !allChecked && someChecked;
    selectAllBtn.textContent = allChecked ? 'Deselect all' : 'Select all';

    tbody.querySelectorAll('.row-check').forEach((c) => {
      c.checked = state.selected.has(Number(c.dataset.id));
    });
  }

  // ---- modals ----
  function openImages(id) {
    const item = AdminDB.find(id);
    if (!item) return;
    imageGallery.innerHTML = (item.images || [])
      .map((src, i) => `<img src="${escapeHtml(src)}" alt="Image ${i + 1}" />`)
      .join('');
    openModal(imageModal);
  }

  function openDetails(id) {
    const item = AdminDB.find(id);
    if (!item) return;
    detailsBody.innerHTML = `
      <div class="detail-row"><span>Name</span><strong>${escapeHtml(item.name)}</strong></div>
      <div class="detail-row"><span>Category</span><strong>${escapeHtml(item.category)}</strong></div>
      <div class="detail-row"><span>Condition</span><strong>${escapeHtml(item.condition)}</strong></div>
      <div class="detail-row"><span>Badge</span><strong>${escapeHtml(item.badge || '—')}</strong></div>
      <div class="detail-row"><span>Price</span><strong>${formatPrice(item.price)}</strong></div>
      <div class="detail-row"><span>Tags</span><strong>${(item.tags || []).map(escapeHtml).join(', ') || '—'}</strong></div>
      <div class="detail-row detail-row-full"><span>Description</span><p>${escapeHtml(item.description || '')}</p></div>
      <div class="detail-row"><span>Seller</span><strong>${escapeHtml(item.seller?.name || '—')} (${escapeHtml(item.seller?.handle || '')})</strong></div>
      <div class="detail-row"><span>Campus</span><strong>${escapeHtml(item.seller?.campus || '—')}</strong></div>
      <div class="detail-row"><span>Date posted</span><strong>${formatDate(item.datePosted)}</strong></div>
      <div class="detail-row"><span>Views</span><strong>${item.viewCount ?? 0}</strong></div>
      <div class="detail-row detail-row-full"><span>Post URL</span>
        <a href="${escapeHtml(item.postUrl || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.postUrl || '')}</a>
      </div>
    `;
    detailsFooter.innerHTML = `
      <button type="button" class="inv-ghost-btn" data-close-modal>Close</button>
      <a href="AdminPostListing.html?id=${item.id}" class="inv-primary-btn">Edit listing</a>
    `;
    detailsFooter.querySelector('[data-close-modal]').addEventListener('click', () => closeModal(detailsModal));
    openModal(detailsModal);
  }

  function askConfirm(message, ids) {
    state.pendingDelete = { ids };
    confirmMessage.textContent = message;
    openModal(confirmModal);
  }

  function openModal(modal) {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
  }
  function closeModal(modal) {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    setTimeout(() => { modal.hidden = true; }, 180);
  }

  // ---- helpers ----
  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  }
  function formatPrice(v) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 })
      .format(Number(v) || 0);
  }
  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  render();
});