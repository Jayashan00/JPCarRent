import { useSyncExternalStore } from 'react';
const KEY = 'jp-rentacar-compare';
let ids = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } })();
const subs = new Set();
const set = (next) => { ids = next.slice(0, 3); try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ } subs.forEach((f) => f()); };
export function useCompare() {
  const list = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => ids);
  return {
    ids: list,
    has: (id) => list.includes(id),
    toggle: (id) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]),
    clear: () => set([]),
    full: list.length >= 3,
  };
}
