import Accent from './Accent';

// A big outlined number + a headline with an italic accent word.
export default function SectionHead({ n, title, children }) {
  return (
    <div className="sh">
      {n != null && <span className="n" aria-hidden>{String(n).padStart(2, '0')}</span>}
      <h2><Accent text={title} /></h2>
      {children}
    </div>
  );
}
