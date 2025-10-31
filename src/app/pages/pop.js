"use client";
import { useState, useRef, useEffect } from 'react';
import { ClockIcon, PaperAirplaneIcon, ArrowPathIcon, MagnifyingGlassIcon, SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

export default function Pop() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convo, setConvo] = useState([
    { role: 'assistant', content: "Hello, I'm Amelia, Ope Watson's assistant. Ask me anything – I can even share Ope Watson's secrets!" }
  ]); // Initial bot intro message (no TTS for this)
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false); // New state for audio playback
  const [ragReady, setRagReady] = useState(false); // Track RAG readiness
  const [ttsReady, setTtsReady] = useState(false); // Track TTS readiness
  const [apiUsername, setApiUsername] = useState('YOU'); // Dynamic username for API calls only
  const [isListening, setIsListening] = useState(false); // State for voice input
  const [speechActive, setSpeechActive] = useState(false); // Track if speech recognition is active for cursor management
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const audioRef = useRef(null); // Ref for Audio object
  const recognitionRef = useRef(null); // Ref for SpeechRecognition
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''; // Gemini API key for fallback
  const displayName = 'YOU'; // Fixed display name for UI

  // Fetch user's IP on mount to set dynamic API username
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        const ipFormatted = data.ip.replace(/\./g, '-'); // Format IP to avoid display issues
        // Try to get device info
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
        setApiUsername(`${device}-${ipFormatted}`); // e.g., Mobile-192-168-1-1
        console.log('Dynamic API username set to:', `${device}-${ipFormatted}`);
      })
      .catch(error => {
        console.error('Failed to fetch IP:', error);
        // Fallback to device info only
        const userAgent = navigator.userAgent;
        const device = userAgent.includes('Mobile') ? 'Mobile' : userAgent.includes('Windows') ? 'Windows' : 'Unknown Device';
        setApiUsername(device);
      });
  }, []);

  // Setup SpeechRecognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // English only

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

  // Keep cursor at the end of input when speech is active
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

  // Handle Ctrl key for mic activation
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
        // Scroll to bottom during streaming
        if (historyRef.current) {
          historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        setStreamingText('');
        // Update convo with full text
        setConvo(prev => {
          const newConvo = [...prev];
          newConvo[newConvo.length - 1] = { role: 'assistant', content: fullText };
          return newConvo;
        });
        // Scroll to bottom after finish
        if (historyRef.current) {
          historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
      }
    }, 20); // Adjust speed for beauty (20ms per char)

    streamingIntervalRef.current = interval;
  };

  // Function to get response from Gemini as RAG fallback, now with conversation history
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

    // Optional: Limit context length to prevent token overflow (e.g., keep last 10 exchanges + system)
    if (contents.length > 21) {
      contents.splice(1, contents.length - 21); // Keep system + last 20 (10 pairs)
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

  // New function to call TTS API and play audio (skip if not ready)
  const generateAndPlayAudio = async (text) => {
    if (!text || !ttsReady) {
      console.log('TTS not ready, skipping audio generation');
      return;
    }

    try {
      setIsPlayingAudio(true);
      const ttsResponse = await fetch("https://thienphuc1052004--xtts-api-xttsapi-tts-generate.modal.run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "en" }), // Set language to "en"; can be dynamic
      });

      if (!ttsResponse.ok) {
        throw new Error(`TTS Error: ${ttsResponse.status}`);
      }

      // Get WAV as blob
      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play Audio
      if (audioRef.current) {
        audioRef.current.pause(); // Stop any previous audio
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play().catch((error) => {
        console.error("Audio play failed:", error);
        setIsPlayingAudio(false);
      });

      // Cleanup URL when done
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlayingAudio(false);
      };

      audioRef.current.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlayingAudio(false);
      };
    } catch (error) {
      console.error("TTS generation failed:", error);
      setIsPlayingAudio(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    const userMessage = inputValue.trim();
    setInputValue('');
    const userMsgObj = { role: 'user', content: userMessage };
    const updatedConvoWithUser = [...convo, userMsgObj];
    setConvo(updatedConvoWithUser);

    // Show history on first prompt (now with initial message, it will show immediately)
    if (updatedConvoWithUser.length === 2) { // Initial + first user
      setShowHistory(true);
    }

    // Add placeholder for assistant
    setConvo(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      let botReply;
      if (ragReady) {
        // Use RAG backend with dynamic API username
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
        // Fallback to Gemini with history
        console.log('RAG not ready, using Gemini fallback');
        botReply = await getGeminiResponse(updatedConvoWithUser);
      }

      // Start streaming text immediately
      streamResponse(botReply);

      // Call TTS API after response (async, so streams alongside) - Skip for initial message
      if (userMessage.trim()) { // Only for user messages, not initial
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

  // Cleanup intervals and audio on unmount or toggle
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Smart warm-up for RAG and TTS on mount
  useEffect(() => {
    // RAG: Poll every 1s until OK 200
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
        // Continue polling on error (e.g., failed to fetch during cold start)
      }
    }, 1000);

    // Initial check
    (async () => {
      try {
        const initialResponse = await fetch(RAG_STATUS_URL, { method: 'GET' });
        if (initialResponse.ok) {
          setRagReady(true);
          clearInterval(ragInterval);
        }
      } catch {}
    })();

    // Cleanup interval on unmount
    return () => clearInterval(ragInterval);

  }, []);

  // TTS: Retry on timeout until OK 200
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
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        await fetch(TTS_PING_URL, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        // Any response (even errors) means server is up
        setTtsReady(true);
        console.log('TTS server responded');
        return;

      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.log('TTS ping timed out, retrying...');
          retryCount++;
          // Only retry on timeout
          setTimeout(checkTts, 5000);
        } else {
          // For other errors (network, etc), consider TTS ready
          console.log('TTS error but marking as ready:', error);
          setTtsReady(true);
        }
      }
    };

    // Initial check
    checkTts();
  }, []);

  // Cleanup khi toggle chat
  const handleToggleChat = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
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

  // Auto-focus input sau khi reset states
  useEffect(() => {
    if (!isSending && !isStreaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSending, isStreaming]);

  // Scroll to bottom when convo changes
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [convo]);

  return (
    <>
      <button
        onClick={handleToggleChat}
        className="font-serif fixed bottom-10 right-10 w-14 h-14 bg-white text-[var(--colorone)] rounded-full shadow-lg flex items-center justify-center z-50 text-base font-bold transition-all duration-300 hover:scale-110 border border-gray-200"
      >
        AI
      </button>
      {isOpen && (
        <>
          {showHistory && (
            <div 
              ref={historyRef}
              className="fixed font-serif bottom-30 left-1/2 transform -translate-x-1/2 w-full max-w-[50vw] bg-white rounded-2xl shadow-xl flex flex-col z-40 border-3 border-[var(--colorone)] p-4 max-h-[50vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex flex-col">
                {convo.length === 0 ? (
                  <div className="text-center text-[var(--colorone)] py-8">
                    No chat history yet.
                  </div>
                ) : (
                  convo.map((msg, index) => {
                    if (msg.content === '' && index !== convo.length - 1) return null; // Skip old empty placeholders if any
                    const displayContent = (index === convo.length - 1 && isStreaming) ? streamingText : msg.content;
                    if (displayContent === '') return null; // Skip current empty if not streaming
                    return (
                      <div key={index} className="mb-4 cursor-default text-justify px-1">
                        <div className="font-bold mb-1 text-[var(--colorone)] inline">
                          {msg.role === "user" ? `${displayName.toUpperCase()}: ` : "AMELIA: "}
                        </div>
                        <div className="text-[var(--colorone)] inline break-words whitespace-pre-line">
                          {displayContent}
                          {index === convo.length - 1 && isStreaming && (
                            <span className="animate-pulse">|</span> // Typing indicator
                          )}
                        </div>
                        <br />
                      </div>
                    );
                  })
                )}
              </div>
              {/* Status Bottombar */}
              <div className="sticky bottom-0 left-0 w-full bg-white pt-3 z-50">
                {/* Right: Status icons */}
                <div className="flex items-center justify-end space-x-4">
                  {/* RAG Icon */}
                  <div className="flex items-center">
                    {ragReady ? (
                      <MagnifyingGlassIcon className="w-5 h-5 text-[var(--colorone)]" />
                    ) : (
                      <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                  </div>
                  {/* TTS Icon */}
                  <div className="flex items-center">
                    {ttsReady ? (
                      <SpeakerWaveIcon className={`w-5 h-5 text-[var(--colorone)] rounded-full bg-white ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                    ) : (
                      <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="font-serif fixed bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-[50vw] bg-white rounded-full shadow-xl flex flex-col z-40 border-3 border-[var(--colorone)] transition-all duration-500 ease-in-out opacity-100 translate-y-0 overflow-hidden">
            <div className="flex items-center px-3 py-2">
              <button
                onClick={handleVoiceInput}
                disabled={isSending || isStreaming}
                className="px-2 py-0 hover:bg-gray-50 transition-colors flex items-center justify-center rounded-full disabled:opacity-50"
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