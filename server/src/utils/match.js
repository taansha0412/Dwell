// Normalizes titles/artists so "Song (feat. X) - Remastered" matches "Song".
export const norm = (s = '') =>
  String(s)
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\s-\s.*$/, '')
    .replace(/[^a-z0-9]/g, '');

export const songKey = (artist, title) => `${norm(artist)}|${norm(title)}`;
