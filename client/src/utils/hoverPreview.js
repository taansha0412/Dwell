// "Hover to listen": hovering a song card plays a few seconds of its preview.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const KEY = 'dwell_hover';
const listeners = new Set();
let enabled = (() => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } })();
const subscribe = (f) => { listeners.add(f); return () => listeners.delete(f); };

export function toggleHoverListen() {
  enabled = !enabled;
  try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* ignore */ }
  if (!enabled) stopActive();
  listeners.forEach((f) => f());
}
export const useHoverListen = () => [useSyncExternalStore(subscribe, () => enabled), toggleHoverListen];

const LENGTH = 6000;
let el, fadeId, endId, active = null;

function fade(to, ms, done) {
  clearInterval(fadeId);
  const from = el.volume, steps = 12;
  let i = 0;
  fadeId = setInterval(() => {
    i++;
    el.volume = Math.min(1, Math.max(0, from + ((to - from) * i) / steps));
    if (i >= steps) { clearInterval(fadeId); done?.(); }
  }, ms / steps);
}

function stopActive() {
  clearTimeout(endId);
  if (!active) return;
  const a = active;
  active = null;
  a.setListening(false);
  fade(0, 350, () => { if (!active) el.pause(); });
}

function begin(track, setListening) {
  stopActive();
  if (!el) el = new Audio();
  clearInterval(fadeId);
  el.src = track.preview;
  el.volume = 0;
  active = { id: track.id, setListening };
  setListening(true);
  el.play().then(() => active?.id === track.id && fade(0.5, 500)).catch(() => active?.id === track.id && stopActive());
  endId = setTimeout(stopActive, LENGTH);
}

export function useHoverPreview(track, blocked) {
  const [listening, setListening] = useState(false);
  const [on] = useHoverListen();
  const timer = useRef();

  const leave = useCallback(() => {
    clearTimeout(timer.current);
    if (active?.id === track.id) stopActive();
  }, [track.id]);

  useEffect(() => { if (blocked) leave(); }, [blocked, leave]);
  useEffect(() => leave, [leave]);

  const onPointerEnter = (e) => {
    if (!on || blocked || !track.preview || e.pointerType !== 'mouse') return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => begin(track, setListening), 450); // hover intent
  };
  return { listening, handlers: { onPointerEnter, onPointerLeave: leave } };
}
