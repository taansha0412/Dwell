import { useRef } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const ACCEPT = 'audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg,.opus';

// Shows where the audio is coming from, and offers an upload when only the 30s preview is available.
export default function SourceInfo() {
  const { source, uploading, uploadProgress, uploadFullSong, removeUpload } = usePlayer();
  const input = useRef(null);

  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (file) uploadFullSong(file);
  };

  return (
    <div className="source">
      {source === 'loading' && <span className="chip">Finding the best source…</span>}
      {source === 'library' && (
        <>
          <span className="chip chip-full">Full song · your library</span>
          <button className="chip-link" onClick={removeUpload} aria-label="Remove uploaded song" title="Remove uploaded song">
            <Trash2 size={13} />
          </button>
        </>
      )}
      {source === 'preview' && (
        <>
          <span className="chip">30s preview</span>
          <button className="chip chip-action" onClick={() => input.current.click()} disabled={uploading}>
            {uploading ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
            {uploading ? `Uploading… ${uploadProgress}%` : 'Upload full song'}
          </button>
          <input ref={input} type="file" accept={ACCEPT} hidden onChange={onPick} />
        </>
      )}
    </div>
  );
}
