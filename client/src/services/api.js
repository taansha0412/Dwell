// All fetch calls to YOUR backend (never directly to the public music API).
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

/* ---- login token (kept in the browser) ---- */
const TOKEN_KEY = 'dwell_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired')); // session ended
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const api = {
  // accounts
  register: (username, password) => request('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // music (proxied from the public API)
  getChart: () => request('/tracks/chart'),
  getTrack: (id) => request(`/tracks/${id}`),
  getAlbum: (id) => request(`/tracks/albums/${id}`),
  getArtist: (id) => request(`/tracks/artists/${id}`),
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),

  // playback chain: your uploads -> 30s preview
  resolvePlayback: async (t) => {
    const qs = new URLSearchParams({ id: t.id, title: t.title, artist: t.artist.name });
    const r = await request(`/playback?${qs}`);
    return r.url ? r : { ...r, source: 'preview', url: t.preview };
  },
  // XMLHttpRequest (not fetch) so we can report upload progress
  uploadSong: (t, file, onProgress) =>
    new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append('trackId', t.id);
      fd.append('title', t.title);
      fd.append('artist', t.artist.name);
      fd.append('album', t.album?.title || '');
      fd.append('cover', t.cover || '');
      fd.append('file', file); // file last

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE}/library/upload`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
      xhr.onerror = () => reject(new Error("Couldn't reach the server. Is it running, and is CLIENT_ORIGIN in server/.env set to this page's address?"));
      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.error || `Upload failed (server answered ${xhr.status})`));
      };
      xhr.send(fd);
    }),
  removeUpload: (id) => request(`/library/${id}`, { method: 'DELETE' }),

  // your playlists
  getPlaylists: () => request('/playlists'),
  getPlaylist: (id) => request(`/playlists/${id}`),
  createPlaylist: (name) => request('/playlists', { method: 'POST', body: { name } }),
  renamePlaylist: (id, name) => request(`/playlists/${id}`, { method: 'PATCH', body: { name } }),
  deletePlaylist: (id) => request(`/playlists/${id}`, { method: 'DELETE' }),
  addToPlaylist: (id, track) => request(`/playlists/${id}/tracks`, { method: 'POST', body: { track } }),
  removeFromPlaylist: (id, trackId) => request(`/playlists/${id}/tracks/${trackId}`, { method: 'DELETE' }),
  reorderTracks: (id, trackIds) => request(`/playlists/${id}/order`, { method: 'PUT', body: { trackIds } }),
  reorderPlaylists: (ids) => request('/playlists/order', { method: 'PUT', body: { ids } }),
};

export default api;
