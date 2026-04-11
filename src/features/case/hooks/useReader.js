import { useState, useRef, useCallback, useEffect } from 'react';

export function useReader() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const audioRef = useRef(null);
  const accumulatedTextRef = useRef('');
  const abortControllerRef = useRef(null);
  const lastLangRef = useRef('en');

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
    setCurrentText('');
  }, []);

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

    const endsWithTerminator = /[.!?。！？]$/.test(cleanText);
    if (!immediate && !endsWithTerminator) {
      await new Promise(r => setTimeout(r, 50));
      return true;
    }

    const rawText = accumulatedTextRef.current;
    accumulatedTextRef.current = '';

    // Strip emoji và ký tự không đọc được
    const textToRead = rawText
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')  // emoji
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')  // misc emoji
      .replace(/[\u{2600}-\u{27BF}]/gu, '')    // symbols
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')  // supplemental symbols
      .replace(/[\u{1FA00}-\u{1FAFF}]/gu, '')  // chess, tools...
      .replace(/[&<>'"]/g, '')                  // XML/HTML special chars
      .replace(/[#@$%^*+=|\\{}[\]~`]/g, '')    // misc punctuation
      .replace(/[\u200B-\u200F\uFEFF\u00AD]/g, '')  // zero-width, soft hyphen, BOM
      .replace(/[\u2000-\u206F]/g, ' ')             // unicode spaces & formatting chars
      .replace(/[^\S\r\n]+/g, ' ')             // normalize spaces
      .trim();

    // Nếu chỉ còn dấu câu hoặc số, hoặc quá ngắn, bỏ qua không gọi API
    if (!textToRead || !/[a-zA-Z\u4e00-\u9fa5\u1EA0-\u1EF9]/.test(textToRead)) return true;

    // Create a new AbortController for this request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Language Detection
    const isChinese = /[\u4e00-\u9fa5]/.test(textToRead);
    const isVietnamese = /[\u1EA0-\u1EF9\u0110\u0111\u00C0-\u00FF]/.test(textToRead);
    const hasLetters = /[a-zA-Z]/.test(textToRead);

    let lang = lastLangRef.current;

    if (isChinese) {
      lang = 'zh';
    } else if (isVietnamese) {
      lang = 'vi';
    } else if (hasLetters) {
      lang = 'en';
    }
    // If only numbers/symbols, keep lastLangRef.current

    lastLangRef.current = lang;

    try {
      // Google TTS (vi) has a ~200 char limit.
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

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'TTS failed');
        }

        const blob = await response.blob();
        if (signal.aborted) return false;
        if (blob.size < 100) throw new Error('Invalid audio blob');

        const url = URL.createObjectURL(blob);

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        audioRef.current.src = url;

        await new Promise((resolve) => {
          const cleanup = () => {
            if (audioRef.current) {
              audioRef.current.removeEventListener('ended', handleEnded);
              audioRef.current.removeEventListener('error', handleError);
            }
            signal.removeEventListener('abort', handleAbort);
            URL.revokeObjectURL(url);
          };

          const handleEnded = () => {
            cleanup();
            resolve(true);
          };
          const handleError = (e) => {
            console.error('[Reader] Audio Error:', e);
            cleanup();
            resolve(false);
          };
          const handleAbort = () => {
            cleanup();
            resolve(false);
          };

          signal.addEventListener('abort', handleAbort);
          audioRef.current.addEventListener('ended', handleEnded);
          audioRef.current.addEventListener('error', handleError);

          audioRef.current.play().catch(err => {
            if (err.name !== 'AbortError' && !signal.aborted) {
              console.error('[Reader] Playback failed:', err);
            }
            if (!signal.aborted) {
              cleanup();
              resolve(false);
            }
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
  }, []);

  return { readChunk, stop, isPlaying, currentText };
}