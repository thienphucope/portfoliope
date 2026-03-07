"use client";
import { useState, useRef, useEffect } from 'react';
import { ClockIcon, PaperAirplaneIcon, ArrowPathIcon, MagnifyingGlassIcon, SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

export default function Pop({ isEmbedded = false }) {
  const [isOpen, setIsOpen] = useState(isEmbedded ? true : false);
  const [showHistory, setShowHistory] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: "Xin chào, tớ là Thiên. Cậu cần tớ giúp gì không? (tag @ope to message me)" }
  ]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ragReady, setRagReady] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);
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
  
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  const displayName = 'YOU';

  const TTS_API_URL = "https://thienphuc1052004--viterbox-api-viterboxapi-tts.modal.run";
  const TTS_HEALTH_URL = "https://thienphuc1052004--viterbox-api-viterboxapi-health.modal.run/";

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
        body: JSON.stringify({ text: chunk, language: lang, temperature: 0.5 }),
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
    const newConvo = [...convo, { role: 'user', content: msg }];
    setConvo(newConvo);
    setConvo(prev => [...prev, { role: 'assistant', content: '' }]);
    try {
      let reply;
      if (ragReady) {
        const r = await fetch("https://rag-backend-zh2e.onrender.com/rag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: apiUsername, query: msg }) });
        const d = await r.json(); reply = d.response || "No response";
      } else {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{role:"user",parts:[{text:"System: Speak concise."}]}, ...newConvo.map(m=>({role:m.role==='user'?"user":"model",parts:[{text:m.content}]}))] }) });
        const d = await r.json(); reply = d.candidates?.[0]?.content?.parts?.[0]?.text || "Error";
      }
      streamResponse(reply);
      generateAndPlayAudio(reply);
    } catch { setConvo(prev => { const n = [...prev]; n[n.length-1] = {role:'assistant',content:"Error"}; return n; }); }
    finally { setIsSending(false); }
  };

  const streamResponse = (full) => {
    let i = 0; setIsStreaming(true);
    const timer = setInterval(() => {
      if (i < full.length) { setStreamingText(full.slice(0, ++i)); if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight; }
      else { clearInterval(timer); setIsStreaming(false); setConvo(p => { const n=[...p]; n[n.length-1]={role:'assistant',content:full}; return n; }); }
    }, 15);
  };

  useEffect(() => {
    const check = async () => { try { if ((await fetch("https://rag-backend-zh2e.onrender.com/status")).ok) setRagReady(true); } catch{} };
    const checkTts = async () => { try { if ((await fetch(TTS_HEALTH_URL)).ok) setTtsReady(true); } catch{ setTimeout(checkTts, 5000); } };
    check(); checkTts();
  }, []);

  useEffect(() => { if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight; }, [convo, streamingText]);

  const style = {
    fontFamily: "'Crimson Text', serif",
    bg: "bg-[#121212]",
    border: "border-white/10",
    text: "text-white/90",
    accent: "text-white"
  };

  if (!isOpen && !isEmbedded) return (
    <button onClick={() => setIsOpen(true)} className="fixed top-0 right-0 w-12 h-12 rounded-full z-50 hover:scale-110 transition-all">
      <img src="/printer.png" className="w-full h-full rounded-full opacity-80" />
    </button>
  );

  return (
    <div className={`${isEmbedded ? 'relative h-full w-full' : 'fixed inset-0 z-50'} flex flex-col bg-[#121212] overflow-hidden`} style={{ fontFamily: style.fontFamily }}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/30">
        <span className="font-bold tracking-widest text-[10px] opacity-40 font-sans">CHAT VAULT</span>
        {!isEmbedded && <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">✕</button>}
      </div>

      {/* History */}
      <div ref={historyRef} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {convo.map((msg, i) => {
          const content = (i === convo.length - 1 && isStreaming) ? streamingText : msg.content;
          if (!content && i !== convo.length-1) return null;
          return (
            <div key={i} className={`${isEmbedded ? 'text-base' : 'text-lg'} leading-relaxed text-justify opacity-90`}>
              <span className="font-bold text-white mr-2">{msg.role === 'user' ? 'YOU:' : 'THIÊN:'}</span>
              <span className="whitespace-pre-wrap">{content}</span>
              {i === convo.length - 1 && isStreaming && <span className="animate-pulse">|</span>}
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div className="px-5 py-2 flex justify-end space-x-4 opacity-30">
        {ragReady ? <MagnifyingGlassIcon className="w-4 h-4" /> : <ArrowPathIcon className="w-4 h-4 animate-spin" />}
        {ttsReady ? <SpeakerWaveIcon className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} /> : <ArrowPathIcon className="w-4 h-4 animate-spin" />}
      </div>

      {/* Input */}
      <div className="p-4 bg-zinc-900/30 border-t border-white/10">
        <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-2 border border-white/10 focus-within:border-white/30 transition-all">
          <button onClick={() => recognitionRef.current?.start()} className={`${isListening ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>
            <MicrophoneIcon className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 text-lg py-1"
          />
          <button onClick={handleSend} disabled={isSending} className="text-white/40 hover:text-white transition-colors">
            <PaperAirplaneIcon className={`w-5 h-5 ${isSending ? 'opacity-20' : ''}`} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 1s infinite; }
      `}</style>
    </div>
  );
}
