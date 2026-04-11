import { useState, useRef, useCallback, useEffect } from 'react';

export function useReader() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
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

  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    if (!isPlaying) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, stop]);

  const readChunk = useCallback(async (text, voice, immediate = true) => {
    if (!text) return true;

    let cleanText = text.trim();
    if (!cleanText || /^http|www\.|^\//i.test(cleanText)) return true;

    accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + cleanText).trim();
    setCurrentText(accumulatedTextRef.current);
    setIsPlaying(true);
    setIsPaused(false);

    const endsWithTerminator = /[.!?。！？]$/.test(cleanText);
    if (!immediate && !endsWithTerminator) {
      await new Promise(r => setTimeout(r, 50));
      return true;
    }

    const rawText = accumulatedTextRef.current;
    accumulatedTextRef.current = '';

    const textToRead = rawText
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
      .trim();

    if (!textToRead || !/[a-zA-Z\u4e00-\u9fa5\u1EA0-\u1EF9]/.test(textToRead)) return true;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const isChinese = /[\u4e00-\u9fa5]/.test(textToRead);
    const isVietnamese = /[\u1EA0-\u1EF9\u0110\u0111\u00C0-\u00FF]/.test(textToRead);
    const hasLetters = /[a-zA-Z]/.test(textToRead);

    let lang = lastLangRef.current;
    if (isChinese) lang = 'zh';
    else if (isVietnamese) lang = 'vi';
    else if (hasLetters) lang = 'en';
    lastLangRef.current = lang;

    try {
      const chunks = lang === 'vi' && textToRead.length > 200 
        ? textToRead.match(/.{1,200}(?=\s|$)|.{1,200}/g) || [textToRead]
        : [textToRead];

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
        
        // Luôn áp dụng playbackRate mới nhất trước khi phát
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
    } catch (e) {
      if (e.name === 'AbortError') return false;
      console.error('[Reader] TTS Catch:', e);
      setIsPlaying(false);
      return false;
    }
  }, []); // Remove dependency on playbackRate to avoid recreation

  return { 
    readChunk, stop, pause, resume, setSpeed,
    isPlaying, isPaused, playbackRate, currentText 
  };
}