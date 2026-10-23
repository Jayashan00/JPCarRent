/**
 * Mock data layer. Everything is kept in localStorage so the client can click
 * through every feature before the backend exists.
 *
 * When the backend is ready, replace the bodies of these functions with API
 * calls (e.g. fetch('/api/vehicles')). The rest of the app only talks to `db`.
 */
import { useSyncExternalStore } from 'react';
import { buildSeed, PHOTOS, commons } from '../data/seed';
import { uid, quote, fx } from './utils';

const KEY = 'jp-rentacar-db-v2';
let state = load();
syncFx();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* ignore */ }
  return hydrate(buildSeed());
}

// Fixes saved data from earlier versions: replaces a sample photo link that pointed to a
// file name that doesn't exist. Photos the admin uploaded are never touched.
function migrate(s) {
  let changed = false;
  const fixed = PHOTOS['veh-aqua'].files.map((f) => commons(f));
  s.vehicles = (s.vehicles || []).map((v) => {
    const broken = (v.images || []).some((u) => typeof u === 'string' && u.includes('Toyota%20AQUA%20G'));
    if (broken) changed = true;
    return broken ? { ...v, images: fixed, photoCredit: 'Sample photos of this model: Tokumeigakarinoaoshima, Wikimedia Commons' } : v;
  });
  // v3 content: real place photos and the hero slideshow (only replaces untouched sample images)
  const seed = buildSeed();
  const isOld = (u) => typeof u === 'string' && u.includes('images.unsplash.com');
  if (!s.content?.heroSlides) { s.content = { ...s.content, heroSlides: seed.content.heroSlides }; changed = true; }
  if (isOld(s.content?.hero?.image)) { s.content.hero = { ...s.content.hero, image: seed.content.hero.image }; changed = true; }
  if ((s.destinations || []).length && s.destinations.every((d) => isOld(d.image))) { s.destinations = seed.destinations; changed = true; }
  s.tours = (s.tours || []).map((t) => { if (!isOld(t.image)) return t; changed = true; return { ...t, image: seed.tours.find((x) => x.id === t.id)?.image || seed.tours[0].image }; });
  // correct contact details (replaces earlier placeholders only; values edited in Settings are kept)
  const st = s.settings || {};
  const fixes = {
    email: ['info@jprentacarkandy.lk'],
    mapQuery: ['William Gopallawa Mawatha, Kandy, Sri Lanka', '451 William Gopallawa Mawatha Kandy Sri Lanka'],
    hours: ['Monday to Sunday, 7:00 AM – 9:00 PM'],
    whatsappHours: ['WhatsApp line open 24/7'],
    address: ['451 William Gopallawa Mawatha, Kandy 20000, Sri Lanka'],
  };
  for (const [k, olds] of Object.entries(fixes)) if (olds.includes(st[k])) { st[k] = seed.settings[k]; changed = true; }
  for (const k of ['deliveryNote', 'whatsappNote']) if (st[k] == null) { st[k] = seed.settings[k]; changed = true; }
  s.settings = st;
  if (changed) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }
  return s;
}

// fill in computed totals on seeded bookings
function hydrate(s) {
  s.bookings = s.bookings.map((b) => {
    if (b.total != null) return b;
    const vehicle = s.vehicles.find((v) => v.id === b.vehicleId);
    const q = quote({
      vehicle, pickupAt: b.pickupAt, dropoffAt: b.dropoffAt, mode: b.mode, extras: b.extras, allExtras: s.extras,
      pickupLocation: s.locations.find((l) => l.id === b.pickupLocationId), dropoffLocation: s.locations.find((l) => l.id === b.dropoffLocationId), seasons: s.seasons,
    });
    const paid = b.paymentStatus === 'paid' || b.paymentStatus === 'refunded' ? q.total : b.paymentStatus === 'partial' ? Math.round(q.total * 0.3) : 0;
    const payments = paid ? [{ id: uid('pay'), at: b.pickupAt, amount: paid, method: b.paymentMethod, by: 'Front desk', note: paid < q.total ? 'Advance payment' : 'Full payment' }] : [];
    if (b.paymentStatus === 'refunded') payments.push({ id: uid('pay'), at: b.dropoffAt, amount: -paid, method: b.paymentMethod, by: 'Front desk', note: 'Refund' });
    return { ...b, total: q.total, deposit: q.deposit, lines: q.lines, discount: 0, days: q.days, amountPaid: paid, payments, depositStatus: b.status === 'completed' && q.deposit ? 'returned' : b.status === 'active' && q.deposit ? 'held' : 'none' };
  });
  return s;
}

let saveError = null;
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    saveError = null;
  } catch (e) {
    saveError = 'Storage is full. Remove some large images and try again (the real backend will not have this limit).';
    window.dispatchEvent(new CustomEvent('jp-toast', { detail: { type: 'error', text: saveError } }));
  }
}

function syncFx() {
  const st = state.settings || {};
  fx.base = st.currency || 'LKR';
  fx.rates = { USD: +st.usdRate || 300, EUR: +st.eurRate || 330 };
}

function emit() {
  state = { ...state };
  syncFx();
  persist();
  listeners.forEach((l) => l());
}

export const db = {
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  snapshot: () => state,

  all: (col) => state[col] || [],
  get: (col, id) => (state[col] || []).find((x) => x.id === id),

  create(col, data, prefix) {
    const item = { id: data.id || uid(prefix || col.slice(0, 3)), createdAt: new Date().toISOString(), ...data };
    state[col] = [item, ...(state[col] || [])];
    emit();
    return item;
  },
  update(col, id, patch) {
    let updated;
    state[col] = (state[col] || []).map((x) => (x.id === id ? (updated = { ...x, ...(typeof patch === 'function' ? patch(x) : patch), updatedAt: new Date().toISOString() }) : x));
    emit();
    return updated;
  },
  remove(col, id) {
    state[col] = (state[col] || []).filter((x) => x.id !== id);
    emit();
  },
  reorder(col, ids) {
    const map = Object.fromEntries((state[col] || []).map((x) => [x.id, x]));
    state[col] = ids.map((id) => map[id]).filter(Boolean);
    emit();
  },
  setObject(key, patch) {
    state[key] = { ...(state[key] || {}), ...patch };
    emit();
  },
  setContent(section, value) {
    state.content = { ...state.content, [section]: value };
    emit();
  },
  notify(userId, title, text, link = '') {
    db.create('notifications', { userId, title, text, link, read: false }, 'ntf');
  },
  nextBookingRef() {
    const nums = state.bookings.map((b) => parseInt(String(b.ref).replace(/\D/g, ''), 10) || 0);
    return `JP-${Math.max(261000, ...nums) + 1}`;
  },
  reset() {
    state = hydrate(buildSeed());
    emit();
  },
  exportJSON() { return JSON.stringify(state, null, 2); },
  importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed.vehicles || !parsed.settings) throw new Error('This file is not a JP Rent A Car backup.');
    state = parsed;
    emit();
  },
  storageUsedKB() {
    try { return Math.round((localStorage.getItem(KEY) || '').length / 1024); } catch { return 0; }
  },
};

// sync between browser tabs
window.addEventListener('storage', (e) => {
  if (e.key === KEY && e.newValue) {
    state = JSON.parse(e.newValue);
    listeners.forEach((l) => l());
  }
});

export function useDB() {
  return useSyncExternalStore(db.subscribe, db.snapshot);
}
export function useCollection(col) {
  const s = useDB();
  return s[col] || [];
}
export function useSettings() {
  return useDB().settings;
}