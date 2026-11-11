import crypto from 'node:crypto';
import path from 'node:path';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as library from '../services/library.service.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

const MIME = {
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.wav': 'audio/wav',
  '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.opus': 'audio/ogg',
};
const MAX_CHUNK = 4 * 1024 * 1024; // answer open-ended Range requests in pieces of at most 4 MB

export const upload = asyncHandler(async (req, res) => {
  const { trackId, title, artist, album = '', cover = '' } = req.body;
  if (!req.file) throw fail(400, 'Choose an audio file to upload.');
  if (!trackId || !title || !artist) throw fail(400, 'Missing song details (trackId, title, artist).');

  const ext = path.extname(req.file.originalname).toLowerCase();
  const song = await library.saveSong({
    trackId, title, artist, album, cover,
    filename: crypto.randomUUID() + ext,
    mime: MIME[ext] || 'application/octet-stream',
    data: req.file.buffer,
  });
  console.log(`Uploaded: "${song.title}" by ${song.artist} (${Math.round(req.file.size / 1024)} KB)`);
  res.status(201).json({ id: song.id, title: song.title, artist: song.artist });
});

// Streams the audio out of the database. Handles HTTP Range requests, which the <audio> element
// needs for seeking (and which Safari/iOS require to play at all).
export const stream = asyncHandler(async (req, res) => {
  const info = await library.getAudioInfo(req.params.id);
  if (!info) throw fail(404, 'Song not found in your library');

  const total = info.size;
  let start = 0;
  let end = total - 1;
  let status = 200;

  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (m[1] === '' && m[2] === '')) {
      res.set('Content-Range', `bytes */${total}`);
      throw fail(416, 'Bad Range header');
    }
    if (m[1] === '') { // "last N bytes"
      start = Math.max(0, total - Number(m[2]));
    } else {
      start = Number(m[1]);
      if (m[2] !== '') end = Math.min(Number(m[2]), total - 1);
    }
    if (start >= total || start > end) {
      res.set('Content-Range', `bytes */${total}`);
      throw fail(416, 'Range not satisfiable');
    }
    end = Math.min(end, start + MAX_CHUNK - 1);
    status = 206;
  }

  const chunk = await library.readAudio(req.params.id, start, end - start + 1);
  if (!chunk) throw fail(404, 'Song not found in your library');

  res.status(status).set({
    'Content-Type': info.mime || MIME[path.extname(info.filename)] || 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Content-Length': chunk.length,
    ...(status === 206 ? { 'Content-Range': `bytes ${start}-${start + chunk.length - 1}/${total}` } : {}),
  });
  res.end(chunk);
});

export const remove = asyncHandler(async (req, res) => {
  if (!(await library.removeSong(req.params.id))) throw fail(404, 'Song not found in your library');
  res.status(204).end();
});
