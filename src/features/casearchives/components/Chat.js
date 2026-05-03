"use client";
import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ClockIcon, PaperAirplaneIcon, SpeakerWaveIcon, MicrophoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ensureLibsLoaded, postProcess } from '../utils/markdown';
import { useAI } from '../hooks/useAI';
import { useTTS } from '../hooks/useTTS';
import { useSTT } from '../hooks/useSTT';

/**
 * AI chat interface component for the case vault application.
 * Features streaming responses, text-to-speech synthesis, speech recognition,
 * and integration with RAG backend for contextual queries.
 */

function MessageContent({ role, content, isStreaming, onLinkClick, libsReady }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current || !window.marked) return;
    try {
      const name = role === 'user' ? 'You' : 'Librarian';
      const prefix = role === 'user' ? `**${name}:** ` : `\n**${name}:** \n\n`;
      let html = window.marked.parse(prefix + (content || ''));
      
      html = html.replace(/(?:<div[^>]*video-container[^>]*>\s*)?(<iframe[^>]*>[\s\S]*?<\/iframe>)(?:\s*<\/div>)?/gi, '<div class="video-container interactable">$1</div>');

      if (isStreaming) {
        const cursorHtml = '<span class="streaming-cursor"></span>';
        if (html.includes('</p>')) {
          html = html.replace(/<\/p>\s*$/, ` ${cursorHtml}</p>`);
        } else {
          html += cursorHtml;
        }
      }
      
      divRef.current.innerHTML = html;
      postProcess(divRef.current);
    } catch (e) {
      divRef.current.textContent = content;
    }
  }, [role, content, isStreaming, libsReady]);

  return <div ref={divRef} className="markdown-content" onClick={onLinkClick} />;
}

const Chat = forwardRef(({ isEmbedded = false, onLinkClick, onLiveCallChange }, ref) => {
  const [isOpen, setIsOpen] = useState(isEmbedded ? true : false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const CONVO_KEY = 'vault_chat_convo';
  const defaultMessage = { role: 'assistant', content: "*Ask me anything about this case or contribute by create + a note* \n\n*I can play YouTube video if you want a BGM.* *I can tell Ope's secrets* \n ## 🤡 Pins\n #### 📌 [[The Boy Who Murdered Love]]\n #### 📌 [[Beautiful]] ⬅️ *click to noclip*\n " };
  const [convo, setConvo] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CONVO_KEY);
      return saved ? JSON.parse(saved) : [defaultMessage];
    } catch { return [defaultMessage]; }
  });

  useEffect(() => {
    try { sessionStorage.setItem(CONVO_KEY, JSON.stringify(convo)); } catch {}
  }, [convo]);

  const [ragReady, setRagReady] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [apiUsername, setApiUsername] = useState('YOU');
  
  const [isLiveCall, setIsLiveCall] = useState(false);
  
  // Notify parent of live call state changes
  useEffect(() => {
    if (onLiveCallChange) onLiveCallChange(isLiveCall);
  }, [isLiveCall, onLiveCallChange]);

  const { isThinking, isStreaming, streamingText, requestAI, streamResponse, stopAI } = useAI();
  const { isPlayingAudio, ttsReady, streamAudioLive, stopAudio, checkTtsHealth } = useTTS();
  
  const isProcessing = isThinking || isStreaming || isPlayingAudio;
  const isProcessingRef = useRef(false);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  const executeInterrupt = useCallback(() => {
    stopAudio();
    stopAI();
    setConvo(prev => {
      const n = [...prev];
      if (n.length > 0 && n[n.length - 1].role === 'assistant' && !n[n.length - 1].content) {
          n[n.length - 1].content = "*(Interrupted)*";
      }
      return n;
    });
    setIsSending(false);
    setInputValue('');
  }, [stopAudio, stopAI]);

  const handleSendAutomated = async (msg) => {
    if (!msg || isSending) return;
    setInputValue('');
    setIsSending(true);
    stopAudio();

    const newConvo = [...convo, { role: 'user', content: msg }];
    setConvo(newConvo);
    setConvo(prev => [...prev, { role: 'assistant', content: '' }]);
    
    try {
      const reply = await requestAI(msg, convo, apiUsername);
      streamResponse(reply, (fullText) => {
        setConvo(p => { 
          const n = [...p]; 
          n[n.length - 1] = { role: 'assistant', content: fullText }; 
          return n; 
        });
      });
      if (isLiveCall) streamAudioLive(reply);
    } catch { 
      setConvo(prev => { 
        const n = [...prev]; 
        n[n.length - 1] = { role: 'assistant', content: "LLMs Error" }; 
        return n; 
      }); 
    } finally { 
      setIsSending(false); 
    }
  };

  const { isListening, micVolume, startListening, stopListening, pauseListening, clearTranscription, startManualMode, stopManualMode } = useSTT({ 
    onResult: (text) => {
      if (!text) { setInputValue(''); return; }
      if (isProcessingRef.current) {
        const lower = text.toLowerCase();
        if (/\b(no|wait|interrupt|interupt|stop)\b/i.test(lower)) executeInterrupt();
        clearTranscription();
        return;
      }
      setInputValue(text);
    },
    onSilence: (text) => {
      if (isLiveCall && text && !isProcessingRef.current) handleSendAutomated(text);
    }
  });

  useEffect(() => { 
    if (isLiveCall) {
      if (isProcessing) startListening();
      else { clearTranscription(); setInputValue(''); startListening(); }
    }
  }, [isProcessing, isLiveCall, startListening, clearTranscription]);

  const toggleLiveCall = useCallback(() => {
    if (isLiveCall) { setIsLiveCall(false); stopListening(); stopAudio(); }
    else { setIsLiveCall(true); startListening(); }
  }, [isLiveCall, stopListening, stopAudio, startListening]);

  useImperativeHandle(ref, () => ({ toggleLiveCall, isLiveCall }));

  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  
  const historyRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const liveUIRef = useRef(null);

  const handleInterrupt = useCallback((e) => {
    if (isLiveCall) {
      if (isProcessing) { executeInterrupt(); clearTranscription(); }
      else { clearTranscription(); setInputValue(''); startListening(); }
    }
  }, [isLiveCall, isProcessing, executeInterrupt, startListening, clearTranscription]);

  const holdTimerRef = useRef(null);
  const releaseTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const [isHoldingUI, setIsHoldingUI] = useState(false);

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
      clearTranscription(); setInputValue(''); handleInterrupt(e);
    }
  }, [handleInterrupt, stopManualMode, clearTranscription]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    handleSendAutomated(inputValue.trim());
  };

  useEffect(() => { ensureLibsLoaded().then(() => setLibsReady(true)); }, []);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setApiUsername(`User-${d.ip.replace(/\./g, '-')}`))
      .catch(() => setApiUsername('Guest'));
  }, []);

  useEffect(() => {
    if (isLiveCall) {
      setTipIndex(0); setTipVisible(true);
      const intv = setInterval(() => {
        setTipVisible(false);
        setTimeout(() => { setTipIndex(i => (i + 1) % 5); setTipVisible(true); }, 500);
      }, 5000);
      return () => clearInterval(intv);
    }
  }, [isLiveCall]);

  useEffect(() => { 
    if (!isStreaming && !isThinking) {
      setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }); }, 50);
    }
  }, [convo.length, isStreaming, isThinking]);

  useEffect(() => {
    if (isLiveCall && window.innerWidth < 768) {
      setTimeout(() => { liveUIRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' }); }, 300);
    }
  }, [isLiveCall]);

  const tipsList = [
    <span key="tip1">Say <strong className="text-white/80">no</strong>, <strong className="text-white/80">wait</strong>, <strong className="text-white/80">stop</strong>, or tap the mic to interrupt.</span>,
    <span key="tip2"><strong className="text-white/80">Hold the mic</strong> to continuously record without auto-sending until released.</span>,
    <span key="tip3"><strong className="text-white/80">Tap the mic</strong> while recording to delete the current message.</span>,
    <span key="tip4">If voice recognition stalls, reopen the call or type directly.</span>,
    <span key="tip5">Headphones are highly recommended!</span>
  ];

  if (!isOpen && !isEmbedded) return null;

  return (
    <div className={`${isEmbedded ? 'relative h-full w-full' : 'fixed inset-0 z-50'} bg-transparent overflow-hidden`} style={{ fontFamily: "'Crimson Text', serif" }}>
      <div className="w-full h-full flex flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth relative">
      {isLiveCall && (
        <div ref={liveUIRef} className="w-full shrink-0 md:w-1/2 h-full flex flex-col items-center justify-between p-5 md:p-10 border-l bg-transparent relative snap-center order-2" style={{ borderColor: 'var(--colorborder)' }}>
            <div className="flex-1 w-full flex flex-col justify-end pb-8 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Listening, or type your prompt..."
                  className="bg-transparent text-center text-white/90 text-2xl font-bold border-none focus:ring-0 outline-none w-full resize-none placeholder-white/20"
                  style={{ fontFamily: 'md-font' }}
                  rows={4}
                />
            </div>
            <div className="shrink-0 py-4 flex items-center justify-center">
                <div 
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={(e) => isHoldingRef.current && handlePointerUp(e)}
                  className={`select-none w-32 h-32 md:w-40 md:h-40 rounded-full transition-all duration-100 flex items-center justify-center relative shadow-[0_0_15px_rgba(255,255,255,0.1)] z-10
                    ${isListening && !isProcessing ? 'shadow-[0_0_60px_var(--colorone)]' : ''} 
                    ${isProcessing ? 'animate-pulse scale-95 cursor-pointer' : 'cursor-pointer'}
                    ${isHoldingUI ? 'scale-110 shadow-[0_0_70px_#60a5fa]' : ''}
                  `} 
                  style={{ 
                    backgroundColor: isHoldingUI ? '#60a5fa' : 'var(--colorone, #ccc)',
                    transform: (isListening && !isProcessing && !isHoldingUI) ? `scale(${1 + micVolume * 0.4})` : undefined,
                    WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none'
                  }}
                >
                  {isProcessing ? <div className="text-black/60 text-sm font-bold tracking-wider">INTERRUPT</div> : <MicrophoneIcon className="w-12 h-12 text-black/50" />}
                </div>
            </div>
            <div className="flex-1 w-full pt-8 flex flex-col items-center justify-start overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="text-white/50 text-sm max-w-[260px] font-sans leading-relaxed text-center min-h-[6rem] flex items-center justify-center" style={{ fontFamily: 'md-font' }}>
                <div className="flex flex-col items-center justify-center" style={{ opacity: tipVisible ? 1 : 0, transform: tipVisible ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.5s ease-in-out' }}>
                  <span className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-bold block">Tip {tipIndex + 1} of {tipsList.length}</span>
                  <p>{tipsList[tipIndex]}</p>
                </div>
              </div>
            </div>
        </div>
      )}

      <div className={`w-full shrink-0 ${isLiveCall ? 'md:w-1/2' : 'w-full'} h-full flex flex-col bg-transparent relative snap-center order-1`}>
          <div ref={historyRef} className="flex-1 overflow-y-auto p-[10px] chat-history">
            <div className="max-w-[1000px] mx-auto w-full space-y-5">
            {convo.map((msg, i) => {
              const isMsgStreaming = (i === convo.length - 1 && isStreaming);
              const isMsgThinking = (i === convo.length - 1 && isThinking);
              const content = isMsgStreaming ? streamingText : (isMsgThinking ? "Thinking..." : msg.content);
              if (!content && i !== convo.length-1 && !isMsgThinking) return null;
              return (
                <div key={i} className={`${isEmbedded ? 'text-base' : 'text-lg'} leading-relaxed text-justify opacity-90`}>
                  {msg.role === 'user' && i > 0 && <hr className="rte-hr" style={{ margin: '1.5em 0', borderBottom: '1px solid white' }} />}
                  <MessageContent role={msg.role} content={content} isStreaming={isMsgStreaming} onLinkClick={onLinkClick} libsReady={libsReady} />
                </div>
              );
            })}
            {!isStreaming && !isThinking && !isLiveCall && (
              <>
                {convo.length > 0 && <hr className="rte-hr" style={{ margin: '1.5em 0', borderBottom: '1px solid white' }} />}
                <div className={`${isEmbedded ? 'text-base' : 'text-lg'} flex items-start opacity-90 markdown-content`}>
                  <p className="m-0"><strong className="whitespace-nowrap">You:&nbsp;</strong></p>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="type here..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white p-0 leading-relaxed outline-none placeholder-white/20"
                    style={{ caretColor: 'white' }}
                  />
                </div>
              </>
            )}
            <div ref={messagesEndRef} className="h-px w-full pointer-events-none opacity-0" />
            </div>
          </div>
          {!isLiveCall && (
              <div className="max-w-[1000px] w-full mx-auto px-[10px] py-2 flex justify-start items-center opacity-30">
                <button onClick={startListening} className={`${isListening && !isLiveCall ? 'text-red-500 animate-pulse' : 'text-white/40'}`} title="Hold to Dictate">
                  <MicrophoneIcon className="w-4 h-4" />
                </button>
              </div>
          )}
      </div>
      </div>

      <style jsx>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 1s infinite; }
        .markdown-content :global(p:last-child) { margin-bottom: 0; }
        .markdown-content :global(p:first-child) { margin-top: 0; }
        .markdown-content :global(.streaming-cursor) {
          display: inline-block; width: 2px; height: 1em; background: white; margin-left: 4px; vertical-align: middle; animation: pulse 1s infinite;
        }
      `}</style>
    </div>
  );
});

Chat.displayName = 'Chat';

export default Chat;
