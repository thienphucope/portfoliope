'use client';

import React, { forwardRef } from 'react';
import { MOXXI_DISPLAY_NAME, SUGGESTED_PROMPTS } from '@/configs/ai';
import EditorStyles from '@/styles/EditorStyles';
import MarkdownStyles from '@/styles/MarkdownStyles';
import ChatRoomStyles from './styles/ChatRoomStyles';
import { ChatMarkdownContent } from './ChatMarkdownContent';
import { useChatRoomLogic } from './useChatRoomLogic';

const ChatRoom = forwardRef(function ChatRoom({ isEmbedded = false, onLinkClick, onLiveCallChange }, ref) {
  const {
    isMounted, markdownReady,
    convo, engineInput, setEngineInput, liveInput,
    isLiveCall, isHoldingUI, isListening,
    isThinking, isStreaming, streamingText, liveToolCalls, isProcessing,
    messagesAreaRef, messagesEndRef, textareaRef,
    handleAnalyze, handlePointerDown, handlePointerUp,
    startLiveCall, endLiveCall, resetConversation,
  } = useChatRoomLogic({ onLiveCallChange, ref });

  if (!isMounted) return null;

  return (
    <div className="chat-shell" style={isEmbedded ? { position: 'relative', height: '100%', width: '100%' } : {}}>
      <div className="chat-header">
        <div className="header-copy">
          <div className="chat-overline info-wrap">
            Consult
            <span className="info-icon" data-tooltip="Text/Voice workspace to chat with Moxxi and search documents">i</span>
          </div>
        </div>
      </div>

      <div className="messages-area">
        {(() => {
          const assistantMsgs = convo.filter(m => m.role === 'assistant');

          return (
            <div className="messages-list" ref={messagesAreaRef}>
              {assistantMsgs.map((msg, i) => {
                const isLast = i === assistantMsgs.length - 1;
                const content = (isLast && isStreaming) ? streamingText : (msg.content || '');
                return (
                  <div key={i} className={isLast ? "chat-response" : "history-entry"}>
                    {(() => {
                      const displayToolCalls = isLast && (isThinking || isStreaming) ? liveToolCalls : (msg.toolCalls || []);
                      if (!displayToolCalls.length) return null;
                      return (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--theme)', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                          {displayToolCalls.map((tc, ti) => {
                            const args = typeof tc.args === 'string' ? tc.args : Object.entries(tc.args || {}).map(([k, v]) => `${k}: "${v}"`).join(', ');
                            return (
                              <span key={ti} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {ti > 0 && <span style={{ opacity: 0.3, lineHeight: '1.4' }}>|</span>}
                                <span>{tc.name}{args ? ` — ${args}` : ''}</span>
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <ChatMarkdownContent content={content} markdownReady={markdownReady} onLinkClick={onLinkClick} isStreaming={isLast && isStreaming} />
                    {isLast && (
                      <>
                        {isStreaming && <span className="streaming-cursor" />}
                        {isThinking && !isStreaming && <span className="thinking-dots">...</span>}
                        {isLiveCall && liveInput && (
                          <div className="live-transcription">{liveInput}</div>
                        )}
                      </>
                    )}
                    {i === 0 && convo.length === 1 && !isProcessing && (
                      <div className="suggest-prompts">
                        {SUGGESTED_PROMPTS.map((p, pi) => (
                          <button key={pi} className="suggest-btn" onClick={() => handleAnalyze(p)}>{p}</button>
                        ))}
                      </div>
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
              onPointerLeave={(e) => { if (isHoldingUI) handlePointerUp(e); }}
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
              <div className="textarea-actions">
                <button
                  className={`action-btn${isLiveCall ? ' active' : ''}`}
                  onClick={isLiveCall ? endLiveCall : startLiveCall}
                  disabled={isProcessing && !isLiveCall}
                >
                  {isLiveCall ? '[ LIVE ]' : '[ VOICE ]'}
                </button>
                <button
                  className="action-btn"
                  onClick={resetConversation}
                  disabled={isProcessing}
                >
                  {'[ NEW ]'}
                </button>
                <button
                  className="action-btn send-btn"
                  onClick={handleAnalyze}
                  disabled={!engineInput.trim() || isProcessing}
                  aria-label="Send message"
                >
                  {isProcessing ? '[ BUSY ]' : '[ SEND ]'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatRoomStyles isEmbedded={isEmbedded} />
      <EditorStyles />
      <MarkdownStyles />
    </div>
  );
});

export default ChatRoom;
