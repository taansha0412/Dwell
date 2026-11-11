import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import TrackList from '../components/TrackList';
import Hero from '../components/Hero';
import placeholder from '../assets/placeholder-cover.svg';

export default function Album() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setAlbum(null);
    api.getAlbum(id).then(setAlbum).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!album) return <Loader />;

  return (
    <>
      <Hero
        kicker={album.year ? `Album · ${album.year}` : 'Album'}
        title={album.title}
        art={<div className="cover shape-arch hero-cover"><img src={album.cover || placeholder} alt="" /></div>}
        meta={<>
          {album.artist && <Link to={`/artist/${album.artist.id}`}><b>{album.artist.name}</b></Link>}
          {' · '}<b className="count">{String(album.tracks.length).padStart(2, '0')}</b> songs
        </>}
      />
      <TrackList tracks={album.tracks} showCover={false} />
    </>
  );
}
