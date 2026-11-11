import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { openNewRoom } from '../utils/rooms';
import useDragReorder from '../hooks/useDragReorder';
import Loader from '../components/Loader';
import RoomCard from '../components/RoomCard';

export default function Library() {
  const [lists, setLists] = useState(null);
  const { user, ready, openAuth } = useAuth();

  useEffect(() => {
    if (!user) return setLists(null);
    api.getPlaylists().then(setLists).catch(() => setLists([]));
  }, [user?.id]);

  // Drag rooms to reorder (Liked Songs stays first)
  async function reorder(next) {
    const before = lists;
    setLists(next);
    try {
      setLists(await api.reorderPlaylists(next.filter((p) => p.id !== 'liked').map((p) => p.id)));
    } catch {
      setLists(before);
    }
  }
  const { getItemProps } = useDragReorder(lists || [], reorder, { canDrag: (i) => lists?.[i]?.id !== 'liked' });

  if (!ready) return <Loader />;
  if (!user) {
    return (
      <>
        <h1 className="mega">Your <em>Rooms</em></h1>
        <div className="empty quiet">
          <p className="big-empty">The house is <em>locked.</em></p>
          <p>Log in to see your rooms and liked songs.</p>
          <button className="btn-solid" onClick={() => openAuth('login')}>Log in</button>
        </div>
      </>
    );
  }
  if (!lists) return <Loader />;

  return (
    <>
      <h1 className="mega">Your <em>Rooms</em></h1>
      <p className="lede">Every room is a mood. Drag to rearrange them.</p>
      <div className="grid rooms stagger" style={{ marginTop: 56 }}>
        {lists.map((r, i) => <RoomCard key={r.id} room={r} dragProps={getItemProps(i)} />)}
        <button className="room new" onClick={openNewRoom}>
          <span className="room-frame"><Plus size={34} /></span>
          <h3>New room</h3>
        </button>
      </div>
      {lists.length <= 1 && <p className="empty">Try “Late Night”, “Rainy Window” or “Study Desk”. Use the “…” menu on any song to move it in.</p>}
    </>
  );
}
