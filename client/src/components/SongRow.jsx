import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GripVertical, Heart, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import api from '../services/api';
import formatTime from '../utils/formatTime';
import placeholder from '../assets/placeholder-cover.svg';

export default function SongRow({ track, index, onPlay, onRemove, showCover = true, dragProps = {} }) {
  const { currentTrack, playing } = usePlayer();
  const { user, openAuth } = useAuth();
  const { className: dragClass = '', ...drag } = dragProps;
  const active = currentTrack?.id === track.id;
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [toast, setToast] = useState('');
  const ref = useRef(null);

  // close the menu on outside click
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  async function toggleMenu() {
    if (!open && user) setLists(await api.getPlaylists().catch(() => []));
    setOpen(!open);
  }

  async function add(pl) {
    await api.addToPlaylist(pl.id, track);
    setOpen(false);
    setToast(`Added to ${pl.name}`);
    setTimeout(() => setToast(''), 2000);
  }

  return (
    <div className={`row ${active ? 'active' : ''} ${open ? 'menu-open' : ''} ${dragClass}`} onDoubleClick={onPlay} ref={ref} {...drag}>
      {drag.draggable && <GripVertical className="grip" size={16} />}
      <div className="idx">
        <span className="num">{active && playing ? '♫' : index + 1}</span>
        <button className="play-ico" onClick={onPlay} aria-label={`Play ${track.title}`}>
          <Play size={16} fill="currentColor" />
        </button>
      </div>

      <div className="info">
        {showCover && <img className="arch-thumb" src={track.cover || placeholder} alt="" loading="lazy" draggable={false} />}
        <div style={{ minWidth: 0 }}>
          <div className="title">{track.title}</div>
          <div className="sub">
            <Link to={`/artist/${track.artist.id}`} draggable={false}>{track.artist.name}</Link>
            {track.album?.title && <> · <Link to={`/album/${track.album.id}`} draggable={false}>{track.album.title}</Link></>}
          </div>
        </div>
      </div>

      <div className="dur">{toast || formatTime(track.duration)}</div>

      {onRemove ? (
        <button className="more" onClick={onRemove} aria-label="Remove from room"><Trash2 size={18} /></button>
      ) : (
        <button className="more" onClick={toggleMenu} aria-label="More options"><MoreHorizontal size={20} /></button>
      )}

      {open && (
        <div className="menu" role="menu">
          <div className="label">Add to room</div>
          {!user && <button onClick={() => { setOpen(false); openAuth('login'); }}>Log in to use rooms</button>}
          {lists.map((pl) => (
            <button key={pl.id} onClick={() => add(pl)}>
              {pl.id === 'liked' && <Heart size={16} />} {pl.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
