import { useState, useRef, useCallback } from 'react';

const TTS_API_URL = "https://thienphuc1052004--xtts-api-xttsapi-tts-generate.modal.run";
const TTS_HEALTH_URL = "https://thienphuc1052004--xtts-api-xttsapi-ping.modal.run";

/**
 * Hook for Text-to-Speech synthesis using external Modal API.
 * Manages audio queue and chunk-based playback.
 */
export function useTTS() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);
  
  const audioQueueRef = useRef([]);
  const pendingChunksRef = useRef([]);
  const isPlayingRef = useRef(false);
  const isFetchingRef = useRef(false);

  const detectLanguage = (text) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text) ? 'vi' : 'en';
  const normalizeText = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}\s.,!?;:'"()-]/gu, '').replace(/\s+/g, ' ').trim();

  const splitTextSmart = (text, minWords = 40, mergeLastThreshold = 10) => {
    const rawSentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const chunks = [];
    let buffer = "";
    for (const sentence of rawSentences) {
      const candidate = (buffer + " " + sentence).trim();
      if (candidate.split(/\s+/).length < minWords) buffer = candidate;
      else { chunks.push(candidate); buffer = ""; }
    }
    if (buffer) chunks.push(buffer);
    if (chunks.length > 1 && chunks[chunks.length - 1].split(/\s+/).length < mergeLastThreshold) chunks[chunks.length - 2] += " " + chunks.pop();
    return chunks;
  };

  const fetchTTSChunk = async (chunk, lang) => {
    try {
      const res = await fetch(TTS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk, language: lang }),
      });
      return res.ok ? await res.blob() : null;
    } catch { return null; }
  };

  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      if (audioQueueRef.current.length === 0 && pendingChunksRef.current.length === 0 && !isFetchingRef.current) setIsPlayingAudio(false);
      return;
    }
    isPlayingRef.current = true;
    setIsPlayingAudio(true);
    const blob = audioQueueRef.current.shift();
    const url = URL.createObjectURL(blob);
    try {
      await new Promise((res, rej) => {
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); res(); };
        audio.onerror = () => { URL.revokeObjectURL(url); rej(); };
        audio.play().catch(rej);
      });
    } catch { }
    isPlayingRef.current = false;
    playNextAudio();
  }, []);

  const processNextChunk = useCallback(async () => {
    if (isFetchingRef.current || pendingChunksRef.current.length === 0) return;
    isFetchingRef.current = true;
    const { text, lang } = pendingChunksRef.current.shift();
    const blob = await fetchTTSChunk(text, lang);
    if (blob) {
      audioQueueRef.current.push(blob);
      if (!isPlayingRef.current) playNextAudio();
    }
    isFetchingRef.current = false;
    if (pendingChunksRef.current.length > 0) processNextChunk();
  }, [playNextAudio]);

  const generateAndPlayAudio = useCallback(async (text) => {
    if (!text || !ttsReady) return;
    const normalized = normalizeText(text);
    const lang = detectLanguage(normalized);
    const chunks = splitTextSmart(normalized);
    chunks.forEach(c => pendingChunksRef.current.push({ text: c, lang }));
    processNextChunk(); processNextChunk();
  }, [ttsReady, processNextChunk]);

  const checkTtsHealth = useCallback(async () => {
    try {
      const res = await fetch(TTS_HEALTH_URL);
      if (res.ok) setTtsReady(true);
      else setTimeout(checkTtsHealth, 10000);
    } catch {
      setTimeout(checkTtsHealth, 10000);
    }
  }, []);

  return {
    isPlayingAudio,
    ttsReady,
    generateAndPlayAudio,
    checkTtsHealth
  };
}
