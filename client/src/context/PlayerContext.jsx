import { createContext, useContext, useEffect, useRef, useState } from 'react';
import useAudio from '../hooks/useAudio';
import api from '../services/api';

const ACCEPTED = /\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i;
const MAX_UPLOAD_MB = 60; // keep in sync with MAX_UPLOAD_MB in server/.env

const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off' | 'all' | 'one'
  const [volume, setVolumeState] = useState(0.7);
  const [muted, setMuted] = useState(false);

  // Where the current audio comes from: 'loading' | 'library' | 'preview'
  const [source, setSource] = useState('loading');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const [sceneOpen, setSceneOpen] = useState(false); // full-screen Now Playing
  const [sleepEnd, setSleepEnd] = useState(null);     // wind-down timer (timestamp)
  const [sleepLeft, setSleepLeft] = useState(0);

  const retried = useRef(new Set());
  const loadToken = useRef(0); // ignores slow responses from a song you've already skipped

  const audio = useAudio({ onEnded: handleEnded, onError: handleError });
  const currentTrack = queue[index] || null;

  /* Playback chain (resolved by the server):
     1) your library of uploaded songs  2) the 30s preview */
  async function startTrack(track) {
    const token = ++loadToken.current;
    audio.pause();
    setSource('loading');
    setUploadError('');
    let result;
    try {
      result = await api.resolvePlayback(track);
    } catch {
      result = { source: 'preview', url: track.preview };
    }
    if (token !== loadToken.current) return;
    setSource(result.source);
    audio.load(result.url);
  }

  useEffect(() => {
    if (currentTrack) startTrack(currentTrack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  /* ---------- wind down: dim the UI and fade the music out over the last 20s ---------- */
  useEffect(() => {
    const root = document.documentElement;
    const base = muted ? 0 : volume;
    if (!sleepEnd) {
      audio.setVolume(base);
      root.style.setProperty('--dim', '0');
      return;
    }
    const FADE = 20;
    const tick = () => {
      const left = (sleepEnd - Date.now()) / 1000;
      setSleepLeft(Math.max(0, Math.ceil(left)));
      const f = left > FADE ? 1 : Math.max(0, left / FADE);
      audio.setVolume(base * f);
      root.style.setProperty('--dim', String((1 - f) * 0.62));
      if (left <= 0) { audio.pause(); setSleepEnd(null); }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepEnd, volume, muted]);

  /* ---------- controls ---------- */
  function playQueue(tracks, startIndex = 0) {
    retried.current.clear();
    setQueue(tracks);
    setIndex(startIndex);
    // same track clicked again → restart it
    if (tracks[startIndex]?.id === currentTrack?.id) startTrack(tracks[startIndex]);
  }

  // like setIndex, but restarts the song if the index doesn't change (e.g. 1-song queue on repeat)
  function goTo(i) {
    if (i === index) startTrack(queue[i]);
    else setIndex(i);
  }

  function next(auto = false) {
    if (!queue.length) return;
    if (repeat === 'one' && auto) {
      audio.seek(0);
      return audio.play();
    }
    if (shuffle && queue.length > 1) {
      let i;
      do i = Math.floor(Math.random() * queue.length);
      while (i === index);
      return goTo(i);
    }
    if (index < queue.length - 1) return goTo(index + 1);
    if (repeat === 'all') return goTo(0);
    if (auto) audio.pause(); // end of queue
    else goTo(0);
  }

  function prev() {
    if (audio.currentTime > 3 || index <= 0) return audio.seek(0);
    goTo(index - 1);
  }

  function togglePlay() {
    if (!currentTrack || source === 'loading') return;
    audio.playing ? audio.pause() : audio.play();
  }

  const cycleRepeat = () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));

  function handleEnded() {
    next(true);
  }

  async function handleError() {
    if (!currentTrack || source === 'loading') return;
    // A full-length source failed (file missing…) → fall back to the preview
    if (source !== 'preview') {
      if (source === 'library') {
        setUploadError("Your browser couldn't play the uploaded file, so the 30s preview is playing instead. Upload a different file (MP3 or M4A works best) to replace it.");
      }
      setSource('preview');
      return audio.load(currentTrack.preview);
    }
    // Preview failed → fetch a fresh URL once, then give up
    if (retried.current.has(currentTrack.id)) return;
    retried.current.add(currentTrack.id);
    try {
      const fresh = await api.getTrack(currentTrack.id);
      if (fresh.preview) audio.load(fresh.preview);
    } catch {
      /* ignore */
    }
  }

  /* ---------- uploads: add a full-length file for the current song ---------- */
  async function uploadFullSong(file) {
    if (!currentTrack || !file) return;
    if (!ACCEPTED.test(file.name)) {
      return setUploadError('Unsupported file type. Choose an MP3, M4A, AAC, WAV, FLAC or OGG file.');
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      return setUploadError(`That file is ${Math.round(file.size / 1048576)} MB. The limit is ${MAX_UPLOAD_MB} MB.`);
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadError('');
    try {
      await api.uploadSong(currentTrack, file, setUploadProgress);
      await startTrack(currentTrack); // now resolves to your library → plays the full song
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeUpload() {
    if (!currentTrack) return;
    await api.removeUpload(currentTrack.id).catch(() => {});
    startTrack(currentTrack);
  }

  const value = {
    queue, queueIndex: index, currentTrack, playing: audio.playing,
    sceneOpen, setSceneOpen, getLevels: audio.getLevels,
    sleepActive: !!sleepEnd, sleepLeft,
    setSleep: (min) => setSleepEnd(min ? Date.now() + min * 60000 : null),
    currentTime: audio.currentTime, duration: audio.duration,
    shuffle, repeat, volume, muted,
    source, uploading, uploadProgress, uploadError,
    clearUploadError: () => setUploadError(''),
    playQueue, next, prev, togglePlay, seek: audio.seek,
    toggleShuffle: () => setShuffle((s) => !s),
    cycleRepeat,
    setVolume: (v) => { setVolumeState(v); setMuted(false); },
    toggleMute: () => setMuted((m) => !m),
    uploadFullSong, removeUpload,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
