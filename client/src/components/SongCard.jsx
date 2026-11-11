import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useHoverPreview } from '../utils/hoverPreview';
import Cover from './Cover';

export default function SongCard({ track, onPlay, shape = 'arch', rank }) {
  const { playing } = usePlayer();
  const { listening, handlers } = useHoverPreview(track, playing);
  return (
    <div className="card" {...handlers}>
      <Cover src={track.cover} shape={shape} listening={listening}>
        {rank != null && <span className="rank" aria-hidden>{rank}</span>}
        {listening && <span className="eq" aria-hidden><i /><i /><i /></span>}
        <button className="fab" onClick={onPlay} aria-label={`Play ${track.title}`}>
          <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
        </button>
      </Cover>
      <h3 title={track.title}>{track.title}</h3>
      <p><Link to={`/artist/${track.artist.id}`}>{track.artist.name}</Link></p>
    </div>
  );
}
