import { useState, useRef, useCallback, useEffect } from 'react';
import cefrDict from '../utils/cefr_dict.json';

const CEFR_LEVELS = ['none', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

export function useReader() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cefrLevel, setCefrLevel] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sonia_cefr') || 'none';
    }
    return 'none';
  });
  
  // Load speed từ sessionStorage để persistent
  const [playbackRate, setPlaybackRate] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseFloat(sessionStorage.getItem('sonia_speed') || '1.0');
    }
    return 1.0;
  });
  
  const audioRef = useRef(null);
  const accumulatedTextRef = useRef('');
  const abortControllerRef = useRef(null);
  const lastLangRef = useRef('en');
  const resolvePlaybackRef = useRef(null);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    accumulatedTextRef.current = '';
    lastLangRef.current = 'en';
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentText('');
    if (resolvePlaybackRef.current) {
      resolvePlaybackRef.current(false);
      resolvePlaybackRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying && !isPaused) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  const resume = useCallback(() => {
    if (audioRef.current && isPlaying && isPaused) {
      audioRef.current.play().catch(console.error);
      setIsPaused(false);
    }
  }, [isPlaying, isPaused]);

  const setSpeed = useCallback((rate) => {
    setPlaybackRate(rate);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sonia_speed', rate.toString());
    }
    // Áp dụng ngay lập tức cho audio đang phát
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const updateCefrLevel = useCallback((level) => {
    setCefrLevel(level);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sonia_cefr', level);
    }
  }, []);

  const [currentText, setCurrentText] = useState('');

  const cleanText = useCallback((text) => {
    return text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA00}-\u{1FAFF}]/gu, '')
      .replace(/[&<>'"]/g, '')
      .replace(/[#@$%^*+=|\\{}[\]~`]/g, '')
      .replace(/[\u200B-\u200F\uFEFF\u00AD]/g, '')
      .replace(/[\u2000-\u206F]/g, ' ')
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, stop]);

  const playText = useCallback(async (text, lang, signal) => {
    const cleaned = cleanText(text);
    if (!cleaned || !/[a-zA-Z\u4e00-\u9fa5\u1EA0-\u1EF9]/.test(cleaned)) return true;

    const chunks = lang === 'vi' && cleaned.length > 200 
      ? cleaned.match(/.{1,200}(?=\s|$)|.{1,200}/g) || [cleaned]
      : [cleaned];

    for (const chunk of chunks) {
      if (signal.aborted) return false;
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk, voice: lang }),
        signal,
      });

      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      if (signal.aborted) return false;
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      
      const currentRate = parseFloat(sessionStorage.getItem('sonia_speed') || '1.0');
      audioRef.current.playbackRate = currentRate;

      await new Promise((resolve) => {
        resolvePlaybackRef.current = resolve;
        const cleanup = () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('ended', handleEnded);
            audioRef.current.removeEventListener('error', handleError);
          }
          signal.removeEventListener('abort', handleAbort);
          URL.revokeObjectURL(url);
          resolvePlaybackRef.current = null;
        };

        const handleEnded = () => { cleanup(); resolve(true); };
        const handleError = (e) => { console.error('[Reader] Audio Error:', e); cleanup(); resolve(false); };
        const handleAbort = () => { cleanup(); resolve(false); };

        signal.addEventListener('abort', handleAbort);
        audioRef.current.addEventListener('ended', handleEnded);
        audioRef.current.addEventListener('error', handleError);

        audioRef.current.play().catch(err => {
          if (err.name !== 'AbortError' && !signal.aborted) console.error('[Reader] Playback failed:', err);
          if (!signal.aborted) { cleanup(); resolve(false); }
        });
      });
    }
    return true;
  }, [cleanText]);

  const readChunk = useCallback(async (text, voice, immediate = true) => {
    if (!text) return true;

    let chunkText = text.trim();
    if (!chunkText || /^http|www\.|^\//i.test(chunkText)) return true;

    accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + chunkText).trim();
    setCurrentText(accumulatedTextRef.current);
    setIsPlaying(true);
    setIsPaused(false);

    const endsWithTerminator = /[.!?。！？]$/.test(chunkText);
    if (!immediate && !endsWithTerminator) {
      await new Promise(r => setTimeout(r, 50));
      return true;
    }

    const rawText = accumulatedTextRef.current;
    accumulatedTextRef.current = '';

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const isChinese = /[\u4e00-\u9fa5]/.test(rawText);
    const isVietnamese = /[\u1EA0-\u1EF9\u0110\u0111\u00C0-\u00FF]/.test(rawText);
    const hasLetters = /[a-zA-Z]/.test(rawText);

    let lang = lastLangRef.current;
    if (isChinese) lang = 'zh';
    else if (isVietnamese) lang = 'vi';
    else if (hasLetters) lang = 'en';
    lastLangRef.current = lang;

    try {
      const success = await playText(rawText, lang, signal);
      if (!success || signal.aborted) return false;

      // English learning logic
      if (lang === 'en' && cefrLevel !== 'none') {
        const words = rawText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const uniqueWords = [...new Set(words)];
        const thresholdIndex = CEFR_LEVELS.indexOf(cefrLevel);
        
        const difficultWords = uniqueWords.filter(w => {
          const entry = cefrDict[w];
          if (!entry) return false;
          const wordLevelIndex = CEFR_LEVELS.indexOf(entry.level.toLowerCase());
          return wordLevelIndex > thresholdIndex;
        });

        if (difficultWords.length > 0) {
          await new Promise(r => setTimeout(r, 500)); // Short pause
          
          // Start message
          await playText("Vocabulary explanation starting.", 'en-male', signal);
          if (signal.aborted) return false;

          for (let index = 0; index < difficultWords.length; index++) {
            if (signal.aborted) return false;
            const word = difficultWords[index];
            const entry = cefrDict[word];
            const defs = entry.definitions && entry.definitions.length > 0 
              ? entry.definitions[0] 
              : null;
            
            if (defs) {
              // Word index message
              await playText(`Word number ${index + 1}.`, 'en-male', signal);
              if (signal.aborted) return false;

              // 1. Play Intro: Word, Level, Type
              const intro = `Word: ${word}. Level: ${entry.level}. Type: ${entry.pos || defs.pos}.`;
              const introSuccess = await playText(intro, 'en-male', signal);
              if (!introSuccess || signal.aborted) return false;

              // 2. Play Definition sentence by sentence to avoid long wait
              const sentences = defs.def.match(/[^.!?。！？]+[.!?。！？]?/g) || [defs.def];
              for (let i = 0; i < sentences.length; i++) {
                if (signal.aborted) return false;
                const prefix = i === 0 ? "Definition: " : "";
                const defPartSuccess = await playText(prefix + sentences[i].trim(), 'en-male', signal);
                if (!defPartSuccess) break;
              }

              if (signal.aborted) return false;
              await new Promise(r => setTimeout(r, 300));
            }
          }

          // End message
          await playText("Vocabulary explanation finished.", 'en-male', signal);
        }
      }

      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
      console.error('[Reader] TTS Catch:', e);
      setIsPlaying(false);
      return false;
    }
  }, [cefrLevel, playText]);

  return { 
    readChunk, stop, pause, resume, setSpeed, updateCefrLevel,
    isPlaying, isPaused, playbackRate, cefrLevel, currentText 
  };
}
