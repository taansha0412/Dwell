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

app.use(cors({ origin: config.clientOrigin }));
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
  console.log(`Dwell API running on http://localhost:${config.port}`);
});
