import { Link } from 'react-router-dom';
import { ChevronUp, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import Waveform from './Waveform';
import VolumeControl from './VolumeControl';
import SourceInfo from './SourceInfo';
import SleepTimer from './SleepTimer';
import formatTime from '../utils/formatTime';
import placeholder from '../assets/placeholder-cover.svg';

// The floating player pill. Click the record or title to open the Now Playing scene.
export default function Player() {
  const p = usePlayer();
  const t = p.currentTrack;
  const total = p.duration || 30; // previews are 30s; real duration once metadata loads

  return (
    <footer className={`player ${p.playing ? 'is-playing' : ''}`}>
      <div className="now">
        {t ? (
          <>
            <button className="disc" onClick={() => p.setSceneOpen(true)} aria-label="Open Now Playing">
              <img src={t.cover || placeholder} alt="" />
            </button>
            <div className="now-text">
              <button className="t" onClick={() => p.setSceneOpen(true)}>{t.title}</button>
              <div className="a"><Link to={`/artist/${t.artist.id}`}>{t.artist.name}</Link></div>
              <SourceInfo />
            </div>
          </>
        ) : (
          <>
            <span className="disc empty" aria-hidden />
            <div className="now-text">
              <div className="t idle">The room’s quiet.</div>
              <div className="a">Put something on.</div>
            </div>
          </>
        )}
      </div>

      <div className="controls">
        <button className={`ctrl ${p.shuffle ? 'on' : ''}`} onClick={p.toggleShuffle} aria-label="Shuffle" aria-pressed={p.shuffle}><Shuffle size={17} /></button>
        <button className="ctrl" onClick={p.prev} aria-label="Previous"><SkipBack size={19} fill="currentColor" /></button>
        <button className="play-main" onClick={p.togglePlay} aria-label={p.playing ? 'Pause' : 'Play'} disabled={!t}>
          {p.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
        </button>
        <button className="ctrl" onClick={() => p.next()} aria-label="Next"><SkipForward size={19} fill="currentColor" /></button>
        <button className={`ctrl ${p.repeat !== 'off' ? 'on' : ''}`} onClick={p.cycleRepeat} aria-label={`Repeat: ${p.repeat}`}>
          {p.repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
        </button>
      </div>

      <div className="seek">
        <span className="time">{formatTime(p.currentTime)}</span>
        <Waveform value={p.currentTime} max={total} onChange={p.seek} seed={t?.id || 'idle'} disabled={!t} />
        <span className="time">{formatTime(total)}</span>
      </div>

      <div className="right">
        <VolumeControl />
        <SleepTimer />
        <button className="ctrl open" onClick={() => p.setSceneOpen(true)} disabled={!t} aria-label="Open Now Playing"><ChevronUp size={20} /></button>
      </div>
    </footer>
  );
}
