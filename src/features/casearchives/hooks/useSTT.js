import { useState, useEffect, useRef, useCallback } from 'react';

/* ============================================================================
 * Speech-to-Text hook backed by Chrome's free Web Speech API
 * (window.SpeechRecognition / window.webkitSpeechRecognition)
 *
 * Architecture
 * ------------
 * The STT lifecycle is owned by an imperative `controller` object created once
 * per hook instance. The controller exposes the public methods; the React hook
 * is a thin wrapper that surfaces reactive state (`isListening`, `micVolume`)
 * and proxies method calls.
 *
 * The controller models intent vs. reality:
 *   - `wantsToListen`  – what the consumer asked for
 *   - recognition state – what's actually happening in Chrome
 * Reality converges to intent through a small number of well-defined paths.
 *
 * Five concerns, kept separate inside the controller:
 *   1. Recognition lifecycle  (build / teardown / start / scheduled restart)
 *   2. Text accumulation      (cross-session continuity, "skip past" cursor)
 *   3. Silence detection      (auto vs. manual / push-to-talk)
 *   4. Volume meter           (real on desktop, simulated on mobile)
 *   5. Watchdog               (recover from "alive but deaf" zombie sessions)
 * ========================================================================== */


/* -------------------------- Tunable constants ----------------------------- */

const SILENCE_MS            = 2000;   // quiet time before flushing utterance
const MIN_FLUSH_WORDS       = 3;      // ignore micro-flushes (noise)
const WATCHDOG_MS           = 20000;  // no audio this long → recreate object
const RESTART_DELAY_DESKTOP = 50;
const RESTART_DELAY_MOBILE  = 200;
const MAX_RESTART_DELAY     = 1000;
const NOISE_GATE            = 15;     // 0–255, below this counts as silence
const VOLUME_DIVISOR        = 50;     // post-gate scaling for 0..1 output
const FLUSH_PATTERN         = /(?:^|\s)no[\s.,!?]+no[\s.,!?]+no[\s.,!?]*$/i;


/* ------------------------------- Helpers ---------------------------------- */

const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const getRecognitionClass = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const normalizeText = (s) => s.replace(/\s*\.\s*\./g, '.').trim();


/* ============================================================================
 * Controller
 * ========================================================================== */

function createSTTController({ setIsListening, setMicVolume, callbacksRef }) {
  const SR             = getRecognitionClass();
  const supported      = !!SR;
  const isMobileDevice = isMobile();

  /* --- Intent / lifecycle flags ----------------------------------------- */
  let wantsToListen      = false;
  let isManual           = false;
  let destroyed          = false;

  /* --- Recognition --------------------------------------------------------- */
  let recognition         = null;
  let recognitionStarting = false;
  let restartTimerId      = null;

  /* --- Text accumulation -------------------------------------------------- */
  let accumulated     = '';   // text from prior recognition sessions
  let session         = '';   // text from the current session, post-baseIdx
  let baseIdx         = 0;    // first index in e.results we still care about
  let lastResultsLen  = 0;    // most recent e.results.length we observed

  /* --- Timers ------------------------------------------------------------- */
  let silenceTimerId  = null;
  let watchdogId      = null;

  /* --- Volume meter ------------------------------------------------------- */
  let mediaStream         = null;
  let audioCtx            = null;
  let analyser            = null;
  let dataArray           = null;
  let volumeRafId         = null;
  let mobilePulseId       = null;
  let volumeMeterBuilding = false;


  /* ------------------------------------------------------------------ Text */

  const joinText = () => {
    const combined = accumulated ? `${accumulated}. ${session}` : session;
    return normalizeText(combined);
  };

  const emitResult  = (t) => callbacksRef.current.onResult?.(t);
  const emitSilence = (t) => callbacksRef.current.onSilence?.(t);

  const skipPastCurrentResults = () => { baseIdx = lastResultsLen; };

  const resetText = () => {
    accumulated = '';
    session     = '';
    skipPastCurrentResults();
  };


  /* -------------------------------------------------------------- Watchdog */

  const clearWatchdog = () => {
    if (watchdogId) { clearTimeout(watchdogId); watchdogId = null; }
  };

  const armWatchdog = () => {
    clearWatchdog();
    if (!wantsToListen) return;
    watchdogId = setTimeout(() => {
      watchdogId = null;
      if (!wantsToListen) return;
      console.warn('[STT] Watchdog: no audio for', WATCHDOG_MS, 'ms — recreating recognition');
      teardownRecognition();
      bringRecognitionUp();
    }, WATCHDOG_MS);
  };


  /* ------------------------------------------------- Recognition lifecycle */

  function buildRecognition() {
    if (!SR) return null;

    const r = new SR();
    r.continuous      = !isMobileDevice; // mobile Safari is unreliable in continuous
    r.interimResults  = true;
    r.lang            = 'en-US';
    r.maxAlternatives = 1;

    r.onstart  = handleStart;
    r.onerror  = handleError;
    r.onresult = handleResult;
    r.onend    = handleEnd;

    return r;
  }

  function teardownRecognition() {
    if (!recognition) return;
    const r = recognition;
    r.onstart = r.onerror = r.onresult = r.onend = null;
    try { r.abort(); } catch { /* ignore */ }
    recognition         = null;
    recognitionStarting = false;
  }

  function bringRecognitionUp(retryDelay = (isMobileDevice ? RESTART_DELAY_MOBILE : RESTART_DELAY_DESKTOP)) {
    if (destroyed || !wantsToListen) return;
    if (recognitionStarting || restartTimerId) return;

    if (!recognition) recognition = buildRecognition();
    if (!recognition) return;

    recognitionStarting = true;
    try {
      recognition.start();
    } catch (err) {
      // Most often InvalidStateError: previous session hasn't fully closed yet.
      recognitionStarting = false;
      const next = Math.min(retryDelay * 2, MAX_RESTART_DELAY);
      console.warn('[STT] start() failed:', err.message || err, '— retry in', next, 'ms');
      restartTimerId = setTimeout(() => {
        restartTimerId = null;
        bringRecognitionUp(next);
      }, next);
    }
  }

  function scheduleRestart(delay) {
    if (destroyed || !wantsToListen) return;
    if (recognitionStarting || restartTimerId) return;
    restartTimerId = setTimeout(() => {
      restartTimerId = null;
      bringRecognitionUp(delay);
    }, delay);
  }


  /* ------------------------------------------------- Recognition handlers */

  function handleStart() {
    recognitionStarting = false;
    baseIdx        = 0;
    lastResultsLen = 0;
    setIsListening(true);
    armWatchdog();
  }

  function handleError(e) {
    recognitionStarting = false;
    clearWatchdog();

    if (
      e.error === 'not-allowed' ||
      e.error === 'audio-capture' ||
      e.error === 'service-not-allowed'
    ) {
      console.warn('[STT] Permission/device error:', e.error);
      wantsToListen = false;
      setIsListening(false);
      return;
    }

    // 'aborted' is expected (we abort on pause/stop). Other errors → onend will
    // fire shortly and the restart machinery there will pick things up.
    if (e.error !== 'aborted') {
      console.warn('[STT] Recognition error:', e.error);
    }
  }

  function handleResult(e) {
    armWatchdog();
    lastResultsLen = e.results.length;

    // Only read results that haven't been flushed to the consumer yet.
    const parts = [];
    for (let i = baseIdx; i < e.results.length; i++) {
      parts.push(e.results[i][0].transcript.trim());
    }
    session = parts.join('. ');

    const full = joinText();

    // "no no no" → user wants to discard what was just said.
    if (FLUSH_PATTERN.test(full)) {
      if (silenceTimerId) { clearTimeout(silenceTimerId); silenceTimerId = null; }
      resetText();
      emitResult('');
      return;
    }

    emitResult(full);

    if (silenceTimerId) clearTimeout(silenceTimerId);
    if (!isManual) {
      silenceTimerId = setTimeout(handleSilence, SILENCE_MS);
    }
  }

  function handleSilence() {
    silenceTimerId = null;
    const text  = joinText();
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < MIN_FLUSH_WORDS) return;

    emitSilence(text);
    resetText();
    emitResult('');
  }

  function handleEnd() {
    clearWatchdog();

    if (!wantsToListen) {
      setIsListening(false);
      return;
    }

    // Chrome may end the session mid-utterance (60s cap, no-speech, etc.).
    // Move whatever we already heard into `accumulated` so the next session
    // appends to it rather than losing it.
    if (session.trim()) {
      const next = accumulated ? `${accumulated}. ${session}` : session;
      accumulated = normalizeText(next);
      session = '';
      emitResult(accumulated);
    }
    baseIdx        = 0;
    lastResultsLen = 0;

    scheduleRestart(isMobileDevice ? RESTART_DELAY_MOBILE : RESTART_DELAY_DESKTOP);
  }


  /* ----------------------------------------------------------- Volume meter */

  async function setupVolumeMeter() {
    if (destroyed) return;

    if (isMobileDevice) {
      // Don't touch getUserMedia on mobile — it kills SpeechRecognition.
      if (mobilePulseId) return;
      let phase = 0;
      mobilePulseId = setInterval(() => {
        phase += 0.15;
        setMicVolume(0.3 + 0.2 * Math.sin(phase));
      }, 50);
      return;
    }

    // Desktop: real volume from a parallel getUserMedia stream.
    if (volumeRafId) return;

    if (!analyser) {
      if (volumeMeterBuilding) return;
      volumeMeterBuilding = true;

      try {
        if (!navigator.mediaDevices) { volumeMeterBuilding = false; return; }
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation:  true,
            noiseSuppression:  true,
            autoGainControl:   true,
          }
        });
      } catch (err) {
        volumeMeterBuilding = false;
        console.warn('[STT] getUserMedia failed (volume viz disabled):', err.message || err);
        return;
      }

      if (destroyed || !wantsToListen) {
        mediaStream.getTracks().forEach(t => t.stop());
        mediaStream = null;
        volumeMeterBuilding = false;
        return;
      }

      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { volumeMeterBuilding = false; return; }

      audioCtx = new AC();
      if (audioCtx.state === 'suspended') {
        try { await audioCtx.resume(); } catch { /* ignore */ }
      }

      analyser           = audioCtx.createAnalyser();
      analyser.fftSize   = 256;
      dataArray          = new Uint8Array(analyser.frequencyBinCount);
      audioCtx.createMediaStreamSource(mediaStream).connect(analyser);
      volumeMeterBuilding = false;
    }

    const tick = () => {
      if (destroyed || !wantsToListen || !analyser) {
        volumeRafId = null;
        return;
      }
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      const eff = avg > NOISE_GATE ? avg - NOISE_GATE : 0;
      setMicVolume(Math.min(1, eff / VOLUME_DIVISOR));
      volumeRafId = requestAnimationFrame(tick);
    };
    volumeRafId = requestAnimationFrame(tick);
  }

  function pauseVolumeMeter() {
    if (volumeRafId)   { cancelAnimationFrame(volumeRafId); volumeRafId = null; }
    if (mobilePulseId) { clearInterval(mobilePulseId);      mobilePulseId = null; }
    setMicVolume(0);
  }

  function teardownVolumeMeter() {
    pauseVolumeMeter();
    if (audioCtx) {
      audioCtx.close().catch(() => { /* ignore */ });
      audioCtx = null;
    }
    analyser  = null;
    dataArray = null;
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
  }


  /* ------------------------------------------------------------- Public API */

  function startListening() {
    if (destroyed || !supported) return;

    if (wantsToListen) {
      // Already in listening mode; just make sure recognition is up.
      bringRecognitionUp();
      return;
    }

    wantsToListen  = true;
    accumulated    = '';
    session        = '';
    baseIdx        = 0;
    lastResultsLen = 0;

    setupVolumeMeter(); // fire and forget — async, but safe to interleave
    bringRecognitionUp();
  }

  function pauseListening() {
    if (!wantsToListen) return;
    wantsToListen = false;

    if (silenceTimerId) { clearTimeout(silenceTimerId); silenceTimerId = null; }
    if (restartTimerId) { clearTimeout(restartTimerId); restartTimerId = null; }
    clearWatchdog();
    teardownRecognition();
    pauseVolumeMeter();    // keep mic stream open for fast resume
    setIsListening(false);
  }

  function stopListening() {
    wantsToListen = false;
    isManual      = false;

    if (silenceTimerId) { clearTimeout(silenceTimerId); silenceTimerId = null; }
    if (restartTimerId) { clearTimeout(restartTimerId); restartTimerId = null; }
    clearWatchdog();
    teardownRecognition();
    teardownVolumeMeter(); // full release: stop mic tracks, close audio context
    setIsListening(false);
  }

  function clearTranscription() {
    isManual    = false;
    accumulated = '';
    session     = '';
    skipPastCurrentResults();
    if (silenceTimerId) { clearTimeout(silenceTimerId); silenceTimerId = null; }
    emitResult('');
  }

  function startManualMode() {
    isManual = true;
    if (silenceTimerId) { clearTimeout(silenceTimerId); silenceTimerId = null; }
    if (!wantsToListen) startListening();
  }

  function stopManualMode() {
    isManual = false;
    const text = joinText();
    if (text) emitSilence(text);
    accumulated = '';
    session     = '';
    skipPastCurrentResults();
    if (silenceTimerId) { clearTimeout(silenceTimerId); silenceTimerId = null; }
    emitResult('');
  }

  function destroy() {
    destroyed = true;
    stopListening();
  }

  return {
    startListening,
    pauseListening,
    stopListening,
    clearTranscription,
    startManualMode,
    stopManualMode,
    destroy,
  };
}


/* ============================================================================
 * React hook (thin wrapper)
 * ========================================================================== */

/**
 * @param {object}                        opts
 * @param {(text: string) => void}        opts.onResult   Streaming/interim text. Empty string means "cleared".
 * @param {(text: string) => void}        opts.onSilence  Final utterance after silence threshold (or end of manual hold).
 */
export function useSTT({ onResult, onSilence }) {
  const [isListening, setIsListening] = useState(false);
  const [micVolume,   setMicVolume]   = useState(0);

  const callbacksRef = useRef({ onResult, onSilence });
  useEffect(() => {
    callbacksRef.current = { onResult, onSilence };
  }, [onResult, onSilence]);

  const ctrlRef = useRef(null);
  if (!ctrlRef.current) {
    ctrlRef.current = createSTTController({
      setIsListening,
      setMicVolume,
      callbacksRef,
    });
  }

  useEffect(() => {
    return () => {
      ctrlRef.current?.destroy();
      ctrlRef.current = null;
    };
  }, []);

  const startListening     = useCallback(() => ctrlRef.current?.startListening(),     []);
  const pauseListening     = useCallback(() => ctrlRef.current?.pauseListening(),     []);
  const stopListening      = useCallback(() => ctrlRef.current?.stopListening(),      []);
  const clearTranscription = useCallback(() => ctrlRef.current?.clearTranscription(), []);
  const startManualMode    = useCallback(() => ctrlRef.current?.startManualMode(),    []);
  const stopManualMode     = useCallback(() => ctrlRef.current?.stopManualMode(),     []);

  return {
    isListening,
    micVolume,
    startListening,
    pauseListening,
    stopListening,
    clearTranscription,
    startManualMode,
    stopManualMode,
  };
}
