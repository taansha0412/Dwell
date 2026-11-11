-- Dwell database schema (Postgres / Supabase).
-- Runs automatically when the server starts (everything is IF NOT EXISTS, so it is safe to re-run).
-- You can also paste it into Supabase -> SQL Editor.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      VARCHAR(30) NOT NULL,
  password_hash TEXT NOT NULL,                      -- scrypt hash, never the password itself
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (lower(username));  -- case-insensitive

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,                  -- SHA-256 of the login token
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS songs (
  id          VARCHAR(32) PRIMARY KEY,              -- iTunes track id
  title       VARCHAR(255) NOT NULL,
  artist      VARCHAR(255) NOT NULL,
  album       VARCHAR(255) NOT NULL DEFAULT '',
  cover       TEXT,
  filename    VARCHAR(255) NOT NULL,                -- file inside server/uploads/
  size        BIGINT NOT NULL DEFAULT 0,
  song_key    VARCHAR(255) NOT NULL,                -- normalized artist and title, to match other releases
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_songs_key ON songs (song_key);

CREATE TABLE IF NOT EXISTS playlists (
  id         VARCHAR(40) PRIMARY KEY,               -- liked_<userId> or u_xxxx
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,            -- order in the sidebar
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists (user_id);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  playlist_id VARCHAR(40) NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id    VARCHAR(32) NOT NULL,
  track_data  JSONB NOT NULL,                       -- the track (title, artist, cover, ...)
  sort_order  INTEGER NOT NULL DEFAULT 0,           -- order inside the playlist
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, track_id)
);

-- SECURITY: Supabase exposes tables in the public schema through its own REST API.
-- Row Level Security with no policies blocks all of that access. Only this server
-- (which connects directly as the database owner) can read or write these tables.
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY
