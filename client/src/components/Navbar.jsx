import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { DoorOpen, Headphones, Home, LogOut, Moon, Search, Sun, Sunrise } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTod } from '../utils/tod';
import { useHoverListen } from '../utils/hoverPreview';
import logo from '../assets/logo.svg';

const LIGHT = { dawn: ['Dawn', Sunrise], day: ['Afternoon', Sun], night: ['Night', Moon] };

// A floating pill instead of a boxed sidebar.
export default function Navbar() {
  const navigate = useNavigate();
  const { user, ready, openAuth, logout } = useAuth();
  const { mode, tod, cycle } = useTod();
  const [hoverOn, toggleHover] = useHoverListen();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const [lightName, LightIcon] = LIGHT[tod];
  const link = ({ isActive }) => `nl ${isActive ? 'active' : ''}`;

  return (
    <header className="nav">
      <nav className="pill" aria-label="Main">
        <Link to="/" className="brand"><img src={logo} alt="" /><span>dwell</span></Link>
        <NavLink to="/" end className={link}><Home size={17} /><span>Home</span></NavLink>
        <NavLink to="/search" className={link}><Search size={17} /><span>Search</span></NavLink>
        <NavLink to="/library" className={link}><DoorOpen size={17} /><span>Rooms</span></NavLink>
        <span className="sep" aria-hidden />

        <button className="pill-ico" onClick={cycle} aria-label={`Light: ${mode === 'auto' ? `auto (${lightName})` : lightName}. Change`} title={`Light: ${mode === 'auto' ? `auto · ${lightName}` : lightName}`}>
          <LightIcon size={17} />{mode === 'auto' && <b className="auto-dot" />}
        </button>
        <button className={`pill-ico ${hoverOn ? 'on' : ''}`} onClick={toggleHover} aria-pressed={hoverOn} aria-label="Hover to listen" title={`Hover to listen: ${hoverOn ? 'on' : 'off'}`}>
          <Headphones size={17} />
        </button>

        {ready && !user && (
          <>
            <button className="nl signup" onClick={() => openAuth('register')}>Sign up</button>
            <button className="login" onClick={() => openAuth('login')}>Log in</button>
          </>
        )}
        {user && (
          <div className="profile-wrap" ref={box}>
            <button className="profile-btn" onClick={() => setOpen(!open)} aria-label={`Profile: ${user.username}`} aria-expanded={open}>
              {user.username[0].toUpperCase()}
            </button>
            {open && (
              <div className="menu profile-menu" role="menu">
                <div className="label">Signed in as</div>
                <div className="profile-name">{user.username}</div>
                <button onClick={() => { setOpen(false); logout(); navigate('/'); }}><LogOut size={16} /> Log out</button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
