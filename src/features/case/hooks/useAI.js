import { useState, useCallback } from 'react';

/**
 * Hook for client-side AI request and streaming response.
 * Interacts with /api/cases which uses src/services/ai.js.
 */
export function useAI() {
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const requestAI = useCallback(async (query, history = [], username = 'User') => {
    setIsThinking(true);
    setStreamingText('');
    
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'ai', 
          query, 
          history, 
          username 
        }),
      });

      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json();
      return data.response || '';
    } finally {
      setIsThinking(false);
    }
  }, []);

  const streamResponse = useCallback((fullText, onComplete) => {
    setIsStreaming(true);
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setStreamingText(fullText.slice(0, ++i));
      } else {
        clearInterval(timer);
        setIsStreaming(false);
        if (onComplete) onComplete(fullText);
      }
    }, 5);
    return () => clearInterval(timer);
  }, []);

  return {
    isThinking,
    setIsThinking,
    isStreaming,
    setIsStreaming,
    streamingText,
    setStreamingText,
    requestAI,
    streamResponse
  };
}
