"use client";
import { useState, useRef, useEffect } from 'react';
import { ClockIcon, PaperAirplaneIcon, ArrowPathIcon, MagnifyingGlassIcon, SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
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

export default function Chat({ isEmbedded = false, onLinkClick }) {
  const [isOpen, setIsOpen] = useState(isEmbedded ? true : false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: "*Ask me anything about this case or contribute by create + a note* \n\n*I can play YouTube video if you want a BGM.* *I can tell Ope's secrets* \n ## 🤡 Pins\n #### 📌 [[The Boy Who Murdered Love]]\n #### 📌 [[Beautiful]] ⬅️ *click to noclip*\n " }
  ]);

  const [ragReady, setRagReady] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [apiUsername, setApiUsername] = useState('YOU');
  
  const historyRef = useRef(null);
  
  const { isThinking, isStreaming, streamingText, requestAI, streamResponse } = useAI();
  const { isPlayingAudio, ttsReady, generateAndPlayAudio, checkTtsHealth } = useTTS();
  const { isListening, startListening } = useSTT({ onResult: setInputValue });

  useEffect(() => {
    ensureLibsLoaded().then(() => setLibsReady(true));
  }, []);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setApiUsername(`User-${d.ip.replace(/\./g, '-')}`))
      .catch(() => setApiUsername('Guest'));
    
    const checkRag = async () => { 
      try { 
        if ((await fetch("https://rag-backend-zh2e.onrender.com/status")).ok) setRagReady(true); 
      } catch{} 
    };
    
    checkRag();
    checkTtsHealth();
  }, [checkTtsHealth]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    const msg = inputValue.trim(); 
    setInputValue('');
    setIsSending(true);
    
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
      generateAndPlayAudio(reply);
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

  useEffect(() => { 
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight; 
  }, [convo, streamingText]);

  const style = {
    fontFamily: "'Crimson Text', serif",
    bg: "bg-transparent",
    border: "border-white/10",
    text: "text-white/90",
    accent: "text-white"
  };

  if (!isOpen && !isEmbedded) return null;

  return (
    <div className={`${isEmbedded ? 'relative h-full w-full' : 'fixed inset-0 z-50'} flex flex-col bg-transparent overflow-hidden`} style={{ fontFamily: style.fontFamily }}>
      {/* History */}
      <div ref={historyRef} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar chat-history">
        {convo.map((msg, i) => {
          const isMsgStreaming = (i === convo.length - 1 && isStreaming);
          const isMsgThinking = (i === convo.length - 1 && isThinking);
          const content = isMsgStreaming ? streamingText : (isMsgThinking ? "Thinking..." : msg.content);
          if (!content && i !== convo.length-1 && !isMsgThinking) return null;
          return (
            <div key={i} className={`${isEmbedded ? 'text-base' : 'text-lg'} leading-relaxed text-justify opacity-90`}>
              <MessageContent 
                role={msg.role} 
                content={content} 
                isStreaming={isMsgStreaming} 
                onLinkClick={onLinkClick}
                libsReady={libsReady}
              />
            </div>
          );
        })}
        
        {/* Inline Input */}
        {!isStreaming && !isThinking && (
          <div className={`${isEmbedded ? 'text-base' : 'text-lg'} flex items-start opacity-90 markdown-content`}>
            <p className="m-0"><strong className="whitespace-nowrap">You:&nbsp;</strong></p>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="type here..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white p-0 leading-relaxed outline-none placeholder-white/20"
              style={{ caretColor: 'white' }}
            />
          </div>
        )}
      </div>

      {/* Status */}
      <div className="px-5 py-2 flex justify-between items-center opacity-30">
        <button onClick={startListening} className={`${isListening ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>
          <MicrophoneIcon className="w-4 h-4" />
        </button>
        <div className="flex space-x-4">
          {ragReady ? <MagnifyingGlassIcon className="w-4 h-4" /> : <ArrowPathIcon className="w-4 h-4 animate-spin" />}
          {ttsReady ? <SpeakerWaveIcon className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} /> : <ArrowPathIcon className="w-4 h-4 animate-spin" />}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 1s infinite; }
        .markdown-content :global(p:last-child) { margin-bottom: 0; }
        .markdown-content :global(p:first-child) { margin-top: 0; }
        .markdown-content :global(.streaming-cursor) {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: white;
          margin-left: 4px;
          vertical-align: middle;
          animation: pulse 1s infinite;
        }
      `}</style>
    </div>
  );
}
