// Time-of-day light: dawn blush · afternoon sage · night indigo. "auto" follows the clock.
import { useEffect, useSyncExternalStore } from 'react';

const KEY = 'dwell_light';
const ORDER = ['auto', 'dawn', 'day', 'night'];
const listeners = new Set();
const read = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } };
let mode = read();

const clock = () => { const h = new Date().getHours(); return h >= 5 && h < 11 ? 'dawn' : h >= 11 && h < 18 ? 'day' : 'night'; };
const current = () => (mode === 'auto' ? clock() : mode);
const apply = () => { document.documentElement.dataset.tod = current(); };
const emit = () => listeners.forEach((f) => f());
apply(); // before first paint

export function cycleTod() {
  mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
  try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
  apply(); emit();
}

const subscribe = (f) => { listeners.add(f); return () => listeners.delete(f); };

export function useTod() {
  const snap = useSyncExternalStore(subscribe, () => `${mode}|${current()}`);
  useEffect(() => {
    const id = setInterval(() => { apply(); emit(); }, 60000);
    return () => clearInterval(id);
  }, []);
  const [m, tod] = snap.split('|');
  return { mode: m, tod, cycle: cycleTod };
}
