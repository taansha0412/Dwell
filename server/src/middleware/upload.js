import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import config from '../config/index.js';

const ALLOWED = new Set(['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.opus']);

fs.mkdirSync(config.uploadDir, { recursive: true });

export const uploadSong = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) =>
      cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED.has(path.extname(file.originalname).toLowerCase());
    if (ok) return cb(null, true);
    cb(Object.assign(new Error('Unsupported file type. Upload an MP3, M4A, WAV, FLAC, OGG or AAC file.'), { status: 400 }));
  },
}).single('file');
