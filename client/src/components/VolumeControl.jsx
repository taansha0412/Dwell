import { Volume1, Volume2, VolumeX } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { usePlayer } from '../context/PlayerContext';

export default function VolumeControl() {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;
  return (
    <div className="volume">
      <button className="ctrl" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
        <Icon size={20} />
      </button>
      <ProgressBar value={level} max={1} step={0.01} onChange={setVolume} label="Volume" />
    </div>
  );
}
