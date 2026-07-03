"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';

import useSpotlight from '@/hooks/useSpotlight';
import MusicHeader from '@/components/sections/MusicHeader';
import { BACKGROUND_VIDEO } from '@/configs/media';

const visibleScrambleText = (value) => value.trimEnd();
const GLYPHS = ['✦', '✳', '❋', '◆', '○', '✕', '△', '❉', '⟡', '✧', '✺', '✴', '＋', '◇', '☾', '✶'];

export default function Hero() {
  const [displayText, setDisplayText] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayPronunciation, setDisplayPronunciation] = useState("");
  const [footprints, setFootprints] = useState([]);
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const { setSpotlightEnabled, spotlightOverlay } = useSpotlight();

  const padChar = ' ';
  const originalText = "An IT developer and embedded IoT programmer wiring up connected devices, firmware, and the quiet systems that keep them talking.";
  const replacementText = "A counselling detective for love, loss, doubt, and the stories people cannot bring themselves to close.";
  const textMaxLen = Math.max(originalText.length, replacementText.length);
  const originalTextPadded = originalText + padChar.repeat(textMaxLen - originalText.length);
  const replacementTextPadded = replacementText + padChar.repeat(textMaxLen - replacementText.length);

  const originalTitle = "Ope Watson";
  const replacementTitle = "No Touchin!";
  const titleMaxLen = Math.max(originalTitle.length, replacementTitle.length);
  const originalTitlePadded = originalTitle + padChar.repeat(titleMaxLen - originalTitle.length);
  const replacementTitlePadded = replacementTitle + padChar.repeat(titleMaxLen - replacementTitle.length);

  const originalPronunciation = "en. /'ohp 'wots-uhn/  jp. /opeオペ/";
  const replacementPronunciation = "pronounce it anyways!";
  const pronMaxLen = Math.max(originalPronunciation.length, replacementPronunciation.length);
  const originalPronPadded = originalPronunciation + padChar.repeat(pronMaxLen - originalPronunciation.length);
  const replacementPronPadded = replacementPronunciation + padChar.repeat(pronMaxLen - replacementPronunciation.length);

  useEffect(() => {
    setDisplayText(visibleScrambleText(originalTextPadded));
    setDisplayTitle(visibleScrambleText(originalTitlePadded));
    setDisplayPronunciation(visibleScrambleText(originalPronPadded));

    // Generate decorative glyphs only on the client to avoid hydration mismatch.
    const generatedFootprints = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      top: 4 + Math.random() * 90,
      left: 3 + Math.random() * 93,
      size: 14 + Math.random() * 30,
      rotation: Math.floor(Math.random() * 90) - 45,
      duration: 5 + Math.random() * 5,
      delay: -Math.random() * 6,
      opacity: 0.1 + Math.random() * 0.14,
    }));
    setFootprints(generatedFootprints);
  }, [originalPronPadded, originalTextPadded, originalTitlePadded]);

  useEffect(() => {
    if (!showVideoOverlay) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') setShowVideoOverlay(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVideoOverlay]);

  const scrambleText = (original, target, setDisplay, duration = 200) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let seed = 1234;
    const m = 2147483647;
    const a = 1103515245;
    const c = 12345;
    const pseudoRandom = () => { seed = (a * seed + c) % m; return seed / m; };
    let startTime = null;
    let frame;
    const length = Math.max(original.length, target.length);
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      if (progressRatio < 0.7) {
        const scrambled = Array.from({ length }).map((_, i) => {
          const targetChar = target[i] || padChar;
          return targetChar === " "
            ? " "
            : chars[Math.floor(pseudoRandom() * chars.length)];
        }).join("");
        setDisplay(visibleScrambleText(scrambled));
        frame = requestAnimationFrame(animate);
      } else {
        const blendRatio = (progressRatio - 0.7) / 0.3;
        const currentText = Array.from({ length }).map((_, i) => {
          const originalChar = original[i] || padChar;
          const targetChar = target[i] || padChar;
          if (targetChar === " ") return " ";
          if (originalChar === " ") return targetChar;
          return blendRatio < pseudoRandom() ? originalChar : targetChar;
        }).join("");
        setDisplay(visibleScrambleText(currentText));
        if (progressRatio < 1) frame = requestAnimationFrame(animate);
        else setDisplay(visibleScrambleText(target));
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  };

  return (
    <section className="about-hero-section relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {spotlightOverlay}
      <div className="absolute inset-[-80px] pointer-events-none z-0">
        {footprints.map(fp => (
          <span key={fp.id} className="noir-glyph" style={{
            top: `${fp.top}%`,
            left: `${fp.left}%`,
            fontSize: `${fp.size}px`,
            opacity: fp.opacity,
            '--r': `${fp.rotation}deg`,
            animationDuration: `${fp.duration}s`,
            animationDelay: `${fp.delay}s`,
          }}>
            {fp.glyph}
          </span>
        ))}
      </div>

      <style jsx global>{`
        @keyframes noir-glyph-float {
          0%   { transform: translateY(0) rotate(var(--r)); }
          50%  { transform: translateY(-14px) rotate(calc(var(--r) + 8deg)); }
          100% { transform: translateY(0) rotate(var(--r)); }
        }
        @keyframes noir-cursor-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .noir-glyph {
          position: absolute;
          color: var(--theme);
          animation-name: noir-glyph-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .about-noir {
          position: relative;
          width: 100%;
          min-height: 100dvh;
          margin: 0;
          --font-mono: 'Special Elite', 'Courier New', monospace;
          color: #241d16;
          background: oklch(0.938 0.03 84);
          padding: clamp(22px, 4vw, 40px);
          border: 1px solid oklch(0.5 0.045 64);
          box-shadow:
            inset 0 0 0 5px oklch(0.938 0.03 84),
            inset 0 0 0 6px oklch(0.5 0.045 64);
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-areas:
            "masthead"
            "visual"
            "copy"
            "social";
          gap: clamp(20px, 4vw, 32px);
          overflow: hidden;
        }
        .about-noir::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          mix-blend-mode: multiply;
          opacity: 0.09;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .noir-visual,
        .noir-masthead,
        .noir-copy,
        .noir-footer {
          position: relative;
          z-index: 2;
          min-width: 0;
        }

        .noir-masthead {
          grid-area: masthead;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .noir-eyebrow {
          display: inline-block;
          width: fit-content;
          font-family: var(--font-mono);
          font-style: italic;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          text-decoration: none;
          color: oklch(0.55 0.02 64);
          transition: color 0.25s ease;
        }
        .noir-eyebrow:hover {
          color: var(--theme);
        }

        .noir-name {
          font-family: var(--font-body);
          font-weight: 900;
          font-size: clamp(3rem, 10.5vw, 4.6rem);
          line-height: 0.98;
          white-space: nowrap;
          overflow: hidden;
          padding-bottom: 0.15em;
          letter-spacing: -0.01em;
          color: var(--theme);
          margin: 0;
          cursor: default;
          transition: color 0.25s ease;
        }
        .noir-name:hover {
          color: var(--theme);
        }

        .noir-pron {
          display: block;
          margin-top: 4px;
          text-transform: lowercase;
          font-family: var(--font-mono);
          font-style: normal;
          font-size: clamp(1rem, 2.2vw, 1.15rem);
          letter-spacing: 0.02em;
          color: oklch(0.5 0.03 64);
          cursor: default;
        }

        .noir-visual {
          grid-area: visual;
        }
        .noir-portrait {
          position: relative;
          display: block;
          width: 100%;
          min-height: 260px;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 4px;
          border: 1px solid oklch(0.7 0.045 70);
          background-image: repeating-linear-gradient(135deg, oklch(0.9 0.034 82) 0 11px, oklch(0.93 0.03 84) 11px 22px);
          transition: box-shadow 0.35s ease, transform 0.35s ease;
        }
        .noir-portrait:hover {
          box-shadow: 0 24px 48px -22px rgba(60,45,110,0.5);
          transform: translateY(-3px);
        }
        .noir-portrait img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .noir-copy {
          grid-area: copy;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .noir-desc {
          margin: 0;
          font-family: var(--font-mono);
          font-style: normal;
          text-transform: lowercase;
          font-size: clamp(1.05rem, 2.4vw, 1.22rem);
          line-height: 1.7;
          min-height: calc(1.7em * 4);
          color: oklch(0.34 0.02 64);
          cursor: default;
          transition: color 0.25s ease;
        }
        .noir-desc:hover {
          color: #241d16;
        }

        .noir-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .noir-action {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 4px;
          text-decoration: none;
          color: #7a1f3d;
          border-top: 1px solid oklch(0.76 0.04 72);
          font-family: var(--font-mono);
          font-style: italic;
          transition: color 0.25s ease, padding-left 0.25s ease;
        }
        .noir-action:last-child {
          border-bottom: 1px solid oklch(0.76 0.04 72);
        }
        .noir-action:hover {
          color: #4f1027;
          padding-left: 12px;
        }
        .noir-action-label {
          flex: 1;
          min-width: 0;
          font-weight: 800;
          font-size: clamp(1rem, 2.5vw, 1.18rem);
          letter-spacing: 0.04em;
          text-transform: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .noir-action-arrow {
          flex: 0 0 auto;
          font-size: 0.78rem;
          color: currentColor;
        }

        .noir-footer {
          grid-area: social;
          display: flex;
          align-items: center;
          padding-top: 6px;
        }
        .noir-hint {
          margin-left: auto;
          font-family: var(--font-mono);
          font-style: italic;
          font-size: 0.78rem;
          color: oklch(0.68 0.02 64);
        }
        .noir-cursor {
          animation: noir-cursor-blink 1.1s step-end infinite;
        }

        .video-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .video-modal {
          position: relative;
          width: 50vw;
          height: 50vh;
          min-width: 280px;
          min-height: 158px;
          background: #000;
          border: 1px solid oklch(0.7 0.045 70);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.72);
        }
        .video-modal iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
        .video-modal-close {
          position: absolute;
          top: -14px;
          right: -14px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid oklch(0.7 0.045 70);
          background: oklch(0.938 0.03 84);
          color: #241d16;
          cursor: pointer;
          z-index: 1;
        }

        @media (min-width: 768px) {
          .about-noir {
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
            grid-template-rows: auto 1fr auto;
            grid-template-areas:
              "masthead visual"
              "copy visual"
              "social visual";
            column-gap: clamp(32px, 5vw, 60px);
            padding: clamp(28px, 3vw, 40px);
          }
          .noir-visual {
            display: flex;
            align-self: stretch;
            min-height: 0;
          }
          .noir-portrait {
            flex: 1;
            height: 100%;
            min-height: 0;
            aspect-ratio: auto;
          }
          .noir-name {
            font-size: clamp(4.2rem, 7.4vw, 6.4rem);
          }
        }

        @media (min-width: 1024px) {
          .noir-name {
            font-size: 7.6rem;
          }
          .noir-desc {
            font-size: 1.35rem;
            max-width: 46ch;
          }
        }
      `}</style>

      <div className="about-noir relative z-10">
        <div className="noir-masthead">
          <MusicHeader onPlayStateChange={setSpotlightEnabled} />
          <button
            type="button"
            className="noir-eyebrow"
            onClick={() => setShowVideoOverlay(true)}
          >
            inspired by ↗
          </button>
          <h2
            className="noir-name"
            onMouseEnter={() => scrambleText(originalTitlePadded, replacementTitlePadded, setDisplayTitle)}
            onMouseLeave={() => scrambleText(replacementTitlePadded, originalTitlePadded, setDisplayTitle)}
          >
            {displayTitle}
          </h2>
          <span
            className="noir-pron"
            onMouseEnter={() => scrambleText(originalPronPadded, replacementPronPadded, setDisplayPronunciation)}
            onMouseLeave={() => scrambleText(replacementPronPadded, originalPronPadded, setDisplayPronunciation)}
          >
            {displayPronunciation}
          </span>
        </div>

        <div className="noir-visual">
          <Link href="/noirboard" className="noir-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ope-new.png" alt="Ope" />
          </Link>
        </div>

        <div className="noir-copy">
          <p
            className="noir-desc"
            onMouseEnter={() => scrambleText(originalTextPadded, replacementTextPadded, setDisplayText)}
            onMouseLeave={() => scrambleText(replacementTextPadded, originalTextPadded, setDisplayText)}
          >
            {displayText}
          </p>

          <nav className="noir-nav">
            <Link href="/chat" className="noir-action">
              <span className="noir-action-label">Chat with librarian moxxi</span>
              <span className="noir-action-arrow">↗</span>
            </Link>
            <Link href="/casearchive" className="noir-action">
              <span className="noir-action-label">Explore the case archives</span>
              <span className="noir-action-arrow">↗</span>
            </Link>
            <Link href="/gallery" className="noir-action">
              <span className="noir-action-label">Visit the gallery</span>
              <span className="noir-action-arrow">↗</span>
            </Link>
          </nav>
        </div>

        <div className="noir-footer">
          <span className="noir-hint">hover anything<span className="noir-cursor">_</span></span>
        </div>
      </div>

      {showVideoOverlay && (
        <div className="video-modal-backdrop" onClick={() => setShowVideoOverlay(false)}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="video-modal-close"
              aria-label="Close"
              onClick={() => setShowVideoOverlay(false)}
            >
              <FaTimes />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${BACKGROUND_VIDEO.videoId}?autoplay=1&start=${BACKGROUND_VIDEO.start}`}
              title="Background video"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}
