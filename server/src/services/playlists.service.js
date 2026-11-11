// Playlists per user, in the Postgres `playlists` and `playlist_tracks` tables.
// Clients see the user's Liked Songs as the id "liked"; in the database it is "liked_<userId>".
import { query } from '../config/db.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

const realId = (userId, id) => (id === 'liked' ? `liked_${userId}` : String(id));
const publicId = (id) => (id.startsWith('liked_') ? 'liked' : id);

async function owned(userId, id) {
  const [p] = await query('SELECT id, name FROM playlists WHERE id = $1 AND user_id = $2', [realId(userId, id), userId]);
  if (!p) throw fail(404, 'Playlist not found');
  return p;
}

export async function list(userId) {
  const rows = await query(
    `SELECT p.id, p.name, COUNT(t.id)::int AS "trackCount",
       (SELECT track_data FROM playlist_tracks WHERE playlist_id = p.id ORDER BY sort_order, id LIMIT 1) AS first
     FROM playlists p LEFT JOIN playlist_tracks t ON t.playlist_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id, p.name, p.sort_order, p.created_at
     ORDER BY (p.id = $2) DESC, p.sort_order, p.created_at, p.id`,
    [userId, `liked_${userId}`]
  );
  return rows.map((r) => ({
    id: publicId(r.id),
    name: r.name,
    trackCount: r.trackCount,
    cover: r.first?.cover || null,
  }));
}

export async function get(userId, id) {
  const p = await owned(userId, id);
  const rows = await query('SELECT track_data FROM playlist_tracks WHERE playlist_id = $1 ORDER BY sort_order, id', [p.id]);
  return { id: publicId(p.id), name: p.name, tracks: rows.map((r) => r.track_data) };
}

export async function create(userId, name) {
  const clean = (name || '').trim();
  if (!clean) throw fail(400, 'Playlist name is required');
  const id = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  await query(
    `INSERT INTO playlists (id, user_id, name, sort_order)
     SELECT $1::text, $2::int, $3::text, COALESCE(MAX(sort_order), 0) + 1 FROM playlists WHERE user_id = $2::int`,
    [id, userId, clean.slice(0, 255)]
  );
  return get(userId, id);
}

export async function rename(userId, id, name) {
  const clean = (name || '').trim();
  if (!clean) throw fail(400, 'Playlist name is required');
  if (id === 'liked') throw fail(400, "Liked Songs can't be renamed");
  const p = await owned(userId, id);
  await query('UPDATE playlists SET name = $1 WHERE id = $2', [clean.slice(0, 255), p.id]);
  return get(userId, id);
}

export async function remove(userId, id) {
  if (id === 'liked') throw fail(400, "Liked Songs can't be deleted");
  const p = await owned(userId, id);
  await query('DELETE FROM playlists WHERE id = $1', [p.id]); // its tracks go too (ON DELETE CASCADE)
}

export async function addTrack(userId, id, track) {
  if (!track?.id) throw fail(400, 'A track is required');
  const p = await owned(userId, id);
  await query(
    `INSERT INTO playlist_tracks (playlist_id, track_id, track_data, sort_order)
     SELECT $1::text, $2::text, $3::jsonb, COALESCE(MAX(sort_order), 0) + 1 FROM playlist_tracks WHERE playlist_id = $1::text
     ON CONFLICT (playlist_id, track_id) DO NOTHING`,
    [p.id, String(track.id), JSON.stringify(track)]
  );
  return get(userId, id);
}

export async function removeTrack(userId, id, trackId) {
  const p = await owned(userId, id);
  await query('DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2', [p.id, String(trackId)]);
  return get(userId, id);
}

// New order for the songs inside one playlist
export async function reorderTracks(userId, id, trackIds) {
  if (!Array.isArray(trackIds)) throw fail(400, 'trackIds must be a list');
  const p = await owned(userId, id);
  const existing = (await query('SELECT track_id FROM playlist_tracks WHERE playlist_id = $1 ORDER BY sort_order, id', [p.id])).map((r) => r.track_id);
  const wanted = [...new Set(trackIds.map(String))].filter((t) => existing.includes(t));
  const order = [...wanted, ...existing.filter((t) => !wanted.includes(t))];
  if (order.length) {
    await query('UPDATE playlist_tracks SET sort_order = array_position($1::text[], track_id::text) WHERE playlist_id = $2', [order, p.id]);
  }
  return get(userId, id);
}

// New order for the user's playlists in the sidebar (Liked Songs always stays first)
export async function reorderPlaylists(userId, ids) {
  if (!Array.isArray(ids)) throw fail(400, 'ids must be a list');
  const liked = `liked_${userId}`;
  const existing = (await query('SELECT id FROM playlists WHERE user_id = $1 AND id <> $2 ORDER BY sort_order, created_at', [userId, liked])).map((r) => r.id);
  const wanted = [...new Set(ids.map(String))].filter((i) => existing.includes(i));
  const order = [...wanted, ...existing.filter((i) => !wanted.includes(i))];
  if (order.length) {
    await query('UPDATE playlists SET sort_order = array_position($1::text[], id::text) WHERE user_id = $2 AND id <> $3', [order, userId, liked]);
  }
  return list(userId);
}
