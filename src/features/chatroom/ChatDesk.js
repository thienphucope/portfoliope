'use client';

import { ChatMarkdownContent } from './ChatMarkdownContent';
import { useChatRoomLogic } from './useChatRoomLogic';
import ChatDeskStyles from './styles/ChatDeskStyles';
import EditorStyles from '@/styles/EditorStyles';
import MarkdownStyles from '@/styles/MarkdownStyles';
import { MOXXI_DISPLAY_NAME } from '@/configs/ai';

// ChatDesk = the live voice line. Minimal: the current spoken exchange + call
// state (listening / transcribing / responding). Full history lives in ChatRoom.
export default function ChatDesk() {
  const {
    isMounted, markdownReady,
    convo, isStreaming, streamingText, isProcessing,
    isLiveCall, isHoldingUI, isListening, liveInput,
    handlePointerDown, handlePointerUp,
    startLiveCall, endLiveCall,
  } = useChatRoomLogic();

  if (!isMounted) return null;

  let lastAssistantIdx = -1;
  for (let i = convo.length - 1; i >= 0; i--) { if (convo[i].role === 'assistant') { lastAssistantIdx = i; break; } }
  const moxxiText = (lastAssistantIdx === convo.length - 1 && isStreaming)
    ? streamingText
    : (convo[lastAssistantIdx]?.content || '');
  const hadExchange = convo.some(m => m.role === 'user');

  const liveStatus = isProcessing ? 'responding' : (liveInput && liveInput.trim()) ? 'transcribing' : 'listening';
  const statusLabel = liveStatus === 'responding' ? `${MOXXI_DISPLAY_NAME} is responding`
    : liveStatus === 'transcribing' ? 'Transcribing' : 'Listening';

  return (
    <div className="live-desk">
      <div className="live-shell">
        <header className="live-header">
          <div className="live-overline info-wrap">
            Live line
            <span className="info-icon" data-tooltip="Voice call with Moxxi — speak and she answers aloud. Text history lives in the text room.">i</span>
          </div>
        </header>

        <div className="live-stage">
          {isLiveCall ? (
            <>
              <div className={`live-status live-status--${liveStatus}`}>
                <span className="live-dot" />
                {statusLabel}
              </div>

              {liveInput
                ? <p className="live-say">“{liveInput}”</p>
                : !isProcessing && <p className="live-say live-say--hint">Speak whenever you’re ready.</p>}

              {hadExchange && moxxiText && (
                <div className="live-reply">
                  <ChatMarkdownContent content={moxxiText} markdownReady={markdownReady} isStreaming={lastAssistantIdx === convo.length - 1 && isStreaming} />
                </div>
              )}
            </>
          ) : (
            <p className="live-idle">Open a live line and talk to {MOXXI_DISPLAY_NAME}.</p>
          )}
        </div>

        <div className="live-bar">
          {isLiveCall ? (
            <>
              <span className="live-hint">{isProcessing ? 'tap to interrupt' : 'tap to reset · hold to retain'}</span>
              <button
                className={`mic-btn${isHoldingUI ? ' holding' : isProcessing ? ' processing' : isListening ? ' listening' : ''}`}
                onContextMenu={(e) => e.preventDefault()}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={(e) => { if (isHoldingUI) handlePointerUp(e); }}
              >
                {isProcessing ? 'HALT' : isListening ? 'REC' : 'WAIT'}
              </button>
              <button className="end-btn" onClick={endLiveCall}>Hang up</button>
            </>
          ) : (
            <button className="start-call-btn" onClick={startLiveCall}>Start live call</button>
          )}
        </div>
      </div>

      <ChatDeskStyles />
      <EditorStyles />
      <MarkdownStyles />
    </div>
  );
}
