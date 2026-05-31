import { useState, useRef, useCallback } from 'react';

export function useTTS() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ttsReady, setTtsReady] = useState(true);

  const isPlayingRef = useRef(false);
  const audioContextRef = useRef(null);
  const activeSourcesRef = useRef([]);

  const detectLanguage = () => 'en';

  const stopAudio = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlayingAudio(false);

    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'running') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    activeSourcesRef.current = [];

    return fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'interrupt' })
    }).catch(() => {});
  }, []);

  const streamAudioLive = useCallback(async (text) => {
    if (!text || !ttsReady) return;
    if (isPlayingRef.current || activeSourcesRef.current.length > 0) {
      await stopAudio();
    }
    const rawText = text.trim();
    if (!rawText) return;
    const lang = detectLanguage(rawText);

    setIsPlayingAudio(true);
    isPlayingRef.current = true;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 32000 });
    }
    const audioCtx = audioContextRef.current;

    try {
      let nextTime = audioCtx.currentTime + 0.3;

      if (!isPlayingRef.current || audioContextRef.current !== audioCtx) return;

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stream', text: rawText, voice: lang, speed: 1.0 }),
        cache: 'no-store'
      });

      if (!res.ok) throw new Error("Failed to start TTS stream");

      const reader = res.body.getReader();
      let leftover = new Uint8Array(0);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!isPlayingRef.current || audioContextRef.current !== audioCtx) break;

        let combined = new Uint8Array(leftover.length + value.length);
        combined.set(leftover);
        combined.set(value, leftover.length);

        let useLength = combined.length;
        if (useLength % 2 !== 0) {
          leftover = combined.slice(useLength - 1);
          useLength -= 1;
        } else {
          leftover = new Uint8Array(0);
        }

        if (useLength === 0) continue;

        const pcm16 = new Int16Array(combined.buffer, combined.byteOffset, useLength / 2);
        if (pcm16.length === 0) continue;

        const audioBuffer = audioCtx.createBuffer(1, pcm16.length, 32000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < pcm16.length; i++) {
          channelData[i] = pcm16[i] / 32768.0;
        }

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);

        if (audioCtx.currentTime > nextTime) {
          nextTime = audioCtx.currentTime + 0.2;
        }

        source.start(nextTime);
        nextTime += audioBuffer.duration;
        activeSourcesRef.current.push(source);

        source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        };
      }

      const timeToWait = Math.max(0, nextTime - audioCtx.currentTime);
      setTimeout(() => {
        if (audioContextRef.current === audioCtx) {
          setIsPlayingAudio(false);
          isPlayingRef.current = false;
        }
      }, timeToWait * 1000);

    } catch (e) {
      setIsPlayingAudio(false);
      isPlayingRef.current = false;
      console.error('Streaming TTS Error:', e);
    }
  }, [ttsReady, stopAudio]);

  const generateAudio = useCallback(async (text, { provider = 'modal', voice = 'en', signal } = {}) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', text, provider, voice }),
      signal
    });
    if (!res.ok) throw new Error('TTS failed');
    return res.blob();
  }, []);

  const checkTtsHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/tts?action=ping');
      if (res.ok) setTtsReady(true);
      else setTimeout(checkTtsHealth, 10000);
    } catch {
      setTimeout(checkTtsHealth, 10000);
    }
  }, []);

  return {
    isPlayingAudio,
    ttsReady,
    streamAudioLive,
    generateAudio,
    stopAudio,
    checkTtsHealth
  };
}
