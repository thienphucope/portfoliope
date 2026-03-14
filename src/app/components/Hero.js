"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { Fingerprint, Footprints } from 'lucide-react';

export default function Hero({ isStoryOpen }) {
  const [displayText, setDisplayText] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayPronunciation, setDisplayPronunciation] = useState("");
  const [isHoveringPolaroid, setIsHoveringPolaroid] = useState(false);
  const [footprints, setFootprints] = useState([]);

  const padChar = ' ';
  const originalText = "A counselling detective who helps people make sense of their stories, whether they are struggling with love, loss, or a mystery.";
  const replacementText = "An unmotivated sloth in human form, dedicated to avoiding effort, solving nothing, and uninterested in anything beyond the nearest snack or nap.";
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
    setDisplayText(originalTextPadded);
    setDisplayTitle(originalTitlePadded);
    setDisplayPronunciation(originalPronPadded);
    
    // Generate footprints only on the client to avoid hydration mismatch
    const generatedFootprints = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      rotation: Math.random() * 360,
      size: Math.random() * 60 + 80, // 80px to 140px
    }));
    setFootprints(generatedFootprints);
  }, []);

  const scrambleText = (original, target, setDisplay, duration = 200) => {
    const chars = "itfoiwwlfr";
    let seed = 1234;
    const m = 2147483647;
    const a = 1103515245;
    const c = 12345;
    const pseudoRandom = () => { seed = (a * seed + c) % m; return seed / m; };
    let startTime = null;
    let frame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      if (progressRatio < 0.7) {
        const scrambled = original.split("").map((char) => (char === " " || char === padChar) ? char : chars[Math.floor(pseudoRandom() * chars.length)]).join("");
        setDisplay(scrambled);
        frame = requestAnimationFrame(animate);
      } else {
        const blendRatio = (progressRatio - 0.7) / 0.3;
        const currentText = original.split("").map((char, i) => (char === " " || char === padChar) ? char : (blendRatio < pseudoRandom() ? char : target[i] || char)).join("");
        setDisplay(currentText);
        if (progressRatio < 1) frame = requestAnimationFrame(animate);
        else setDisplay(target);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  };

  return (
    <section className="relative w-full h-full flex items-center justify-center pt-0 pb-32 lg:pt-24 lg:pb-20 overflow-visible">
      {/* Footprints background on hover */}
      <div className={`absolute inset-[-100px] pointer-events-none transition-opacity duration-500 z-0 ${isHoveringPolaroid ? 'opacity-30' : 'opacity-0'}`}>
        {footprints.map(fp => (
          <div key={fp.id} style={{
            position: 'absolute',
            top: `${fp.top}%`,
            left: `${fp.left}%`,
            transform: `rotate(${fp.rotation}deg)`,
            color: 'var(--colorone)'
          }}>
            <Footprints size={fp.size} />
          </div>
        ))}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap');
        .font-fredericka { font-family: 'Fredericka the Great', cursive; }
        
        .detective-card {
          background: transparent;
          backdrop-filter: none;
          border: none;
          border-radius: 0; 
          padding: 0; 
          display: flex;
          flex-direction: column;
          align-items: center;
          width: fit-content;
          max-width: 98%;
          transition: all 0.5s ease;
          box-shadow: none;
          overflow: hidden;
        }

        @media (min-width: 1024px) {
          .detective-card {
            background: transparent;
            backdrop-filter: none;
            border: none;
            flex-direction: row;
            align-items: center;
            box-shadow: none;
          }
        }

        .polaroid-container {
          position: relative;
          padding: 0 !important;
          border: 8px solid var(--colorone);
          border-bottom-width: 45px;
          background: transparent;
          transition: all 0.7s cubic-bezier(0.23, 1, 0.32, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
          flex-shrink: 0;
          width: 240px; /* Mobile - Smaller */
        }

        @media (min-width: 768px) {
          .polaroid-container { width: 320px; }
        }
        @media (min-width: 1024px) {
          .polaroid-container { width: 300px; }
        }

        .polaroid-container:hover {
          background: transparent;
          border-color: transparent;
          box-shadow: none;
          transform: scale(1.02) rotate(-1deg);
        }

        .image-wrapper {
          width: 100%;
          aspect-ratio: 1/1;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          background: transparent;
        }

        .image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: filter 0.6s ease;
        }

        .polaroid-container:hover img {
          filter: brightness(1.1) contrast(1.1) saturate(1.1) !important;
        }

        .polaroid-label {
          position: absolute;
          bottom: -40px; 
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Courier New', monospace;
          font-weight: 900;
          color: #ffffff; 
          font-size: clamp(12px, 2vw, 15px);
          letter-spacing: 1px;
          white-space: nowrap;
          transition: opacity 0.4s ease;
          z-index: 10;
        }

        .polaroid-container:hover .polaroid-label {
          opacity: 1;
        }
      `}</style>

      {/* Detective Dossier Card */}
      <div className="flex justify-center relative z-10 w-fit">
        <div className="detective-card">
          
          {/* Left side: Polaroid (Square) */}
          <div className="flex justify-center items-center">
            <div 
              className="polaroid-container use-custom-cursor"
              onMouseEnter={() => setIsHoveringPolaroid(true)}
              onMouseLeave={() => setIsHoveringPolaroid(false)}
            >
              <div className="image-wrapper">
                <img
                  src="/ope.png"
                  alt="Ope"
                  style={{
                    filter: 'brightness(0.7) contrast(1.1) saturate(0.8)'
                  }}
                />
              </div>
              <span className="polaroid-label">#SUBJECT-510</span>
            </div>
          </div>

          {/* Right side: Text Intro */}
          {!isStoryOpen && (
            <div className="intro-text-content font-fredericka p-8 lg:p-12 lg:pl-10 max-w-2xl relative">
              {/* Fingerprint in top right of the text content */}
              <div className="absolute top-0 right-0 text-[var(--colorone)] rotate-[-45deg] opacity-60 pointer-events-none p-4">
                <Fingerprint className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32" />
              </div>
              <h2
                className="text-3xl md:text-5xl lg:text-7xl xl:text-7xl text-[var(--colorone)] font-bold mb-3 hover:bg-gradient-to-r hover:from-white hover:to-[var(--colorone)] hover:text-transparent hover:bg-clip-text transition-all duration-300 cursor-default text-center lg:text-left whitespace-pre-wrap"
                onMouseEnter={() => scrambleText(originalTitlePadded, replacementTitlePadded, setDisplayTitle)}
                onMouseLeave={() => scrambleText(replacementTitlePadded, originalTitlePadded, setDisplayTitle)}
              >
                {displayTitle}
              </h2>
              
              <div className="mb-4 text-center lg:text-left">
                <span
                  className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-[var(--colorone)] italic hover:bg-gradient-to-r hover:from-white hover:to-[var(--colorone)] hover:text-transparent hover:bg-clip-text transition-all duration-300 cursor-default whitespace-pre-wrap"
                  onMouseEnter={() => scrambleText(originalPronPadded, replacementPronPadded, setDisplayPronunciation)}
                  onMouseLeave={() => scrambleText(replacementPronPadded, originalPronPadded, setDisplayPronunciation)}
                >
                  {displayPronunciation}
                </span>
              </div>

              <div
                className="text-sm md:text-base lg:text-xl xl:text-2xl leading-relaxed text-[var(--colorone)] hover:bg-gradient-to-r hover:from-white hover:to-[var(--colorone)] hover:text-transparent hover:bg-clip-text transition-all duration-300 cursor-default lg:text-left whitespace-pre-wrap"
                onMouseEnter={() => scrambleText(originalTextPadded, replacementTextPadded, setDisplayText)}
                onMouseLeave={() => scrambleText(replacementTextPadded, originalTextPadded, setDisplayText)}
              >
                {displayText}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
