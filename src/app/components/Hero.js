"use client";
import { useState, useEffect, useRef } from 'react';

export default function Hero({ isStoryOpen }) {
  const [displayText, setDisplayText] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayPronunciation, setDisplayPronunciation] = useState("");

  const padChar = ' ';
  const originalText = "A counselling detective who helps people make sense of their stories, whether they are struggling with love, confusion, loss, or a mystery that refuses to rest.";
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
  }, []);

  const scrambleText = (original, target, setDisplay, duration = 200) => {
    const chars = "itfrliclfr";
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
    <section className="relative w-full h-full flex items-center justify-center pt-16 pb-12 lg:pt-24 lg:pb-20">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap');
        .font-fredericka { font-family: 'Fredericka the Great', cursive; }
        
        .detective-card {
          background: transparent;
          backdrop-filter: none;
          border: none;
          border-radius: 16px;
          padding: 12px; /* Giảm padding trên Mobile/iPad */
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 95%;
          max-width: 1100px;
          transition: all 0.5s ease;
        }

        @media (min-width: 1024px) {
          .detective-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 25px; /* Giảm padding trên Desktop từ 40px xuống 25px */
            flex-direction: row;
            align-items: center;
            gap: 40px;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4);
          }
        }

        .polaroid-container {
          position: relative;
          padding: 10px;
          border: 10px solid #f5f5dc;
          border-bottom-width: 55px;
          background: #ffffff;
          transition: all 0.7s cubic-bezier(0.23, 1, 0.32, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
          flex-shrink: 0;
          width: 280px; /* Mobile */
        }

        @media (min-width: 768px) {
          .polaroid-container { width: min(500px, 85vw); } /* iPad: Dãn rộng tối đa */
        }
        @media (min-width: 1024px) {
          .polaroid-container { width: 380px; padding: 15px; } /* Laptop: Thu lại để cân đối 40/60 */
        }

        .polaroid-container:hover {
          border-color: transparent;
          background: transparent;
          box-shadow: none;
          transform: scale(1.03) rotate(-1deg);
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
          bottom: -42px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Courier New', monospace;
          font-weight: 900;
          color: #1a1a1a;
          font-size: clamp(12px, 2vw, 15px);
          letter-spacing: 1px;
          white-space: nowrap;
          transition: opacity 0.4s ease;
        }

        .polaroid-container:hover .polaroid-label {
          opacity: 0;
        }
      `}</style>

      {/* Detective Dossier Card */}
      <div className="w-full flex justify-center">
        <div className="detective-card">
          
          {/* Left side: Polaroid (Square) */}
          <div className="w-full lg:w-[40%] flex justify-center items-center">
            <div className="polaroid-container">
              <div className="image-wrapper">
                <img
                  src="/ope.png"
                  alt="Ope"
                  style={{
                    filter: 'brightness(0.7) contrast(1.1) saturate(0.8)'
                  }}
                />
              </div>
              <span className="polaroid-label">#SUBJECT-0910</span>
            </div>
          </div>

          {/* Right side: Text Intro */}
          {!isStoryOpen && (
            <div className="w-full lg:w-[60%] intro-text-content font-fredericka mt-8 lg:mt-0">
              <h2
                className="text-3xl md:text-5xl lg:text-7xl xl:text-8xl text-[var(--colorone)] font-bold mb-3 hover:bg-gradient-to-r hover:from-white hover:to-[var(--colorone)] hover:text-transparent hover:bg-clip-text transition-all duration-300 cursor-default text-center lg:text-left whitespace-pre-wrap"
                onMouseEnter={() => scrambleText(originalTitlePadded, replacementTitlePadded, setDisplayTitle)}
                onMouseLeave={() => scrambleText(replacementTitlePadded, originalTitlePadded, setDisplayTitle)}
              >
                {displayTitle}
              </h2>
              
              <div className="mb-4 text-center lg:text-left">
                <span
                  className="text-sm md:text-xl lg:text-2xl xl:text-3xl text-[var(--colorone)] italic hover:bg-gradient-to-r hover:from-white hover:to-[var(--colorone)] hover:text-transparent hover:bg-clip-text transition-all duration-300 cursor-default whitespace-pre-wrap"
                  onMouseEnter={() => scrambleText(originalPronPadded, replacementPronPadded, setDisplayPronunciation)}
                  onMouseLeave={() => scrambleText(replacementPronPadded, originalPronPadded, setDisplayPronunciation)}
                >
                  {displayPronunciation}
                </span>
              </div>

              <div
                className="text-xs md:text-base lg:text-xl xl:text-2xl leading-relaxed text-[var(--colorone)] hover:bg-gradient-to-r hover:from-white hover:to-[var(--colorone)] hover:text-transparent hover:bg-clip-text transition-all duration-300 cursor-default lg:text-left max-w-[85vw] md:max-w-[70vw] lg:max-w-none mx-auto lg:mx-0 whitespace-pre-wrap"
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
