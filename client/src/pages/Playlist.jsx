import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import TrackList from '../components/TrackList';
import Hero from '../components/Hero';
import RoomArt from '../components/RoomArt';

export default function Playlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mine = id === 'liked' || id.startsWith('u_');
  const { user, ready, openAuth } = useAuth();
  const [pl, setPl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready || (mine && !user)) return;
    setPl(null);
    setError('');
    const load = mine ? api.getPlaylist(id) : Promise.reject(new Error('Room not found'));
    load.then(setPl).catch((e) => setError(e.message));
  }, [id, mine, ready, user?.id]);

  async function rename() {
    const name = window.prompt('Rename room', pl.name);
    if (!name?.trim()) return;
    setPl(await api.renamePlaylist(id, name));
  }

  async function remove() {
    if (!window.confirm(`Close the room "${pl.name}" for good?`)) return;
    await api.deletePlaylist(id);
    navigate('/library');
  }

  async function reorder(next) {
    const before = pl;
    setPl({ ...pl, tracks: next }); // update instantly, then save
    try {
      setPl(await api.reorderTracks(id, next.map((t) => t.id)));
    } catch {
      setPl(before);
    }
  }

  async function removeTrack(t) {
    setPl(await api.removeFromPlaylist(id, t.id));
  }

  if (!ready) return <Loader />;
  if (mine && !user) {
    return (
      <div className="empty quiet">
        <p className="big-empty">The house is <em>locked.</em></p>
        <p>Log in to see your rooms.</p>
        <button className="btn-solid" onClick={() => openAuth('login')}>Log in</button>
      </div>
    );
  }
  if (error) return <p className="error">{error}</p>;
  if (!pl) return <Loader />;

  const title = pl.name || pl.title;
  const n = pl.tracks.length;

  return (
    <>
      <Hero
        kicker="Room"
        title={title}
        art={mine ? <RoomArt room={{ id, name: title }} /> : <div className="cover shape-arch hero-cover"><img src={pl.cover} alt="" /></div>}
        meta={<>{!mine && pl.description ? `${pl.description} · ` : ''}<b className="count">{String(n).padStart(2, '0')}</b> {n === 1 ? 'song' : 'songs'}</>}
      >
        {mine && id !== 'liked' && (
          <div className="hero-actions">
            <button className="icon-btn" onClick={rename} aria-label="Rename room"><Pencil size={20} /></button>
            <button className="icon-btn" onClick={remove} aria-label="Delete room"><Trash2 size={20} /></button>
          </div>
        )}
      </Hero>

      <TrackList tracks={pl.tracks} onRemove={mine ? removeTrack : undefined} onReorder={mine ? reorder : undefined} />
    </>
  );
}
