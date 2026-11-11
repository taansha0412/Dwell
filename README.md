# Dwell

A music player web app (React + Vite client, Node + Express server, **Supabase** Postgres database).
Songs come from Apple's public iTunes Search API (no key needed) as 30-second previews, and you can
upload your own full-length version of any song to your library, after which Dwell plays that by default.

```
dwell/
├── client/   React + Vite frontend
└── server/   Node + Express backend  ──►  Supabase (Postgres)  +  iTunes Search API
```

## Quick start

Requires **Node 18+** and a free [Supabase](https://supabase.com) project (setup below).

```bash
# 1) Backend
cd server
cp .env.example .env     # then paste your Supabase connection string (see below)
npm install
npm run dev              # http://localhost:5000

# 2) Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com) and note the **database password** you choose.
2. In the project, click **Connect** and copy the **Session pooler** connection string
   (it looks like `postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres`).
   Menu labels may differ slightly between dashboard versions.
   Use the *Session pooler* string, not "Direct connection": the direct one is IPv6-only and fails on many home networks.
3. Put it in `server/.env` as `DATABASE_URL`, replacing `[YOUR-PASSWORD]` with your password.
   If the password has special characters, URL-encode them (`@` becomes `%40`, `#` becomes `%23`).
4. Start the server. It **creates all tables automatically** on first start. Check **Table Editor** in Supabase to see them.
   (`server/sql/schema.sql` has the same SQL if you prefer to paste it into the SQL Editor.)

If the connection fails the server prints a plain-English reason and exits (wrong password, can't reach host, etc.).

**Security**
- Keep `DATABASE_URL` private: it is a full-access password. Never put it in the client or commit it (`.env` is git-ignored).
- Supabase exposes tables in the `public` schema through its own REST API. Dwell turns on **Row Level Security** for every table
  with no policies, which blocks all of that access. Only the Dwell server, connecting directly, can read or write the data.

| Table | Holds |
|---|---|
| `users` | profiles: username + scrypt password hash |
| `sessions` | logins (hashed tokens, 30 days) |
| `songs` | uploaded full-length songs: title, artist, album, cover, size, and the audio itself |
| `playlists` | each profile's Liked Songs + playlists (with their order) |
| `playlist_tracks` | tracks inside each playlist, in order (deleted with the playlist) |

## How playback works

When you click a song, the server picks the source (`GET /api/playback`):

1. **Your library**: if you've uploaded a full-length file for that song, it plays that. Songs match by the
   song's id, or by artist + title, so other releases of the same song match too.
2. **30-second preview** (iTunes): otherwise the preview plays, and the player bar shows an **Upload full song**
   button. After you upload, the file is stored in your Supabase database, and plays by default from then on.
   A small trash icon next to "Full song · your library" removes an upload.

If an uploaded file can't be played by your browser, Dwell falls back to the preview and tells you why.
Only upload music you own or have the right to use.

Uploaded audio files are stored in the Supabase `songs` table itself (column `audio`), next to their details, so they
survive server restarts and redeploys on hosts with a temporary disk (e.g. Render). Keep an eye on your Supabase database
size (500 MB on the free plan); for a big library, move the files to Supabase Storage instead.

Songs uploaded by an older version of Dwell (when files lived on the server's disk) have no audio in the database;
they play the 30s preview until you upload the full file again.

## Deploying behind a proxy (Render, etc.)

The server sets `trust proxy`, so it knows the public request is HTTPS and returns `https://` stream URLs (otherwise the
browser blocks them as Mixed Content). Set `CLIENT_ORIGIN` on the server to your frontend's URL (comma-separate several).
For a React Router site hosted as a Render *Static Site*, add a rewrite rule `/*` -> `/index.html`, or refreshing
a page like `/library` shows a 404.

## Profiles

Click **Sign up** (top right) to create a profile with a username and password, **Log in** to open an existing one.
Each profile has its own playlists and Liked Songs. You can browse, search and play without an account;
you need one to save songs or create playlists. Passwords are hashed (scrypt) and never stored in plain text.
Uploaded full-length songs are shared by every profile (they belong to the server's library).

## Reordering

- **Songs in a playlist:** drag a row up or down (a grip icon appears on hover).
- **Rooms (playlists):** on the Rooms page, drag a room up or down. Liked Songs stays pinned at the top.

Drag and drop works with a mouse (desktop browsers), not on touch screens.

## Troubleshooting uploads

If an upload doesn't work you get a red message in the bottom-right corner. Also check:
- the server terminal: it prints `Uploaded: "Song" by Artist` on success, or `POST /api/library/upload -> 400: reason` on failure;
- browser DevTools (F12) → Network → the `upload` request → its status and response.

Common causes: unsupported file type, file over `MAX_UPLOAD_MB`, the page's address not matching `CLIENT_ORIGIN`
in `server/.env`, or a file the browser can't decode (MP3 and M4A are the safest).

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/tracks/chart` | Home page data |
| `GET /api/tracks/:id` | Single track |
| `GET /api/tracks/albums/:id` · `/artists/:id` | Album / artist pages |
| `GET /api/search?q=` | Songs, albums, artists |
| `GET /api/playback?id=&title=&artist=` | Which source to play: library or preview |
| `POST /api/library/upload` | Upload a full song (multipart: `trackId, title, artist, album, cover, file`) |
| `GET /api/library/stream/:id` | Stream an uploaded song (supports seeking) |
| `DELETE /api/library/:id` | Remove an uploaded song |
| `POST /api/auth/register` · `/login` | Create a profile / log in (returns a token) |
| `GET /api/auth/me` · `POST /api/auth/logout` | Current profile / log out |
| `GET/POST /api/playlists` | List / create **your** playlists (login required) |
| `PUT /api/playlists/order` | Reorder your playlists (`{ ids }`) |
| `GET/PATCH/DELETE /api/playlists/:id` | Read / rename / delete |
| `POST /api/playlists/:id/tracks` | Add a track (`{ track }`) |
| `PUT /api/playlists/:id/order` | Reorder songs in a playlist (`{ trackIds }`) |
| `DELETE /api/playlists/:id/tracks/:trackId` | Remove a track |

## Project notes

- `server/src/services/musicApi.service.js` is the only file that talks to iTunes. To change the music source, edit it
  and keep the same normalized shapes (`track`, `album`, `artist`).
- The iTunes API has no artist photos, so artist images use album/song artwork. It is also rate limited
  (about 20 requests/min per IP); the server cache and debounced search keep you under it.
- Set `MUSIC_COUNTRY` in `server/.env` (e.g. `in`, `us`, `gb`) to change the catalog and charts.

## Design

Palette: `#d6d9ce` sage · `#f3dad8` blush · `#b23a48` crimson · `#363457` ink · `#7c77b9` iris.
Colours are CSS variables at the top of `client/src/index.css`. Headings use Fraunces, body text DM Sans (Google Fonts).


## Interface notes

- **Floating pill nav** instead of a sidebar. The sun/moon button cycles the light: auto (follows the clock) → dawn → afternoon → night. The headphones button turns "hover to listen" on or off.
- **Now Playing scene:** click the record or title in the player (or the chevron). A spinning vinyl, a tonearm that tracks progress, and a background tinted with colours pulled from the album art. Esc closes it.
- **Breathing background:** driven by the browser's Web Audio analyser. If a source isn't CORS-readable, playback still works and the UI uses a gentle simulated pulse instead.
- **Rooms:** playlists are shown as rooms. Each gets its own little scene (Late Night, Rainy Window and Study Desk have their own; other names are matched or assigned by id).
- **Wind down:** the hourglass button dims the UI and fades the music out over the last 20 seconds.
- Fonts (Fraunces, DM Sans) load from Google Fonts; the API and routes are unchanged.
