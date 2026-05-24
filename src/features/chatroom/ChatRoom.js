'use client';

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useAI } from '@/hooks/useAI';
import { MOXXI_DISPLAY_NAME, MOXXI_GREETING, MOXXI_ERROR_MSG } from '@/configs/ai';
import { useSTT } from '@/hooks/useSTT';
import { useTTS } from '@/hooks/useTTS';
import { ensureLibsLoaded } from '@/features/casearchives/utils/markdown';
import ChatRoomStyles from './styles/ChatRoomStyles';

const ChatRoom = forwardRef(function ChatRoom({ isEmbedded = false, onLinkClick, onLiveCallChange }, ref) {
  const [isMounted, setIsMounted] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: MOXXI_GREETING }
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
    ensureLibsLoaded().then(() => setLibsReady(true));
  }, []);

  useEffect(() => {
    if (onLiveCallChange) onLiveCallChange(isLiveCall);
  }, [isLiveCall, onLiveCallChange]);

  // Keep track of convo length to only scroll on new messages
  const prevConvoLenRef = useRef(convo.length);

  useEffect(() => {
    // Only scroll if AI is streaming OR if a new message was added to the conversation.
    // This prevents scrolling on every keystroke in the textarea.
    if (isStreaming || convo.length !== prevConvoLenRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
      prevConvoLenRef.current = convo.length;
    }
  }, [convo.length, streamingText, isStreaming]);

  useEffect(() => {
    if (isMounted && convo.length > 1) {
      const toSave = convo.slice(-20);
      localStorage.setItem('moxxi_chat_history', JSON.stringify(toSave));
    }
  }, [convo, isMounted]);


  const handleAnalyze = async (msgOverride) => {
    const raw = (typeof msgOverride === 'string' ? msgOverride : engineInput).trim();
    if (!raw || isThinking || isStreaming || isPlayingAudio) return;

    const slashMatch = raw.match(/^\/(\w+)\s+([\s\S]+)$/);
    const provider = slashMatch ? slashMatch[1] : undefined;
    const userMsg = slashMatch ? slashMatch[2].trim() : raw;

    setEngineInput('');
    setLiveInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const currentConvo = [...convo, { role: 'user', content: raw }];
    setConvo([...currentConvo, { role: 'assistant', content: '' }]);

    try {
      const reply = await requestAI(userMsg, convo.filter(m => m.content), undefined, undefined, provider);
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
        n[n.length - 1] = { role: 'assistant', content: MOXXI_ERROR_MSG };
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
          <span className="chat-overline">Dispatch</span>
        </div>
        <div className="header-actions">
          <div className="header-btn-group">
            <button
              className={`voice-header-btn${isLiveCall ? ' active' : ''}`}
              onClick={isLiveCall ? endLiveCall : startLiveCall}
              disabled={isProcessing && !isLiveCall}
            >
              {isEmbedded ? (isLiveCall ? '[L]' : '[V]') : (isLiveCall ? '[ LIVE ]' : '[ VOICE ]')}
            </button>
            <button
              className="voice-header-btn"
              onClick={() => {
                if (isLiveCall) endLiveCall();
                setConvo([{ role: 'assistant', content: MOXXI_GREETING }]);
                localStorage.removeItem('moxxi_chat_history');
              }}
              disabled={isProcessing}
            >
              {isEmbedded ? '[N]' : '[ NEW ]'}
            </button>
          </div>
        </div>
      </div>

      <div className="messages-area">
        {(() => {
          const assistantMsgs = convo.filter(m => m.role === 'assistant');

          // Clean up any accidental markdown code blocks the AI might slip in despite the prompt
          const cleanHtml = (txt) => {
            if (!txt) return '';
            let cleaned = txt;
            // Remove ```html or ```text wrapping
            cleaned = cleaned.replace(/^```[a-z]*\n?/i, '');
            cleaned = cleaned.replace(/\n?```$/i, '');
            return cleaned.trim();
          };

          return (
            <div className="messages-list">
              {assistantMsgs.map((msg, i) => {
                const isLast = i === assistantMsgs.length - 1;
                const content = (isLast && isStreaming) ? streamingText : (msg.content || '');
                return (
                  <div key={i} className={isLast ? "chat-response" : "history-entry"}>
                    <div
                      className="bubble-content html-content"
                      dangerouslySetInnerHTML={{ __html: cleanHtml(content) }}
                      onClick={(e) => { 
                        const a = e.target.closest('a[href]'); 
                        if (a && onLinkClick) {
                          const href = a.getAttribute('href');
                          // Allow normal browser behavior for external links
                          if (href.startsWith('http://') || href.startsWith('https://')) {
                            return;
                          }
                          e.preventDefault(); 
                          onLinkClick(href); 
                        } 
                      }}
                    />
                    {isLast && (
                      <>
                        {isStreaming && <span className="streaming-cursor" />}
                        {isThinking && !isStreaming && <span className="thinking-dots">...</span>}
                        {isLiveCall && liveInput && (
                          <div className="live-transcription">{liveInput}</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          );
        })()}
      </div>

      <div className="input-area">
        {isLiveCall ? (
          <div className="live-controls">
            <div className="live-copy">
              <span className="live-title">{isProcessing ? `${MOXXI_DISPLAY_NAME} IS RESPONDING...` : isHoldingUI ? 'RECORDING MANUAL INPUT' : 'LISTENING TO SUBJECT...'}</span>
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
