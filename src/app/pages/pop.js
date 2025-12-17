"use client";
import { useState, useRef, useEffect } from 'react';
import { ClockIcon, PaperAirplaneIcon, ArrowPathIcon, MagnifyingGlassIcon, SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

export default function Pop() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: "Xin chào, tớ là Thiên. Cậu cần tớ giúp gì không? (testing vi tts feature - sound jumpscare alert) (tag @ope to message me)" }
  ]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ragReady, setRagReady] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);
  const [apiUsername, setApiUsername] = useState('YOU');
  const [isListening, setIsListening] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  
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

  // --- CẤU HÌNH API MỚI ---
  const TTS_API_URL = "https://thienphuc1052004--viterbox-api-viterboxapi-tts.modal.run";
  const TTS_HEALTH_URL = "https://thienphuc1052004--viterbox-api-viterboxapi-health.modal.run";

  // ... (GIỮ NGUYÊN TOÀN BỘ LOGIC XỬ LÝ BÊN DƯỚI: detectLanguage, normalizeText, splitTextSmart, fetchTTSChunk, processNextChunk, playNextAudio, generateAndPlayAudio, useEffects...) ...
  // (Phần logic này không đổi nên mình ẩn đi cho gọn code nhé)
  
  // 1. Detect Language
  const detectLanguage = (text) => {
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnameseRegex.test(text) ? 'vi' : 'en';
  };

  // 2. Normalize Text
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s.,!?;:'"()-]/gu, '') 
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 3. Smart Chunking
  const splitTextSmart = (text, minWords = 40, mergeLastThreshold = 10) => {
    const rawSentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const chunks = [];
    let buffer = "";
    for (const sentence of rawSentences) {
      const candidate = (buffer + " " + sentence).trim();
      const wordCount = candidate.split(/\s+/).length;
      if (wordCount < minWords) {
        buffer = candidate;
      } else {
        chunks.push(candidate);
        buffer = "";
      }
    }
    if (buffer) chunks.push(buffer);
    if (chunks.length > 1) {
      const lastChunk = chunks[chunks.length - 1];
      const lastWordCount = lastChunk.split(/\s+/).length;
      if (lastWordCount < mergeLastThreshold) {
        chunks[chunks.length - 2] += " " + chunks.pop();
      }
    }
    return chunks;
  };

  // Fetch TTS
  const fetchTTSChunk = async (chunk, lang) => {
    try {
      console.log(`🎤 Fetching TTS [${lang}]: "${chunk.substring(0, 20)}..."`);
      const ttsResponse = await fetch(TTS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            text: chunk, 
            language: lang,
            temperature: 0.5 
        }),
      });
      if (!ttsResponse.ok) throw new Error(`TTS Error: ${ttsResponse.status}`);
      const audioBlob = await ttsResponse.blob();
      return audioBlob;
    } catch (error) {
      console.error("TTS chunk failed:", error);
      return null;
    }
  };

  // Process Queue
  const processNextChunk = async () => {
    if (isFetchingRef.current || pendingChunksRef.current.length === 0) return;
    isFetchingRef.current = true;
    const { text, lang } = pendingChunksRef.current.shift();
    const audioBlob = await fetchTTSChunk(text, lang);
    if (audioBlob) {
      audioQueueRef.current.push(audioBlob);
      if (!isPlayingRef.current) {
        playNextAudio();
      }
    }
    isFetchingRef.current = false;
    if (pendingChunksRef.current.length > 0) {
      processNextChunk();
    }
  };

  // Play Audio
  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      if (audioQueueRef.current.length === 0 && pendingChunksRef.current.length === 0 && !isFetchingRef.current) {
        setIsPlayingAudio(false);
        isPlayingRef.current = false;
      }
      return;
    }
    isPlayingRef.current = true;
    setIsPlayingAudio(true);
    const audioBlob = audioQueueRef.current.shift();
    const audioUrl = URL.createObjectURL(audioBlob);
    try {
      await new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error("Audio playback failed:", error);
    }
    isPlayingRef.current = false;
    playNextAudio();
  };

  // Generate & Play Logic
  const generateAndPlayAudio = async (text) => {
    if (!text || !ttsReady) {
      console.log('TTS not ready or empty text');
      return;
    }
    const normalized = normalizeText(text);
    const lang = detectLanguage(normalized);
    const chunks = splitTextSmart(normalized, 40, 10);
    console.log(`Detected [${lang}]. Chunks:`, chunks);
    chunks.forEach(chunk => {
        pendingChunksRef.current.push({ text: chunk, lang: lang });
    });
    processNextChunk();
    processNextChunk(); 
  };

  // IP Detect & Speech
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        const ipFormatted = data.ip.replace(/\./g, '-');
        const userAgent = navigator.userAgent;
        let device = 'Unknown';
        if (userAgent.includes('Mobile')) device = 'Mobile';
        else if (userAgent.includes('Windows')) device = 'Windows';
        else if (userAgent.includes('Mac')) device = 'Mac';
        else if (userAgent.includes('Linux')) device = 'Linux';
        setApiUsername(`${device}-${ipFormatted}`);
      })
      .catch(() => setApiUsername('Guest'));
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'vi-VN'; 
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setSpeechActive(true);
      };
      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputValue(transcript);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setSpeechActive(false);
      };
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current || isSending || isStreaming) return;
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSending && !isStreaming) handleSend();
    else if (e.key === 'Control' && !isListening && !isSending && !isStreaming) {
       e.preventDefault();
       handleVoiceInput();
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);
  const toggleHistory = () => setShowHistory(!showHistory);

  const streamResponse = (fullText) => {
    let index = 0;
    setStreamingText('');
    setIsStreaming(true);
    const interval = setInterval(() => {
      if (index < fullText.length) {
        const currentText = fullText.slice(0, index + 1);
        setStreamingText(currentText);
        index++;
        if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        setStreamingText('');
        setConvo(prev => {
          const newConvo = [...prev];
          newConvo[newConvo.length - 1] = { role: 'assistant', content: fullText };
          return newConvo;
        });
        if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
      }
    }, 20);
    streamingIntervalRef.current = interval;
  };

  const getGeminiResponse = async (history) => {
    if (!GEMINI_API_KEY) throw new Error('Gemini API key missing');
    const systemPrompt = "You are Amelia. You can speak both English and Vietnamese properly. Answer helpful and concise.";
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...history.map(msg => ({
        role: msg.role === 'user' ? "user" : "model",
        parts: [{ text: msg.content }]
      }))
    ];
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );
    if (!response.ok) throw new Error("Gemini Error");
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error";
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);
    const userMessage = inputValue.trim();
    setInputValue('');
    const updatedConvo = [...convo, { role: 'user', content: userMessage }];
    setConvo(updatedConvo);
    if (updatedConvo.length === 2) setShowHistory(true);
    setConvo(prev => [...prev, { role: 'assistant', content: '' }]);
    try {
      let botReply;
      if (ragReady) {
        const response = await fetch("https://rag-backend-zh2e.onrender.com/rag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: apiUsername, query: userMessage }),
        });
        if (!response.ok) throw new Error("RAG Error");
        const data = await response.json();
        botReply = data.response || "No response";
      } else {
        botReply = await getGeminiResponse(updatedConvo);
      }
      streamResponse(botReply);
      if (userMessage.trim()) generateAndPlayAudio(botReply);
    } catch (error) {
      setConvo(prev => {
         const newConvo = [...prev];
         newConvo[newConvo.length - 1] = { role: 'assistant', content: "Sorry, something went wrong." };
         return newConvo;
      });
      setIsStreaming(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (e) => setInputValue(e.target.value);

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
      audioQueueRef.current = [];
      pendingChunksRef.current = [];
      isPlayingRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
        try {
            const res = await fetch("https://rag-backend-zh2e.onrender.com/status");
            if (res.ok) setRagReady(true);
        } catch {}
    };
    checkStatus();
  }, []);

  useEffect(() => {
    const checkTts = async () => {
      try {
        const res = await fetch(TTS_HEALTH_URL);
        if (res.ok) {
            setTtsReady(true);
            console.log("✅ Viterbox TTS Ready!");
        }
      } catch (e) {
          console.log("TTS waking up...", e);
          setTimeout(checkTts, 5000);
      }
    };
    checkTts();
  }, []);

  const handleToggleChat = () => {
    if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
    setIsOpen(!isOpen);
    setIsSending(false);
    setIsStreaming(false);
    setIsPlayingAudio(false);
  };

  // --- STYLE OBJECTS (Đã sửa sang tone Trắng) ---
  const vaultStyle = {
    fontFamily: "'Crimson Text', serif",
    bg: "bg-[#121212]", // Nền vẫn đen để nổi bật chữ trắng
    border: "border-white", // Viền trắng
    text: "text-white", // Chữ trắng
    icon: "text-white", // Icon trắng
    placeholder: "placeholder-gray-400", // Placeholder xám nhạt
  };

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [convo]);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');
      `}</style>

      {/* Trigger Button */}
      <button
        onClick={handleToggleChat}
        // Sửa shadow sang màu trắng, border dùng biến vaultStyle
        className={`fixed top-3 right-2 md:top-2 md:right-2 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center z-50 transition-all duration-300 hover:scale-110`}
      >
        <img src="/printer.png" alt="Thiên" className="w-full h-full object-cover rounded-full opacity-90 hover:opacity-100" />
      </button>

      {isOpen && (
        <>
          {/* --- CHAT HISTORY --- */}
          {showHistory && (
            <div 
              ref={historyRef}
              // Sửa shadow sang màu trắng nhẹ, dùng các biến style mới
              className={`fixed bottom-20 md:bottom-30 left-1/2 transform -translate-x-1/2 w-[95vw] md:max-w-[50vw] ${vaultStyle.bg} rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] flex flex-col z-40 border ${vaultStyle.border} p-5 max-h-[100vh] overflow-y-auto custom-scrollbar`}
              style={{ fontFamily: "'Crimson Text', serif" }}
            >
              <div className="flex flex-col">
                {convo.map((msg, index) => {
                   if (msg.content === '' && index !== convo.length - 1) return null;
                   const displayContent = (index === convo.length - 1 && isStreaming) ? streamingText : msg.content;
                   if (displayContent === '') return null;
                   return (
                     <div key={index} className="mb-4 cursor-default text-justify px-1 text-lg leading-relaxed">
                       {/* Role label dùng màu icon trắng */}
                       <div className={`font-bold mb-1 ${vaultStyle.icon} inline tracking-wider`}>
                         {msg.role === "user" ? `${displayName.toUpperCase()}: ` : "THIÊN: "}
                       </div>
                       {/* Nội dung dùng màu text trắng */}
                       <div className={`${vaultStyle.text} inline break-words whitespace-pre-line`}>
                         {displayContent}
                         {/* Con trỏ streaming cũng màu trắng */}
                         {index === convo.length - 1 && isStreaming && <span className="animate-pulse text-white">|</span>}
                       </div>
                       <br />
                     </div>
                   );
                })}
              </div>
              
              {/* Status Footer */}
              <div className="sticky bottom-0 left-0 w-full bg-transparent pt-3 z-50 flex justify-end">
                {/* Sửa border và separator sang màu trắng mờ */}
                <div className="flex items-center space-x-3 bg-black/80 px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                   <div title="RAG Status">
                     {/* Icon loading chuyển sang màu trắng mờ */}
                     {ragReady ? <MagnifyingGlassIcon className={`w-4 h-4 ${vaultStyle.icon}`} /> : <ArrowPathIcon className="w-4 h-4 animate-spin text-white/50" />}
                   </div>
                   <div className="w-[1px] h-4 bg-white/30"></div>
                   <div title="TTS Status">
                     {ttsReady ? <SpeakerWaveIcon className={`w-4 h-4 ${vaultStyle.icon} ${isPlayingAudio ? 'animate-pulse' : ''}`} /> : <ArrowPathIcon className="w-4 h-4 animate-spin text-white/50" />}
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* --- INPUT BAR --- */}
          <div 
            // Sửa shadow sang màu trắng
            className={`fixed bottom-4 md:bottom-10 left-1/2 transform -translate-x-1/2 w-[95vw] md:max-w-[50vw] ${vaultStyle.bg} rounded-full shadow-[0_5px_20px_rgba(255,255,255,0.1)] flex flex-col z-40 border ${vaultStyle.border} overflow-hidden`}
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            <div className="flex items-center px-4 py-3">
              <button onClick={handleVoiceInput} disabled={isSending} className="px-2 transition-transform active:scale-95">
                {/* Mic khi active sẽ nhấp nháy màu trắng */}
                <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'animate-pulse text-white' : vaultStyle.icon}`} />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isSending}
                // Sử dụng màu text trắng và placeholder xám mới
                className={`flex-grow rounded-none px-3 py-1 focus:outline-none ${vaultStyle.text} ${vaultStyle.placeholder} text-xl bg-transparent`}
                style={{ fontFamily: "'Crimson Text', serif" }}
              />
              
              <button onClick={toggleHistory} className="px-2 transition-transform active:scale-95">
                <ClockIcon className={`w-6 h-6 ${vaultStyle.icon}`} />
              </button>
              
              <button onClick={handleSend} disabled={isSending} className="px-2 transition-transform active:scale-95">
                <PaperAirplaneIcon className={`w-6 h-6 ${vaultStyle.icon} ${isSending ? 'opacity-50' : ''}`} />
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 1s infinite; }
        
        /* Custom WHITE Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1); /* Track màu trắng mờ */
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.6); /* Thumb màu trắng đục hơn */
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.9); /* Hover sáng hơn */
        }
      `}</style>
    </>
  );
}