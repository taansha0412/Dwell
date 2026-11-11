import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { modal, openAuth, closeAuth, authenticate } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setError(''); }, [modal]);
  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => e.key === 'Escape' && closeAuth();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, closeAuth]);

  if (!modal) return null;
  const isLogin = modal === 'login';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authenticate(modal, username, password);
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={closeAuth}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={isLogin ? 'Log in' : 'Sign up'} onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={closeAuth} aria-label="Close"><X size={20} /></button>
        <h2>{isLogin ? <>Welcome <em>back</em></> : <>Make yourself <em>at home</em></>}</h2>

        <form onSubmit={submit}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required minLength={3} maxLength={30} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={isLogin ? 1 : 8} />
          </label>
          {!isLogin && <small className="hint">At least 8 characters. Your rooms are saved to this profile.</small>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}</button>
        </form>

        <p className="switch">
          {isLogin ? "Don't have a profile?" : 'Already have a profile?'}{' '}
          <button onClick={() => openAuth(isLogin ? 'register' : 'login')}>{isLogin ? 'Sign up' : 'Log in'}</button>
        </p>
      </div>
    </div>
  );
}
