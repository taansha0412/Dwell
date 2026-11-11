import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import useCoverPalette from '../hooks/useCoverPalette';

// The background layer: mesh gradient, album-tinted blobs that breathe with the audio,
// a soft light that follows the cursor, and the wind-down dimmer.
export default function Ambient() {
  const p = usePlayer();
  const pal = useCoverPalette(p.currentTrack?.cover);
  const live = useRef({});
  live.current = { getLevels: p.getLevels, playing: p.playing, has: !!p.currentTrack };

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--t1', pal.c1); r.setProperty('--t2', pal.c2); r.setProperty('--t3', pal.c3);
  }, [pal]);

  useEffect(() => {
    const root = document.documentElement.style;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { root.setProperty('--live', '0'); return; }
    let raf, bass = 0, mid = 0, high = 0, on = 0;
    const loop = (t) => {
      const { getLevels, playing, has } = live.current;
      let l = playing ? getLevels?.() : null;
      if (playing && !l) { // no analyser for this source: a slow, gentle pulse instead
        const s = t / 1000;
        l = { bass: 0.38 + 0.22 * Math.sin(s * 2.2) * Math.sin(s * 0.7), mid: 0.34 + 0.2 * Math.sin(s * 1.3 + 1), high: 0.3 + 0.18 * Math.sin(s * 3.1 + 2) };
      }
      const k = 0.14;
      bass += ((l?.bass ?? 0) - bass) * k; mid += ((l?.mid ?? 0) - mid) * k; high += ((l?.high ?? 0) - high) * k;
      on += ((has && playing ? 1 : 0) - on) * 0.05;
      root.setProperty('--bass', bass.toFixed(3));
      root.setProperty('--mid', mid.toFixed(3));
      root.setProperty('--high', high.toFixed(3));
      root.setProperty('--live', on.toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let raf;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = document.documentElement.style;
        r.setProperty('--mx', `${e.clientX}px`); r.setProperty('--my', `${e.clientY}px`);
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div className="mesh" aria-hidden />
      <div className="breath" aria-hidden><i className="b1" /><i className="b2" /><i className="b3" /></div>
      <div className="glow" aria-hidden />
      <div className="dim" aria-hidden />
    </>
  );
}
