"use client";
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMediaModal } from '@/components/ui/MediaModal';
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

const DESKTOP_DIALOGUE = [
  { side: 'left', text: 'Anything below?', top: 29, edge: 3 },
  { side: 'right', text: 'A map. Loose ends.', top: 36, edge: 2 },
  { side: 'left', text: 'Anything strange?', top: 54, edge: 1 },
  { side: 'right', text: 'Seven missing minutes.', top: 60, edge: 5 },
  { side: 'left', text: 'Where?', top: 42, edge: 7 },
  { side: 'right', text: 'Scroll.', top: 48, edge: 3 },
];

const visibleScrambleText = (value) => value.trimEnd();
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function scrambleElement(element, original, target, duration = 200) {
  if (!element) return () => {};

  const length = Math.max(original.length, target.length);
  const originalPadded = original.padEnd(length, ' ');
  const targetPadded = target.padEnd(length, ' ');
  let seed = 1234;
  let startTime = null;
  let frame;

  const pseudoRandom = () => {
    seed = (1103515245 * seed + 12345) % 2147483647;
    return seed / 2147483647;
  };

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progressRatio = Math.min((timestamp - startTime) / duration, 1);

    if (progressRatio < 0.7) {
      element.textContent = visibleScrambleText(Array.from({ length }, (_, index) => (
        targetPadded[index] === ' '
          ? ' '
          : SCRAMBLE_CHARS[Math.floor(pseudoRandom() * SCRAMBLE_CHARS.length)]
      )).join(''));
    } else {
      const blendRatio = (progressRatio - 0.7) / 0.3;
      element.textContent = visibleScrambleText(Array.from({ length }, (_, index) => {
        const originalChar = originalPadded[index];
        const targetChar = targetPadded[index];
        if (targetChar === ' ') return ' ';
        if (originalChar === ' ') return targetChar;
        return blendRatio < pseudoRandom() ? originalChar : targetChar;
      }).join(''));
    }

    if (progressRatio < 1) frame = window.requestAnimationFrame(animate);
    else element.textContent = target;
  };

  frame = window.requestAnimationFrame(animate);
  return () => window.cancelAnimationFrame(frame);
}

export default function Hero({ galleryImages = [] }) {
  const openMedia = useMediaModal();
  const { setSpotlightEnabled } = useSpotlight();

  const sectionRef = useRef(null);
  const portraitRef = useRef(null);
  const idRef = useRef(null);
  const dialogueRef = useRef(null);
  const titleTextRef = useRef(null);
  const pronTextRef = useRef(null);

  const title = "Ope Watson";
  const pronunciation = "en. /'ohp 'wots-uhn/  jp. /opeオペ/";
  const bulletinTitle = 'Evidence Wall';
  const bulletinDescription = 'notes / photographs / loose ends';

  const inspectBulletin = () => {
    window.dispatchEvent(new Event('ope:inspect-bulletin'));
  };

  // No matchMedia any more: the only breakpoint branch used to be the mobile
  // contact cluster riding the name, and the contacts have moved out of the
  // pinned scene into the fixed furniture.
  useEffect(() => {
    let copyMode = 'identity';
    let cancelTitleScramble = () => {};
    let cancelPronScramble = () => {};

    const updateIdentityCopy = (progress) => {
      const nextMode = progress > 0.008 ? 'bulletin' : 'identity';
      if (nextMode === copyMode) return;
      copyMode = nextMode;

      cancelTitleScramble();
      cancelPronScramble();
      if (nextMode === 'bulletin') {
        cancelTitleScramble = scrambleElement(titleTextRef.current, title, bulletinTitle);
        cancelPronScramble = scrambleElement(pronTextRef.current, pronunciation, bulletinDescription);
      } else {
        cancelTitleScramble = scrambleElement(titleTextRef.current, bulletinTitle, title);
        cancelPronScramble = scrambleElement(pronTextRef.current, bulletinDescription, pronunciation);
      }
    };

    const ctx = gsap.context(() => {
      const centerDelta = () => {
        const rect = idRef.current.getBoundingClientRect();
        return window.innerHeight / 2 - (rect.top + rect.height / 2);
      };
      const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=100%',
          scrub: 1,
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
          onUpdate: (self) => updateIdentityCopy(self.progress),
        },
      });

      tl.to(portraitRef.current, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 0)
        .to(idRef.current, {
          y: centerDelta,
          scale: () => isMobile() ? 1.05 : 1.3,
          duration: 0.6,
          ease: 'power2.out',
        }, 0)
        .to(dialogueRef.current, { opacity: 0, duration: 0.1, ease: 'power1.out' }, 0)
        .to(idRef.current, {
          scale: () => isMobile() ? 1.22 : 1.9,
          opacity: 0,
          duration: 0.4,
          ease: 'power1.in',
        }, 0.6);
    }, sectionRef);
    return () => {
      cancelTitleScramble();
      cancelPronScramble();
      ctx.revert();
    };
  }, []);


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
        <button type="button" className="noir-inspired" onClick={() => openMedia({ type: 'youtube', videoId: BACKGROUND_VIDEO.videoId, start: BACKGROUND_VIDEO.start, title: 'Inspiration' })}>inspired by ↗</button>
      </div>

    <section ref={sectionRef} className="noir-room relative w-full overflow-hidden">
      <style jsx global>{`
        @keyframes cursor-blink { 0%,49%{opacity:1;} 50%,100%{opacity:0;} }
        @keyframes noir-dialogue-line {
          0%, 100% { opacity: 0; transform: translateY(5px); filter: blur(2px); }
          5% { opacity: 0; }
          10%, 21% { opacity: 0.92; transform: translateY(0); filter: blur(0); }
          27% { opacity: 0; transform: translateY(-3px); filter: blur(1px); }
          28%, 99% { opacity: 0; }
        }

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

        .noir-dialogue {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: none;
          pointer-events: none;
          will-change: opacity;
        }
        .noir-dialogue-side {
          position: absolute;
          inset: 0;
          color: rgba(238,232,214,0.94);
          font-family: var(--font-body);
          font-size: clamp(1.08rem, 1.45vw, 1.38rem);
          font-weight: 500;
          font-style: italic;
          line-height: 1.45;
          letter-spacing: 0.025em;
          text-shadow: 0 2px 20px #000, 0 0 15px rgba(243,208,152,0.18);
        }
        .noir-dialogue-line {
          position: absolute;
          top: calc(var(--top) * 1%);
          width: clamp(170px, 21vw, 330px);
          opacity: 0;
          animation: noir-dialogue-line 18s ease-in-out infinite;
          animation-delay: calc(0.45s + var(--line) * 3s);
        }
        .noir-dialogue-left .noir-dialogue-line {
          right: calc(50% + min(35vh, 31vw) + var(--edge) * 1vw);
          text-align: right;
        }
        .noir-dialogue-right .noir-dialogue-line {
          left: calc(50% + min(35vh, 31vw) + var(--edge) * 1vw);
          text-align: left;
        }
        @media (min-width: 1024px) {
          .noir-dialogue { display: block; }
        }
        @media (prefers-reduced-motion: reduce) {
          .noir-dialogue { display: none; }
        }

        /* Keep the identity above the foreground ceiling wash. */
        .noir-id { position: relative; z-index: 46; transform-origin: center; will-change: transform; }
        .noir-identity-action {
          border: 0;
          margin: 0;
          padding: 0;
          color: inherit;
          background: transparent;
          font: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          cursor: pointer;
          transition: color 0.2s ease, text-shadow 0.2s ease;
        }
        .noir-identity-action:hover { color: #fff2cf; text-shadow: 0 0 32px rgba(243,208,152,0.48); }
        .noir-identity-action:focus-visible { outline: 1px solid rgba(243,208,152,0.62); outline-offset: 7px; }

        .noir-name {
          position: relative; z-index: 4;
          font-family: var(--font-body); font-weight: 900; line-height: 0.92;
          font-size: clamp(3.6rem, 13vw, 8rem); letter-spacing: -0.02em; color: var(--theme, #eef7f4); margin: 0;
          text-shadow: 0 0 50px rgba(214,236,232,0.3), 0 6px 30px rgba(0,0,0,0.8);
        }
        .noir-pron { position: relative; z-index: 4; display: block; width: fit-content; margin: 8px auto 0; text-align: center; text-transform: lowercase; font-family: var(--font-mono); font-size: clamp(1.05rem, 2.6vw, 1.35rem); color: rgba(223,238,235,0.92); text-shadow: 0 0 24px rgba(214,236,232,0.25); }

        @media (max-width: 767px) {
          .noir-id { width: 100%; text-align: center; }
          .noir-name { font-size: clamp(2.55rem, 11.5vw, 3.35rem); }
          .noir-name .noir-identity-action {
            display: block;
            width: fit-content;
            max-width: 78vw;
            margin: 0 auto;
            white-space: nowrap;
          }
          .noir-pron {
            width: 78vw;
            max-width: 78vw;
            white-space: normal;
            overflow-wrap: anywhere;
            font-size: clamp(0.72rem, 3vw, 0.9rem);
            line-height: 1.3;
          }
        }

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

        .noir-inspired { position: absolute; bottom: clamp(16px, 3vh, 28px); left: clamp(18px, 4vw, 40px); z-index: 46; border: 0; padding: 0; background: transparent; cursor: pointer; font-family: var(--font-mono); font-style: italic; font-size: 0.8rem; color: rgba(207,227,223,0.45); transition: color 0.25s ease; pointer-events: auto; }
        .noir-inspired:hover { color: #eaf6f2; }

      `}</style>

      <div className="noir-stage">
        <div className="noir-zone scene-zone">
          <div className="scene">
            <Link ref={portraitRef} href="/noirboard" className="noir-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ope-new.png" alt="Ope" />
            </Link>
            <div ref={idRef} className="noir-id">
              <h2 className="noir-name">
                <button type="button" className="noir-identity-action" onClick={inspectBulletin}>
                  <span ref={titleTextRef}>{title}</span>
                </button>
              </h2>
              <button type="button" className="noir-pron noir-identity-action" onClick={inspectBulletin}>
                <span ref={pronTextRef}>{pronunciation}</span>
              </button>
            </div>
          </div>
          <div ref={dialogueRef} className="noir-dialogue" aria-hidden="true">
            <div className="noir-dialogue-side noir-dialogue-left">
              {DESKTOP_DIALOGUE.map((line, index) => line.side === 'left' && (
                <span
                  key={line.text}
                  className="noir-dialogue-line"
                  style={{ '--line': index, '--top': line.top, '--edge': line.edge }}
                >
                  {line.text}
                </span>
              ))}
            </div>
            <div className="noir-dialogue-side noir-dialogue-right">
              {DESKTOP_DIALOGUE.map((line, index) => line.side === 'right' && (
                <span
                  key={line.text}
                  className="noir-dialogue-line"
                  style={{ '--line': index, '--top': line.top, '--edge': line.edge }}
                >
                  {line.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
    </>
  );
}
