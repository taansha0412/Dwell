import { Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import useDragReorder from '../hooks/useDragReorder';
import SongRow from './SongRow';

// onRemove  → shows a remove button on each row
// onReorder → rows can be dragged up and down; called with the new array
export default function TrackList({ tracks, onRemove, onReorder, showCover = true }) {
  const { playQueue } = usePlayer();
  const { getItemProps } = useDragReorder(tracks, (next) => onReorder?.(next), { enabled: !!onReorder });

  if (!tracks.length) {
    return (
      <div className="empty quiet">
        <p className="big-empty">The room’s <em>quiet.</em></p>
        <p>Put something on — find songs in Search and add them with the “…” menu.</p>
      </div>
    );
  }
  return (
    <>
      <div className="actions">
        <button className="big-play" onClick={() => playQueue(tracks, 0)} aria-label="Play all">
          <Play size={24} fill="currentColor" style={{ marginLeft: 2 }} />
        </button>
        {onReorder && tracks.length > 1 && <span className="hint-inline">Drag songs up or down to reorder</span>}
      </div>
      <div className="list-head"><span style={{ textAlign: 'center' }}>#</span><span>Title</span><span style={{ textAlign: 'right' }}>Time</span><span /></div>
      {tracks.map((t, i) => (
        <SongRow
          key={t.id}
          track={t}
          index={i}
          showCover={showCover}
          dragProps={getItemProps(i)}
          onPlay={() => playQueue(tracks, i)}
          onRemove={onRemove ? () => onRemove(t) : undefined}
        />
      ))}
    </>
  );
}
