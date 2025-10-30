"use client";
import { useState, useRef, useEffect } from 'react';
import { ClockIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function Pop() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convo, setConvo] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const username = 'CLIENT'; // Fixed username for API calls; can be made dynamic if needed

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

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    const userMessage = inputValue.trim();
    setInputValue('');
    setConvo(prev => [...prev, { role: 'user', content: userMessage }]);

    // Show history on first prompt
    if (convo.length === 0) {
      setShowHistory(true);
    }

    // Add placeholder for assistant
    setConvo(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch("https://rag-backend-zh2e.onrender.com/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, query: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.response || "No response from backend";

      // Start streaming
      streamResponse(botReply);
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSending && !isStreaming) {
      handleSend();
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  // Cleanup intervals on unmount or toggle
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  // Ping server on mount to warm up (prevent cold start)
  useEffect(() => {
    const warmUpServer = async () => {
      try {
        await fetch("https://rag-backend-zh2e.onrender.com/status", { method: 'GET' });
        console.log('Server warmed up');
      } catch (error) {
        console.error('Warm-up ping failed:', error);
      }
    };
    warmUpServer();
  }, []);

  // Cleanup khi toggle chat
  const handleToggleChat = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setIsOpen(!isOpen);
    setIsSending(false);
    setIsStreaming(false);
    setInputValue('');
    setStreamingText('');
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
                          {msg.role === "user" ? `${username.toUpperCase()}: ` : "OPE: "}
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
            </div>
          )}
          <div className="font-serif fixed bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-[50vw] bg-white rounded-full shadow-xl flex flex-col z-40 border-3 border-[var(--colorone)] transition-all duration-500 ease-in-out opacity-100 translate-y-0 overflow-hidden">
            <div className="flex items-center px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
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
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
}