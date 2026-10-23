export const DAY = 86400000;

export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const cx = (...a) => a.filter(Boolean).join(' ');

/**
 * Currency display. Prices are stored and charged in the base currency (LKR).
 * Visitors can view approximate prices in USD or EUR; the admin always sees LKR.
 */
export const fx = { base: 'LKR', display: 'LKR', scope: 'display', rates: { USD: 300, EUR: 330 } };
const SYMBOL = { USD: 'US$', EUR: '€' };
export function money(n, currency) {
  if (n == null || isNaN(n)) return '—';
  const cur = fx.scope === 'display' ? fx.display : fx.base;
  if (cur !== fx.base && fx.rates[cur]) {
    const v = n / fx.rates[cur];
    return `${SYMBOL[cur] || cur + ' '}${Math.round(v).toLocaleString('en-US')}`;
  }
  return `${currency || fx.base} ${Math.round(n).toLocaleString('en-US')}`;
}
/** Small "≈ US$" hint shown under LKR prices (hidden when the visitor already chose another currency). */
export function usd(n, rate) {
  if (!rate || (fx.scope === 'display' && fx.display !== fx.base)) return '';
  return `≈ US$${Math.round(n / rate).toLocaleString('en-US')}`;
}
/** Always formats in the base currency (used for amounts that are actually charged). */
export function moneyBase(n) {
  if (n == null || isNaN(n)) return '—';
  return `${fx.base} ${Math.round(n).toLocaleString('en-US')}`;
}

export function fmtDate(d, withTime = false) {
  if (!d) return '—';
  const date = new Date(d);
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) Object.assign(opts, { hour: 'numeric', minute: '2-digit' });
  return date.toLocaleString('en-GB', opts);
}
export function fmtShort(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
export function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(d);
}

// value for <input type="datetime-local">
export function toLocalInput(d) {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
export function defaultDates(offset = 1, length = 3) {
  const a = new Date(Date.now() + offset * DAY); a.setHours(9, 0, 0, 0);
  const b = new Date(a.getTime() + length * DAY);
  return { pickupAt: toLocalInput(a), dropoffAt: toLocalInput(b) };
}

export function rentalDays(pickupAt, dropoffAt) {
  const ms = new Date(dropoffAt) - new Date(pickupAt);
  if (!(ms > 0)) return 0;
  // a grace period of 2 hours before an extra day is charged
  return Math.max(1, Math.ceil((ms - 2 * 3600000) / DAY));
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

export const BLOCKING = ['pending', 'confirmed', 'active'];
/** Periods when a vehicle can't be rented: live bookings plus unfinished maintenance. */
export function busyPeriods(vehicleId, bookings = [], maintenance = [], ignoreId) {
  const out = bookings.filter((b) => b.vehicleId === vehicleId && b.id !== ignoreId && BLOCKING.includes(b.status))
    .map((b) => ({ start: b.pickupAt, end: b.dropoffAt, kind: 'booking', ref: b.ref }));
  for (const m of maintenance) {
    if (m.vehicleId !== vehicleId || m.status === 'done' || !m.blocks) continue;
    const s = new Date(m.date); s.setHours(0, 0, 0, 0);
    const e = new Date(m.endDate || m.date); e.setHours(23, 59, 0, 0);
    out.push({ start: s.toISOString(), end: e.toISOString(), kind: 'maintenance', ref: m.type });
  }
  return out;
}
export function isVehicleFree(vehicleId, start, end, bookings, ignoreId, maintenance = []) {
  return !busyPeriods(vehicleId, bookings, maintenance, ignoreId).some((p) => overlaps(start, end, p.start, p.end));
}

/** The single source of truth for price calculation (mirror this on the backend). */
export function seasonFor(date, seasons = []) {
  const t = new Date(date).toISOString().slice(0, 10);
  return seasons.find((s) => s.active && s.start <= t && t <= s.end);
}

export function quote({ vehicle, pickupAt, dropoffAt, mode = 'self', extras = [], allExtras = [], pickupLocation, dropoffLocation, promo, taxPercent = 0, seasons = [] }) {
  const days = rentalDays(pickupAt, dropoffAt);
  if (!vehicle || !days) return { days: 0, lines: [], subtotal: 0, discount: 0, tax: 0, total: 0, deposit: 0, dayRate: 0 };
  let dayRate = vehicle.dailyRate;
  let rateLabel = 'daily rate';
  if (days >= 30 && vehicle.monthlyRate) { dayRate = vehicle.monthlyRate / 30; rateLabel = 'monthly rate'; }
  else if (days >= 7 && vehicle.weeklyRate) { dayRate = vehicle.weeklyRate / 7; rateLabel = 'weekly rate'; }
  const lines = [{ label: `${days} day${days > 1 ? 's' : ''} × ${Math.round(dayRate).toLocaleString('en-US')} (${rateLabel})`, amount: dayRate * days }];
  // seasonal price changes (e.g. peak season, Kandy Perahera)
  const bySeason = {};
  for (let i = 0; i < days; i++) {
    const s = seasonFor(new Date(new Date(pickupAt).getTime() + i * DAY), seasons);
    if (s) bySeason[s.id] = { s, n: (bySeason[s.id]?.n || 0) + 1 };
  }
  for (const { s, n } of Object.values(bySeason)) {
    lines.push({ label: `${s.name} (${s.percent > 0 ? '+' : ''}${s.percent}%, ${n} day${n > 1 ? 's' : ''})`, amount: (dayRate * n * s.percent) / 100 });
  }
  if (mode === 'driver') lines.push({ label: `Driver, ${days} day${days > 1 ? 's' : ''}`, amount: (vehicle.driverRate || 0) * days });
  for (const id of extras) {
    const e = allExtras.find((x) => x.id === id);
    if (!e) continue;
    lines.push({ label: e.name + (e.per === 'day' ? `, ${days} day${days > 1 ? 's' : ''}` : ''), amount: e.per === 'day' ? e.price * days : e.price });
  }
  if (pickupLocation?.fee) lines.push({ label: `Pickup fee: ${pickupLocation.name}`, amount: pickupLocation.fee });
  if (dropoffLocation?.fee) lines.push({ label: `Return fee: ${dropoffLocation.name}`, amount: dropoffLocation.fee });
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  let discount = 0;
  if (promo && promo.active && days >= (promo.minDays || 1) && (!promo.expires || new Date(promo.expires) >= new Date(new Date().toDateString()))) {
    discount = promo.type === 'percent' ? (subtotal * promo.value) / 100 : Math.min(promo.value, subtotal);
  }
  const tax = ((subtotal - discount) * (taxPercent || 0)) / 100;
  return { days, dayRate, lines, subtotal, discount, tax, total: Math.round(subtotal - discount + tax), deposit: mode === 'driver' ? 0 : vehicle.deposit || 0 };
}

export function promoError(promo, days) {
  if (!promo) return 'This code isn’t valid.';
  if (!promo.active) return 'This code is no longer active.';
  if (promo.expires && new Date(promo.expires) < new Date(new Date().toDateString())) return 'This code has expired.';
  if (days < (promo.minDays || 1)) return `This code needs a rental of at least ${promo.minDays} days.`;
  return '';
}

export function waLink(number, text) {
  return `https://wa.me/${String(number).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

/** Reads an image file, scales it down and returns a compressed JPEG data URL. */
export function fileToDataUrl(file, maxSize = 1400, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
}

export function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

export const STATUS_LABEL = {
  pending: 'Awaiting confirmation', confirmed: 'Confirmed', active: 'On trip', completed: 'Completed', cancelled: 'Cancelled',
  unpaid: 'Unpaid', partial: 'Part paid', paid: 'Paid', refunded: 'Refunded',
};
export const PAY_METHOD = { pickup: 'Pay on pickup', bank: 'Bank transfer', card: 'Card' };

/**
 * Locations are free text: customers can type any place in Sri Lanka.
 * If the text matches one of the admin's saved locations, that location's fee applies;
 * otherwise the place is kept as typed and any delivery cost is confirmed by the team.
 */
export function resolvePlace(text, locations = []) {
  const t = String(text || '').trim();
  if (!t) return null;
  const hit = locations.find((l) => l.active !== false && (l.id === t || l.name.toLowerCase() === t.toLowerCase()));
  if (hit) return hit;
  return { id: null, name: t, fee: 0, custom: true };
}
/** Display name of a booking's pickup or return place. */
export function placeOf(b, which, locations = []) {
  if (!b) return '';
  const text = which === 'pickup' ? b.pickupPlace : b.dropoffPlace;
  if (text) return text;
  const id = which === 'pickup' ? b.pickupLocationId : b.dropoffLocationId;
  return locations.find((l) => l.id === id)?.name || '';
}
