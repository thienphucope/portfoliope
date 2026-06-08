import { useState, useCallback, useRef } from 'react';


export function useAI() {
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [liveToolCalls, setLiveToolCalls] = useState([]);

  const abortControllerRef = useRef(null);
  const streamTimerRef = useRef(null);
  const liveToolCallsRef = useRef([]);

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

  const requestAI = useCallback(async (query, history = [], username = 'User', systemInstruction, provider) => {
    stopAI();

    setIsThinking(true);
    setStreamingText('');
    setLiveToolCalls([]);
    liveToolCallsRef.current = [];

    abortControllerRef.current = new AbortController();

    let completed = false;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai', query, history, username, systemInstruction, provider }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error('AI request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accText = '';
      let streamingStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === 'tool_call') {
            const tc = { name: event.name, args: event.args };
            liveToolCallsRef.current = [...liveToolCallsRef.current, tc];
            setLiveToolCalls([...liveToolCallsRef.current]);
          } else if (event.type === 'text_delta') {
            if (!streamingStarted) {
              streamingStarted = true;
              setIsThinking(false);
              setIsStreaming(true);
            }
            accText += event.text;
            setStreamingText(prev => prev + event.text);
          } else if (event.type === 'done') {
            completed = true;
            return { text: accText || event.response || '', toolCalls: liveToolCallsRef.current };
          } else if (event.type === 'error') {
            throw new Error(event.error);
          }
        }
      }

      completed = true;
      return { text: accText, toolCalls: liveToolCallsRef.current };
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Aborted');
      throw err;
    } finally {
      setIsThinking(false);
      if (!completed) setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [stopAI]);

  const streamResponse = useCallback((fullText, onComplete) => {
    setIsStreaming(false);
    setStreamingText('');
    if (onComplete) onComplete(fullText);
  }, []);

  return {
    isThinking,
    setIsThinking,
    isStreaming,
    setIsStreaming,
    streamingText,
    setStreamingText,
    liveToolCalls,
    requestAI,
    streamResponse,
    stopAI
  };
}
