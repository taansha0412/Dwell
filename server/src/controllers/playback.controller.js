import { asyncHandler } from '../middleware/errorHandler.js';
import { findSong } from '../services/library.service.js';

// GET /api/playback?id=&title=&artist=
// Decides what to play:  1) your library of uploaded songs  2) the 30s preview (the client plays its own preview URL)
export const resolve = asyncHandler(async (req, res) => {
  const { id, title, artist } = req.query;

  const song = await findSong(id, title, artist);
  if (song) {
    const base = `${req.protocol}://${req.get('host')}`;
    return res.json({ source: 'library', fullLength: true, url: `${base}/api/library/stream/${song.id}` });
  }

  res.json({ source: 'preview', fullLength: false, url: null, canUpload: true });
});
