import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for Speech-to-Text using Browser Web Speech API.
 */
export function useSTT({ onResult }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (e) => {
        const transcript = e.results[e.results.length - 1][0].transcript;
        if (onResult) onResult(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    recognitionRef.current?.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return {
    isListening,
    startListening,
    stopListening
  };
}
