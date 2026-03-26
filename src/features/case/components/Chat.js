"use client";
import { useState, useRef, useEffect } from 'react';
import { ClockIcon, PaperAirplaneIcon, ArrowPathIcon, MagnifyingGlassIcon, SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { ensureLibsLoaded, postProcess } from './MarkdownEngine';

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
  const [showHistory, setShowHistory] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: "*Ask me anything about this case or contribute by create + a note* \n\n*I can play YouTube video if you want a BGM.* *I can tell Ope's secrets* \n ## 🤡 Pins\n #### 📌 [[The Boy Who Murdered Love]]\n #### 📌 [[Beautiful]] ⬅️ *click to noclip*\n " }
  ]);

 
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ragReady, setRagReady] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [apiUsername, setApiUsername] = useState('YOU');
  const [isListening, setIsListening] = useState(false);
  
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const audioQueueRef = useRef([]); 
  const pendingChunksRef = useRef([]); 
  const isPlayingRef = useRef(false); 
  const isFetchingRef = useRef(false); 
  const recognitionRef = useRef(null);
  
  const displayName = 'YOU';

  useEffect(() => {
    ensureLibsLoaded().then(() => setLibsReady(true));
  }, []);

  const TTS_API_URL = "https://thienphuc1052004--xtts-api-xttsapi-tts-generate.modal.run";
  const TTS_HEALTH_URL = "https://thienphuc1052004--xtts-api-xttsapi-ping.modal.run";

  // --- LOGIC HELPER ---
  const detectLanguage = (text) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text) ? 'vi' : 'en';
  const normalizeText = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}\s.,!?;:'"()-]/gu, '').replace(/\s+/g, ' ').trim();
  
  const splitTextSmart = (text, minWords = 40, mergeLastThreshold = 10) => {
    const rawSentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const chunks = [];
    let buffer = "";
    for (const sentence of rawSentences) {
      const candidate = (buffer + " " + sentence).trim();
      if (candidate.split(/\s+/).length < minWords) buffer = candidate;
      else { chunks.push(candidate); buffer = ""; }
    }
    if (buffer) chunks.push(buffer);
    if (chunks.length > 1 && chunks[chunks.length-1].split(/\s+/).length < mergeLastThreshold) chunks[chunks.length-2] += " " + chunks.pop();
    return chunks;
  };

  const fetchTTSChunk = async (chunk, lang) => {
    try {
      const res = await fetch(TTS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk, language: lang }),
      });
      return res.ok ? await res.blob() : null;
    } catch { return null; }
  };

  const processNextChunk = async () => {
    if (isFetchingRef.current || pendingChunksRef.current.length === 0) return;
    isFetchingRef.current = true;
    const { text, lang } = pendingChunksRef.current.shift();
    const blob = await fetchTTSChunk(text, lang);
    if (blob) {
      audioQueueRef.current.push(blob);
      if (!isPlayingRef.current) playNextAudio();
    }
    isFetchingRef.current = false;
    if (pendingChunksRef.current.length > 0) processNextChunk();
  };

  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      if (audioQueueRef.current.length === 0 && pendingChunksRef.current.length === 0 && !isFetchingRef.current) setIsPlayingAudio(false);
      return;
    }
    isPlayingRef.current = true;
    setIsPlayingAudio(true);
    const blob = audioQueueRef.current.shift();
    const url = URL.createObjectURL(blob);
    try {
      await new Promise((res, rej) => {
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); res(); };
        audio.onerror = () => { URL.revokeObjectURL(url); rej(); };
        audio.play().catch(rej);
      });
    } catch {}
    isPlayingRef.current = false;
    playNextAudio();
  };

  const generateAndPlayAudio = async (text) => {
    if (!text || !ttsReady) return;
    const normalized = normalizeText(text);
    const lang = detectLanguage(normalized);
    const chunks = splitTextSmart(normalized);
    chunks.forEach(c => pendingChunksRef.current.push({ text: c, lang }));
    processNextChunk(); processNextChunk();
  };

  useEffect(() => {
    fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => setApiUsername(`User-${d.ip.replace(/\./g, '-')}`)).catch(() => setApiUsername('Guest'));
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (e) => setInputValue(e.results[e.results.length-1][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    const msg = inputValue.trim(); setInputValue('');
    setIsSending(true);
    setIsThinking(true);
    const newConvo = [...convo, { role: 'user', content: msg }];
    setConvo(newConvo);
    setConvo(prev => [...prev, { role: 'assistant', content: '' }]);
    
    try {
      const r = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: 'ai',
          query: msg,
          history: convo, // Send previous history for context
          username: apiUsername
        })
      });
      
      if (!r.ok) throw new Error("AI request failed");
      const d = await r.json();
      const reply = d.response || "No response";

      streamResponse(reply);
      generateAndPlayAudio(reply);
    } catch { 
      setIsThinking(false);
      setConvo(prev => { 
        const n = [...prev]; 
        n[n.length-1] = {role:'assistant',content:"LLMs Error"}; 
        return n; 
      }); 
    } finally { 
      setIsSending(false); 
    }
  };

  const streamResponse = (full) => {
    setIsThinking(false);
    let i = 0; setIsStreaming(true);
    const timer = setInterval(() => {
      if (i < full.length) { setStreamingText(full.slice(0, ++i)); if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight; }
      else { clearInterval(timer); setIsStreaming(false); setConvo(p => { const n=[...p]; n[n.length-1]={role:'assistant',content:full}; return n; }); }
    }, 5);
  };

  useEffect(() => {
    const check = async () => { try { if ((await fetch("https://rag-backend-zh2e.onrender.com/status")).ok) setRagReady(true); } catch{} };
    const checkTts = async () => { try { if ((await fetch(TTS_HEALTH_URL)).ok) setTtsReady(true); } catch{ setTimeout(checkTts, 5000); } };
    check(); checkTts();
  }, []);

  useEffect(() => { if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight; }, [convo, streamingText]);

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
              ref={inputRef}
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
        <button onClick={() => recognitionRef.current?.start()} className={`${isListening ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>
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
