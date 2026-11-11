import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Player from './components/Player';
import NowPlaying from './components/NowPlaying';
import Ambient from './components/Ambient';
import NewRoomModal from './components/NewRoomModal';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import { useTod } from './utils/tod';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Playlist from './pages/Playlist';
import Album from './pages/Album';
import Artist from './pages/Artist';

export default function App() {
  useTod(); // keeps the time-of-day light in sync
  return (
    <div className="app">
      <Ambient />
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/playlist/:id" element={<Playlist />} />
          <Route path="/album/:id" element={<Album />} />
          <Route path="/artist/:id" element={<Artist />} />
          <Route path="*" element={<p className="empty">Wrong door. Nothing here.</p>} />
        </Routes>
      </main>
      <Player />
      <NowPlaying />
      <NewRoomModal />
      <AuthModal />
      <Toast />
    </div>
  );
}
