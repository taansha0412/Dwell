import { useMemo, useRef, useState } from 'react';
import { hashOf } from '../utils/colors';

// A waveform-shaped seek bar. Bar heights are drawn from the track id (deterministic), not the audio.
function heights(seed, n) {
  let a = hashOf(seed) || 1;
  const rnd = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const phase = rnd() * 6;
  return Array.from({ length: n }, (_, i) => Math.max(0.16, Math.min(1, 0.28 + 0.42 * rnd() + 0.3 * Math.abs(Math.sin(i * 0.23 + phase)))));
}

export default function Waveform({ value, max, onChange, seed = 'idle', bars = 72, label = 'Seek', disabled = false }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  const hs = useMemo(() => heights(seed, bars), [seed, bars]);
  const pct = max ? Math.min(100, (value / max) * 100) : 0;

  const seekTo = (e) => {
    if (disabled || !max) return;
    const r = ref.current.getBoundingClientRect();
    onChange(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * max);
  };
  const keys = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowRight') onChange(Math.min(max, value + 5));
    else if (e.key === 'ArrowLeft') onChange(Math.max(0, value - 5));
    else return;
    e.preventDefault();
  };
  const row = (cls) => <div className={`wf-row ${cls}`} aria-hidden>{hs.map((h, i) => <i key={i} style={{ height: `${h * 100}%` }} />)}</div>;

  return (
    <div
      ref={ref}
      className={`wf ${drag ? 'drag' : ''}`}
      role="slider" tabIndex={disabled ? -1 : 0} aria-label={label}
      aria-valuemin={0} aria-valuemax={Math.round(max || 0)} aria-valuenow={Math.round(value || 0)}
      onKeyDown={keys}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); seekTo(e); }}
      onPointerMove={(e) => drag && seekTo(e)}
      onPointerUp={() => setDrag(false)}
      onPointerCancel={() => setDrag(false)}
    >
      {row('base')}
      <div className="wf-clip" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>{row('done')}</div>
    </div>
  );
}
