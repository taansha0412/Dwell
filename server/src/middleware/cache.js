import config from '../config/index.js';

const store = new Map();

// In-memory GET cache — saves calls to the public API.
export const cache = (ttlSeconds = config.cacheTtl) => (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = req.originalUrl;
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return res.json(hit.body);

  const send = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200) {
      store.set(key, { body, expires: Date.now() + ttlSeconds * 1000 });
    }
    return send(body);
  };
  next();
};
