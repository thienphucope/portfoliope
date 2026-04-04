"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { ClockIcon, PaperAirplaneIcon, PhoneIcon, SpeakerWaveIcon, MicrophoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
      
      // Ép mọi iframe (bao gồm nguyên gốc html AI sinh) vô video-container chuẩn của VaultStyles
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
  
  const [isLiveCall, setIsLiveCall] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  
  const historyRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const liveUIRef = useRef(null);
  
  const { isThinking, isStreaming, streamingText, requestAI, streamResponse, stopAI } = useAI();
  const { isPlayingAudio, ttsReady, streamAudioLive, stopAudio, checkTtsHealth } = useTTS();
  const isPlayingRef = useRef(false);

  const isProcessing = isThinking || isStreaming || isPlayingAudio;
  const isProcessingRef = useRef(false);

  useEffect(() => { isPlayingRef.current = isPlayingAudio; }, [isPlayingAudio]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  // Hành động ngắt lời được tái cấu trúc thành hàm để dùng ở cả OnClick lẫn Voice
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

  const { isListening, micVolume, startListening, stopListening, pauseListening, clearTranscription, startManualMode, stopManualMode } = useSTT({ 
    onResult: (text) => {
      // Ngăn vòng lặp vô hạn (Infinite Loop) do clearTranscription tự động trả về chuỗi rỗng ''
      if (!text) {
        setInputValue('');
        return;
      }
      
      // Nếu máy đang nói/nghĩ: block text hiện trên màn hình, nhưng Lắng Nghe keyword ngắt lời!
      if (isProcessingRef.current) {
        const lower = text.toLowerCase();
        if (/\b(no|wait|interrupt|interupt|stop)\b/i.test(lower)) {
           executeInterrupt();
        }
        clearTranscription(); // <--- CHẶN TRIỆT ĐỂ: Liên tục xoá sạch mọi text thu được khi máy đang nói
        return; // Chặn không cho text lọt vào ô input
      }
      
      // Chặn cẩn thận các chữ lọt âm ở khoảnh khắc giao thoa 0.1s
      setInputValue(text);
    },
    onSilence: (text) => {
      // Khi người dùng ngừng nói -> Gửi lệnh mới
      if (isLiveCall && text && !isProcessingRef.current) {
        handleSendAutomated(text);
      }
    }
  });

  // Quản lý trạng thái Mic dựa trên Audio của Bot
  useEffect(() => { 
    if (isLiveCall) {
      if (isProcessing) {
        // KHÔNG TẮT MIC NỮA ĐỂ BẮT KEYWORD NGẮT LỜI (Voice Interruption)!
        startListening();
      } else {
        // Máy vừa trả lời xong -> flush sạch mọi dư âm vọng lại trong khoảng thời gian vừa qua
        clearTranscription();
        setInputValue(''); 
        // Mở lại kết nối nhận diện khi hệ thống rảnh
        startListening();
      }
    }
  }, [isProcessing, isLiveCall, startListening, clearTranscription]);

  // Tính năng ngắt lời thủ công (nhấn nút)
  const handleInterrupt = useCallback((e) => {
    if (isLiveCall) {
      if (isProcessing) {
        executeInterrupt();
        clearTranscription();
      } else {
        // Nhấn khi đang rảnh -> Tap để KHÓA toàn bộ dữ liệu vừa nhận diện (hủy gửi, xóa trống)
        clearTranscription();
        setInputValue('');
        startListening();
      }
    }
  }, [isLiveCall, isProcessing, executeInterrupt, startListening, clearTranscription]);

  const holdTimerRef = useRef(null);
  const releaseTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const [isHoldingUI, setIsHoldingUI] = useState(false);

  const handlePointerDown = useCallback((e) => {
    // Chỉ kích hoạt với click chuột trái hoặc chạm màn hình cảm ứng
    if (e.button && e.button !== 0) return;
    if (releaseTimerRef.current) {
      clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
    isHoldingRef.current = false;
    setIsHoldingUI(false);
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsHoldingUI(true);
      startManualMode();
    }, 400); // 400ms để không bị nhầm lẫn giữa Tap (chạm nhanh) và Hold (giữ)
  }, [startManualMode]);

  const handlePointerUp = useCallback((e) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (isHoldingRef.current) {
      // Đang giữ -> nhả tay ra, đợi 1s mới đóng gói gửi đi (phòng hờ ng dùng tap nhanh để hủy)
      isHoldingRef.current = false;
      setIsHoldingUI(false);
      releaseTimerRef.current = setTimeout(() => {
        stopManualMode(); // Nếu không Tap phá thì máy gửi đi
        releaseTimerRef.current = null;
      }, 1000);
    } else {
      // Tap chạm nhanh (hoặc dập tắt gửi auto ngay trong thời gian chờ 1s vàng)
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
      clearTranscription(); // Dọn dẹp thẳng tay băng ghi âm lập tức hủy toàn bộ quá trình gửi
      setInputValue('');
      handleInterrupt(e);
    }
  }, [handleInterrupt, stopManualMode, clearTranscription]);

  const handleSendAutomated = async (msg) => {
    if (!msg || isSending) return;
    setInputValue('');
    setIsSending(true);
    
    // Stop ongoing audio for barge-in
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
      
      // Chỉ phát TTS khi đang trong chế độ Live Call
      if (isLiveCall) {
        streamAudioLive(reply);
      }
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

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    handleSendAutomated(inputValue.trim());
  };

  const toggleLiveCall = () => {
    if (isLiveCall) {
      setIsLiveCall(false);
      stopListening();
      stopAudio();
    } else {
      setIsLiveCall(true);
      startListening();
    }
  };

  useEffect(() => {
    ensureLibsLoaded().then(() => setLibsReady(true));
  }, []);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setApiUsername(`User-${d.ip.replace(/\./g, '-')}`))
      .catch(() => setApiUsername('Guest'));
  }, []);

  useEffect(() => {
    if (isLiveCall) {
      setTipIndex(0);
      setTipVisible(true);
      const intv = setInterval(() => {
        setTipVisible(false); // Bắt đầu mờ đi
        setTimeout(() => {
          setTipIndex(i => (i + 1) % 5); // Nhảy qua câu tiếp theo
          setTipVisible(true); // Hiện rõ lại
        }, 500); // Đợi 500ms cho fade out hẳn xong mới đổi và hiện
      }, 5000);
      return () => clearInterval(intv);
    }
  }, [isLiveCall]);

  useEffect(() => { 
    if (!isStreaming && !isThinking) {
      // Dùng scrollIntoView trên phần tử neo (anchor) dưới cùng của list thay vì gán cứng scrollTop
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 50);
    }
  }, [convo.length, isStreaming, isThinking]);

  useEffect(() => {
    if (isLiveCall && window.innerWidth < 768) {
      setTimeout(() => {
        liveUIRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
      }, 300);
    }
  }, [isLiveCall]);

// Trích xuất dữ liệu để hiển thị bên nửa Live Call
  const activeBotMsg = (isStreaming || isThinking) ? streamingText : (convo[convo.length - 1]?.role === 'assistant' ? convo[convo.length - 1].content : '');

  const tipsList = [
    <span key="tip1">Say <strong className="text-white/80">no</strong>, <strong className="text-white/80">wait</strong>, <strong className="text-white/80">stop</strong>, or tap the mic to interrupt.</span>,
    <span key="tip2"><strong className="text-white/80">Hold the mic</strong> to continuously record without auto-sending until released.</span>,
    <span key="tip3"><strong className="text-white/80">Tap the mic</strong> while recording to delete the current message.</span>,
    <span key="tip4">If voice recognition stalls, reopen the call or type directly.</span>,
    <span key="tip5">Headphones are highly recommended!</span>
  ];

  const style = {
    fontFamily: "'Crimson Text', serif",
    bg: "bg-transparent",
    border: "border-white/10",
    text: "text-white/90",
    accent: "text-white"
  };

  if (!isOpen && !isEmbedded) return null;

  return (
    <div 
      className={`${isEmbedded ? 'relative h-full w-full' : 'fixed inset-0 z-50'} bg-transparent overflow-hidden`} 
      style={{ fontFamily: style.fontFamily }}
    >
      <div className="w-full h-full flex flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth hide-scrollbar relative">
      {/* Nửa Màn Hình Phải: Chế độ Live Call (Camera UI) */}
      {isLiveCall && (
        <div 
          ref={liveUIRef}
          className="w-full shrink-0 md:w-1/2 h-full flex flex-col items-center justify-between p-5 md:p-10 border-l border-white/10 bg-black/40 backdrop-blur-sm relative snap-center order-2"
        >
            <div className="flex-1 w-full flex flex-col justify-end pb-8 overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Listening, or type your prompt..."
                  className="bg-transparent text-center text-white/90 text-2xl font-bold border-none focus:ring-0 outline-none w-full w-full resize-none placeholder-white/20 custom-scrollbar"
                  rows={4}
                />
            </div>
            
            <div className="shrink-0 py-4 flex items-center justify-center">
                <div 
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={(e) => isHoldingRef.current && handlePointerUp(e)}
                  title={isProcessing ? "Tap to interrupt" : "Tap to clear / Hold to dictate"}
                  className={`select-none w-32 h-32 md:w-40 md:h-40 rounded-full transition-all duration-100 flex items-center justify-center relative shadow-[0_0_15px_rgba(255,255,255,0.1)] z-10
                    ${isListening && !isProcessing ? 'shadow-[0_0_60px_var(--colorone)]' : ''} 
                    ${isProcessing ? 'animate-pulse scale-95 cursor-pointer' : 'cursor-pointer'}
                    ${isHoldingUI ? 'scale-110 shadow-[0_0_70px_#60a5fa]' : ''}
                  `} 
                  style={{ 
                    backgroundColor: 'var(--colorone, #ccc)',
                    transform: (isListening && !isProcessing && !isHoldingUI) ? `scale(${1 + micVolume * 0.4})` : undefined,
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    touchAction: 'none'
                  }}
                >
                  {isProcessing ? (
                    <div className="text-black/60 text-sm font-bold tracking-wider">INTERRUPT</div>
                  ) : (
                    <MicrophoneIcon className="w-12 h-12 text-black/50" />
                  )}
                </div>
            </div>

            <div className="flex-1 w-full pt-8 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <div className="text-white/50 text-sm max-w-[260px] font-sans leading-relaxed text-center min-h-[6rem] flex items-center justify-center">
                <div 
                  className="flex flex-col items-center justify-center"
                  style={{ 
                    opacity: tipVisible ? 1 : 0, 
                    transform: tipVisible ? 'translateY(0)' : 'translateY(-10px)', 
                    transition: 'all 0.5s ease-in-out' 
                  }}
                >
                  <span className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-bold block">Tip {tipIndex + 1} of {tipsList.length}</span>
                  <p>{tipsList[tipIndex]}</p>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* Nửa Màn Hình Trái: Lịch Sử Chat Ẩn Hiện Bất Cứ Lúc Nào */}
      <div 
        className={`w-full shrink-0 ${isLiveCall ? 'md:w-1/2' : 'w-full'} h-full flex flex-col bg-transparent relative snap-center order-1`}
      >
          <div ref={historyRef} className="flex-1 overflow-y-auto p-5 custom-scrollbar chat-history">
            <div className="max-w-3xl mx-auto w-full space-y-5">
            {convo.map((msg, i) => {
              const isMsgStreaming = (i === convo.length - 1 && isStreaming);
              const isMsgThinking = (i === convo.length - 1 && isThinking);
              const content = isMsgStreaming ? streamingText : (isMsgThinking ? "Thinking..." : msg.content);
              if (!content && i !== convo.length-1 && !isMsgThinking) return null;
              return (
                <div key={i} className={`${isEmbedded ? 'text-base' : 'text-lg'} leading-relaxed text-justify opacity-90`}>
                  {msg.role === 'user' && i > 0 && <hr className="rte-hr" style={{ margin: '1.5em 0', borderBottom: '1px solid white' }} />}
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
            
            {/* Inline Input (Chỉ hiện khi tắt LiveCall) */}
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
            
            {/* Điểm neo (anchor) tàng hình dưới cùng để trượt tới */}
            <div ref={messagesEndRef} className="h-px w-full pointer-events-none opacity-0" />
            </div>
          </div>

          {/* Status (Chỉ hiện khi tắt LiveCall) */}
          {!isLiveCall && (
              <div className="max-w-3xl w-full mx-auto px-5 py-2 flex justify-start items-center opacity-30">
                <button onClick={startListening} className={`${isListening && !isLiveCall ? 'text-red-500 animate-pulse' : 'text-white/40'}`} title="Hold to Dictate">
                  <MicrophoneIcon className="w-4 h-4" />
                </button>
              </div>
          )}

      </div>
      </div>

      {/* Floating Live Call Trigger - Luôn nổi ở góc phải dưới Màn Hình (Fixed/Absolute) */}
      <div
        className={`live-call-trigger flex items-center justify-center rounded-full cursor-pointer z-50 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 w-12 h-12 md:w-[60px] md:h-[60px] absolute bottom-[90px] right-5 md:right-[30px] ${isLiveCall ? 'text-white' : 'text-black'}`}
        onClick={toggleLiveCall}
        title={isLiveCall ? "End Live Call" : "Start Live Call"}
        style={{
          backgroundColor: isLiveCall ? '#ef4444' : 'var(--colorone, #ccc)'
        }}
      >
        <PhoneIcon className={`w-6 h-6 md:w-7 md:h-[28px] ${isLiveCall ? 'animate-pulse' : ''}`} />
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
