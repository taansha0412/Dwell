import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import TrackList from '../components/TrackList';
import PlaylistCard from '../components/PlaylistCard';
import Hero from '../components/Hero';
import SectionHead from '../components/SectionHead';
import placeholder from '../assets/placeholder-cover.svg';

const SHAPES = ['window', 'arch', 'pill'];

export default function Artist() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setArtist(null);
    api.getArtist(id).then(setArtist).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!artist) return <Loader />;

  return (
    <>
      <Hero
        kicker="Artist"
        title={artist.name}
        art={<div className="cover shape-circle hero-cover"><img src={artist.picture || placeholder} alt="" /></div>}
        meta={artist.fans != null ? `${artist.fans.toLocaleString()} fans` : null}
      />

      <section className="section" style={{ marginTop: 40 }}>
        <SectionHead n={1} title="Popular" />
        <TrackList tracks={artist.topTracks} />
      </section>

      {artist.albums.length > 0 && (
        <section className="section">
          <SectionHead n={2} title="Discography" />
          <div className="grid stagger">
            {artist.albums.map((a, i) => (
              <PlaylistCard key={a.id} shape={SHAPES[i % SHAPES.length]} to={`/album/${a.id}`} image={a.cover} title={a.title} subtitle={a.year} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
