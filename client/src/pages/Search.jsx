import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import useDebounce from '../hooks/useDebounce';
import { usePlayer } from '../context/PlayerContext';
import SearchBar from '../components/SearchBar';
import SongRow from '../components/SongRow';
import PlaylistCard from '../components/PlaylistCard';
import Loader from '../components/Loader';
import SectionHead from '../components/SectionHead';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const debounced = useDebounce(query.trim(), 400);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { playQueue } = usePlayer();

  useEffect(() => {
    setParams(debounced ? { q: debounced } : {}, { replace: true });
    if (!debounced) return setResults(null);

    let cancelled = false;
    setLoading(true);
    setError('');
    api.search(debounced)
      .then((r) => !cancelled && setResults(r))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const none = results && !results.tracks.length && !results.albums.length && !results.artists.length;

  return (
    <>
      <h1 className="mega">Go <em>looking</em></h1>
      <div style={{ margin: '32px 0 8px' }}><SearchBar value={query} onChange={setQuery} /></div>

      {!debounced && <div className="empty quiet"><p className="big-empty">Nothing on the <em>shelf</em> yet.</p><p>Try a song, an artist, an album, a mood.</p></div>}
      {loading && <Loader />}
      {error && <p className="error">{error}</p>}
      {none && !loading && <div className="empty quiet"><p className="big-empty">Nothing by that <em>name.</em></p><p>No results for “{debounced}”. Check the spelling or try another keyword.</p></div>}

      {results && !loading && (
        <>
          {results.tracks.length > 0 && (
            <section className="section">
              <SectionHead n={1} title="Songs" />
              {results.tracks.map((t, i) => (
                <SongRow key={t.id} track={t} index={i} onPlay={() => playQueue(results.tracks, i)} />
              ))}
            </section>
          )}
          {results.artists.length > 0 && (
            <section className="section">
              <SectionHead n={2} title="Artists" />
              <div className="grid stagger">
                {results.artists.map((a) => (
                  <PlaylistCard key={a.id} round to={`/artist/${a.id}`} image={a.picture} title={a.name} subtitle="Artist" />
                ))}
              </div>
            </section>
          )}
          {results.albums.length > 0 && (
            <section className="section">
              <SectionHead n={3} title="Albums" />
              <div className="grid stagger">
                {results.albums.map((a) => (
                  <PlaylistCard key={a.id} to={`/album/${a.id}`} image={a.cover} title={a.title} subtitle={`${a.year || ''} ${a.artist?.name || ''}`} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
