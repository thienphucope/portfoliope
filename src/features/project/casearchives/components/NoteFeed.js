import React, { useState, useEffect, useRef } from 'react';
import { ensureLibsLoaded, postProcess } from '../utils/markdown';

const CaseItem = ({ caseData, onLinkClick }) => {
  const contentRef = useRef(null);
  useEffect(() => {
    if (contentRef.current) postProcess(contentRef.current);
  }, [caseData.descriptionHtml]);

  const mediaSrc = caseData.media
    ? caseData.media.type === 'youtube'
      ? `https://img.youtube.com/vi/${caseData.media.videoId}/mqdefault.jpg`
      : caseData.media.url
    : null;

  return (
    <div className="case-item reveal">
      <div className="case-left">
        <span className="case-year">{caseData.year || '2025'}</span>
        {mediaSrc && (
          <div className="case-media-preview">
            <img src={mediaSrc} alt="" />
          </div>
        )}
      </div>
      <div className="case-info" onClick={() => onLinkClick(caseData.id)}>
        <h3 className="case-title-main">{caseData.displayTitle}</h3>
        <div className="case-metadata">
          {caseData.author && <span className="meta-item"><strong>Author:</strong> {caseData.author}</span>}
          {caseData.tag && <span className="meta-item"><strong>Tag:</strong> {caseData.tag}</span>}
          {caseData.links && <span className="meta-item"><strong>Links:</strong> {caseData.links}</span>}
        </div>
        <div 
          ref={contentRef}
          className="case-desc-compiled markdown-content"
          dangerouslySetInnerHTML={{ __html: caseData.descriptionHtml }} 
        />
        <span className="case-status solved">Examine Dossier</span>
      </div>
    </div>
  );
};

export default function NoteFeed({
  allFiles,
  fileRegistry,
  fullContentCache,
  onLinkClick,
  upsertCacheEntry
}) {
  const [displayedCases, setDisplayedCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [loadedCount, setLoadedCount] = useState(0);
  const [engineInput, setEngineInput] = useState('');
  const [engineOutput, setEngineOutput] = useState([]);
  
  const BATCH_SIZE = 10;
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const fogCanvasRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { 
    setIsMounted(true);
    // Explicitly allow scroll on body when NoteFeed is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';
    
    ensureLibsLoaded().then(() => setLibsReady(true));

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (isMounted && libsReady && allFiles.length > 0 && displayedCases.length === 0) {
        fetchBatch(0, BATCH_SIZE);
    }
  }, [allFiles, isMounted, libsReady]);

  const extractMedia = (content) => {
    const ytRegex = /(?:youtube\.com\/(?:[^/\n]+\/[^\n]+\/|(?:v|e(?:mbed)?)\/|[^\n]*?[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const items = [];

    const videoMatch = content.match(ytRegex);
    if (videoMatch) items.push({ type: 'youtube', videoId: videoMatch[1] });

    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    let imgMatch;
    while ((imgMatch = imageRegex.exec(content)) !== null) {
      const lineStart = content.lastIndexOf('\n', imgMatch.index) + 1;
      const lineEnd = content.indexOf('\n', imgMatch.index);
      const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      if (!ytRegex.test(line)) {
        items.push({ type: 'image', url: imgMatch[1] });
        break;
      }
    }

    return items;
  };

  const parseNote = (content, fileName, fileId) => {
    const lines = content.split('\n');
    const displayTitle = fileName.split('/').pop().replace(/\.md$/, '');
    
    // Metadata Extraction (Regex based on your note structure)
    const authorMatch = content.match(/author:\s*([^*#\n]+)/i);
    const tagMatch = content.match(/tag:\s*#?([^*#\n,\]]+)/i);
    const linksMatch = content.match(/links:\s*([^*#\n]*)/i);

    const author = authorMatch ? authorMatch[1].trim() : null;
    const tag = tagMatch ? tagMatch[1].trim() : 'Archive';
    const links = linksMatch ? linksMatch[1].trim() : null;

    // Advanced Description Filtering (Logic from NoteGallery.js)
    const isSkippedLine = t =>
        !t || t.startsWith('#') || t.startsWith('>') || t.startsWith('![') ||
        t.startsWith('|') || /(?:youtube\.com|youtu\.be)/.test(t) || /^[*_].+:[*_]?/.test(t);

    // 1. Try Quote first
    const quoteMatch = content.match(/^>+ ([\s\S]*?)(?:\n\n|\n(?=[^>])|$)/m);
    let rawDescription = '';
    if (quoteMatch) {
      rawDescription = quoteMatch[0]; 
    } else {
      // 2. Fallback to intro text block (finding first significant text)
      let i = 0;
      while (i < lines.length) {
        let trimmed = lines[i].trim();
        while (i < lines.length && isSkippedLine(trimmed)) { i++; if (lines[i]) trimmed = lines[i].trim(); }
        const blockLines = [];
        while (i < lines.length && !isSkippedLine(trimmed)) {
          blockLines.push(trimmed);
          i++;
          if (lines[i]) trimmed = lines[i].trim();
          if (blockLines.length >= 3) break;
        }
        if (blockLines.length > 0) {
          rawDescription = blockLines.join('\n\n');
          break;
        }
        i++;
      }
    }

    if (!rawDescription) rawDescription = 'No additional field notes available.';

    // Word clamping (40 words)
    const words = rawDescription.split(/\s+/);
    if (words.length > 40) {
      rawDescription = words.slice(0, 40).join(' ') + '...';
    }

    const descriptionHtml = window.marked ? window.marked.parse(rawDescription) : rawDescription;

    return { 
      id: fileId, 
      displayTitle,
      author, tag, links,
      descriptionHtml, 
      year: '2025' 
    };
  };

  const fetchBatch = async (start, end) => {
    if (loading) return;
    setLoading(true);
    const slice = allFiles.slice(start, end);
    const results = await Promise.all(slice.map(async (file) => {
      let content = fullContentCache[file.id]?.raw;
      if (!content) {
        try {
          const url = fileRegistry[file.id.toLowerCase()] || fileRegistry[file.id.toLowerCase() + '.md'];
          if (!url) return null;
          const res = await fetch(url);
          content = await res.text();
          upsertCacheEntry(file.id, content);
        } catch (e) { return null; }
      }
      if (!content) return null;
      const note = parseNote(content, file.name, file.id);
      const firstMedia = extractMedia(content)[0] || null;
      return { ...note, media: firstMedia };
    }));
    
    setDisplayedCases(prev => [...prev, ...results.filter(Boolean)]);
    setLoadedCount(end);
    setLoading(false);
  };

  const handleAnalyze = () => {
    if (!engineInput.trim()) return;
    const input = engineInput.toLowerCase();
    const deductions = [
      {
        keywords: ['ink', 'pen', 'write', 'writing', 'fingers'],
        response: [
          'The ink stains upon the right hand — specifically the index and middle fingers — indicate a person who writes extensively with a fountain pen.',
          'The position of the stains suggests a right-handed individual, and the depth of saturation implies this is a daily habit.',
          'Combined with the university ring, I deduce: a scholar working under significant pressure.',
          'Conclusion: A postgraduate researcher near completion.'
        ]
      },
      {
        keywords: ['mud', 'boot', 'shoe', 'feet', 'dirt'],
        response: [
          'The mud upon the left boot — but not the right — is most revealing.',
          'The consistency is red clay, found along the Thames embankment near Southwark.',
          'The absence of corresponding marks on the right boot suggests you were leaning, examining something at ground level.',
          'Conclusion: You were at the Southwark embankment recently, investigating something in the mud.'
        ]
      },
      {
        keywords: ['callus', 'hand', 'finger'],
        response: [
          'A callus upon the middle finger of the right hand — the precise position where a pen is gripped.',
          'This is the mark of thousands of hours. Not a scholar, but a copyist.',
          'Or perhaps someone who practices their signature. Someone who must authenticate documents.',
          'Conclusion: A professional forger.'
        ]
      }
    ];

    const match = deductions.find(d => d.keywords.some(k => input.includes(k)));
    if (match) {
      setEngineOutput(match.response);
    } else {
      setEngineOutput(['Observations insufficient. Please provide more granular details of the subject.', 'Even the smallest detail can be the key to the entire mystery.']);
    }
  };

const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  };

  const handleInternalLink = (targetId) => {
    const link = document.createElement('a');
    link.setAttribute('data-target', targetId);
    link.classList.add('internal-link');
    onLinkClick({ target: link, preventDefault: () => {} });
  };

  useEffect(() => {
    if (!isMounted) return;

    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    let mX = 0, mY = 0, rX = 0, rY = 0;

    const onMouseMove = (e) => {
      mX = e.clientX; mY = e.clientY;
      if (dot) { dot.style.left = `${mX}px`; dot.style.top = `${mY}px`; }
    };
    
    const animateRing = () => {
      rX += (mX - rX) * 0.15; rY += (mY - rY) * 0.15;
      if (ring) { ring.style.left = `${rX}px`; ring.style.top = `${rY}px`; }
      requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', onMouseMove);
    const ringId = requestAnimationFrame(animateRing);

    const handleMouseEnter = () => ring?.classList.add('inspecting');
    const handleMouseLeave = () => ring?.classList.remove('inspecting');
    const interactiveElements = document.querySelectorAll('a, button, .case-info, .board-note');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    const canvas = fogCanvasRef.current;
    let fogId;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let particles = [];
      const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
      resize(); window.addEventListener('resize', resize);

      class Particle {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
          this.size = Math.random() * 200 + 100; this.speedX = (Math.random() - 0.5) * 0.2;
          this.opacity = Math.random() * 0.02 + 0.01; this.life = Math.random() * 500 + 200; this.maxLife = this.life;
        }
        update() { this.x += this.speedX; this.life--; if (this.life <= 0) this.reset(); }
        draw() {
          const alpha = this.opacity * (this.life / this.maxLife);
          const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
          g.addColorStop(0, `rgba(180, 180, 190, ${alpha})`); g.addColorStop(1, 'rgba(180, 180, 190, 0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (let i = 0; i < 15; i++) particles.push(new Particle());
      const animFog = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); fogId = requestAnimationFrame(animFog); };
      animFog();
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.02 });
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(r => observer.observe(r));

    // Refactored Section Tracking using Scroll Event
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const scrollPos = scrollRef.current.scrollTop + 100;
      const sections = ['hero', 'engine', 'cases'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
          setActiveSection(id);
          break;
        }
      }
    };
    const scrollContainer = scrollRef.current;
    scrollContainer?.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(ringId);
      if (fogId) cancelAnimationFrame(fogId);
      observer.disconnect();
      scrollContainer?.removeEventListener('scroll', handleScroll);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [isMounted, displayedCases, libsReady]);

  if (!isMounted) return null;

  return (
    <div className="mind-palace-scroll-container" ref={scrollRef}>
      {/* FIXED BACKGROUND EFFECTS */}
      <nav className="nav-mind-palace">
        {[
          { id: 'hero', label: 'Entry' },
          { id: 'engine', label: 'Engine' },
          { id: 'cases', label: 'Dossier' },
        ].map(({ id, label }) => (
          <button key={id} className={`nav-item ${activeSection === id ? 'active' : ''}`} onClick={() => scrollToSection(id)}>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="effects-layer">
        <div className="grain"></div>
        <div className="cursor-dot" ref={cursorDotRef}></div>
        <div className="cursor-ring" ref={cursorRingRef}></div>
        <canvas className="fog-canvas" ref={fogCanvasRef}></canvas>
      </div>

      <div className="scroll-content">
        {/* HERO SECTION */}
        <section className="hero" id="hero">
          <div className="hero-content reveal">
            <div className="hero-overline">Consulting Archivist · Ope Watson</div>
            <h1 className="hero-title">Case <span className="italic">Archives</span></h1>
            <p className="hero-subtitle">The digital mind palace, refined to a science.</p>
            <button className="hero-cta" onClick={() => scrollToSection('engine')}>
              Examine the Evidence <span className="arrow">→</span>
            </button>
            <div className="scroll-indicator">
              <span>Scroll to Observe</span>
              <div className="scroll-line"></div>
            </div>
          </div>
        </section>

        {/* ENGINE SECTION */}
        <section className="engine-section" id="engine">
          <div className="engine-container">
            <div className="section-header reveal">
              <span className="section-number">File 005 — The Engine</span>
              <h2 className="section-title">The <span className="accent">Deduction</span> Engine</h2>
              <div className="section-line"></div>
              <p className="section-desc">Present your observations. I shall render my analysis.</p>
            </div>

            <div className="engine-box reveal">
              <p className="engine-prompt">Describe a person before you. I will deduce what you cannot see.</p>
              <div className="engine-input-area">
                <input 
                  type="text" 
                  className="engine-input" 
                  placeholder="e.g., 'A man with ink stains on his right fingers...'"
                  value={engineInput}
                  onChange={(e) => setEngineInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <button className="engine-btn" onClick={handleAnalyze}>Analyze</button>
              {engineOutput.length > 0 && (
                <div className="engine-output visible">
                  {engineOutput.map((line, idx) => (
                    <span key={idx} className="deduction-line" style={{ animationDelay: `${idx * 0.5 + 0.3}s` }}>{line}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

{/* DOSSIER SECTION */}
        <section className="cases-section" id="cases">
          <div className="section-header reveal">
            <span className="section-number">File 004 — The Dossier</span>
            <h2 className="section-title">Notable <span className="accent">Cases</span></h2>
            <div className="section-line"></div>
          </div>

          <div className="cases-timeline">
            {displayedCases.map((c) => (
              <CaseItem key={c.id} caseData={c} onLinkClick={handleInternalLink} />
            ))}
          </div>
          {loadedCount < allFiles.length && (
            <div className="load-more-wrapper">
              <button className="load-more-btn" onClick={() => fetchBatch(loadedCount, loadedCount + BATCH_SIZE)}>
                {loading ? 'Consulting Evidence...' : 'Load More Cases'} <span className="arrow">→</span>
              </button>
            </div>
          )}
        </section>

        <footer className="footer">
          <div className="footer-bottom">
            <span>The Mind Palace · MMXXV</span>
            <span className="footer-wig">🕵️</span>
            <span>"Elementary"</span>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Special+Elite&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');

        :root {
          --void: #0a0a0c;
          --gaslight: #d4a843;
          --gaslight-dim: #8a6d2b;
          --blood-ink: #8b1a1a;
          --parchment: #f4e8c1;
          --parchment-dark: #c4b48a;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-typewriter: 'Special Elite', monospace;
          --font-body: 'EB Garamond', Georgia, serif;
        }

        /* FORCE FULL SCREEN SCROLL */
        .mind-palace-scroll-container {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: var(--void) !important;
          color: var(--parchment);
          font-family: var(--font-body);
          z-index: 999999 !important;
          overflow-y: scroll !important;
          overflow-x: hidden !important;
          cursor: none !important;
          scrollbar-width: none !important;
          pointer-events: auto !important;
        }
        .mind-palace-scroll-container::-webkit-scrollbar { display: none !important; }

        .scroll-content {
          position: relative;
          z-index: 10;
          width: 100%;
          pointer-events: auto !important;
        }

        ::selection { background: var(--gaslight); color: var(--void); }

        /* Effects layer */
        .effects-layer {
          position: fixed !important;
          inset: 0 !important;
          pointer-events: none !important;
          z-index: 5 !important;
        }
        .grain {
          position: absolute; inset: 0; z-index: 9999; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
        .fog-canvas { position: absolute; inset: 0; z-index: 1; opacity: 0.4; }
        
        .cursor-dot {
          width: 8px; height: 8px; background: var(--gaslight); border-radius: 50%;
          position: fixed !important; pointer-events: none !important; z-index: 1000000 !important; transform: translate(-50%, -50%);
          mix-blend-mode: difference;
          left: -10px; top: -10px;
        }
        .cursor-ring {
          width: 40px; height: 40px; border: 1.5px solid var(--gaslight); border-radius: 50%;
          position: fixed !important; pointer-events: none !important; z-index: 999999 !important; transform: translate(-50%, -50%);
          opacity: 0.6; transition: width 0.3s, height 0.3s, background 0.3s;
          left: -100px; top: -100px;
        }
        .cursor-ring.inspecting {
          width: 80px; height: 80px;
          background: radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%);
          opacity: 1;
        }

        /* Sections */
        section { position: relative; z-index: 20; padding: 120px 40px; width: 100%; box-sizing: border-box; }
        .hero { height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; }
        .nav-mind-palace {
          position: fixed; top: 30px; right: 30px; z-index: 10000000;
          display: flex; flex-direction: column; gap: 8px; align-items: flex-end;
        }
        .nav-item {
          display: flex; align-items: center; gap: 12px; background: none; border: none;
          color: var(--parchment-dark); font-family: var(--font-typewriter); font-size: 0.7rem;
          letter-spacing: 3px; text-transform: uppercase; opacity: 0.5; transition: all 0.4s ease;
          cursor: none; padding: 0;
        }
        .nav-item::before {
          content: ''; width: 20px; height: 1px; background: var(--gaslight-dim); transition: all 0.4s ease;
        }
        .nav-item:hover { opacity: 1; color: var(--gaslight); }
        .nav-item:hover::before { width: 40px; background: var(--gaslight); }
        .nav-item.active { opacity: 1; color: var(--gaslight); }
        .nav-item.active::before { width: 40px; background: var(--gaslight); }
        .nav-label { writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); }

        .hero-cta {
          display: inline-flex; align-items: center; gap: 15px; margin-top: 40px;
          font-family: var(--font-typewriter); font-size: 0.75rem; letter-spacing: 4px; text-transform: uppercase;
          color: var(--gaslight); background: transparent; border: 1px solid var(--gaslight-dim);
          padding: 18px 40px; cursor: none; position: relative; overflow: hidden; transition: all 0.5s ease;
        }
        .hero-cta::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212,168,67,0.1), transparent);
          transition: left 0.6s ease;
        }
        .hero-cta:hover::before { left: 100%; }
        .hero-cta:hover { border-color: var(--gaslight); box-shadow: 0 0 30px rgba(212,168,67,0.1); }
        .hero-cta .arrow { transition: transform 0.3s ease; }
        .hero-cta:hover .arrow { transform: translateX(5px); }

        .hero-overline { font-family: var(--font-typewriter); color: var(--gaslight-dim); letter-spacing: 8px; text-transform: uppercase; margin-bottom: 30px; }
        .hero-title { font-family: var(--font-display); font-size: clamp(3rem, 12vw, 8rem); font-weight: 900; margin: 0; line-height: 1; }
        .hero-title .italic { font-style: italic; font-weight: 400; color: var(--gaslight); }
        .hero-subtitle { font-family: var(--font-display); font-style: italic; color: var(--parchment-dark); font-size: clamp(1.2rem, 4vw, 2.5rem); margin-top: 20px; }

        .scroll-indicator {
          margin-top: 60px; display: flex; flex-direction: column; align-items: center; gap: 14px;
          font-family: var(--font-typewriter); font-size: 0.7rem; letter-spacing: 6px; text-transform: uppercase;
          color: var(--gaslight-dim); opacity: 0.7; animation: fadeInUp 2s ease 1s both;
        }
        .scroll-line {
          width: 1px; height: 60px;
          background: linear-gradient(to bottom, var(--gaslight-dim), transparent);
          animation: scrollPulse 2s ease-in-out infinite;
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.15); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 0.7; transform: translateY(0); }
        }

        .section-header { text-align: center; margin-bottom: 100px; }
        .section-number { font-family: var(--font-typewriter); color: var(--gaslight-dim); letter-spacing: 6px; display: block; margin-bottom: 15px; text-transform: uppercase; font-size: 0.7rem; }
        .section-title { font-family: var(--font-display); font-size: clamp(2.5rem, 8vw, 4.5rem); color: var(--parchment); font-weight: 700; margin: 0; }
        .section-title .accent { color: var(--gaslight); font-style: italic; }
        .section-line { width: 80px; height: 1px; background: var(--gaslight-dim); margin: 30px auto; }
        .section-desc { font-family: var(--font-body); font-size: 1.1rem; font-style: italic; color: rgba(244,232,193,0.5); text-align: center; margin-bottom: 50px; }

        /* Deduction Engine */
        .engine-section { background: linear-gradient(180deg, var(--void) 0%, rgba(20,20,25,1) 50%, var(--void) 100%); }
        .engine-container { max-width: 900px; margin: 0 auto; }
        .engine-box { 
          background: rgba(15, 15, 20, 0.9); 
          border: 1px solid rgba(212, 168, 67, 0.15); 
          padding: 60px; 
          position: relative; 
          text-align: center;
        }
        .engine-prompt { font-family: var(--font-body); font-size: 1.3rem; font-style: italic; color: rgba(244,232,193,0.6); margin-bottom: 40px; }
        .engine-input {
          width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(212, 168, 67, 0.3);
          padding: 15px 0; font-family: var(--font-typewriter); font-size: 1.1rem; color: var(--parchment);
          outline: none; transition: border-color 0.3s ease; text-align: center;
        }
        .engine-input:focus { border-bottom-color: var(--gaslight); }
        .engine-btn {
          margin-top: 40px; background: transparent; border: 1px solid var(--gaslight-dim); color: var(--gaslight);
          font-family: var(--font-typewriter); font-size: 0.8rem; letter-spacing: 4px; text-transform: uppercase;
          padding: 16px 40px; cursor: none; transition: all 0.4s ease;
        }
        .engine-btn:hover { background: rgba(212, 168, 67, 0.08); border-color: var(--gaslight); box-shadow: 0 0 20px rgba(212, 168, 67, 0.1); }
        
        .engine-output { 
          margin-top: 50px; padding: 40px; background: rgba(212, 168, 67, 0.03); 
          border-left: 2px solid var(--gaslight-dim); text-align: left; display: flex; flex-direction: column; gap: 15px;
        }
        .deduction-line { 
          font-family: var(--font-body); font-size: 1.2rem; color: var(--parchment-dark); 
          font-style: italic; opacity: 0; animation: typeLine 0.5s ease forwards;
        }
        @keyframes typeLine {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .case-left { display: flex; flex-direction: column; gap: 12px; min-width: 180px; }
        .case-media-preview { width: 180px; }
        .case-media-preview img { width: 100%; height: auto; display: block; opacity: 0.75; filter: sepia(0.2); transition: all 0.4s; border: 1px solid rgba(212,168,67,0.15); }
        .case-item:hover .case-media-preview img { opacity: 1; filter: sepia(0); border-color: rgba(212,168,67,0.4); }

        .load-more-wrapper { display: flex; justify-content: center; padding: 60px 0 20px; }
        .load-more-btn {
          display: inline-flex; align-items: center; gap: 12px;
          font-family: var(--font-typewriter); font-size: 0.75rem; letter-spacing: 4px; text-transform: uppercase;
          color: var(--gaslight-dim); background: transparent; border: 1px solid var(--gaslight-dim);
          padding: 16px 36px; cursor: none; transition: all 0.4s ease; position: relative; overflow: hidden;
        }
        .load-more-btn::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212,168,67,0.08), transparent);
          transition: left 0.5s ease;
        }
        .load-more-btn:hover::before { left: 100%; }
        .load-more-btn:hover { color: var(--gaslight); border-color: var(--gaslight); }
        .load-more-btn .arrow { transition: transform 0.3s ease; }
        .load-more-btn:hover .arrow { transform: translateX(4px); }

        /* Dossier Timeline Expanded */
        .cases-timeline { 
          max-width: 1400px; 
          margin: 0 auto; 
          position: relative; 
          padding: 80px 0 80px 120px; 
          box-sizing: border-box;
        }
        .cases-timeline::before { 
          content: ''; 
          position: absolute; 
          left: 0; 
          top: 0; 
          width: 1px; 
          height: 100%; 
          background: linear-gradient(to bottom, transparent, var(--gaslight-dim), transparent); 
        }
        
        .case-item { 
          display: flex; 
          gap: 100px; 
          padding: 100px 0; 
          border-bottom: 1px solid rgba(212, 168, 67, 0.1); 
          position: relative;
        }
        .case-item::after {
          content: '';
          position: absolute;
          left: -125px;
          top: 108px;
          width: 12px;
          height: 12px;
          background: var(--void);
          border: 1px solid var(--gaslight);
          transform: rotate(45deg);
        }
        .case-year { font-family: var(--font-typewriter); color: var(--gaslight); font-size: 1.2rem; font-weight: 700; letter-spacing: 3px; }
        .case-info { cursor: pointer; flex: 1; }
        .case-info h3 { font-family: var(--font-display); font-size: clamp(2.5rem, 8vw, 4.5rem); margin: 0 0 12px 0; transition: all 0.4s; line-height: 1.1; color: var(--parchment); }
        .case-info:hover h3 { color: var(--gaslight); transform: translateX(20px); }
        .case-type { font-family: var(--font-typewriter); color: var(--gaslight-dim); font-size: 0.9rem; letter-spacing: 4px; text-transform: uppercase; display: block; margin-bottom: 30px; }
        
        .case-desc-compiled { 
          color: rgba(244, 232, 193, 0.85); 
          line-height: 1.8; 
          margin-bottom: 40px; 
          max-width: 1000px; 
          font-size: 1.4rem;
        }
        .case-desc-compiled p { margin: 0 0 20px 0; }
        .case-desc-compiled blockquote { 
          margin: 0 0 25px 0; 
          padding: 15px 0 15px 40px; 
          border-left: 4px solid var(--gaslight-dim); 
          font-style: italic;
          color: var(--gaslight);
          background: rgba(212, 168, 67, 0.04);
        }

        .case-metadata {
          display: flex; flex-wrap: wrap; gap: 8px 20px; margin-bottom: 16px; align-items: center;
        }
        .meta-item {
          font-family: var(--font-typewriter); font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase;
          color: var(--parchment-dark); opacity: 0.75; display: flex; align-items: center; gap: 6px;
        }
        .meta-item strong { color: var(--gaslight-dim); font-weight: 400; }
        .meta-item:not(:last-child)::after { content: '·'; margin-left: 12px; color: var(--gaslight-dim); opacity: 0.5; }

        .case-status { font-family: var(--font-typewriter); font-size: 0.9rem; color: var(--gaslight-dim); border: 1px solid var(--gaslight-dim); padding: 10px 30px; text-transform: uppercase; letter-spacing: 5px; transition: all 0.3s; }
        .case-item:hover .case-status { color: var(--gaslight); border-color: var(--gaslight); background: rgba(212, 168, 67, 0.1); }

        /* Animations */
        .reveal { opacity: 0; transform: translateY(60px); transition: all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        .footer { padding: 150px 40px; border-top: 1px solid rgba(212, 168, 67, 0.15); background: rgba(0,0,0,0.6); }
        .footer-bottom { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; font-family: var(--font-typewriter); font-size: 1rem; color: rgba(244, 232, 193, 0.4); letter-spacing: 5px; text-transform: uppercase; }
        .footer-wig { font-size: 2.5rem; opacity: 0.7; }

        @media (max-width: 1024px) {
          .case-item { flex-direction: column; gap: 40px; }
          .cases-timeline { padding-left: 80px; }
          .case-item::after { left: -85px; top: 38px; }
          .detective-board { height: 1400px; }
          .board-note { width: 90%; left: 5% !important; position: relative !important; top: auto !important; margin: 0 auto 40px !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
