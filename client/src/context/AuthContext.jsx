import { createContext, useContext, useEffect, useState } from 'react';
import api, { getToken, setToken } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // false until we've checked a saved login
  const [modal, setModal] = useState(null); // null | 'login' | 'register'

  // Restore the saved login on page load
  useEffect(() => {
    if (!getToken()) return setReady(true);
    api.me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  // The server said our session is over (expired / logged out elsewhere)
  useEffect(() => {
    const onExpired = () => { setToken(null); setUser(null); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  async function authenticate(mode, username, password) {
    const r = await (mode === 'login' ? api.login : api.register)(username, password);
    setToken(r.token);
    setUser(r.user);
    setModal(null);
  }

  async function logout() {
    await api.logout().catch(() => {});
    setToken(null);
    setUser(null);
  }

  const value = {
    user, ready, modal,
    openAuth: (mode = 'login') => setModal(mode),
    closeAuth: () => setModal(null),
    authenticate, logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
