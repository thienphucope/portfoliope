'use client';

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useAI } from '@/hooks/useAI';
import { useSTT } from '@/hooks/useSTT';
import { useTTS } from '@/hooks/useTTS';
import { ensureLibsLoaded } from '@/features/casearchives/utils/markdown';
import ChatRoomStyles from './styles/ChatRoomStyles';

const ChatRoom = forwardRef(function ChatRoom({ isEmbedded = false, onLinkClick, onLiveCallChange }, ref) {
  const [isMounted, setIsMounted] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: "Oh hey! Didn't see you come in. You look like someone with a story - what's going on?" }
  ]);
  const [engineInput, setEngineInput] = useState('');
  const [liveInput, setLiveInput] = useState('');
  const [isLiveCall, setIsLiveCall] = useState(false);
  const [isHoldingUI, setIsHoldingUI] = useState(false);

  const messagesEndRef = useRef(null);
  const isLiveCallRef = useRef(false);
  const isProcessingRef = useRef(false);
  const holdTimerRef = useRef(null);
  const releaseTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const textareaRef = useRef(null);

  const { requestAI, streamResponse, isThinking, isStreaming, streamingText, stopAI } = useAI();
  const { isPlayingAudio, streamAudioLive, stopAudio } = useTTS();

  const isProcessing = isThinking || isStreaming || isPlayingAudio;
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  useEffect(() => {
    setIsMounted(true);
    ensureLibsLoaded().then(() => setLibsReady(true));
  }, []);

  useEffect(() => {
    if (onLiveCallChange) onLiveCallChange(isLiveCall);
  }, [isLiveCall, onLiveCallChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const handleAnalyze = async (msgOverride) => {
    const userMsg = (typeof msgOverride === 'string' ? msgOverride : engineInput).trim();
    if (!userMsg || isThinking || isStreaming || isPlayingAudio) return;

    setEngineInput('');
    setLiveInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const currentConvo = [...convo, { role: 'user', content: userMsg }];
    setConvo([...currentConvo, { role: 'assistant', content: '' }]);

    try {
      const reply = await requestAI(userMsg, convo.filter(m => m.content), 'Moxxi');
      streamResponse(reply, (fullText) => {
        setConvo(prev => {
          const n = [...prev];
          n[n.length - 1] = { role: 'assistant', content: fullText };
          return n;
        });
      });
      if (isLiveCallRef.current) streamAudioLive(reply);
    } catch (e) {
      setConvo(prev => {
        const n = [...prev];
        n[n.length - 1] = { role: 'assistant', content: "Well, that didn't go as planned, sugar. Even I have my off nights." };
        return n;
      });
    }
  };

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

  if (!isMounted) return null;

  return (
    <div className="chat-shell" style={isEmbedded ? { position: 'relative', height: '100%', width: '100%' } : {}}>
      <div className="chat-header">
        <div className="header-copy">
          <span className="chat-name">MOXXI</span>
          <span className="chat-overline">CASE FILE // INQUIRY OPEN</span>
        </div>
        <div className={`presence-status${isProcessing ? ' active' : ''}`}>
          [{isProcessing ? 'WORKING...' : 'READY'}]
        </div>
      </div>

      <div className="messages-area">
        <div className="messages-inner">
          {convo.map((msg, i) => {
            const isLast = i === convo.length - 1;
            const content = isLast && isStreaming ? streamingText : msg.content;
            const html = libsReady && window.marked ? window.marked.parse(content || '') : (content || '');

            return (
              <div key={i} className={`message-row ${msg.role}`}>
                <div className="message-bubble">
                  <span className="bubble-name">{msg.role === 'assistant' ? 'MOXXI' : 'SUBJECT (YOU)'}</span>
                  <div
                    className="bubble-content markdown-content"
                    dangerouslySetInnerHTML={{ __html: html }}
                    onClick={onLinkClick}
                  />
                  {isLast && isStreaming && <span className="streaming-cursor" />}
                  {isLast && isThinking && !isStreaming && <span className="thinking-dots">...</span>}
                </div>
              </div>
            );
          })}

          {isLiveCall && liveInput && (
            <div className="message-row user">
              <div className="message-bubble transcribing">
                <span className="bubble-name">TRANSCRIPTION (LIVE)</span>
                <div className="bubble-content">{liveInput}</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-area">
        {isLiveCall ? (
          <div className="live-controls">
            <div className="live-copy">
              <span className="live-title">{isProcessing ? 'MOXXI IS RESPONDING...' : isHoldingUI ? 'RECORDING MANUAL INPUT' : 'LISTENING TO SUBJECT...'}</span>
              <span className="live-subtitle">{isProcessing ? '[ TAP TO INTERRUPT ]' : '[ TAP TO RESET / HOLD TO RETAIN ]'}</span>
            </div>
            <button
              className={`mic-btn${isHoldingUI ? ' holding' : isProcessing ? ' processing' : isListening ? ' listening' : ''}`}
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={(e) => { if (isHoldingRef.current) handlePointerUp(e); }}
            >
              {isProcessing ? '[ HALT ]' : isListening ? '[ REC ]' : '[ WAIT ]'}
            </button>
            <button className="end-btn" onClick={endLiveCall}>[ HANG UP ]</button>
          </div>
        ) : (
          <div className="text-controls">
            <div className="textarea-row">
              <button className="composer-tool" onClick={startLiveCall} aria-label="Start voice recording" title="Start voice recording">
                [ VOICE ]
              </button>
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Log your statement..."
                value={engineInput}
                onChange={(e) => setEngineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyze(); }
                }}
                rows={1}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                disabled={isProcessing}
              />
              <button
                className="send-btn"
                onClick={handleAnalyze}
                disabled={!engineInput.trim() || isProcessing}
                aria-label="Send message"
              >
                {isProcessing ? '[ BUSY ]' : '[ SEND ]'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ChatRoomStyles isEmbedded={isEmbedded} />
    </div>
  );
});

export default ChatRoom;
