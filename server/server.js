import express from 'express';
import cors from 'cors';
import config from './src/config/index.js';
import tracksRoutes from './src/routes/tracks.routes.js';
import searchRoutes from './src/routes/search.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import playlistsRoutes from './src/routes/playlists.routes.js';
import playbackRoutes from './src/routes/playback.routes.js';
import libraryRoutes from './src/routes/library.routes.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { initDb } from './src/config/db.js';

const app = express();

// Render (and most hosts) put a reverse proxy in front of the app and terminate HTTPS there.
// Without this, Express sees every request as plain http, so req.protocol is "http" and any
// URL we build from it (e.g. the audio stream URL) is http:// -> "Mixed Content" on an https site.
// It also makes req.ip the real visitor instead of Render's proxy (used by the login rate limit).
app.set('trust proxy', 1);

// Allowed frontends. CLIENT_ORIGIN may hold several comma-separated origins.
const allowedOrigins = [
  'https://dwell-frontend-ahex.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  ...config.clientOrigin.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean),
];
app.use(cors({
  origin: [...new Set(allowedOrigins)],
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/tracks', tracksRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/playback', playbackRoutes);
app.use('/api/library', libraryRoutes);

app.use(notFound);
app.use(errorHandler);

try {
  await initDb();
  console.log(`Database connected (Supabase Postgres)`);
} catch (e) {
  console.error(`\n✖ ${e.message}\n`);
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`Dwell API running on port ${config.port}`);
});
