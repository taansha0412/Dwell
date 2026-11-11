import { useEffect, useState } from 'react';
import { extractPalette, fallbackPalette } from '../utils/colors';

export default function useCoverPalette(url) {
  const [pal, setPal] = useState(() => fallbackPalette(url || ''));
  useEffect(() => {
    let live = true;
    setPal(fallbackPalette(url || ''));
    extractPalette(url).then((p) => live && setPal(p));
    return () => { live = false; };
  }, [url]);
  return pal;
}
