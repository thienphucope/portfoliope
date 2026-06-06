// src/features/caseArchive/components/SpritzOverlay.js
"use client";
import { useState, useEffect } from 'react';

// Full-screen RSVP ("Spritz") reader: flashes one word at a time, shown only
// while the reader is playing at 4x speed.
const SpritzOverlay = ({ text, isPlaying, isPaused, playbackRate }) => {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!text) return;
    const w = text.split(/\s+/).filter(Boolean);
    setWords(w);
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (!isPlaying || isPaused || playbackRate !== 4.0 || index >= words.length) return;
    const word = words[index] || "";
    const baseDuration = 110;
    const extra = (word.length > 8 ? 40 : 0) + (/[.,!?;]/.test(word) ? 60 : 0);
    const timer = setTimeout(() => { setIndex(i => i + 1); }, baseDuration + extra);
    return () => clearTimeout(timer);
  }, [index, words, isPlaying, isPaused, playbackRate]);

  if (playbackRate !== 4.0 || !isPlaying || words.length === 0) return null;

  return (
    <div className="spritz-overlay" style={{ position: 'fixed', inset: 0, background: 'var(--background, #000)', color: 'var(--theme, #FFFACD)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, userSelect: 'none' }}>
      <div className="spritz-word" style={{ fontSize: '6vw', fontWeight: '400', fontFamily: 'var(--font-mono)', textAlign: 'center', letterSpacing: '-0.02em', textTransform: 'lowercase' }}>
        {words[index] || words[words.length - 1]}
      </div>
    </div>
  );
};

export default SpritzOverlay;
