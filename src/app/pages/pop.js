"use client";
import { useState, useRef, useEffect } from 'react';
import { ClockIcon, PaperAirplaneIcon, ArrowPathIcon, MagnifyingGlassIcon, SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

export default function Pop() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: "Hello, I'm Amelia. Ask me anything – I can even share Ope Watson's secrets!" }
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
  const audioQueueRef = useRef([]); // Queue for audio blobs ready to play
  const pendingChunksRef = useRef([]); // Chunks waiting to be sent to TTS
  const isPlayingRef = useRef(false); // Track if audio is currently playing
  const isFetchingRef = useRef(false); // Track if fetching TTS
  const recognitionRef = useRef(null);
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  const displayName = 'YOU';

  // Normalize text: remove special chars except punctuation
  const normalizeText = (text) => {
    return text
      .replace(/[^\w\s.,!?;:'"()-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Split text into sentences and merge short ones
  const splitIntoChunks = (text, minLength = 0) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();
      if (currentChunk.length + trimmed.length < minLength) {
        currentChunk += (currentChunk ? ' ' : '') + trimmed;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = trimmed;
      }
    });

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  };

  // Fetch TTS for a chunk and add to audio queue
  const fetchTTSChunk = async (chunk) => {
    try {
      const ttsResponse = await fetch("https://thienphuc1052004--xtts-api-xttsapi-tts-generate.modal.run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk, language: "en" }),
      });

      if (!ttsResponse.ok) throw new Error(`TTS Error: ${ttsResponse.status}`);

      const audioBlob = await ttsResponse.blob();
      return audioBlob;
    } catch (error) {
      console.error("TTS chunk failed:", error);
      return null;
    }
  };

  // Process next chunk from pending list
  const processNextChunk = async () => {
    if (isFetchingRef.current || pendingChunksRef.current.length === 0) return;
    
    isFetchingRef.current = true;
    const chunk = pendingChunksRef.current.shift();
    
    const audioBlob = await fetchTTSChunk(chunk);
    if (audioBlob) {
      audioQueueRef.current.push(audioBlob);
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextAudio();
      }
    }
    
    isFetchingRef.current = false;
    
    // Continue processing if more chunks available
    if (pendingChunksRef.current.length > 0) {
      processNextChunk();
    }
  };

  // Play next audio from queue
  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      // Check if we're done with everything
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

    // Play next audio
    playNextAudio();
  };

  // Generate and play audio chunks
  const generateAndPlayAudio = async (text) => {
    if (!text || !ttsReady) {
      console.log('TTS not ready, skipping audio generation');
      return;
    }

    const normalized = normalizeText(text);
    const chunks = splitIntoChunks(normalized, 150);
    
    console.log('Audio chunks:', chunks);
    
    // Add chunks to pending list
    pendingChunksRef.current.push(...chunks);
    
    // Start processing chunks (will fetch multiple in parallel while playing)
    processNextChunk();
    processNextChunk(); // Start 2 fetches immediately for better pipeline
  };

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        const ipFormatted = data.ip.replace(/\./g, '-');
        const userAgent = navigator.userAgent;
        let device = 'Unknown';
        if (userAgent.includes('Mobile')) {
          device = 'Mobile';
        } else if (userAgent.includes('Windows')) {
          device = 'Windows';
        } else if (userAgent.includes('Mac')) {
          device = 'Mac';
        } else if (userAgent.includes('Linux')) {
          device = 'Linux';
        }
        setApiUsername(`${device}-${ipFormatted}`);
        console.log('Dynamic API username set to:', `${device}-${ipFormatted}`);
      })
      .catch(error => {
        console.error('Failed to fetch IP:', error);
        const userAgent = navigator.userAgent;
        const device = userAgent.includes('Mobile') ? 'Mobile' : userAgent.includes('Windows') ? 'Windows' : 'Unknown Device';
        setApiUsername(device);
      });
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

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

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechActive(false);
      };
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }
  }, []);

  useEffect(() => {
    if (speechActive && inputRef.current) {
      const input = inputRef.current;
      input.focus();
      input.selectionStart = input.value.length;
      input.selectionEnd = input.value.length;
    }
  }, [inputValue, speechActive]);

  const handleVoiceInput = () => {
    if (!recognitionRef.current || isSending || isStreaming) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSending && !isStreaming) {
      handleSend();
    } else if (e.key === 'Control' && !isListening && !isSending && !isStreaming && inputRef.current === document.activeElement) {
      e.preventDefault();
      handleVoiceInput();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const streamResponse = (fullText) => {
    let index = 0;
    setStreamingText('');
    setIsStreaming(true);

    const interval = setInterval(() => {
      if (index < fullText.length) {
        const currentText = fullText.slice(0, index + 1);
        setStreamingText(currentText);
        index++;
        if (historyRef.current) {
          historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        setStreamingText('');
        setConvo(prev => {
          const newConvo = [...prev];
          newConvo[newConvo.length - 1] = { role: 'assistant', content: fullText };
          return newConvo;
        });
        if (historyRef.current) {
          historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
      }
    }, 20);

    streamingIntervalRef.current = interval;
  };

  const getGeminiResponse = async (history) => {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const systemPrompt = "You are Forgetful Amelia, an AI assistant. Ope haven't connect you to the database yet so you can't answer question about Ope but still try to help with anything. Provide clear and concise answers. Do NOT use asterisks. Capitalize to emphasive";

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      ...history.map(msg => ({
        role: msg.role === 'user' ? "user" : "model",
        parts: [{ text: msg.content }]
      }))
    ];

    if (contents.length > 21) {
      contents.splice(1, contents.length - 21);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini";

    return responseText;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    const userMessage = inputValue.trim();
    setInputValue('');
    const userMsgObj = { role: 'user', content: userMessage };
    const updatedConvoWithUser = [...convo, userMsgObj];
    setConvo(updatedConvoWithUser);

    if (updatedConvoWithUser.length === 2) {
      setShowHistory(true);
    }

    setConvo(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      let botReply;
      if (ragReady) {
        const response = await fetch("https://rag-backend-zh2e.onrender.com/rag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: apiUsername, query: userMessage }),
        });

        if (!response.ok) {
          throw new Error(`RAG Error: ${response.status}`);
        }

        const data = await response.json();
        botReply = data.response || "No response from backend";
      } else {
        console.log('RAG not ready, using Gemini fallback');
        botReply = await getGeminiResponse(updatedConvoWithUser);
      }

      // Stream original response (no normalization)
      streamResponse(botReply);

      // Generate audio with normalized chunks
      if (userMessage.trim()) {
        generateAndPlayAudio(botReply);
      }
    } catch (error) {
      console.error("Error processing request:", error);
      const errorMessage = error.message;
      setConvo(prev => {
        const newConvo = [...prev];
        newConvo[newConvo.length - 1] = { role: 'assistant', content: errorMessage };
        return newConvo;
      });
      setIsStreaming(false);
      setStreamingText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
      audioQueueRef.current = [];
      pendingChunksRef.current = [];
      isPlayingRef.current = false;
      isFetchingRef.current = false;
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const RAG_STATUS_URL = "https://rag-backend-zh2e.onrender.com/status";
    let ragInterval = setInterval(async () => {
      try {
        const response = await fetch(RAG_STATUS_URL, { method: 'GET' });
        if (response.ok) {
          setRagReady(true);
          console.log('RAG server ready');
          clearInterval(ragInterval);
        }
      } catch (error) {
        console.log('RAG warm-up ping failed, retrying...');
      }
    }, 1000);

    (async () => {
      try {
        const initialResponse = await fetch(RAG_STATUS_URL, { method: 'GET' });
        if (initialResponse.ok) {
          setRagReady(true);
          clearInterval(ragInterval);
        }
      } catch {}
    })();

    return () => clearInterval(ragInterval);

  }, []);

  useEffect(() => {
    const TTS_PING_URL = "https://thienphuc1052004--xtts-api-xttsapi-tts-generate.modal.run/ping";
    let retryCount = 0;
    const maxRetries = 10;

    const checkTts = async () => {
      if (retryCount >= maxRetries) {
        console.error('TTS warm-up exceeded max retries');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        await fetch(TTS_PING_URL, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        setTtsReady(true);
        console.log('TTS server responded');
        return;

      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.log('TTS ping timed out, retrying...');
          retryCount++;
          setTimeout(checkTts, 5000);
        } else {
          console.log('TTS error but marking as ready:', error);
          setTtsReady(true);
        }
      }
    };

    checkTts();
  }, []);

  const handleToggleChat = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    audioQueueRef.current = [];
    pendingChunksRef.current = [];
    isPlayingRef.current = false;
    isFetchingRef.current = false;
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsOpen(!isOpen);
    setIsSending(false);
    setIsStreaming(false);
    setIsPlayingAudio(false);
    setInputValue('');
    setStreamingText('');
    setIsListening(false);
    setSpeechActive(false);
  };

  useEffect(() => {
    if (!isSending && !isStreaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSending, isStreaming]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [convo]);

  return (
    <>
      <button
        onClick={handleToggleChat}
        className="fixed top-5 right-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-300 hover:scale-110"
      >
        <img
          src="/printer.png"
          alt="Amelia"
          className="w-full h-full object-cover rounded-full"
        />
      </button>
      {isOpen && (
        <>
          {showHistory && (
            <div 
              ref={historyRef}
              className="fixed font-serif bottom-20 md:bottom-30 left-1/2 transform -translate-x-1/2 w-full md:max-w-[50vw] max-w-[100vw] bg-[var(--colortwo)] rounded-2xl shadow-xl flex flex-col z-40 border-3 border-[var(--colorone)] p-4 max-h-[50vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex flex-col">
                {convo.length === 0 ? (
                  <div className="text-center text-[var(--colorone)] py-8">
                    No chat history yet.
                  </div>
                ) : (
                  convo.map((msg, index) => {
                    if (msg.content === '' && index !== convo.length - 1) return null;
                    const displayContent = (index === convo.length - 1 && isStreaming) ? streamingText : msg.content;
                    if (displayContent === '') return null;
                    return (
                      <div key={index} className="mb-4 cursor-default text-justify px-1">
                        <div className="font-bold mb-1 text-[var(--colorone)] inline">
                          {msg.role === "user" ? `${displayName.toUpperCase()}: ` : "AMELIA: "}
                        </div>
                        <div className="text-[var(--colorone)] inline break-words whitespace-pre-line">
                          {displayContent}
                          {index === convo.length - 1 && isStreaming && (
                            <span className="animate-pulse">|</span>
                          )}
                        </div>
                        <br />
                      </div>
                    );
                  })
                )}
              </div>
              <div className="sticky bottom-0 left-0 w-full bg-[var(--colortwo)] pt-3 z-50">
                <div className="flex items-center justify-end space-x-4">
                  <div className="flex items-center">
                    {ragReady ? (
                      <MagnifyingGlassIcon className="w-5 h-5 text-[var(--colorone)]" />
                    ) : (
                      <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                  </div>
                  <div className="flex items-center">
                    {ttsReady ? (
                      <SpeakerWaveIcon className={`w-5 h-5 text-[var(--colorone)] rounded-full bg-[var(--colortwo)] ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                    ) : (
                      <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="font-serif fixed bottom-0 md:bottom-10 left-1/2 transform -translate-x-1/2 w-full md:max-w-[50vw] max-w-[100vw] bg-[var(--colortwo)] rounded-full shadow-xl flex flex-col z-40 border-3 border-[var(--colorone)] transition-all duration-500 ease-in-out opacity-100 translate-y-0 overflow-hidden">
            <div className="flex items-center px-3 py-2">
              <button
                onClick={handleVoiceInput}
                disabled={isSending || isStreaming}
                className="px-2 py-0 bg-[var(--colortwo)] hover:bg-gray-50 transition-colors flex items-center justify-center rounded-full disabled:opacity-50"
                title="Voice Input (or press Ctrl)"
              >
                <MicrophoneIcon className={`w-6 h-6 text-[var(--colorone)] rounded-full ${isListening ? 'animate-pulse' : ''}`} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message in ENGLISH ONLY..."
                disabled={isSending || isStreaming}
                className="flex-grow rounded-none px-3 py-2 focus:outline-none text-[var(--colorone)] text-lg"
              />
              <button
                onClick={toggleHistory}
                className="px-2 py-0 hover:bg-gray-50 transition-colors flex items-center justify-center rounded-full"
                disabled={isSending || isStreaming}
              >
                <ClockIcon className="w-6 h-6 text-[var(--colorone)]" />
              </button>
              <button 
                onClick={handleSend}
                disabled={isSending || isStreaming}
                className="px-2 py-0 hover:bg-gray-50 transition-colors flex items-center justify-center rounded-full disabled:opacity-50"
              >
                <PaperAirplaneIcon className="w-6 h-6 text-[var(--colorone)]" />
              </button>
            </div>
          </div>
        </>
      )}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { background-color: white; color: var(--colorone); }
          50% { background-color: var(--colorone); color: white;}
        }
        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
}