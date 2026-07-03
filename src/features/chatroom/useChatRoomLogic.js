'use client';

import { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import { useAI } from '@/hooks/useAI';
import { useSTT } from '@/hooks/useSTT';
import { useTTS } from '@/hooks/useTTS';
import { MOXXI_GREETING, MOXXI_ERROR_MSG } from '@/configs/ai';
import { ensureLibsLoaded } from '@/lib/markdown';
import { extractSpeechText } from './ChatMarkdownContent';

export function useChatRoomLogic({ onLiveCallChange, ref } = {}) {
  const [isMounted, setIsMounted] = useState(false);
  const [markdownReady, setMarkdownReady] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: MOXXI_GREETING }
  ]);
  const [engineInput, setEngineInput] = useState('');
  const [liveInput, setLiveInput] = useState('');
  const [isLiveCall, setIsLiveCall] = useState(false);
  const [isHoldingUI, setIsHoldingUI] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const scrollStateRef = useRef({ shouldFollow: true, lastTop: 0 });
  const isLiveCallRef = useRef(false);
  const isProcessingRef = useRef(false);
  const holdTimerRef = useRef(null);
  const releaseTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const textareaRef = useRef(null);

  const { requestAI, streamResponse, isThinking, isStreaming, streamingText, stopAI, liveToolCalls } = useAI();
  const { isPlayingAudio, streamAudioLive, stopAudio } = useTTS();

  const isProcessing = isThinking || isStreaming || isPlayingAudio;
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  useEffect(() => {
    setIsMounted(true);
    if (!localStorage.getItem('moxxi_device_id')) {
      localStorage.setItem('moxxi_device_id', crypto.randomUUID());
    }
    const saved = localStorage.getItem('moxxi_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setConvo(parsed);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    ensureLibsLoaded()
      .then(() => {
        if (active) setMarkdownReady(true);
      })
      .catch((e) => {
        console.error('Failed to load markdown engine:', e);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (onLiveCallChange) onLiveCallChange(isLiveCall);
  }, [isLiveCall, onLiveCallChange]);

  const prevConvoLenRef = useRef(convo.length);

  useEffect(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const state = scrollStateRef.current;
      if (state.shouldFollow) return;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      if (atBottom) state.shouldFollow = true;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = messagesAreaRef.current;
    const isActive = isStreaming || isThinking;
    const newMessage = convo.length !== prevConvoLenRef.current;
    if (newMessage) {
      prevConvoLenRef.current = convo.length;
      scrollStateRef.current.shouldFollow = true;
      scrollStateRef.current.lastTop = 0;
    }
    if (!el || (!isActive && !newMessage)) return;
    const state = scrollStateRef.current;
    if (state.shouldFollow && state.lastTop > 0 && el.scrollTop < state.lastTop - 20) {
      state.shouldFollow = false;
      return;
    }
    if (!state.shouldFollow) return;
    el.scrollTo({ top: el.scrollHeight, behavior: isActive ? 'auto' : 'smooth' });
    state.lastTop = el.scrollHeight - el.clientHeight;
  }, [convo.length, streamingText, isStreaming, isThinking, liveToolCalls]);

  useEffect(() => {
    if (isMounted && convo.length > 1) {
      const toSave = convo.slice(-20);
      localStorage.setItem('moxxi_chat_history', JSON.stringify(toSave));
    }
  }, [convo, isMounted]);

  const handleAnalyze = useCallback(async (msgOverride) => {
    const raw = (typeof msgOverride === 'string' ? msgOverride : engineInput).trim();
    if (!raw || isThinking || isStreaming || isPlayingAudio) return;

    const slashMatch = raw.match(/^\/(\w+)\s+([\s\S]+)$/);
    const provider = slashMatch ? slashMatch[1] : undefined;
    const userMsg = slashMatch ? slashMatch[2].trim() : raw;

    setEngineInput('');
    setLiveInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const live = isLiveCallRef.current;
    const currentConvo = [...convo, { role: 'user', content: raw }];
    setConvo([...currentConvo, { role: 'assistant', content: '', live }]);

    try {
      const { text: reply, toolCalls } = await requestAI(userMsg, convo.filter(m => m.content), undefined, undefined, provider);
      streamResponse(reply, (fullText) => {
        setConvo(prev => {
          const n = [...prev];
          n[n.length - 1] = { role: 'assistant', content: fullText, toolCalls, live };
          return n;
        });
      });
      if (isLiveCallRef.current) {
        const speechText = extractSpeechText(reply, markdownReady);
        if (speechText) streamAudioLive(speechText);
      }
    } catch (e) {
      setConvo(prev => {
        const n = [...prev];
        n[n.length - 1] = { role: 'assistant', content: MOXXI_ERROR_MSG };
        return n;
      });
    }
  }, [engineInput, isThinking, isStreaming, isPlayingAudio, convo, requestAI, streamResponse, markdownReady, streamAudioLive]);

  const executeInterrupt = useCallback(() => {
    stopAudio();
    stopAI();
    setConvo(prev => {
      const n = [...prev];
      if (n.length > 0 && n[n.length - 1].role === 'assistant' && !n[n.length - 1].content) {
        n[n.length - 1].content = '*(Interrupted)*';
      }
      return n;
    });
    setLiveInput('');
  }, [stopAudio, stopAI]);

  const { isListening, startListening, pauseListening, stopListening, clearTranscription, startManualMode, stopManualMode } = useSTT({
    onResult: (text) => {
      if (!text) { setLiveInput(''); return; }
      if (isProcessingRef.current) {
        if (/\b(no|wait|interrupt|interupt|stop)\b/i.test(text.toLowerCase())) executeInterrupt();
        clearTranscription();
        return;
      }
      setLiveInput(text);
    },
    onSilence: (text) => {
      if (isLiveCallRef.current && text && !isProcessingRef.current) handleAnalyze(text);
    }
  });

  const handleInterrupt = useCallback(() => {
    if (isProcessingRef.current) { executeInterrupt(); clearTranscription(); }
    else { clearTranscription(); setLiveInput(''); startListening(); }
  }, [executeInterrupt, startListening, clearTranscription]);

  const handlePointerDown = useCallback((e) => {
    if (e.button && e.button !== 0) return;
    if (releaseTimerRef.current) { clearTimeout(releaseTimerRef.current); releaseTimerRef.current = null; }
    isHoldingRef.current = false;
    setIsHoldingUI(false);
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsHoldingUI(true);
      startManualMode();
    }, 400);
  }, [startManualMode]);

  const handlePointerUp = useCallback((e) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setIsHoldingUI(false);
      releaseTimerRef.current = setTimeout(() => { stopManualMode(); releaseTimerRef.current = null; }, 1000);
    } else {
      if (releaseTimerRef.current) { clearTimeout(releaseTimerRef.current); releaseTimerRef.current = null; }
      clearTranscription(); setLiveInput(''); handleInterrupt();
    }
  }, [handleInterrupt, stopManualMode, clearTranscription]);

  const startLiveCall = useCallback(() => {
    executeInterrupt();
    isLiveCallRef.current = true;
    setIsLiveCall(true);
    startListening();
  }, [startListening, executeInterrupt]);

  const endLiveCall = useCallback(() => {
    isLiveCallRef.current = false;
    setIsLiveCall(false);
    stopListening();
    stopAudio();
    setLiveInput('');
  }, [stopListening, stopAudio]);

  const resetConversation = useCallback(() => {
    if (isLiveCallRef.current) endLiveCall();
    setConvo([{ role: 'assistant', content: MOXXI_GREETING }]);
    localStorage.removeItem('moxxi_chat_history');
  }, [endLiveCall]);

  useImperativeHandle(ref, () => ({
    toggleLiveCall: () => {
      if (isLiveCallRef.current) endLiveCall();
      else startLiveCall();
    },
    isLiveCall
  }), [startLiveCall, endLiveCall, isLiveCall]);

  useEffect(() => {
    if (!isLiveCall) return;
    if (isPlayingAudio) {
      pauseListening();
    } else {
      const t = setTimeout(() => {
        if (isLiveCallRef.current) { clearTranscription(); startListening(); }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isPlayingAudio, isLiveCall, pauseListening, clearTranscription, startListening]);

  return {
    isMounted, markdownReady,
    convo, engineInput, setEngineInput, liveInput,
    isLiveCall, isHoldingUI, isListening,
    isThinking, isStreaming, streamingText, liveToolCalls, isProcessing,
    messagesAreaRef, messagesEndRef, textareaRef,
    handleAnalyze, handleInterrupt, handlePointerDown, handlePointerUp,
    startLiveCall, endLiveCall, resetConversation,
  };
}
