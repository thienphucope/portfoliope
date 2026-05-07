import Link from 'next/link';

export default function HeroSection({ scrollToSection }) {
  return (
    <section className="hero" id="hero">
      <div className="hero-content reveal">
        <div className="hero-overline">by Ope watson</div>
        <h1 className="hero-title">Case <span className="italic">Archives</span></h1>
        <p className="hero-subtitle">You see, but you do not observe. — Sherlock Holmes inspired</p>
        <div className="hero-ctas">
          <div className="cta-path">
            <Link className="hero-cta" href="/chat" target="_blank" rel="noopener noreferrer">Ask Sidekick <span className="arrow">→</span></Link>
          </div>
          <div className="cta-separator" />
          <div className="cta-path">
            <Link className="hero-cta" href="/noirboard" target="_blank" rel="noopener noreferrer">Inspect Board <span className="arrow">→</span></Link>
          </div>
          <div className="cta-separator" />
          <div className="cta-path">
            <button className="hero-cta" onClick={() => scrollToSection('cases')}>Browse Cases <span className="arrow">→</span></button>
          </div>
        </div>
        <div className="hero-links">
          <Link href="/about"   className="hero-link">About</Link>
          <Link href="/privacy" className="hero-link">Privacy</Link>
          <Link href="/terms"   className="hero-link">Terms</Link>
        </div>
        <div className="scroll-indicator">
          <div className="scroll-line" />
          <span>Scroll to Cases</span>
        </div>
      </div>
    </section>
  );
}
