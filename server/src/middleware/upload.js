import multer from 'multer';
import path from 'node:path';
import config from '../config/index.js';

const ALLOWED = new Set(['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.opus']);

// Files are held in memory just long enough to be saved into the database (see library.service.js).
// They are NOT written to disk: the disk on Render is temporary and gets wiped on restart/redeploy.
export const uploadSong = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED.has(path.extname(file.originalname).toLowerCase());
    if (ok) return cb(null, true);
    cb(Object.assign(new Error('Unsupported file type. Upload an MP3, M4A, WAV, FLAC, OGG or AAC file.'), { status: 400 }));
  },
}).single('file');
