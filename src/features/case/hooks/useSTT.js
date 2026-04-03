import { useState, useEffect, useRef, useCallback } from 'react';

export function useSTT({ onResult, onSilence }) {
  const [isListening, setIsListening] = useState(false);
  const [micVolume, setMicVolume] = useState(0); // Track volume (0 to 1)
  
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  
  // This helps us retain words across sudden short gaps
  const accumulatedRef = useRef('');
  const sessionRef = useRef('');
  
  const shouldListenRef = useRef(false);
  const echoFilterRef = useRef(null);
  
  // Audio node refs for volume
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);
  
  const callbacks = useRef({ onResult, onSilence });
  useEffect(() => {
    callbacks.current = { onResult, onSilence };
  }, [onResult, onSilence]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      
      recognition.onerror = (e) => {
        console.warn('STT Mic err:', e.error);
        // Ngắt thẳng nếu bị từ chối quyền hoặc lỗi thật sự nặng
        if (e.error === 'not-allowed' || e.error === 'audio-capture') {
          setIsListening(false);
          shouldListenRef.current = false;
        }
      };

      recognition.onresult = (e) => {
        let textArr = [];
        for (let i = 0; i < e.results.length; i++) {
          textArr.push(e.results[i][0].transcript.trim());
        }
        sessionRef.current = textArr.join('. ');
        
        let full = accumulatedRef.current 
          ? (accumulatedRef.current + '. ' + sessionRef.current).trim()
          : sessionRef.current;
        full = full.replace(/\s*\.\s*\./g, '.'); // Tránh bị 2 dấu chấm liên tiếp
        
        // Flush if the user says "no no no" at the end
        if (/(?:^|\s)no[\s.,!?]+no[\s.,!?]+no[\s.,!?]*$/i.test(full)) {
          clearTimeout(silenceTimer.current); // <--- Quan trọng: xóa bộ đếm thời gian cũ
          accumulatedRef.current = '';
          sessionRef.current = '';
          if (callbacks.current.onResult) callbacks.current.onResult('');
          try { recognition.abort(); } catch(err) {} 
          return;
        }

        if (callbacks.current.onResult) callbacks.current.onResult(full);
        
        clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
          if (callbacks.current.onSilence && full) {
            const words = full.trim().split(/\s+/).filter(Boolean);
            if (words.length < 3) return; // Nếu dưới 3 từ thì bỏ qua không gửi, tiếp tục đợi thêm

            callbacks.current.onSilence(full);
            accumulatedRef.current = '';
            sessionRef.current = '';
            if (callbacks.current.onResult) callbacks.current.onResult('');
            // Ensure STT completely forgets previous sentences after a send
            try { recognition.abort(); } catch(err) {}
          }
        }, 2000);
      };
      
      recognition.onend = () => {
        setIsListening(false); // ALWAYS update UI
        if (sessionRef.current.trim()) {
           accumulatedRef.current = accumulatedRef.current 
             ? (accumulatedRef.current + '. ' + sessionRef.current).trim()
             : sessionRef.current.trim();
           accumulatedRef.current = accumulatedRef.current.replace(/\s*\.\s*\./g, '.');
           sessionRef.current = '';
        }
        
        if (shouldListenRef.current) {
          setTimeout(() => {
            // Force clean state on automatic restart if there's no pending timeout
            if (!silenceTimer.current) {
              sessionRef.current = '';
              accumulatedRef.current = '';
            }
            try { recognitionRef.current?.start(); } catch(err) {}
          }, 100);
        }
      };
    }
  }, []);

  const startListening = useCallback(async () => {
    if (shouldListenRef.current) {
      try { recognitionRef.current?.start(); } catch(e) {}
      return; 
    }
    
    shouldListenRef.current = true;
    accumulatedRef.current = '';
    sessionRef.current = '';
    
    try {
      if (!echoFilterRef.current && navigator.mediaDevices) {
        // Try allocating a stream to force WebRTC hardware echo cancellation
        echoFilterRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });

        // Tính toán âm thanh trực quan thật mượt (Volume Meter)
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        
        const src = audioCtx.createMediaStreamSource(echoFilterRef.current);
        src.connect(analyser);

        const trackVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length;
          // Scale volume lên x2 để dễ thấy dao động, giới hạn max là 1
          setMicVolume(Math.min(1, (average / 128) * 2));
          rafRef.current = requestAnimationFrame(trackVolume);
        };
        trackVolume();
      }
      recognitionRef.current?.start();
    } catch (e) {
      console.warn('STT Mic err:', e);
    }
  }, []);

  const pauseListening = useCallback(() => {
    shouldListenRef.current = false;
    clearTimeout(silenceTimer.current);
    try { recognitionRef.current?.abort(); } catch (e) {}
    setIsListening(false);
  }, []);

  const clearTranscription = useCallback(() => {
    accumulatedRef.current = '';
    sessionRef.current = '';
    try { recognitionRef.current?.abort(); } catch(err) {} 
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearTimeout(silenceTimer.current);
    try { recognitionRef.current?.abort(); } catch (e) {}
    setIsListening(false);
    setMicVolume(0);
    
    if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close().catch(()=>{});
        audioContextRef.current = null;
        analyserRef.current = null;
        dataArrayRef.current = null;
    }

    if (echoFilterRef.current) {
      echoFilterRef.current.getTracks().forEach(track => track.stop());
      echoFilterRef.current = null;
    }
  }, []);

  return { isListening, micVolume, startListening, pauseListening, stopListening, clearTranscription };
}
