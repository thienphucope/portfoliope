import { useState, useRef, useCallback } from 'react';

const TTS_API_URL = "https://thienphuc1052004--xtts-api-xttsapi-tts-generate.modal.run";
const TTS_STREAM_URL = "https://thienphuc1052004--xtts-api-xttsapi-tts-stream.modal.run";
const TTS_HEALTH_URL = "https://thienphuc1052004--xtts-api-xttsapi-ping.modal.run";
const TTS_INTERRUPT_URL = "https://thienphuc1052004--xtts-api-xttsapi-tts-interrupt.modal.run";

// const TTS_API_URL = "https://thienphuc1052004--xtts-api-xttsapi-tts-generate.modal.run";
// const TTS_STREAM_URL = "https://thienphuc1052004--xtts-ft-api-xttsftapi-tts-stream.modal.run";
// const TTS_HEALTH_URL = "https://thienphuc1052004--xtts-ft-api-xttsftapi-ping.modal.run";
// const TTS_INTERRUPT_URL = "https://thienphuc1052004--xtts-ft-api-xttsftapi-tts-interrupt.modal.run";

/**
 * Hook for Text-to-Speech synthesis using external Modal API.
 * Manages audio queue and chunk-based playback.
 */
export function useTTS() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ttsReady, setTtsReady] = useState(true);
  
  const isPlayingRef = useRef(false);
  
  const audioContextRef = useRef(null);
  const activeSourcesRef = useRef([]);

  const detectLanguage = (text) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text) ? 'vi' : 'en';

  // Stop currently playing audio via audio context stream
  const stopAudio = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlayingAudio(false);
    
    // Gửi tín hiệu ngắt âm thanh đang tạo đến Backend
    fetch(TTS_INTERRUPT_URL, { method: 'POST' }).catch(() => {});
    
    // Stop streams
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
  }, []);

  const streamAudioLive = useCallback(async (text) => {
    if (!text || !ttsReady) return;
    stopAudio();
    const rawText = text.trim();
    if (!rawText) return;
    const lang = detectLanguage(rawText);
    
    setIsPlayingAudio(true);
    isPlayingRef.current = true;
    
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioCtx = audioContextRef.current;
    
    try {
        let nextTime = audioCtx.currentTime + 0.3; // Khởi tạo delay đệm đầu tiên
        
        // Đẩy toàn bộ text lên backend để backend tự động chunk text và stream audio liền mạch
        if (!isPlayingRef.current || audioContextRef.current !== audioCtx) return;
        
        const res = await fetch(TTS_STREAM_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: rawText, language: lang })
        });
        
        if (!res.ok) throw new Error("Failed to start TTS stream");
        
        const reader = res.body.getReader();
        let leftover = new Uint8Array(0);
        
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (!isPlayingRef.current || audioContextRef.current !== audioCtx) break;
            
            // Xử lý gói tin bị cắt lẻ byte từ TCP network stream
            let combined = new Uint8Array(leftover.length + value.length);
            combined.set(leftover);
            combined.set(value, leftover.length);
            
            let useLength = combined.length;
            if (useLength % 2 !== 0) {
                leftover = combined.slice(useLength - 1); // Giữ lại 1 byte bị lẻ cho vòng lặp sau
                useLength -= 1;
            } else {
                leftover = new Uint8Array(0);
            }
            
            if (useLength === 0) continue;
            
            // Giải mã byte buffer mới thành mảng 16-bit
            const pcm16 = new Int16Array(combined.buffer, combined.byteOffset, useLength / 2);
            if (pcm16.length === 0) continue;
            
            const audioBuffer = audioCtx.createBuffer(1, pcm16.length, 24000);
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
        
        // Timeout chờ âm thanh cuối kết thúc
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
    streamAudioLive,
    stopAudio,
    checkTtsHealth
  };
}
