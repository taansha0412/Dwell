// Pulls a three-colour palette out of album art (falls back to the Dwell palette if the image can't be read).
const FALLBACKS = [
  ['#7c77b9', '#b23a48', '#f3dad8'],
  ['#b23a48', '#7c77b9', '#d6d9ce'],
  ['#7c77b9', '#d6d9ce', '#b23a48'],
  ['#b23a48', '#f3dad8', '#7c77b9'],
];

export const hashOf = (s = '') => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

export function fallbackPalette(seed = '') {
  const [c1, c2, c3] = FALLBACKS[hashOf(seed) % FALLBACKS.length];
  return { c1, c2, c3 };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function fromImage(img, url) {
  const N = 32;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = N;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, N, N);
  const d = ctx.getImageData(0, 0, N, N).data; // throws if the image is cross-origin without CORS

  const B = 16;
  const buckets = Array.from({ length: B }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < d.length; i += 4) {
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (l < 0.12 || l > 0.93 || s < 0.15) continue;
    const w = s * (1 - Math.abs(2 * l - 1)) + 0.02;
    const b = buckets[Math.min(B - 1, Math.floor(h * B))];
    b.w += w; b.r += d[i] * w; b.g += d[i + 1] * w; b.b += d[i + 2] * w;
  }
  const ranked = buckets.map((b, k) => ({ ...b, k })).filter((b) => b.w > 0).sort((a, b) => b.w - a.w);
  const picked = [];
  for (const b of ranked) {
    if (picked.every((p) => Math.min(Math.abs(p.k - b.k), B - Math.abs(p.k - b.k)) >= 2)) picked.push(b);
    if (picked.length === 3) break;
  }
  const fb = fallbackPalette(url);
  if (!picked.length) return fb;
  const hex = (b) => {
    const [h, s, l] = rgbToHsl(b.r / b.w, b.g / b.w, b.b / b.w);
    return hslToHex(h, Math.min(0.8, Math.max(0.4, s)), Math.min(0.58, Math.max(0.34, l)));
  };
  const cols = picked.map(hex);
  return { c1: cols[0], c2: cols[1] || fb.c2, c3: cols[2] || fb.c3 };
}

const cache = new Map();
export function extractPalette(url) {
  if (!url) return Promise.resolve(fallbackPalette(''));
  if (cache.has(url)) return cache.get(url);
  const job = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { try { resolve(fromImage(img, url)); } catch { resolve(fallbackPalette(url)); } };
    img.onerror = () => resolve(fallbackPalette(url));
    img.src = url;
  });
  cache.set(url, job);
  return job;
}
