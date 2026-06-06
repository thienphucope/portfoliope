"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footprints } from 'lucide-react';

import useSpotlight from '@/hooks/useSpotlight';
import MusicHeader from '@/components/sections/MusicHeader';
import SocialTiles from '@/components/sections/SocialTiles';

const visibleScrambleText = (value) => value.trimEnd();

export default function Hero() {
  const [displayText, setDisplayText] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayPronunciation, setDisplayPronunciation] = useState("");
  const [displayCaseNote, setDisplayCaseNote] = useState("");
  const [isHoveringPortrait, setIsHoveringPortrait] = useState(false);
  const [footprints, setFootprints] = useState([]);
  const { setSpotlightEnabled, spotlightOverlay } = useSpotlight();

  const padChar = ' ';
  const originalText = "An embedded IoT programmer wiring up connected devices and the firmware that keeps them quietly talking.";
  const replacementText = "A counselling detective for love, loss, doubt, and the stories that people cannot bring themselves to close.";
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

  const originalCaseNote = "Most days that means soldered boards, stubborn sensors, and the one bug that only ever shows up at 3am.";
  const replacementCaseNote = "Off duty, avoiding drama, solving only the cases that arrive with snacks and a quiet place to nap.";
  const caseNoteMaxLen = Math.max(originalCaseNote.length, replacementCaseNote.length);
  const originalCaseNotePadded = originalCaseNote + padChar.repeat(caseNoteMaxLen - originalCaseNote.length);
  const replacementCaseNotePadded = replacementCaseNote + padChar.repeat(caseNoteMaxLen - replacementCaseNote.length);

  useEffect(() => {
    setDisplayText(visibleScrambleText(originalTextPadded));
    setDisplayTitle(visibleScrambleText(originalTitlePadded));
    setDisplayPronunciation(visibleScrambleText(originalPronPadded));
    setDisplayCaseNote(visibleScrambleText(originalCaseNotePadded));

    // Generate footprints only on the client to avoid hydration mismatch.
    const generatedFootprints = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      rotation: Math.random() * 360,
      size: Math.random() * 60 + 80,
    }));
    setFootprints(generatedFootprints);
  }, [originalCaseNotePadded, originalPronPadded, originalTextPadded, originalTitlePadded]);

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
    <section className="relative w-full min-h-[100dvh] flex items-center justify-center px-4 pt-0 pb-10 lg:px-10 lg:pt-4 lg:pb-8 overflow-visible">
      {spotlightOverlay}
      <div className={`absolute inset-[-80px] pointer-events-none transition-opacity duration-500 z-0 ${isHoveringPortrait ? 'opacity-25' : 'opacity-0'}`}>
        {footprints.map(fp => (
          <div key={fp.id} style={{
            position: 'absolute',
            top: `${fp.top}%`,
            left: `${fp.left}%`,
            transform: `rotate(${fp.rotation}deg)`,
            color: 'var(--theme)'
          }}>
            <Footprints size={fp.size} />
          </div>
        ))}
      </div>

      <style jsx global>{`
        .about-noir {
          position: relative;
          width: min(1040px, calc(100vw - 32px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-areas:
            "masthead"
            "visual"
            "copy"
            "social";
          align-items: start;
          gap: 14px;
          color: #f7f5ef;
          background-image:
            repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 28px),
            linear-gradient(135deg, rgba(0,0,0,0.94), rgba(0,0,0,0.68));
          border-top: 1px solid color-mix(in srgb, var(--theme) 54%, transparent);
          border-bottom: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 24px 70px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.08);
          padding: 12px 14px 18px;
          overflow: hidden;
        }
        .about-noir::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(90deg, transparent 0, transparent 42%, color-mix(in srgb, var(--theme) 36%, transparent) 42%, transparent 43%),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 9px);
          opacity: 0.38;
          z-index: 0;
        }
        .about-noir::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          pointer-events: none;
          background: linear-gradient(90deg, var(--theme), #fff, transparent);
          opacity: 0.72;
          z-index: 1;
        }

        .noir-visual,
        .noir-copy,
        .social-tiles {
          position: relative;
          z-index: 2;
        }

        .noir-visual {
          grid-area: visual;
          min-width: 0;
        }

        .noir-portrait {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #000;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 44px rgba(0,0,0,0.72);
          transition: transform 0.45s ease, border-color 0.45s ease;
        }
        .noir-portrait:hover {
          transform: translateY(-3px);
          border-color: color-mix(in srgb, var(--theme) 66%, #fff);
        }
        .noir-portrait img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(0.58) contrast(1.12) brightness(0.98);
          transition: filter 0.6s ease;
        }
        .noir-portrait:hover img {
          filter: grayscale(1) contrast(1.18) brightness(0.82);
        }
        .noir-portrait::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, transparent 46%, rgba(0,0,0,0.72)),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.055) 0 1px, transparent 1px 7px);
          mix-blend-mode: screen;
          opacity: 0.45;
        }
        .noir-copy {
          grid-area: copy;
          min-width: 0;
        }

        .noir-name {
          font-family: var(--font-display);
          font-size: 2.15rem;
          font-weight: 900;
          line-height: 1.08;
          height: 1.16em;
          color: #fff;
          margin: 0 0 8px;
          white-space: nowrap;
          overflow: hidden;
          cursor: default;
          text-shadow: 0 0 22px rgba(243,208,152,0.16);
          transition: color 0.25s ease, text-shadow 0.25s ease;
        }
        .noir-name:hover {
          color: var(--theme);
          text-shadow: 0 0 28px rgba(243,208,152,0.32);
        }

        .noir-pron {
          display: block;
          text-transform: lowercase;
          width: 100%;
          margin-bottom: 10px;
          color: var(--theme);
          font-family: var(--font-mono);
          font-size: 0.62rem;
          line-height: 1.25;
          height: 1.25em;
          font-style: italic;
          letter-spacing: 0.4px;
          white-space: nowrap;
          overflow: hidden;
          cursor: default;
        }

        .noir-desc {
          font-family: var(--font-mono);
          text-transform: lowercase;
          color: rgba(255,255,255,0.82);
          font-size: 0.78rem;
          line-height: 1.38;
          height: calc(1.38em * 3);
          overflow: hidden;
          margin: 0;
          cursor: default;
          transition: color 0.25s ease;
        }
        .noir-desc:hover { color: #fff; }

        .noir-note {
          margin: 6px 0 0;
          display: grid;
          min-width: 0;
        }
        .noir-note > * {
          grid-area: 1 / 1;
          margin: 0;
          min-width: 0;
          text-transform: lowercase;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          line-height: 1.38;
          color: rgba(255,255,255,0.82);
        }
        .noir-note-ghost {
          visibility: hidden;
          pointer-events: none;
          user-select: none;
        }

        @media (max-width: 430px) {
          .about-noir {
            width: min(100%, calc(100vw - 20px));
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
            padding: 10px 10px 14px;
          }

          .noir-name {
            font-size: 1.75rem;
          }

          .noir-pron {
            font-size: 0.5rem;
          }

          .noir-desc {
            font-size: 0.68rem;
            line-height: 1.3;
            height: calc(1.3em * 4);
          }

          .noir-note {
            margin-top: 4px;
          }
          .noir-note > * {
            font-size: 0.68rem;
            line-height: 1.3;
          }
        }

        @media (min-width: 768px) {
          .about-noir {
            grid-template-columns: minmax(220px, 0.72fr) minmax(0, 1.28fr);
            grid-template-areas:
              "visual masthead"
              "visual copy"
              "social social";
            align-items: stretch;
            gap: 18px 34px;
            padding: 20px 28px 28px;
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
            font-size: 3.6rem;
            margin-bottom: 10px;
          }

          .noir-pron {
            font-size: 0.78rem;
            margin-bottom: 16px;
          }

          .noir-desc {
            font-size: 1rem;
            line-height: 1.52;
            height: calc(1.52em * 2);
          }

          .noir-note {
            margin-top: 8px;
          }
          .noir-note > * {
            font-size: 1rem;
            line-height: 1.52;
          }
        }

        @media (min-width: 1024px) {
          .about-noir {
            width: min(1080px, calc(100vw - 120px));
            grid-template-columns: minmax(280px, 0.74fr) minmax(0, 1.26fr);
            gap: 22px 52px;
            padding: 24px 38px 34px;
          }

          .noir-name {
            font-size: 5rem;
          }

          .noir-desc {
            max-width: 680px;
          }

          .noir-note {
            max-width: 680px;
          }
        }
      `}</style>

      <div
        className="about-noir relative z-10"
        onMouseEnter={() => setSpotlightEnabled(true)}
        onMouseLeave={() => setSpotlightEnabled(false)}
      >
        <MusicHeader />

        <div className="noir-visual">
          <Link href="/noirboard" style={{ display: 'contents' }}>
            <div
              className="noir-portrait"
              onMouseEnter={() => setIsHoveringPortrait(true)}
              onMouseLeave={() => setIsHoveringPortrait(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ope-new.png" alt="Ope" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </Link>
        </div>

        <div className="noir-copy">
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

          <p
            className="noir-desc"
            onMouseEnter={() => scrambleText(originalTextPadded, replacementTextPadded, setDisplayText)}
            onMouseLeave={() => scrambleText(replacementTextPadded, originalTextPadded, setDisplayText)}
          >
            {displayText}
          </p>

          <div
            className="noir-note"
            onMouseEnter={() => scrambleText(originalCaseNotePadded, replacementCaseNotePadded, setDisplayCaseNote)}
            onMouseLeave={() => scrambleText(replacementCaseNotePadded, originalCaseNotePadded, setDisplayCaseNote)}
          >
            <span className="noir-note-ghost" aria-hidden="true">{originalCaseNote}</span>
            <span className="noir-note-ghost" aria-hidden="true">{replacementCaseNote}</span>
            <span className="noir-note-text">{displayCaseNote}</span>
          </div>
        </div>

        <SocialTiles />
      </div>
    </section>
  );
}
