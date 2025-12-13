"use client";
import { useState, useRef, useEffect } from 'react';
import { ClockIcon, PaperAirplaneIcon, ArrowPathIcon, MagnifyingGlassIcon, SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

export default function Pop() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: "Xin chào, tớ là Thiên. Cậu cần tớ giúp gì không? (testing vi tts feature - sound jumpscare alert)" }
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

  // 1. Detect Language (Tiếng Việt vs Tiếng Anh)
  const detectLanguage = (text) => {
    // Regex chứa các ký tự đặc trưng của tiếng Việt
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnameseRegex.test(text) ? 'vi' : 'en';
  };

  // 2. Normalize Text (Giữ lại Unicode cho tiếng Việt)
  const normalizeText = (text) => {
    // Sử dụng \p{L} để match mọi chữ cái Unicode (bao gồm tiếng Việt)
    return text
      .toLowerCase() // <--- MỚI THÊM: Chuyển hết về chữ thường ở đây
      .replace(/[^\p{L}\p{N}\s.,!?;:'"()-]/gu, '') 
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 3. Smart Chunking (Tách câu thông minh)
  // minWords = 40: Gom các câu lại cho đến khi đủ khoảng 40 từ
  // mergeLastThreshold = 10: Nếu chunk cuối cùng < 10 từ, gộp vào chunk trước đó
  const splitTextSmart = (text, minWords = 40, mergeLastThreshold = 10) => {
    // Tách sơ bộ bằng dấu câu (. ? ! ...)
    const rawSentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    
    const chunks = [];
    let buffer = "";

    for (const sentence of rawSentences) {
      // Thử gộp câu hiện tại vào buffer
      const candidate = (buffer + " " + sentence).trim();
      const wordCount = candidate.split(/\s+/).length; // Đếm số từ

      if (wordCount < minWords) {
        // Chưa đủ từ -> Giữ trong buffer
        buffer = candidate;
      } else {
        // Đủ từ -> Đẩy vào mảng chunks & reset buffer
        chunks.push(candidate);
        buffer = "";
      }
    }

    // Xử lý phần dư
    if (buffer) {
      chunks.push(buffer);
    }

    // Logic gộp chunk cuối nếu quá ngắn (tránh cụt lủn)
    if (chunks.length > 1) {
      const lastChunk = chunks[chunks.length - 1];
      const lastWordCount = lastChunk.split(/\s+/).length;
      
      if (lastWordCount < mergeLastThreshold) {
        // Gộp chunk cuối vào chunk áp chót
        chunks[chunks.length - 2] += " " + chunks.pop();
      }
    }

    return chunks;
  };

  // Fetch TTS (Gọi API Modal mới)
  const fetchTTSChunk = async (chunk, lang) => {
    try {
      console.log(`🎤 Fetching TTS [${lang}]: "${chunk.substring(0, 20)}..."`);
      const ttsResponse = await fetch(TTS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Gửi thêm language được detect
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

  // Process Queue (Xử lý hàng đợi chunk)
  const processNextChunk = async () => {
    if (isFetchingRef.current || pendingChunksRef.current.length === 0) return;
    
    isFetchingRef.current = true;
    
    // Lấy chunk và ngôn ngữ đã lưu
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

  // Play Audio (Phát nhạc)
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

  // Generate & Play Logic (Kết hợp Detect + Split)
  const generateAndPlayAudio = async (text) => {
    if (!text || !ttsReady) {
      console.log('TTS not ready or empty text');
      return;
    }

    const normalized = normalizeText(text);
    // 1. Detect ngôn ngữ
    const lang = detectLanguage(normalized);
    
    // 2. Cắt chunk thông minh (min 40 từ)
    const chunks = splitTextSmart(normalized, 40, 10);
    
    console.log(`Detected [${lang}]. Chunks:`, chunks);
    
    // Đẩy vào hàng đợi kèm thông tin ngôn ngữ
    chunks.forEach(chunk => {
        pendingChunksRef.current.push({ text: chunk, lang: lang });
    });
    
    // Chạy pipeline
    processNextChunk();
    processNextChunk(); 
  };

  // ... (Phần code IP detect, Speech Recognition giữ nguyên) ...
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
      // Auto detect ngôn ngữ cho mic hơi khó, tạm để EN hoặc VI tùy nhu cầu
      // Bạn có thể đổi thành 'vi-VN' nếu muốn nói tiếng Việt
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

  // ... (Các hàm handleVoiceInput, handleKeyDown, toggleChat, streamResponse... giữ nguyên) ...

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

  // --- Ping Health Checks ---
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
    // Ping Modal Health Endpoint mới
    const checkTts = async () => {
      try {
        const res = await fetch(TTS_HEALTH_URL); // Dùng Health URL mới
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

  // ... (Phần render UI giữ nguyên, chỉ update style nếu cần) ...
  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [convo]);

  return (
    <>
      <button
        onClick={handleToggleChat}
        className="fixed top-5 right-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-300 hover:scale-110"
      >
        <img src="/printer.png" alt="Thiên" className="w-full h-full object-cover rounded-full" />
      </button>

      {isOpen && (
        <>
          {showHistory && (
            <div 
              ref={historyRef}
              className="fixed font-serif bottom-20 md:bottom-30 left-1/2 transform -translate-x-1/2 w-full md:max-w-[50vw] max-w-[100vw] bg-[var(--colortwo)] rounded-2xl shadow-xl flex flex-col z-40 border-3 border-[var(--colorone)] p-4 max-h-[50vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex flex-col">
                {convo.map((msg, index) => {
                   if (msg.content === '' && index !== convo.length - 1) return null;
                   const displayContent = (index === convo.length - 1 && isStreaming) ? streamingText : msg.content;
                   if (displayContent === '') return null;
                   return (
                     <div key={index} className="mb-4 cursor-default text-justify px-1">
                       <div className="font-bold mb-1 text-[var(--colorone)] inline">
                         {msg.role === "user" ? `${displayName.toUpperCase()}: ` : "THIÊN: "}
                       </div>
                       <div className="text-[var(--colorone)] inline break-words whitespace-pre-line">
                         {displayContent}
                         {index === convo.length - 1 && isStreaming && <span className="animate-pulse">|</span>}
                       </div>
                       <br />
                     </div>
                   );
                })}
              </div>
              
              <div className="sticky bottom-0 left-0 w-full bg-transparent pt-3 z-50">
                <div className="flex items-center justify-end space-x-4">
                   {/* Status Icons */}
                   <div title="RAG Status">
                     {ragReady ? <MagnifyingGlassIcon className="w-5 h-5 text-[var(--colorone)]" /> : <ArrowPathIcon className="w-5 h-5 animate-spin text-gray-400" />}
                   </div>
                   <div title="TTS Status">
                     {ttsReady ? <SpeakerWaveIcon className={`w-5 h-5 text-[var(--colorone)] ${isPlayingAudio ? 'animate-pulse' : ''}`} /> : <ArrowPathIcon className="w-5 h-5 animate-spin text-gray-400" />}
                   </div>
                </div>
              </div>
            </div>
          )}

          <div className="font-serif fixed bottom-0 md:bottom-10 left-1/2 transform -translate-x-1/2 w-full md:max-w-[50vw] max-w-[100vw] bg-[var(--colortwo)] rounded-full shadow-xl flex flex-col z-40 border-3 border-[var(--colorone)] overflow-hidden">
            <div className="flex items-center px-3 py-2">
              <button onClick={handleVoiceInput} disabled={isSending} className="px-2">
                <MicrophoneIcon className={`w-6 h-6 text-[var(--colorone)] ${isListening ? 'animate-pulse text-red-500' : ''}`} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isSending}
                className="flex-grow rounded-none px-3 py-2 focus:outline-none text-[var(--colorone)] text-lg bg-transparent placeholder-[var(--colorone)]/50"
              />
              <button onClick={toggleHistory} className="px-2">
                <ClockIcon className="w-6 h-6 text-[var(--colorone)]" />
              </button>
              <button onClick={handleSend} disabled={isSending} className="px-2">
                <PaperAirplaneIcon className="w-6 h-6 text-[var(--colorone)]" />
              </button>
            </div>
          </div>
        </>
      )}
      <style jsx>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 1s infinite; }
      `}</style>
    </>
  );
}