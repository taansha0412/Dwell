// Wraps async controllers so thrown errors reach errorHandler
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (req, res) =>
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : err.name === 'MulterError' ? 400 : 500);
  if (err.code === 'LIMIT_FILE_SIZE') err.message = 'That file is too large. Try a smaller file.';
  if (status >= 500) console.error(err);
  else console.warn(`${req.method} ${req.originalUrl} -> ${status}: ${err.message}`);
  res.status(status).json({ error: err.message || 'Something went wrong' });
};
