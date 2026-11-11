import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { openNewRoom } from '../utils/rooms';
import Loader from '../components/Loader';
import SongCard from '../components/SongCard';
import PlaylistCard from '../components/PlaylistCard';
import RoomCard from '../components/RoomCard';
import SectionHead from '../components/SectionHead';

const word = () => {
  const h = new Date().getHours();
  return h < 5 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
};
const SONG_SHAPES = ['arch', 'circle', 'pill', 'window'];
const ALBUM_SHAPES = ['window', 'arch', 'pill'];

export default function Home() {
  const [data, setData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const { playQueue } = usePlayer();
  const { user } = useAuth();

  useEffect(() => {
    api.getChart().then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!user) return setRooms([]);
    api.getPlaylists().then(setRooms).catch(() => {});
  }, [user?.id]);

  if (error) return <p className="error">Couldn't load music: {error}. Is the server running?</p>;
  if (!data) return <Loader />;
  if (!data.tracks.length) return <p className="empty">No songs found. Check the server terminal for errors.</p>;

  let n = 0;
  return (
    <>
      <header className="masthead">
        <h1 className="mega">Good <em>{word()}</em></h1>
        <p className="lede">Pick a door. Put something on.</p>
      </header>

      {user && (
        <section className="section">
          <SectionHead n={++n} title="Your Rooms" />
          <div className="grid rooms stagger">
            {rooms.map((r) => <RoomCard key={r.id} room={r} />)}
            <button className="room new" onClick={openNewRoom}>
              <span className="room-frame"><Plus size={34} /></span>
              <h3>New room</h3>
            </button>
          </div>
        </section>
      )}

      <section className="section">
        <SectionHead n={++n} title="Trending songs" />
        <div className="grid stagger">
          {data.tracks.slice(0, 12).map((t, i) => (
            <SongCard key={t.id} track={t} rank={i + 1} shape={SONG_SHAPES[i % SONG_SHAPES.length]} onPlay={() => playQueue(data.tracks, i)} />
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead n={++n} title="Popular albums" />
        <div className="grid stagger">
          {data.albums.slice(0, 12).map((a, i) => (
            <PlaylistCard key={a.id} shape={ALBUM_SHAPES[i % ALBUM_SHAPES.length]} to={`/album/${a.id}`} image={a.cover} title={a.title} subtitle={a.artist?.name} />
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead n={++n} title="Popular artists" />
        <div className="grid stagger">
          {data.artists.slice(0, 12).map((a) => (
            <PlaylistCard key={a.id} round to={`/artist/${a.id}`} image={a.picture} title={a.name} subtitle="Artist" />
          ))}
        </div>
      </section>
    </>
  );
}
