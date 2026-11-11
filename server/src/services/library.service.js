// Your database of uploaded full-length songs: details in the Postgres `songs` table,
// audio files on disk in uploads/. Only this file knows how songs are stored.
import fs from 'node:fs';
import path from 'node:path';
import config from '../config/index.js';
import { query } from '../config/db.js';
import { songKey } from '../utils/match.js';

export const filePath = (song) => path.join(config.uploadDir, song.filename);

const toSong = (r) => r && {
  id: r.id, title: r.title, artist: r.artist, album: r.album, cover: r.cover,
  filename: r.filename, size: Number(r.size), uploadedAt: r.uploaded_at,
};

export async function getSong(id) {
  const rows = await query('SELECT * FROM songs WHERE id = $1', [String(id)]);
  return toSong(rows[0]);
}

// Exact iTunes track id first, then same artist + title (a different release of the same song)
export async function findSong(trackId, title, artist) {
  if (trackId) {
    const exact = await getSong(trackId);
    if (exact) return exact;
  }
  if (!title || !artist) return null;
  const rows = await query('SELECT * FROM songs WHERE song_key = $1 LIMIT 1', [songKey(artist, title)]);
  return toSong(rows[0]);
}

export async function saveSong({ trackId, title, artist, album, cover, filename, size }) {
  const id = String(trackId);
  const old = await getSong(id);

  await query(
    `INSERT INTO songs (id, title, artist, album, cover, filename, size, song_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, artist = EXCLUDED.artist, album = EXCLUDED.album,
       cover = EXCLUDED.cover, filename = EXCLUDED.filename, size = EXCLUDED.size,
       song_key = EXCLUDED.song_key, uploaded_at = now()`,
    [id, title.slice(0, 255), artist.slice(0, 255), album.slice(0, 255), cover || null, filename, size, songKey(artist, title)]
  );

  if (old) fs.rmSync(filePath(old), { force: true }); // replacing an earlier upload
  return getSong(id);
}

export async function removeSong(id) {
  const song = await getSong(id);
  if (!song) return false;
  await query('DELETE FROM songs WHERE id = $1', [song.id]);
  fs.rmSync(filePath(song), { force: true });
  return true;
}
