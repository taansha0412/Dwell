// The ONLY file that talks to the public music API (Apple iTunes Search API).
// Free, no API key, works worldwide, returns 30-second audio previews.
import config from '../config/index.js';

const ITUNES = 'https://itunes.apple.com';
const CHART = `https://rss.applemarketingtools.com/api/v2/${config.country}/music/most-played/25/songs.json`;

const httpError = (status, message) => Object.assign(new Error(message), { status });

async function getJson(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw httpError(502, 'Could not reach the music API');
  }
  if (!res.ok) throw httpError(502, `Music API responded with ${res.status}`);
  return res.json();
}

const itunes = async (path, params) => {
  const qs = new URLSearchParams({ country: config.country, ...params });
  const data = await getJson(`${ITUNES}${path}?${qs}`);
  return data.results || [];
};

/* ---------- normalizers: the client never sees iTunes' format ---------- */
const bigArt = (url) => (url ? url.replace(/\d+x\d+(bb)?\./, '600x600bb.') : null);

const track = (r) => ({
  id: r.trackId,
  title: r.trackName,
  duration: Math.round((r.trackTimeMillis || 30000) / 1000),
  preview: r.previewUrl,
  artist: { id: r.artistId, name: r.artistName },
  album: { id: r.collectionId, title: r.collectionName },
  cover: bigArt(r.artworkUrl100),
});

const album = (r) => ({
  id: r.collectionId,
  title: r.collectionName,
  cover: bigArt(r.artworkUrl100),
  artist: { id: r.artistId, name: r.artistName },
  year: r.releaseDate ? r.releaseDate.slice(0, 4) : null,
  trackCount: r.trackCount ?? null,
});

const isSong = (r) => r.wrapperType === 'track' && r.kind === 'song' && r.previewUrl;
const songs = (results) => results.filter(isSong).map(track);

// iTunes has no artist photos, so borrow artwork from their songs/albums
function artistsFrom(artistResults, coverSources) {
  const covers = new Map();
  coverSources.forEach((t) => {
    const aid = t.artist?.id;
    if (aid && t.cover && !covers.has(aid)) covers.set(aid, t.cover);
  });
  return artistResults.map((a) => ({
    id: a.artistId,
    name: a.artistName,
    picture: covers.get(a.artistId) || null,
    fans: null,
  }));
}

/* ---------- public functions ---------- */
export async function getChart() {
  let tracks = [];
  try {
    const feed = await getJson(CHART);
    const ids = (feed.feed?.results || []).map((r) => r.id);
    if (ids.length) {
      const found = songs(await itunes('/lookup', { id: ids.join(',') }));
      const byId = new Map(found.map((t) => [String(t.id), t]));
      tracks = ids.map((id) => byId.get(String(id))).filter(Boolean);
    }
  } catch {
    /* chart feed unavailable → fall back to search below */
  }
  if (!tracks.length) {
    tracks = songs(await itunes('/search', { term: 'top hits', entity: 'song', limit: 25 }));
  }

  // Albums and artists are derived from the trending songs
  const albums = new Map();
  const artists = new Map();
  tracks.forEach((t) => {
    if (t.album.id && !albums.has(t.album.id)) {
      albums.set(t.album.id, { id: t.album.id, title: t.album.title, cover: t.cover, artist: t.artist, year: null, trackCount: null });
    }
    if (t.artist.id && !artists.has(t.artist.id)) {
      artists.set(t.artist.id, { id: t.artist.id, name: t.artist.name, picture: t.cover, fans: null });
    }
  });
  return { tracks, albums: [...albums.values()], artists: [...artists.values()], playlists: [] };
}

export async function search(q) {
  const [t, al, ar] = await Promise.all([
    itunes('/search', { term: q, entity: 'song', limit: 25 }),
    itunes('/search', { term: q, entity: 'album', limit: 12 }),
    itunes('/search', { term: q, entity: 'musicArtist', limit: 8 }),
  ]);
  const tracks = songs(t);
  const albums = al.filter((r) => r.collectionId).map(album);
  const covers = [...tracks, ...albums.map((a) => ({ artist: a.artist, cover: a.cover }))];
  return { tracks, albums, artists: artistsFrom(ar, covers) };
}

export async function getTrack(id) {
  const t = songs(await itunes('/lookup', { id }))[0];
  if (!t) throw httpError(404, 'Track not found');
  return t;
}

export async function getAlbum(id) {
  const results = await itunes('/lookup', { id, entity: 'song' });
  const head = results.find((r) => r.wrapperType === 'collection');
  if (!head) throw httpError(404, 'Album not found');
  return { ...album(head), tracks: songs(results) };
}

export async function getArtist(id) {
  const [topResults, albumResults] = await Promise.all([
    itunes('/lookup', { id, entity: 'song', limit: 10 }),
    itunes('/lookup', { id, entity: 'album', limit: 25 }),
  ]);
  const head = topResults.find((r) => r.wrapperType === 'artist') || albumResults.find((r) => r.wrapperType === 'artist');
  if (!head) throw httpError(404, 'Artist not found');
  const topTracks = songs(topResults);
  const albums = albumResults.filter((r) => r.wrapperType === 'collection').map(album);
  return {
    id: head.artistId,
    name: head.artistName,
    picture: albums[0]?.cover || topTracks[0]?.cover || null,
    fans: null,
    topTracks,
    albums,
  };
}
