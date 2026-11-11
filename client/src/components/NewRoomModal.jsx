import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PRESETS } from '../utils/rooms';

// Opened from anywhere with openNewRoom() (a window event).
export default function NewRoomModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const show = () => (user ? (setName(''), setError(''), setOpen(true)) : openAuth('login'));
    window.addEventListener('dwell:new-room', show);
    return () => window.removeEventListener('dwell:new-room', show);
  }, [user, openAuth]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.createPlaylist(name.trim());
      setOpen(false);
      navigate(`/playlist/${r.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="New room" onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={() => setOpen(false)} aria-label="Close"><X size={20} /></button>
        <h2>Open a <em>new room</em></h2>
        <form onSubmit={submit}>
          <div className="chips" role="group" aria-label="Suggestions">
            {PRESETS.map((n) => <button type="button" key={n} className={`chip-pick ${name === n ? 'on' : ''}`} onClick={() => setName(n)}>{n}</button>)}
          </div>
          <label>
            Name it
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus placeholder="Late Night" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn-primary" disabled={busy || !name.trim()}>{busy ? 'Opening…' : 'Open the door'}</button>
        </form>
      </div>
    </div>
  );
}
