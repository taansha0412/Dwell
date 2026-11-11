// Your database of uploaded full-length songs. Both the details AND the audio bytes live in the
// Postgres `songs` table, so they survive restarts/redeploys of the server (a host's local disk does not).
// Only this file knows how songs are stored.
import { query } from '../config/db.js';
import { songKey } from '../utils/match.js';

// Never SELECT * here: that would pull the whole audio file into memory on every lookup.
const COLS = 'id, title, artist, album, cover, filename, size, mime, uploaded_at';

const toSong = (r) => r && {
  id: r.id, title: r.title, artist: r.artist, album: r.album, cover: r.cover,
  filename: r.filename, size: Number(r.size), mime: r.mime, uploadedAt: r.uploaded_at,
};

export async function getSong(id) {
  const rows = await query(`SELECT ${COLS} FROM songs WHERE id = $1`, [String(id)]);
  return toSong(rows[0]);
}

// Exact iTunes track id first, then same artist + title (a different release of the same song).
// Only songs whose audio is actually stored count (older rows whose file was lost with the disk are skipped).
export async function findSong(trackId, title, artist) {
  if (trackId) {
    const rows = await query(`SELECT ${COLS} FROM songs WHERE id = $1 AND audio IS NOT NULL`, [String(trackId)]);
    if (rows[0]) return toSong(rows[0]);
  }
  if (!title || !artist) return null;
  const rows = await query(
    `SELECT ${COLS} FROM songs WHERE song_key = $1 AND audio IS NOT NULL ORDER BY uploaded_at DESC LIMIT 1`,
    [songKey(artist, title)]
  );
  return toSong(rows[0]);
}

export async function saveSong({ trackId, title, artist, album, cover, filename, mime, data }) {
  const id = String(trackId);
  await query(
    `INSERT INTO songs (id, title, artist, album, cover, filename, size, mime, audio, song_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, artist = EXCLUDED.artist, album = EXCLUDED.album,
       cover = EXCLUDED.cover, filename = EXCLUDED.filename, size = EXCLUDED.size, mime = EXCLUDED.mime,
       audio = EXCLUDED.audio, song_key = EXCLUDED.song_key, uploaded_at = now()`,
    [id, title.slice(0, 255), artist.slice(0, 255), album.slice(0, 255), cover || null, filename, data.length, mime, data, songKey(artist, title)]
  );
  return getSong(id);
}

// Size + type of a stored song's audio, or null if there is none.
export async function getAudioInfo(id) {
  const rows = await query('SELECT size, mime, filename FROM songs WHERE id = $1 AND audio IS NOT NULL', [String(id)]);
  return rows[0] ? { size: Number(rows[0].size), mime: rows[0].mime, filename: rows[0].filename } : null;
}

// Reads `length` bytes of the audio starting at byte `start` (0-based), straight from Postgres.
export async function readAudio(id, start, length) {
  const rows = await query(
    'SELECT substring(audio FROM $2::int FOR $3::int) AS chunk FROM songs WHERE id = $1',
    [String(id), start + 1, length] // SQL substring is 1-based
  );
  return rows[0]?.chunk || null;
}

export async function removeSong(id) {
  const rows = await query('DELETE FROM songs WHERE id = $1 RETURNING id', [String(id)]);
  return rows.length > 0;
}
