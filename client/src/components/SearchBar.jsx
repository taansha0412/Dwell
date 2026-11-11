import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="searchbar">
      <Search size={26} />
      <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} placeholder="Look for something to put on…" aria-label="Search" />
      {value && <button className="ctrl" onClick={() => onChange('')} aria-label="Clear search"><X size={22} /></button>}
    </div>
  );
}
