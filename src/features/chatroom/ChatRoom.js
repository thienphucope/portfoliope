'use client';

import React, { forwardRef } from 'react';
import { MOXXI_DISPLAY_NAME, SUGGESTED_PROMPTS } from '@/configs/ai';
import EditorStyles from '@/styles/EditorStyles';
import MarkdownStyles from '@/styles/MarkdownStyles';
import ChatRoomStyles from './styles/ChatRoomStyles';
import { ChatMarkdownContent } from './ChatMarkdownContent';
import { useChatRoomLogic } from './useChatRoomLogic';
import { ArrowUp, FileText, LoaderCircle, RotateCcw } from 'lucide-react';

const ChatRoom = forwardRef(function ChatRoom({ isEmbedded = false, noteContext = null, onLinkClick, onLiveCallChange }, ref) {
  const {
    isMounted, markdownReady,
    convo, engineInput, setEngineInput, liveInput,
    isLiveCall, isHoldingUI, isListening,
    isThinking, isStreaming, streamingText, liveToolCalls, isProcessing,
    messagesAreaRef, messagesEndRef, textareaRef,
    handleAnalyze, handlePointerDown, handlePointerUp,
    endLiveCall, resetConversation,
  } = useChatRoomLogic({ onLiveCallChange, ref, noteContext });

  if (!isMounted) return null;

  return (
    <section className={`chat-shell${isEmbedded ? ' chat-shell--embedded' : ''}`} aria-label="AI Chat Vault" style={isEmbedded ? { position: 'relative', height: '100%', width: '100%' } : {}}>
      <div className="chat-header">
        <div className="header-copy">
          <span className="chat-eyebrow">The consulting room</span>
          <h1 className="chat-overline">AI Chat Vault</h1>
          {noteContext ? (
            <p className="chat-note-context" title={noteContext.fileName}>
              <FileText size={14} strokeWidth={1.5} aria-hidden="true" />
              <span>Attached: {noteContext.fileName.split('/').pop().replace(/\.md$/i, '')}</span>
            </p>
          ) : (
            <p className="chat-description">A conversation with {MOXXI_DISPLAY_NAME}, keeper of the archives.</p>
          )}
        </div>
        <span className="chat-status" role="status"><i aria-hidden="true" />{isProcessing ? 'Thinking' : 'Text conversation'}</span>
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
                        <div className="chat-tool-calls">
                          {displayToolCalls.map((tc, ti) => {
                            const args = typeof tc.args === 'string' ? tc.args : Object.entries(tc.args || {}).map(([k, v]) => `${k}: "${v}"`).join(', ');
                            return (
                              <span key={ti}>
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
              <span className="live-title">{isProcessing ? `${MOXXI_DISPLAY_NAME} is responding…` : isHoldingUI ? 'Recording your voice' : 'Listening…'}</span>
              <span className="live-subtitle">{isProcessing ? 'Tap to interrupt' : 'Tap to reset · hold to retain'}</span>
            </div>
            <button
              className={`mic-btn${isHoldingUI ? ' holding' : isProcessing ? ' processing' : isListening ? ' listening' : ''}`}
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={(e) => { if (isHoldingUI) handlePointerUp(e); }}
            >
              {isProcessing ? 'Interrupt' : isListening ? 'Recording' : 'Waiting'}
            </button>
            <button className="end-btn" onClick={endLiveCall}>Hang up</button>
          </div>
        ) : (
          <div className="text-controls">
            <div className="textarea-row">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Ask about the archives…"
                aria-label="Message to Moxxi"
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
                  className="action-btn"
                  onClick={resetConversation}
                  disabled={isProcessing}
                  aria-label="New conversation"
                  title="New conversation"
                >
                  <RotateCcw size={16} strokeWidth={1.6} aria-hidden="true" />
                </button>
                <button
                  className="action-btn send-btn"
                  onClick={handleAnalyze}
                  disabled={!engineInput.trim() || isProcessing}
                  aria-label="Send message"
                >
                  {isProcessing ? <LoaderCircle className="chat-spinner" size={17} aria-hidden="true" /> : <ArrowUp size={18} strokeWidth={1.7} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div className="composer-note"><span>Enter to send · Shift + Enter for a new line</span><span>{MOXXI_DISPLAY_NAME}</span></div>
          </div>
        )}
      </div>

      <ChatRoomStyles isEmbedded={isEmbedded} />
      <EditorStyles />
      <MarkdownStyles />
    </section>
  );
});

export default ChatRoom;
