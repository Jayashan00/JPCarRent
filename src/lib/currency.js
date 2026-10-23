import { useSyncExternalStore } from 'react';
import { fx } from './utils';
const KEY = 'jp-rentacar-currency';
try { const c = localStorage.getItem(KEY); if (['LKR', 'USD', 'EUR'].includes(c)) fx.display = c; } catch { /* ignore */ }
const subs = new Set();
export function setCurrency(c) {
  fx.display = c;
  try { localStorage.setItem(KEY, c); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export function setMoneyScope(scope) { fx.scope = scope; }
export function useCurrency() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => fx.display);
}
