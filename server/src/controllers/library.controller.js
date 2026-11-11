import fs from 'node:fs';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as library from '../services/library.service.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

export const upload = asyncHandler(async (req, res) => {
  const { trackId, title, artist, album = '', cover = '' } = req.body;
  if (!req.file) throw fail(400, 'Choose an audio file to upload.');
  if (!trackId || !title || !artist) {
    fs.rmSync(req.file.path, { force: true });
    throw fail(400, 'Missing song details (trackId, title, artist).');
  }
  const song = await library.saveSong({ trackId, title, artist, album, cover, filename: req.file.filename, size: req.file.size });
  console.log(`Uploaded: "${song.title}" by ${song.artist} (${Math.round(req.file.size / 1024)} KB)`);
  res.status(201).json({ id: song.id, title: song.title, artist: song.artist });
});

// res.sendFile supports HTTP Range requests, which the <audio> element needs for seeking
export const stream = asyncHandler(async (req, res) => {
  const song = await library.getSong(req.params.id);
  if (!song || !fs.existsSync(library.filePath(song))) throw fail(404, 'Song not found in your library');
  res.sendFile(library.filePath(song));
});

export const remove = asyncHandler(async (req, res) => {
  if (!(await library.removeSong(req.params.id))) throw fail(404, 'Song not found in your library');
  res.status(204).end();
});
