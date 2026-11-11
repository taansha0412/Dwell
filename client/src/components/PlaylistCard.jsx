import { Link } from 'react-router-dom';
import Cover from './Cover';

// Albums and artists (set `round` for artists)
export default function PlaylistCard({ to, image, title, subtitle, round = false, shape = 'arch' }) {
  return (
    <Link to={to} className="card">
      <Cover src={image} shape={round ? 'circle' : shape} />
      <h3 title={title}>{title}</h3>
      <p>{subtitle}</p>
    </Link>
  );
}
