import { useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

// Shows upload problems where you can't miss them (the player bar is too small for long messages).
export default function Toast() {
  const { uploadError, clearUploadError } = usePlayer();

  useEffect(() => {
    if (!uploadError) return;
    const t = setTimeout(clearUploadError, 10000);
    return () => clearTimeout(t);
  }, [uploadError, clearUploadError]);

  if (!uploadError) return null;
  return (
    <div className="toast" role="alert">
      <span>{uploadError}</span>
      <button onClick={clearUploadError} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}
