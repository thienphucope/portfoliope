import { useState, useEffect, useRef, useCallback } from 'react';

// Detect mobile browser
const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

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
  const isMobileDevice = useRef(isMobile());
  const isRestartingRef = useRef(false); // Prevent double restart on mobile
  
  // Audio node refs for volume
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);
  
  const callbacks = useRef({ onResult, onSilence });
  useEffect(() => {
    callbacks.current = { onResult, onSilence };
  }, [onResult, onSilence]);

  // Safe restart helper for mobile
  const safeRestart = useCallback((delay = 100) => {
    if (isRestartingRef.current || !shouldListenRef.current) return;
    isRestartingRef.current = true;
    
    setTimeout(() => {
      if (shouldListenRef.current && recognitionRef.current) {
        try { 
          recognitionRef.current.start(); 
        } catch(err) {
          console.warn('STT restart err:', err);
        }
      }
      isRestartingRef.current = false;
    }, delay);
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognitionRef.current = recognition;
      
      // Mobile Safari doesn't support continuous well, use shorter sessions
      recognition.continuous = !isMobileDevice.current;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      // Set max alternatives for better accuracy on mobile
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isRestartingRef.current = false;
        setIsListening(true);
      };
      
      recognition.onerror = (e) => {
        console.warn('STT Mic err:', e.error);
        isRestartingRef.current = false;
        
        // Ngắt thẳng nếu bị từ chối quyền hoặc lỗi thật sự nặng
        if (e.error === 'not-allowed' || e.error === 'audio-capture' || e.error === 'service-not-allowed') {
          setIsListening(false);
          shouldListenRef.current = false;
          return;
        }
        
        // Mobile thường bị 'no-speech' hoặc 'aborted' hoặc 'network' - retry
        if (shouldListenRef.current && (e.error === 'no-speech' || e.error === 'aborted' || e.error === 'network')) {
          // Longer delay for mobile to prevent rapid restart loops
          safeRestart(isMobileDevice.current ? 300 : 100);
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
          // Force clean state on automatic restart if there's no pending timeout
          if (!silenceTimer.current) {
            sessionRef.current = '';
            accumulatedRef.current = '';
          }
          // Use longer delay for mobile to ensure clean restart
          safeRestart(isMobileDevice.current ? 200 : 50);
        }
      };
    }
  }, [safeRestart]);

  const startListening = useCallback(async () => {
    if (shouldListenRef.current) {
      try { recognitionRef.current?.start(); } catch(e) {}
      return; 
    }
    
    shouldListenRef.current = true;
    isRestartingRef.current = false;
    accumulatedRef.current = '';
    sessionRef.current = '';
    
    try {
      if (!echoFilterRef.current && navigator.mediaDevices) {
        try {
          // Mobile-friendly constraints - simpler for better compatibility
          let constraints = isMobileDevice.current 
            ? { audio: true } // Simplest constraint for mobile
            : {
                audio: { 
                  echoCancellation: true, 
                  noiseSuppression: true, 
                  autoGainControl: true
                }
              };
          
          try {
            echoFilterRef.current = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (firstErr) {
            // Fallback to basic audio
            console.warn('Fallback mic constraints:', firstErr);
            echoFilterRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
          }

          // Tính toán âm thanh trực quan thật mượt (Volume Meter)
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            
            // Mobile cần resume AudioContext sau user interaction
            if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
            }
            
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
              const NOISE_GATE = 15;
              const effectiveVolume = average > NOISE_GATE ? average - NOISE_GATE : 0;

              setMicVolume(Math.min(1, effectiveVolume / 50)); 
              rafRef.current = requestAnimationFrame(trackVolume);
            };
            trackVolume();
          }
        } catch (mediaErr) {
          console.warn('Volume visualization not supported:', mediaErr);
        }
      }
      
      // Start recognition
      try {
        recognitionRef.current?.start();
      } catch (startErr) {
        console.warn('Initial STT start error:', startErr);
        // Retry once after small delay (important for mobile)
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch(e) {}
        }, 100);
      }
    } catch (e) {
      console.warn('STT Mic err:', e);
    }
  }, []);

  const pauseListening = useCallback(() => {
    shouldListenRef.current = false;
    isRestartingRef.current = false;
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
    isRestartingRef.current = false;
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
