// Accounts: username + password. Passwords are hashed with scrypt (built into Node);
// logins are random tokens whose SHA-256 hash is stored in the `sessions` table.
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { query } from '../config/db.js';

const scrypt = promisify(crypto.scrypt);
const SESSION_DAYS = 30;
const fail = (status, message) => Object.assign(new Error(message), { status });
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [, saltHex, keyHex] = stored.split('$');
  const key = await scrypt(password, Buffer.from(saltHex, 'hex'), 64);
  return crypto.timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
}
const DUMMY_HASH = await hashPassword('not-a-real-password'); // keeps "unknown user" timing similar

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await query('DELETE FROM sessions WHERE expires_at < now()'); // housekeeping
  await query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [
    sha256(token), userId, new Date(Date.now() + SESSION_DAYS * 86400000),
  ]);
  return token;
}

export async function getUserByToken(token) {
  const rows = await query(
    `SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)]
  );
  return rows[0] || null;
}

export async function register(username, password) {
  username = String(username || '').trim();
  password = String(password || '');
  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) {
    throw fail(400, 'Username must be 3–30 characters: letters, numbers, dot, dash or underscore.');
  }
  if (password.length < 8 || password.length > 128) throw fail(400, 'Password must be 8–128 characters.');

  let userId;
  try {
    const rows = await query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id', [username, await hashPassword(password)]);
    userId = rows[0].id;
  } catch (e) {
    if (e.code === '23505') throw fail(409, 'That username is taken. Try another one.'); // unique violation
    throw e;
  }

  await query("INSERT INTO playlists (id, user_id, name, sort_order) VALUES ($1, $2, 'Liked Songs', 0)", [`liked_${userId}`, userId]);

  return { token: await createSession(userId), user: { id: userId, username } };
}

export async function login(username, password) {
  const rows = await query('SELECT id, username, password_hash FROM users WHERE lower(username) = lower($1) LIMIT 1', [String(username || '').trim()]);
  const user = rows[0];
  const ok = await verifyPassword(String(password || ''), user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) throw fail(401, 'Wrong username or password.');
  return { token: await createSession(user.id), user: { id: user.id, username: user.username } };
}

export const logout = (token) => query('DELETE FROM sessions WHERE token_hash = $1', [sha256(token)]);
