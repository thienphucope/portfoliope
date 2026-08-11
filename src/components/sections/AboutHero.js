"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';

import useSpotlight from '@/hooks/useSpotlight';
import MusicHeader from '@/components/sections/MusicHeader';
import LampScene from '@/components/layout/LampScene';
import { BACKGROUND_VIDEO } from '@/configs/media';

const TOP_LINKS = [
  { label: 'chat', href: '/chat' },
  { label: 'casearchives', href: '/casearchive' },
  { label: 'gallery', href: '/gallery' },
];

const GLYPHS = ['✦', '✳', '❋', '◆', '○', '✕', '△', '❉', '⟡', '✧', '✺', '✴', '＋', '◇', '☾', '✶'];

export default function Hero({ galleryImages = [] }) {
  const [glyphs, setGlyphs] = useState([]);
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const { setSpotlightEnabled } = useSpotlight();

  const title = "Ope Watson";
  const pronunciation = "en. /'ohp 'wots-uhn/  jp. /opeオペ/";

  useEffect(() => {
    const generated = Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      top: 4 + Math.random() * 90,
      left: 3 + Math.random() * 93,
      size: 12 + Math.random() * 26,
      rotation: Math.floor(Math.random() * 90) - 45,
      duration: 5 + Math.random() * 5,
      delay: -Math.random() * 6,
      opacity: 0.08 + Math.random() * 0.12,
    }));
    setGlyphs(generated);
  }, []);

  useEffect(() => {
    if (!showVideoOverlay) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') setShowVideoOverlay(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVideoOverlay]);

  return (
    <section className="noir-room relative w-full overflow-hidden">
      <div className="noir-glyphs" aria-hidden>
        {glyphs.map((g) => (
          <span key={g.id} className="noir-glyph" style={{
            top: `${g.top}%`, left: `${g.left}%`, fontSize: `${g.size}px`, opacity: g.opacity,
            '--r': `${g.rotation}deg`, animationDuration: `${g.duration}s`, animationDelay: `${g.delay}s`,
          }}>{g.glyph}</span>
        ))}
      </div>

      <style jsx global>{`
        @keyframes noir-glyph-float {
          0%   { transform: translateY(0) rotate(var(--r)); }
          50%  { transform: translateY(-14px) rotate(calc(var(--r) + 8deg)); }
          100% { transform: translateY(0) rotate(var(--r)); }
        }
        @keyframes cursor-blink { 0%,49%{opacity:1;} 50%,100%{opacity:0;} }

        .noir-room { background: #000; --font-mono: 'Special Elite', 'Courier New', monospace; color: #dfe8e6; --beam-w: min(640px, 84vw); }

        .noir-glyphs { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
        .noir-glyph { position: absolute; color: #cfe3df; animation: noir-glyph-float ease-in-out infinite; }

        .noir-stage { position: relative; z-index: 2; width: 100%; margin: 0; padding: 0; }

        /* landing fits exactly one screen */
        .scene-zone { position: relative; height: 100dvh; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }

        /* No z-index here on purpose: it would open a stacking context and trap
           .noir-id below the LampScene shade. .noir-stage (z 2) already lifts
           the whole scene above the glyph layer. */
        .scene { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: clamp(12px, 2.2vh, 26px); padding: clamp(10px, 3vh, 32px) 0; height: 100%; }

        /* across the table: no frame, edges dissolved into the dark */
        .noir-portrait {
          position: relative; z-index: 1; display: block; height: min(88vh, 1040px); width: auto; max-width: 96vw; aspect-ratio: 4/5; overflow: hidden; transform: translateY(8vh); margin-bottom: -2.6em; flex: 0 1 auto;
          -webkit-mask-image: radial-gradient(74% 80% at 50% 42%, #000 40%, rgba(0,0,0,0.5) 66%, transparent 90%), linear-gradient(to bottom, transparent 0%, #000 16%, #000 80%, transparent 100%);
          -webkit-mask-composite: source-in;
                  mask-image: radial-gradient(74% 80% at 50% 42%, #000 40%, rgba(0,0,0,0.5) 66%, transparent 90%), linear-gradient(to bottom, transparent 0%, #000 16%, #000 80%, transparent 100%);
                  mask-composite: intersect;
        }
        .noir-portrait img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.98) contrast(1.04) grayscale(0.12); }
        .noir-portrait::before {
          content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background: radial-gradient(120% 55% at 50% -8%, rgba(214,236,232,0.35) 0%, rgba(214,236,232,0.08) 26%, transparent 56%);
          mix-blend-mode: screen;
        }

        /* The name sits ~80% down the screen, where the LampScene shade is ~0.6
           black — under it, even white text reads as grey. z 46 lifts the two
           lines clear of the shade so they carry the same brightness as the lit
           part of the portrait. The portrait itself stays under the shade and
           keeps sinking into the dark. */
        .noir-id { position: relative; z-index: 46; }

        .noir-name {
          position: relative; z-index: 4;
          font-family: var(--font-body); font-weight: 900; line-height: 0.92;
          font-size: clamp(3.6rem, 13vw, 8rem); letter-spacing: -0.02em; color: var(--theme, #eef7f4); margin: 0;
          text-shadow: 0 0 50px rgba(214,236,232,0.3), 0 6px 30px rgba(0,0,0,0.8);
        }
        .noir-pron { position: relative; z-index: 4; display: block; margin-top: 8px; text-transform: lowercase; font-family: var(--font-mono); font-size: clamp(1.05rem, 2.6vw, 1.35rem); color: rgba(223,238,235,0.92); text-shadow: 0 0 24px rgba(214,236,232,0.25); }

        /* disc pinned left-middle, the 3 contacts top-right, inspired-by top-left */
        .noir-music-layer { position: absolute; inset: 0; z-index: 5; pointer-events: none; }
        .noir-music-layer .about-masthead { display: block; position: static; margin: 0; padding: 0; }
        .noir-music-layer .about-music-control { position: absolute; left: clamp(16px, 4vw, 44px); top: clamp(16px, 3vh, 28px); pointer-events: auto; }
        .noir-music-layer .about-nav { position: absolute; top: clamp(16px, 3vh, 28px); right: clamp(18px, 4vw, 40px); pointer-events: auto; }

        /* ── The fixture that emits <LampScene />'s column ──────────────────
           Ceiling-mounted (top: 0), sitting over the beam's throat, so the
           column reads as coming out from under it. The shade is a separate
           child because clip-path applies to descendants too — the lip's glow
           has to spill below the shade's bottom edge, so it can't be clipped
           by it. */
        .noir-lamp {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 6;
          width: min(560px, 88vw);
          padding: clamp(16px, 2.6vh, 26px) clamp(18px, 4vw, 38px) clamp(15px, 2.2vh, 21px);
          filter: drop-shadow(0 12px 26px rgba(0,0,0,0.78));
        }
        .noir-lamp-shade {
          position: absolute; inset: 0; z-index: -1; pointer-events: none;
          clip-path: polygon(15% 0, 85% 0, 100% 100%, 0 100%);
          background: linear-gradient(180deg, #080f0e 0%, #131f1d 58%, #1e2c29 100%);
        }
        /* the bulb line: brightest dead centre, where the column starts */
        .noir-lamp-lip {
          position: absolute; left: 0; right: 0; bottom: 0; height: 3px; pointer-events: none;
          background: linear-gradient(90deg, transparent 0%, var(--theme) 14%, #fdfffe 50%, var(--theme) 86%, transparent 100%);
          box-shadow: 0 0 18px 3px rgba(243,208,152,0.5), 0 0 52px 12px rgba(214,236,232,0.26);
        }
        .noir-topnav { position: relative; display: flex; justify-content: center; gap: clamp(18px, 3vw, 34px); pointer-events: auto; }
        /* Theme colour, dimmed by opacity rather than a second hardcoded rgba —
           keeps --theme the single source for the accent. */
        .noir-topnav a { font-family: var(--font-mono); font-size: clamp(0.82rem, 1.4vw, 0.98rem); letter-spacing: 0.06em; text-transform: lowercase; color: var(--theme); opacity: 0.62; text-decoration: none; transition: opacity 0.25s ease, text-shadow 0.25s ease; }
        .noir-topnav a:hover { opacity: 1; text-shadow: 0 0 14px rgba(243,208,152,0.65); }
        /* z 46: above the LampScene shade (45), which reaches solid black at the
           bottom edge and would otherwise swallow this button. */
        .noir-inspired { position: absolute; bottom: clamp(16px, 3vh, 28px); left: clamp(18px, 4vw, 40px); z-index: 46; border: 0; padding: 0; background: transparent; cursor: pointer; font-family: var(--font-mono); font-style: italic; font-size: 0.8rem; color: rgba(207,227,223,0.45); transition: color 0.25s ease; }
        .noir-inspired:hover { color: #eaf6f2; }

        .video-modal-backdrop { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); }
        .video-modal { position: relative; width: 100vw; aspect-ratio: 16/9; background: #000; border: 1px solid rgba(214,236,232,0.4); box-shadow: 0 24px 70px rgba(0,0,0,0.72); }
        .video-modal iframe { width: 100%; height: 100%; border: 0; display: block; }
        .video-modal-close { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid rgba(214,236,232,0.4); background: #dfe8e6; color: #05100e; cursor: pointer; z-index: 1; }
        @media (min-width: 768px) { .video-modal { width: 75vw; } .video-modal-close { top: -14px; right: -14px; } }
      `}</style>

      <div className="noir-stage">
        <div className="noir-zone scene-zone">
          <LampScene />
          <div className="noir-music-layer">
            <MusicHeader onPlayStateChange={setSpotlightEnabled} />
          </div>
          <button type="button" className="noir-inspired" onClick={() => setShowVideoOverlay(true)}>inspired by ↗</button>
          <div className="noir-lamp">
            <span className="noir-lamp-shade" aria-hidden />
            <span className="noir-lamp-lip" aria-hidden />
            <nav className="noir-topnav" aria-label="Sections">
              {TOP_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
            </nav>
          </div>
          <div className="scene">
            <Link href="/noirboard" className="noir-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ope-new.png" alt="Ope" />
            </Link>
            <div className="noir-id">
              <h2 className="noir-name">{title}</h2>
              <span className="noir-pron">{pronunciation}</span>
            </div>
          </div>
        </div>
      </div>

      {showVideoOverlay && (
        <div className="video-modal-backdrop" onClick={() => setShowVideoOverlay(false)}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="video-modal-close" aria-label="Close" onClick={() => setShowVideoOverlay(false)}><FaTimes /></button>
            <iframe
              src={`https://www.youtube.com/embed/${BACKGROUND_VIDEO.videoId}?autoplay=1&start=${BACKGROUND_VIDEO.start}`}
              title="Background video" allow="autoplay; encrypted-media" allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}
