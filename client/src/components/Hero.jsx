import Accent from './Accent';

export default function Hero({ kicker, title, art, meta, children }) {
  return (
    <section className="hero">
      <div className="hero-art">{art}</div>
      <div className="hero-text">
        <span className="tag">{kicker}</span>
        <h1 className="mega small"><Accent text={title} /></h1>
        {meta && <div className="meta">{meta}</div>}
        {children}
      </div>
    </section>
  );
}
