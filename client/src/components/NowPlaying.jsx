import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import useCoverPalette from '../hooks/useCoverPalette';
import Accent from './Accent';
import Waveform from './Waveform';
import VolumeControl from './VolumeControl';
import SourceInfo from './SourceInfo';
import SleepTimer from './SleepTimer';
import formatTime from '../utils/formatTime';
import placeholder from '../assets/placeholder-cover.svg';

// Tonearm geometry (viewBox 0 0 100 100 over the record): pivot at (108,10), arm length 70.
// 20° puts the needle on the outer groove, 38° at the inner edge; paused = lifted off the record.
const armAngle = (playing, progress) => (playing ? 20 + 18 * Math.min(1, Math.max(0, progress)) : 6);

export default function NowPlaying() {
  const p = usePlayer();
  const t = p.currentTrack;
  const pal = useCoverPalette(t?.cover);
  const open = p.sceneOpen && !!t;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && p.setSceneOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const total = p.duration || 30;
  const close = () => p.setSceneOpen(false);
  const art = t.cover || placeholder;

  return (
    <div className="scene" role="dialog" aria-label="Now playing" style={{ '--t1': pal.c1, '--t2': pal.c2, '--t3': pal.c3 }}>
      <div className="scene-blobs" aria-hidden><i className="s1" /><i className="s2" /><i className="s3" /></div>
      <button className="scene-close" onClick={close} aria-label="Close Now Playing" autoFocus><ChevronDown size={24} /></button>

      <div className="scene-grid">
        <div className={`stage ${p.playing ? 'spinning' : ''}`}>
          <div className="sleeve"><img src={art} alt="" /></div>
          <div className="vinyl-wrap">
            <div className="vinyl">
              <div className="label"><img src={art} alt="" /></div>
              <div className="hole" />
              <div className="sheen" />
            </div>
            <svg className="arm" viewBox="0 0 100 100" aria-hidden>
              <g transform="translate(108 10)">
                <g className="arm-swing" style={{ transform: `rotate(${armAngle(p.playing, p.currentTime / total)}deg)` }}>
                  <rect x="-3.4" y="-15" width="6.8" height="10" rx="2.4" fill="#7c77b9" />
                  <path d="M0 -6V58L-3 70" fill="none" stroke="#f3dad8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="-7.4" y="65" width="7" height="10" rx="1.6" fill="#b23a48" transform="rotate(8 -4 70)" />
                </g>
                <circle r="7.5" fill="#44426b" stroke="#f3dad8" strokeWidth="1" />
                <circle r="2.6" fill="#b23a48" />
              </g>
            </svg>
          </div>
        </div>

        <div className="scene-info">
          <div className="np-top">
            <span className="np-num" aria-hidden>{String(p.queueIndex + 1).padStart(2, '0')}<small>/{String(p.queue.length).padStart(2, '0')}</small></span>
            <span className="np-kicker">Now spinning</span>
          </div>
          <h2 className="np-title"><Accent text={t.title} /></h2>
          <p className="np-by">
            <Link to={`/artist/${t.artist.id}`} onClick={close}>{t.artist.name}</Link>
            {t.album?.title && <> · <Link to={`/album/${t.album.id}`} onClick={close}>{t.album.title}</Link></>}
          </p>
          <SourceInfo />

          <div className="seek np-seek">
            <span className="time">{formatTime(p.currentTime)}</span>
            <Waveform value={p.currentTime} max={total} onChange={p.seek} seed={t.id} bars={64} />
            <span className="time">{formatTime(total)}</span>
          </div>

          <div className="controls np-controls">
            <button className={`ctrl ${p.shuffle ? 'on' : ''}`} onClick={p.toggleShuffle} aria-label="Shuffle" aria-pressed={p.shuffle}><Shuffle size={20} /></button>
            <button className="ctrl" onClick={p.prev} aria-label="Previous"><SkipBack size={24} fill="currentColor" /></button>
            <button className="play-main big" onClick={p.togglePlay} aria-label={p.playing ? 'Pause' : 'Play'}>
              {p.playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" style={{ marginLeft: 3 }} />}
            </button>
            <button className="ctrl" onClick={() => p.next()} aria-label="Next"><SkipForward size={24} fill="currentColor" /></button>
            <button className={`ctrl ${p.repeat !== 'off' ? 'on' : ''}`} onClick={p.cycleRepeat} aria-label={`Repeat: ${p.repeat}`}>
              {p.repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
          </div>

          <div className="np-extras"><VolumeControl /><SleepTimer /></div>
        </div>
      </div>
    </div>
  );
}
