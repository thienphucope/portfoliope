import { useState, useCallback, useRef } from 'react';

export function useAI() {
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const abortControllerRef = useRef(null);
  const streamTimerRef = useRef(null);

  const stopAI = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setIsThinking(false);
    setIsStreaming(false);
  }, []);

  const requestAI = useCallback(async (query, history = [], username = 'User', systemInstruction) => {
    stopAI();

    setIsThinking(true);
    setStreamingText('');

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai',
          query,
          history,
          username,
          systemInstruction
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json();
      return data.response || '';
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Aborted');
      }
      throw err;
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setIsThinking(false);
        abortControllerRef.current = null;
      }
    }
  }, [stopAI]);

  const streamResponse = useCallback((fullText, onComplete) => {
    setIsStreaming(true);
    let i = 0;
    streamTimerRef.current = setInterval(() => {
      if (i < fullText.length) {
        setStreamingText(fullText.slice(0, ++i));
      } else {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
        setIsStreaming(false);
        if (onComplete) onComplete(fullText);
      }
    }, 5);
    return () => stopAI();
  }, [stopAI]);

  return {
    isThinking,
    setIsThinking,
    isStreaming,
    setIsStreaming,
    streamingText,
    setStreamingText,
    requestAI,
    streamResponse,
    stopAI
  };
}
