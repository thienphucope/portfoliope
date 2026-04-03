import { useState, useEffect, useRef, useCallback } from 'react';

export function useSTT({ onResult, onSilence }) {
  const [isListening, setIsListening] = useState(false);
  const [micVolume, setMicVolume] = useState(0); // Track volume (0 to 1)
  
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const isManualRef = useRef(false);
  
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
        if (!isManualRef.current) {
          silenceTimer.current = setTimeout(() => {
            if (callbacks.current.onSilence && full) {
              const words = full.trim().split(/\s+/).filter(Boolean);
              if (words.length < 3) return; // Trả lại 3 từ như cũ!

              callbacks.current.onSilence(full);
              accumulatedRef.current = '';
              sessionRef.current = '';
              silenceTimer.current = null; // Reset bộ đếm
              if (callbacks.current.onResult) callbacks.current.onResult('');
              // Ensure STT completely forgets previous sentences after a send
              try { recognition.abort(); } catch(err) {}
            }
          }, 4000); // Đặt lại 4 giây (ngừng nói 4s mới gửi) thay vì 7 giây quá lâu
        }
      };
      
      recognition.onend = () => {
        // Chỉ tắt UI nếu thưc sự người dùng ngắt (hoặc hệ thống ngắt hoàn toàn)
        if (!shouldListenRef.current) {
           setIsListening(false); // Ngắt thật
        }
        
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
          }, 50); // Khởi động lại ngay lập tức ngầm bên dưới
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
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: false // Tắt tự động khuếch đại âm thanh (AGC) để tránh hút tiếng vọng từ tai nghe 
          }
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
          
          // Noise Gate (Ngưỡng lọc ồn tiếng vọng): Chỉ khi âm thanh đủ lớn mới nhảy mic
          const NOISE_GATE = 15; // Ngưỡng cắt lọc dải âm thanh nhỏ (có thể tăng lên 20-25 nếu vẫn nhạy)
          const effectiveVolume = average > NOISE_GATE ? average - NOISE_GATE : 0;

          // Tính toán lại tỷ lệ animation sau khi đã cắt tạp âm
          setMicVolume(Math.min(1, effectiveVolume / 50)); 
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
    isManualRef.current = false;
    accumulatedRef.current = '';
    sessionRef.current = '';
    clearTimeout(silenceTimer.current);
    if (callbacks.current.onResult) callbacks.current.onResult('');
    try { recognitionRef.current?.abort(); } catch(err) {} 
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    isManualRef.current = false;
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

  const startManualMode = useCallback(() => {
    isManualRef.current = true;
    clearTimeout(silenceTimer.current);
    if (!shouldListenRef.current) {
      startListening();
    }
  }, [startListening]);

  const stopManualMode = useCallback(() => {
    isManualRef.current = false;
    let full = accumulatedRef.current 
      ? (accumulatedRef.current + '. ' + sessionRef.current).trim()
      : sessionRef.current.trim();
    full = full.replace(/\s*\.\s*\./g, '.');
    
    if (full && callbacks.current.onSilence) {
      callbacks.current.onSilence(full);
    }
    accumulatedRef.current = '';
    sessionRef.current = '';
    silenceTimer.current = null;
    if (callbacks.current.onResult) callbacks.current.onResult('');
    try { recognitionRef.current?.abort(); } catch(err) {} 
  }, []);

  return { isListening, micVolume, startListening, pauseListening, stopListening, clearTranscription, startManualMode, stopManualMode };
}
