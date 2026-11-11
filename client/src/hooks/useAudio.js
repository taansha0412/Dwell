import { useCallback, useEffect, useRef, useState } from 'react';

// Wraps one HTML5 Audio element and exposes reactive state + controls.
// Also taps the audio with a Web Audio analyser so the interface can breathe with the music.
// The analyser needs the audio to be CORS-readable; if a source isn't, we play it normally
// (on a fresh element) and the UI falls back to a gentle simulated pulse.
const noCorsHosts = new Set();
const hostOf = (u) => { try { return new URL(u, location.href).host; } catch { return ''; } };

export default function useAudio({ onEnded, onError } = {}) {
  const audioRef = useRef(null);
  const volRef = useRef(0.7);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const bufRef = useRef(null);
  const unbindRef = useRef(() => {});
  const triedRef = useRef(false);

  const handlers = useRef({});
  handlers.current = { onEnded, onError };

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  const ensureGraph = (a) => {
    if (a._node || a.crossOrigin !== 'anonymous') return;
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctxRef.current = new AC();
        const an = ctxRef.current.createAnalyser();
        an.fftSize = 512;
        an.smoothingTimeConstant = 0.8;
        an.connect(ctxRef.current.destination);
        analyserRef.current = an;
        bufRef.current = new Uint8Array(an.frequencyBinCount);
      }
      a._node = ctxRef.current.createMediaElementSource(a);
      a._node.connect(analyserRef.current);
    } catch { /* analyser unavailable: audio still plays */ }
  };

  // (re)attach listeners to whichever element is current
  const bind = useCallback((a) => {
    const ev = {
      timeupdate: () => setCurrentTime(a.currentTime),
      loadedmetadata: () => setDuration(a.duration || 0),
      play: () => { setPlaying(true); ensureGraph(a); ctxRef.current?.resume?.(); },
      pause: () => setPlaying(false),
      ended: () => handlers.current.onEnded?.(),
      error: () => {
        // CORS-less source: retry once on a fresh element without the analyser
        if (a.crossOrigin && !triedRef.current && a.src) {
          triedRef.current = true;
          noCorsHosts.add(hostOf(a.src));
          swapElement(a.src, a.currentTime, true);
          return;
        }
        handlers.current.onError?.();
      },
    };
    Object.entries(ev).forEach(([e, fn]) => a.addEventListener(e, fn));
    unbindRef.current = () => Object.entries(ev).forEach(([e, fn]) => a.removeEventListener(e, fn));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function make(cors) {
    const a = new Audio();
    if (cors) a.crossOrigin = 'anonymous';
    a.volume = volRef.current;
    bind(a);
    return a;
  }

  function swapElement(src, at = 0, autoplay = true) {
    const old = audioRef.current;
    unbindRef.current();
    old.pause();
    old.removeAttribute('src');
    old.load?.();
    const a = make(false);
    audioRef.current = a;
    a.src = src;
    if (at) a.currentTime = at;
    if (autoplay) a.play().catch(() => {});
  }

  if (!audioRef.current) audioRef.current = make(true);

  // (Re)attach listeners on mount. React StrictMode runs mount → cleanup → mount in dev,
  // and the cleanup removes the listeners, so they must be re-added here.
  useEffect(() => {
    unbindRef.current();
    bind(audioRef.current);
    const a = audioRef.current;
    setPlaying(!a.paused);
    setCurrentTime(a.currentTime);
    return () => { unbindRef.current(); audioRef.current.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback((src, autoplay = true) => {
    triedRef.current = false;
    setCurrentTime(0);
    const wantCors = !noCorsHosts.has(hostOf(src));
    let a = audioRef.current;
    if (a._node && !wantCors) return swapElement(src, 0, autoplay); // analysed element can't play CORS-less audio
    if (!a._node) { if (wantCors) a.crossOrigin = 'anonymous'; else a.removeAttribute('crossorigin'); }
    a.src = src;
    if (autoplay) a.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(() => audioRef.current.play().catch(() => {}), []);
  const pause = useCallback(() => audioRef.current.pause(), []);
  const seek = useCallback((t) => { audioRef.current.currentTime = t; setCurrentTime(t); }, []);
  const setVolume = useCallback((v) => { volRef.current = v; audioRef.current.volume = v; }, []);

  // 0..1 levels for the UI, or null when the analyser isn't available / nothing is playing
  const getLevels = useCallback(() => {
    const an = analyserRef.current, a = audioRef.current;
    if (!an || !a._node || a.paused) return null;
    an.getByteFrequencyData(bufRef.current);
    const avg = (from, to) => { let s = 0; for (let i = from; i < to; i++) s += bufRef.current[i]; return s / (to - from) / 255; };
    return { bass: Math.min(1, avg(1, 4) * 1.15), mid: Math.min(1, avg(4, 20) * 1.6), high: Math.min(1, avg(20, 60) * 2.4) };
  }, []);

  return { currentTime, duration, playing, load, play, pause, seek, setVolume, getLevels };
}
