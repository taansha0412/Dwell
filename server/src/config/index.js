import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
dotenv.config();

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // iTunes storefront country (2-letter code). Changes which catalog/charts you get.
  country: (process.env.MUSIC_COUNTRY || 'us').toLowerCase(),
  cacheTtl: Number(process.env.CACHE_TTL_SECONDS) || 300,
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 60,
  databaseUrl: process.env.DATABASE_URL || '',
  uploadDir: path.join(root, 'uploads'),
  schemaFile: path.join(root, 'sql/schema.sql'),
};
