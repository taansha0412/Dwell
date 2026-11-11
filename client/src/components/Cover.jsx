import { useRef } from 'react';
import placeholder from '../assets/placeholder-cover.svg';

// Arch / window / circle / pill covers that tilt toward the mouse.
export default function Cover({ src, shape = 'arch', listening = false, tilt = true, children }) {
  const ref = useRef(null);
  const move = (e) => {
    if (!tilt || e.pointerType !== 'mouse') return;
    const el = ref.current, r = el.getBoundingClientRect();
    el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
    el.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 14}deg`);
    el.classList.add('moving');
  };
  const reset = () => {
    const el = ref.current;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.classList.remove('moving');
  };
  return (
    <div ref={ref} className={`cw ${listening ? 'listening' : ''}`} onPointerMove={move} onPointerLeave={reset}>
      <div className={`cover shape-${shape}`}>
        <img src={src || placeholder} alt="" loading="lazy" draggable={false} />
      </div>
      {children}
    </div>
  );
}
