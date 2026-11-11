// Generic slider used for both the seek bar and the volume control.
export default function ProgressBar({ value, max = 100, step = 0.1, onChange, label }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <input
      className="bar"
      type="range"
      min={0}
      max={max || 100}
      step={step}
      value={value}
      aria-label={label}
      style={{ '--pct': `${pct}%` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
