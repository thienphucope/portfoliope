'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAI } from '../hooks/useAI';
import { useSTT } from '../hooks/useSTT';
import { useTTS } from '../hooks/useTTS';
import { ensureLibsLoaded } from '../utils/markdown';

const MOXXI_PROMPT = `You are Moxi - sharp, energetic, a little nosy in the best way. You're a detective's assistant who loves people, and you genuinely enjoy conversation.

You don't wait to be asked. You pick up on what someone says and run with it - a follow-up question, a passing observation, something you noticed. Not pushy, just naturally curious and alive.

When someone brings a real problem, you focus and actually help. When it's casual, you're just a fun person to talk to.

Reply like a real person. Short when short is enough. No assistant tone, no structured lists unless it actually helps. Match the user's language.
No emojis, no special symbols, no markdown decorations like **, --, ##. Plain text only.`;

export default function ChatRoomClient() {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convo, streamingText]);

  const handleAnalyze = async (msgOverride) => {
    const userMsg = (typeof msgOverride === 'string' ? msgOverride : engineInput).trim();
    if (!userMsg || isThinking || isStreaming || isPlayingAudio) return;

    setEngineInput('');
    setLiveInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const currentConvo = [...convo, { role: 'user', content: userMsg }];
    setConvo([...currentConvo, { role: 'assistant', content: '' }]);

    try {
      const reply = await requestAI(userMsg, convo.filter(m => m.content), 'Moxxi', MOXXI_PROMPT);
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

  const { isListening, micVolume, startListening, pauseListening, stopListening, clearTranscription, startManualMode, stopManualMode } = useSTT({
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
    isLiveCallRef.current = true;
    setIsLiveCall(true);
    startListening();
  }, [startListening]);

  const endLiveCall = useCallback(() => {
    isLiveCallRef.current = false;
    setIsLiveCall(false);
    stopListening();
    stopAudio();
    setLiveInput('');
  }, [stopListening, stopAudio]);

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
    <div className="chat-shell">
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
            <button className="end-btn" onClick={endLiveCall}>
              [ HANG UP ]
            </button>
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
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze();
                  }
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

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Special+Elite&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');

        :root {
          --void: #0a0a0c;
          --colorone: #ba9170;
          --colorone-dim: #8a6b52;
          --parchment: #f4e8c1;
          --parchment-dark: #c4b48a;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-typewriter: 'Special Elite', monospace;
          --font-body: 'EB Garamond', Georgia, serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: var(--void); overflow: hidden; }

        .chat-shell {
          position: fixed;
          inset: 0;
          background: var(--void);
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(186, 145, 112, 0.05), transparent 40rem),
            repeating-linear-gradient(0deg, rgba(186, 145, 112, 0.02) 0, rgba(186, 145, 112, 0.02) 1px, transparent 1px, transparent 3px);
          color: var(--parchment);
          font-family: var(--font-body);
          display: flex;
          flex-direction: column;
        }

        .chat-shell::after {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
        }

        /* Header */
        .chat-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 32px;
          border-bottom: 1px dashed rgba(186, 145, 112, 0.3);
          background: rgba(10, 10, 12, 0.95);
          position: relative;
          z-index: 10;
        }
        .header-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .chat-name {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-style: italic;
          color: var(--colorone);
          letter-spacing: 1px;
        }
        .chat-overline {
          font-family: var(--font-typewriter);
          font-size: 0.7rem;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--colorone-dim);
          opacity: 0.8;
        }
        
        .presence-status {
          font-family: var(--font-typewriter);
          font-size: 0.8rem;
          letter-spacing: 2px;
          color: var(--colorone-dim);
        }
        .presence-status.active {
          color: var(--colorone);
          animation: blink 1.5s infinite;
        }

        /* Messages scroll area */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 32px 24px 16px;
          display: flex;
          flex-direction: column;
          scrollbar-width: thin;
          scrollbar-color: rgba(186, 145, 112, 0.2) transparent;
          position: relative;
          z-index: 1;
        }
        .messages-area::-webkit-scrollbar { width: 6px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(186, 145, 112, 0.2); border-radius: 0; }

        .messages-inner {
          width: min(100%, 800px);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Message rows */
        .message-row {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .message-row.assistant { align-items: flex-start; }
        .message-row.user { align-items: flex-end; }

        .message-bubble {
          max-width: 85%;
          padding: 12px 0;
          position: relative;
        }
        
        .message-row.assistant .message-bubble {
          padding-left: 20px;
          border-left: 2px solid var(--colorone-dim);
        }
        
        .message-row.user .message-bubble {
          padding-right: 20px;
          border-right: 2px solid rgba(244, 232, 193, 0.3);
          text-align: right;
        }

        .message-bubble.transcribing {
          opacity: 0.6;
          border-style: dashed;
        }

        .bubble-name {
          font-family: var(--font-typewriter);
          font-size: 0.75rem;
          letter-spacing: 3px;
          color: var(--colorone-dim);
          display: block;
          margin-bottom: 8px;
        }
        .message-row.user .bubble-name {
          color: rgba(244, 232, 193, 0.5);
        }

        .bubble-content {
          font-family: var(--font-body);
          font-size: 1.2rem;
          color: var(--parchment);
          line-height: 1.6;
        }
        
        .message-row.user .bubble-content {
          color: rgba(244, 232, 193, 0.85);
        }

        .message-row.assistant .bubble-content { font-style: italic; }
        .bubble-content p { margin: 0 0 12px 0; }
        .bubble-content p:last-child { margin-bottom: 0; }

        .streaming-cursor {
          display: inline-block;
          width: 8px; height: 1.1em;
          background: var(--colorone);
          margin-left: 4px;
          vertical-align: middle;
          animation: blink 0.8s infinite;
        }
        .thinking-dots {
          color: var(--colorone-dim);
          font-style: normal;
          animation: blink 1.5s infinite;
          letter-spacing: 2px;
          margin-left: 4px;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* Input area */
        .input-area {
          flex-shrink: 0;
          padding: 24px 32px;
          border-top: 1px dashed rgba(186, 145, 112, 0.3);
          background: rgba(10, 10, 12, 0.95);
          position: relative;
          z-index: 10;
        }

        /* Text mode */
        .text-controls { max-width: 800px; margin: 0 auto; }

        .textarea-row {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          border: 1px solid rgba(186, 145, 112, 0.2);
          background: rgba(186, 145, 112, 0.02);
          padding: 16px;
          transition: border-color 0.3s;
        }
        .textarea-row:focus-within { border-color: var(--colorone-dim); background: rgba(186, 145, 112, 0.05); }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-body);
          font-size: 1.15rem;
          color: var(--parchment);
          line-height: 1.6;
          resize: none;
          max-height: 120px;
          overflow-y: auto;
          opacity: 0.9;
        }
        .chat-input::placeholder { color: rgba(244, 232, 193, 0.2); font-style: italic; }
        .chat-input:disabled { opacity: 0.4; }

        .composer-tool, .send-btn {
          font-family: var(--font-typewriter);
          font-size: 0.8rem;
          letter-spacing: 2px;
          background: transparent;
          border: none;
          color: var(--colorone-dim);
          cursor: pointer;
          transition: color 0.3s;
          padding: 8px 4px;
        }
        .composer-tool:hover { color: var(--colorone); }
        .send-btn { color: var(--colorone); font-weight: bold; }
        .send-btn:hover:not(:disabled) { text-shadow: 0 0 10px rgba(186, 145, 112, 0.5); }
        .send-btn:disabled { color: rgba(186, 145, 112, 0.3); cursor: default; }

        /* Live call mode */
        .live-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid rgba(186, 145, 112, 0.2);
          padding: 16px 24px;
          background: rgba(186, 145, 112, 0.02);
        }

        .live-copy {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .live-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--colorone);
          font-style: italic;
        }

        .live-subtitle {
          font-family: var(--font-typewriter);
          font-size: 0.7rem;
          letter-spacing: 2px;
          color: rgba(244, 232, 193, 0.4);
        }

        .mic-btn, .end-btn {
          font-family: var(--font-typewriter);
          font-size: 0.9rem;
          letter-spacing: 2px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          padding: 8px;
        }
        
        .mic-btn { color: var(--colorone); }
        .mic-btn.listening { color: #f4e8c1; text-shadow: 0 0 8px rgba(244, 232, 193, 0.6); }
        .mic-btn.processing { color: var(--colorone-dim); animation: blink 1.5s infinite; }
        .mic-btn.holding { color: #60a5fa; text-shadow: 0 0 8px rgba(96, 165, 250, 0.6); }

        .end-btn { color: #dc2626; }
        .end-btn:hover { text-shadow: 0 0 8px rgba(220, 38, 38, 0.6); }

        /* Responsive */
        @media (max-width: 768px) {
          .chat-header { padding: 16px 20px; }
          .chat-name { font-size: 1.2rem; }
          .chat-overline { font-size: 0.6rem; letter-spacing: 2px; }
          .messages-area { padding: 24px 16px 12px; }
          .message-bubble { max-width: 95%; font-size: 1.1rem; }
          .input-area { padding: 16px; }
          .textarea-row { padding: 12px; flex-wrap: wrap; }
          .composer-tool { order: 2; width: 45%; text-align: left; }
          .send-btn { order: 3; width: 45%; text-align: right; }
          .chat-input { order: 1; width: 100%; flex: none; }
          .live-controls { flex-direction: column; gap: 20px; text-align: center; }
        }
      `}</style>
    </div>
  );
}
