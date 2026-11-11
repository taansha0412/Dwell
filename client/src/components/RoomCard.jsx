import { Link } from 'react-router-dom';
import RoomArt from './RoomArt';

export default function RoomCard({ room, dragProps = {} }) {
  const { className = '', ...drag } = dragProps;
  return (
    <Link to={`/playlist/${room.id}`} className={`room ${className}`} {...drag}>
      <div className="room-frame">
        <RoomArt room={room} />
        {room.cover && <img className="peek" src={room.cover} alt="" draggable={false} />}
      </div>
      <h3>{room.name}</h3>
      <p>{room.trackCount} {room.trackCount === 1 ? 'song' : 'songs'}</p>
    </Link>
  );
}
