// "Late Night" -> Late <em>Night</em>  (last word gets the italic accent)
export default function Accent({ text = '' }) {
  const words = String(text).trim().split(/\s+/);
  const last = words.pop();
  return <>{words.length ? `${words.join(' ')} ` : ''}<em>{last}</em></>;
}
