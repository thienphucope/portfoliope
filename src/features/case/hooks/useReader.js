import { useState, useRef, useCallback, useEffect } from 'react';

export function useReader() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const audioRef = useRef(null);
  const accumulatedTextRef = useRef('');

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    accumulatedTextRef.current = '';
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

  const readChunk = useCallback(async (text, voice = 'en-GB-SoniaNeural') => {
    if (!text) return true;
    
    let cleanText = text.trim();
    if (!cleanText || /^http|www\.|^\//i.test(cleanText)) return true;

    accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + cleanText).trim();
    setCurrentText(accumulatedTextRef.current);
    setIsPlaying(true);

    const endsWithTerminator = /[.!?。！？]$/.test(cleanText);
    if (!endsWithTerminator) {
      await new Promise(r => setTimeout(r, 50));
      return true;
    }

    const textToRead = accumulatedTextRef.current;
    accumulatedTextRef.current = '';

    // Language Detection
    let selectedVoice = voice;
    const isChinese = /[\u4e00-\u9fa5]/.test(textToRead);
    // Robust Vietnamese regex covering all accented characters
    const isVietnamese = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(textToRead);

    if (isChinese) {
      selectedVoice = 'zh-CN-XiaoxiaoNeural';
    } else if (isVietnamese) {
      // Trying HoaiMyNeural - ensuring the string is exact
      selectedVoice = 'vi-VN-HoaiMyNeural';
    }

    console.log(`[Reader] Voice: ${selectedVoice} | Text: ${textToRead.slice(0, 30)}...`);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToRead, voice: selectedVoice }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'TTS failed');
      }
      
      const blob = await response.blob();
      if (blob.size < 100) throw new Error('Invalid audio blob');
      
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = url;

      return new Promise((resolve) => {
        const handleEnded = () => {
          URL.revokeObjectURL(url);
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.removeEventListener('error', handleError);
          resolve(true);
        };
        const handleError = (e) => {
          console.error('[Reader] Audio Error:', e);
          URL.revokeObjectURL(url);
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.removeEventListener('error', handleError);
          resolve(false);
        };

        audioRef.current.addEventListener('ended', handleEnded);
        audioRef.current.addEventListener('error', handleError);
        
        audioRef.current.play().catch(err => {
          console.error('[Reader] Playback failed:', err);
          resolve(false);
        });
      });
    } catch (e) {
      console.error('[Reader] TTS Catch:', e);
      setIsPlaying(false);
      return false;
    }
  }, []);

  return { readChunk, stop, isPlaying, currentText };
}
