"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import useSpotlight from '@/hooks/useSpotlight';
import MusicHeader from '@/components/sections/MusicHeader';
import LampScene from '@/components/layout/LampScene';
import { BACKGROUND_VIDEO } from '@/configs/media';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const TOP_LINKS = [
  { label: 'chat', href: '/chat' },
  { label: 'casearchives', href: '/casearchive' },
  { label: 'gallery', href: '/gallery' },
];

export default function Hero({ galleryImages = [] }) {
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const { setSpotlightEnabled } = useSpotlight();

  const sectionRef = useRef(null);
  const portraitRef = useRef(null);
  const idRef = useRef(null);

  const title = "Ope Watson";
  const pronunciation = "en. /'ohp 'wots-uhn/  jp. /opeオペ/";

  // No matchMedia any more: the only breakpoint branch used to be the mobile
  // contact cluster riding the name, and the contacts have moved out of the
  // pinned scene into the fixed furniture.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const centerDelta = () => {
        const rect = idRef.current.getBoundingClientRect();
        return window.innerHeight / 2 - (rect.top + rect.height / 2);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=100%',
          scrub: 1,
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        },
      });

      tl.to(portraitRef.current, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 0)
        .to(idRef.current, { y: centerDelta, scale: 1.3, duration: 0.6, ease: 'power2.out' }, 0)
        .to(idRef.current, {
          scale: 1.9,
          opacity: 0,
          duration: 0.4,
          ease: 'power1.in',
        }, 0.6);
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!showVideoOverlay) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') setShowVideoOverlay(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVideoOverlay]);

  return (
    <>
      {/* The furniture that must NOT move: a SIBLING of the pinned section, not
          a child of it. position:fixed alone wasn't enough — ScrollTrigger's pin
          takes the whole section with it, so anything inside travels along no
          matter what its own position is. Being outside the trigger element is
          the only thing the pin can't reach. */}
      <LampScene fixed />
      <div className="noir-fixture">
        <div className="noir-lamp">
          <span className="noir-tube" aria-hidden>
            <i className="noir-tube-bulb" />
          </span>
          <nav className="noir-topnav" aria-label="Sections">
            {TOP_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </nav>
        </div>
        <div className="noir-music-layer">
          <MusicHeader onPlayStateChange={setSpotlightEnabled} />
        </div>
        <button type="button" className="noir-inspired" onClick={() => setShowVideoOverlay(true)}>inspired by ↗</button>
      </div>

    <section ref={sectionRef} className="noir-room relative w-full overflow-hidden">
      <style jsx global>{`
        @keyframes cursor-blink { 0%,49%{opacity:1;} 50%,100%{opacity:0;} }

        .noir-room { background: #000; --font-mono: 'Special Elite', 'Courier New', monospace; color: #dfe8e6; --beam-w: min(640px, 84vw); }

        .noir-stage { position: relative; width: 100%; margin: 0; padding: 0; }

        /* landing fits exactly one screen */
        .scene-zone { position: relative; height: 100dvh; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }

        /* No z-index here on purpose: it would open a stacking context and trap
           .noir-id below the fixed LampScene wash. */
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

        /* Keep the identity above the foreground ceiling wash. */
        .noir-id { position: relative; z-index: 46; transform-origin: center; will-change: transform; }

        .noir-name {
          position: relative; z-index: 4;
          font-family: var(--font-body); font-weight: 900; line-height: 0.92;
          font-size: clamp(3.6rem, 13vw, 8rem); letter-spacing: -0.02em; color: var(--theme, #eef7f4); margin: 0;
          text-shadow: 0 0 50px rgba(214,236,232,0.3), 0 6px 30px rgba(0,0,0,0.8);
        }
        .noir-pron { position: relative; z-index: 4; display: block; margin-top: 8px; text-transform: lowercase; font-family: var(--font-mono); font-size: clamp(1.05rem, 2.6vw, 1.35rem); color: rgba(223,238,235,0.92); text-shadow: 0 0 24px rgba(214,236,232,0.25); }

        /* Fixed ceiling furniture, outside the pinned hero. */
        .noir-fixture {
          position: fixed; inset: 0; z-index: 46; pointer-events: none;
          --font-mono: 'Special Elite', 'Courier New', monospace;
        }

        /* disc top-left, the 3 contacts top-right */
        .noir-music-layer { position: absolute; inset: 0; pointer-events: none; }
        .noir-music-layer .about-masthead { display: block; position: static; margin: 0; padding: 0; }
        .noir-music-layer .about-music-control { position: absolute; left: clamp(16px, 4vw, 44px); top: clamp(16px, 3vh, 28px); pointer-events: auto; }
        .noir-music-layer .about-nav { position: absolute; top: clamp(16px, 3vh, 28px); right: clamp(18px, 4vw, 40px); pointer-events: auto; }

        /* Mobile: the tube/navigation owns the full first row. Contacts move to
           a compact second row, clear of the light fixture. */
        @media (max-width: 767px) {
          .noir-music-layer .about-music-control { display: none; }
          .noir-music-layer .about-nav {
            top: 64px;
            left: 0;
            right: 0;
            justify-content: center;
          }
        }

        /* Fluorescent tube: the links divide its usable face into three equal
           sections. The fixture is intentionally shallow; the broad light wash
           comes from <LampScene />, not from a spotlight-shaped shade. */
        .noir-lamp {
          position: absolute; top: 8px; left: 50%; transform: translateX(-50%); z-index: 47;
          pointer-events: none;
          width: min(840px, 66vw);
          height: 44px;
          padding: 0 22px;
          filter: drop-shadow(0 9px 14px rgba(0,0,0,0.82));
        }
        .noir-tube {
          position: absolute; inset: 0; z-index: -1; pointer-events: none;
          border: 1px solid rgba(196,208,202,0.22);
          border-radius: 3px 3px 7px 7px;
          background:
            linear-gradient(90deg, rgba(255,255,255,0.025), transparent 8% 92%, rgba(255,255,255,0.025)),
            linear-gradient(180deg, #18201e 0%, #101715 58%, #080d0c 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.07),
            inset 0 -8px 12px rgba(0,0,0,0.5),
            0 2px 0 #020504;
        }
        .noir-tube::before,
        .noir-tube::after {
          content: '';
          position: absolute;
          top: 8px;
          bottom: 7px;
          width: 7px;
          border: 1px solid rgba(188,199,194,0.16);
          background: #090e0d;
        }
        .noir-tube::before { left: 9px; }
        .noir-tube::after { right: 9px; }
        .noir-tube-bulb {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: -2px;
          height: 5px;
          border-radius: 0 0 999px 999px;
          background: linear-gradient(90deg, #9a865f 0%, #f7e4b6 8%, #fff7dc 50%, #f7e4b6 92%, #9a865f 100%);
          box-shadow:
            0 3px 5px rgba(255,244,213,0.78),
            0 10px 22px rgba(243,208,152,0.34),
            0 24px 52px rgba(214,222,207,0.14);
        }
        .noir-tube-bulb::after {
          content: '';
          position: absolute;
          top: 100%;
          left: -12%;
          width: 124%;
          height: 70px;
          background: radial-gradient(ellipse at 50% 0%, rgba(243,208,152,0.22), transparent 68%);
          filter: blur(9px);
        }
        .noir-topnav { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); align-items: center; width: 100%; height: 100%; pointer-events: auto; }
        .noir-topnav a { display: flex; align-items: center; justify-content: center; height: 52%; border-right: 1px solid rgba(196,208,202,0.13); font-family: var(--font-mono); font-size: clamp(0.76rem, 1.2vw, 0.92rem); letter-spacing: 0.045em; text-transform: lowercase; color: rgba(243,208,152,0.64); text-decoration: none; transition: color 0.2s ease, text-shadow 0.2s ease; }
        .noir-topnav a:last-child { border-right: 0; }
        .noir-topnav a:hover { color: #fff0cb; text-shadow: 0 0 10px rgba(243,208,152,0.54); }

        @media (max-width: 767px) {
          .noir-lamp { top: 0; left: 0; right: 0; width: auto; height: 48px; padding: 0 14px; transform: none; }
          .noir-tube { border-radius: 0 0 5px 5px; }
          .noir-tube-bulb { left: 14px; right: 14px; }
          .noir-topnav a { font-size: clamp(0.7rem, 3vw, 0.82rem); letter-spacing: 0.015em; }
        }

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
          <div className="scene">
            <Link ref={portraitRef} href="/noirboard" className="noir-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ope-new.png" alt="Ope" />
            </Link>
            <div ref={idRef} className="noir-id">
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
    </>
  );
}
