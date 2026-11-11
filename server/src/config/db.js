import fs from 'node:fs';
import pg from 'pg';
import config from './index.js';

let pool;

const hint = (e, host) => ({
  ECONNREFUSED: `Can't connect to the database at ${host}. Is the host and port in DATABASE_URL right?`,
  ENOTFOUND: `Can't find the database host "${host}". Check DATABASE_URL in server/.env.`,
  ENETUNREACH: `Can't reach ${host}. Supabase's direct connection is IPv6-only. Use the "Session pooler" connection string instead (Supabase -> Connect).`,
  ETIMEDOUT: `Timed out connecting to ${host}. If this is Supabase, use the "Session pooler" connection string (it works over IPv4).`,
  '28P01': 'The database rejected the password. Check the password in DATABASE_URL (URL-encode special characters, e.g. @ becomes %40).',
  '28000': 'The database rejected the login. Check the username and password in DATABASE_URL.',
  '3D000': 'That database does not exist. Check the database name at the end of DATABASE_URL.',
}[e.code]);

// Connects to Postgres (Supabase), creates the tables if they don't exist yet.
export async function initDb() {
  if (!config.databaseUrl || config.databaseUrl.includes('[YOUR-PASSWORD]')) {
    throw new Error('DATABASE_URL is not set. Copy your Supabase connection string into server/.env (see README).');
  }
  let host = 'the database';
  try { host = new URL(config.databaseUrl).hostname; } catch { throw new Error('DATABASE_URL is not a valid URL. Check for unencoded special characters in the password.'); }

  const local = ['localhost', '127.0.0.1', '::1'].includes(host);
  pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: local ? false : { rejectUnauthorized: false }, // Supabase requires SSL
    max: 10,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (e) => console.error('Database connection error:', e.message));

  try {
    await pool.query(fs.readFileSync(config.schemaFile, 'utf8'));
  } catch (e) {
    throw new Error(hint(e, host) || `Database error: ${e.message}`);
  }
}

// query('SELECT ... WHERE id = $1', [id]) -> array of rows
export async function query(sql, params = []) {
  return (await pool.query(sql, params)).rows;
}
export const closeDb = () => pool?.end();
