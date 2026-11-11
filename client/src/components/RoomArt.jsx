import { useId } from 'react';
import { roomScene } from '../utils/rooms';

const ARCH = 'M0 125V50a50 50 0 0 1 100 0v75Z';
const C = { ink: '#363457', deep: '#26243f', iris: '#7c77b9', crimson: '#b23a48', blush: '#f3dad8', sage: '#d6d9ce' };

function Scene({ kind, gid }) {
  switch (kind) {
    case 'night':
      return (
        <>
          <rect width="100" height="125" fill={C.ink} />
          <circle cx="50" cy="52" r="17" fill={C.blush} />
          <circle cx="58" cy="46" r="15" fill={C.ink} />
          {[[24, 34, 1.7], [78, 28, 1.3], [70, 62, 1.1], [18, 70, 1.2], [38, 22, 1]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={C.sage} />)}
          <path d="M0 125V104h14v-8h10v12h12V98h8v10h14V92h10v14h12v-8h20v27Z" fill={C.deep} />
          {[[19, 104], [51, 100], [63, 98], [84, 104]].map(([x, y], i) => <rect key={i} x={x} y={y} width="3" height="3" fill={C.crimson} />)}
        </>
      );
    case 'rain':
      return (
        <>
          <rect width="100" height="125" fill={C.iris} />
          <path d="M24 106V62a26 26 0 0 1 52 0v44Z" fill={C.ink} stroke={C.sage} strokeWidth="3" />
          <path d="M50 36v70M24 74h52" stroke={C.sage} strokeWidth="2.2" />
          <rect x="17" y="105" width="66" height="6" rx="1.5" fill={C.sage} />
          {[[36, 50], [60, 44], [64, 82], [38, 88], [56, 62], [30, 66]].map(([x, y], i) => <path key={i} d={`M${x} ${y}l-3 8`} stroke={C.sage} strokeWidth="1.8" strokeLinecap="round" />)}
          {[[10, 40], [90, 56], [8, 84], [92, 96]].map(([x, y], i) => <path key={i} d={`M${x} ${y}l-2 7`} stroke={C.ink} strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />)}
        </>
      );
    case 'desk':
      return (
        <>
          <rect width="100" height="125" fill={C.crimson} />
          <circle cx="50" cy="72" r="36" fill={C.blush} opacity=".16" />
          <path d="M37 44h26l9 22H28Z" fill={C.blush} />
          <rect x="48.5" y="66" width="3" height="30" fill={C.ink} />
          <rect x="38" y="95" width="24" height="5" rx="2.5" fill={C.ink} />
          <rect x="0" y="104" width="100" height="21" fill={C.ink} />
          <rect x="10" y="94" width="28" height="10" rx="1" fill={C.sage} />
          <rect x="14" y="86" width="22" height="8" rx="1" fill={C.iris} />
          <rect x="72" y="92" width="14" height="12" rx="2" fill={C.blush} />
        </>
      );
    case 'sunrise':
      return (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={C.crimson} />
              <stop offset="1" stopColor={C.blush} />
            </linearGradient>
          </defs>
          <rect width="100" height="125" fill={`url(#${gid})`} />
          <circle cx="50" cy="80" r="20" fill={C.blush} />
          <path d="M0 125V98c18-12 34-6 50 2s34 6 50-4v29Z" fill={C.iris} />
          <path d="M0 125v-16c20-8 38 2 56-2s30-8 44-2v20Z" fill={C.ink} />
        </>
      );
    default: // liked
      return (
        <>
          <rect width="100" height="125" fill={C.blush} />
          <path d="M50 92C20 70 28 42 44 48c4 2 6 6 6 6s2-4 6-6c16-6 24 22-6 44Z" fill={C.crimson} />
          {[[20, 30], [80, 36], [74, 100], [24, 98]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" fill={C.ink} opacity=".5" />)}
        </>
      );
  }
}

// A tiny scene inside an arch. Each room gets its own.
export default function RoomArt({ room }) {
  const gid = `g${useId().replace(/:/g, '')}`;
  const kind = roomScene(room);
  return (
    <svg className="room-art" viewBox="0 0 100 125" role="img" aria-label={`${room.name} room`}>
      <clipPath id={`${gid}c`}><path d={ARCH} /></clipPath>
      <g clipPath={`url(#${gid}c)`}><Scene kind={kind} gid={gid} /></g>
      <path d={ARCH} fill="none" stroke={C.ink} strokeOpacity=".28" strokeWidth="1.4" />
    </svg>
  );
}
