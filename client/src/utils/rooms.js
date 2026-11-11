import { hashOf } from './colors';

export const PRESETS = ['Late Night', 'Rainy Window', 'Study Desk', 'Sunday Morning'];
const SCENES = ['night', 'rain', 'desk', 'sunrise'];

// Which little scene a room gets: by its name, otherwise by its id.
export function roomScene(room) {
  if (room.id === 'liked') return 'liked';
  const n = (room.name || '').toLowerCase();
  if (/night|moon|sleep|midnight|dark|late/.test(n)) return 'night';
  if (/rain|window|storm|cloud|gloom|mood/.test(n)) return 'rain';
  if (/study|desk|focus|work|read|code|exam/.test(n)) return 'desk';
  if (/morning|sun|dawn|coffee|summer|day/.test(n)) return 'sunrise';
  return SCENES[hashOf(String(room.id)) % SCENES.length];
}

export const openNewRoom = () => window.dispatchEvent(new Event('dwell:new-room'));
