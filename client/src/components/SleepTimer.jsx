import { useEffect, useRef, useState } from 'react';
import { Hourglass } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import formatTime from '../utils/formatTime';

// "Wind down": dims the interface and fades the music out.
export default function SleepTimer({ up = true }) {
  const { sleepActive, sleepLeft, setSleep } = usePlayer();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (m) => { setSleep(m); setOpen(false); };
  return (
    <div className="sleep" ref={box}>
      <button className={`ctrl ${sleepActive ? 'on' : ''}`} onClick={() => setOpen(!open)} aria-label="Wind down timer" aria-expanded={open} title="Wind down">
        <Hourglass size={18} />
        {sleepActive && <span className="sleep-left">{formatTime(sleepLeft)}</span>}
      </button>
      {open && (
        <div className={`menu sleep-menu ${up ? 'up' : ''}`} role="menu">
          <div className="label">Wind down in…</div>
          {[5, 15, 30, 60].map((m) => <button key={m} onClick={() => pick(m)}>{m} minutes</button>)}
          {sleepActive && <button onClick={() => pick(null)}>Cancel timer</button>}
        </div>
      )}
    </div>
  );
}
