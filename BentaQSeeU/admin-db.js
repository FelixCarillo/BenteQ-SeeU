/* =========================================================
   BENTA Q, SEE U — ADMIN LISTINGS DB
   Wraps localStorage around window.LISTINGS.
   First read seeds from listings.js.
   ========================================================= */
(function () {
  const KEY = 'bq_listings_v1';

  function defaults() {
    if (!Array.isArray(window.LISTINGS)) return [];
    try { return JSON.parse(JSON.stringify(window.LISTINGS)); }
    catch { return window.LISTINGS.slice(); }
  }

  function getAll() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (Array.isArray(stored)) return stored;
    } catch {}
    const seed = defaults();
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }

  function saveAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function nextId(list) {
    return list.reduce((max, it) => Math.max(max, Number(it.id) || 0), 0) + 1;
  }

  function create(data) {
    const list = getAll();
    const item = { ...data, id: nextId(list) };
    list.unshift(item);
    saveAll(list);
    return item;
  }

  function update(id, data) {
    const list = getAll();
    const idx = list.findIndex((it) => Number(it.id) === Number(id));
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, id: list[idx].id };
    saveAll(list);
    return list[idx];
  }

  function remove(id) {
    saveAll(getAll().filter((it) => Number(it.id) !== Number(id)));
  }

  function removeMany(ids) {
    const set = new Set(ids.map(Number));
    saveAll(getAll().filter((it) => !set.has(Number(it.id))));
  }

  function find(id) {
    return getAll().find((it) => Number(it.id) === Number(id)) || null;
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  window.AdminDB = { getAll, saveAll, create, update, remove, removeMany, find, reset, nextId, defaults };
})();