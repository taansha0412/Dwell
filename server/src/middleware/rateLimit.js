// Tiny in-memory limiter (per IP) — slows down password guessing on login/register.
export const rateLimit = ({ windowMs, max }) => {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const recent = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    }
    recent.push(now);
    hits.set(req.ip, recent);
    next();
  };
};
