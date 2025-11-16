"use client";
import { useState, useEffect, useRef } from 'react';
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter, FaArrowDown } from 'react-icons/fa';

export default function Page1() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  const [displayText, setDisplayText] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayPronunciation, setDisplayPronunciation] = useState("");
  const [isIntroStarted, setIsIntroStarted] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [apiUsername, setApiUsername] = useState('YOU');

  // Thêm constant này để quản lý text gốc cho story (chỉ 1 chỗ duy nhất!)
  const DEFAULT_STORY_TEXT = "Dear Ope Watson!\n\nToday, I've seen a ghost hanging behind the room's door. Can you explain that?";
  
  const [storyText, setStoryText] = useState(DEFAULT_STORY_TEXT); // Sử dụng constant ở đây
  
  const [animationClass, setAnimationClass] = useState(''); 
  const [animationKey, setAnimationKey] = useState(0); 
  const newSongTimerRef = useRef(null); 

  const playerRef = useRef(null);
  const textRef = useRef(null);
  const titleRef = useRef(null);
  const pronunciationRef = useRef(null);

  // You can change this value in the code to scale the image
  const imageScale = 1.75;

  const padChar = '\u00A0';

  const originalText = "A counselling detective who helps people make sense of their stories, whether they are struggling with love, confusion, loss, or a mystery that refuses to rest.";
  const replacementText = "An unmotivated sloth in human form, dedicated to avoiding effort, solving nothing, and uninterested in anything beyond the nearest snack or nap.";
  const textMaxLen = Math.max(originalText.length, replacementText.length);
  const originalTextPadded = originalText + padChar.repeat(textMaxLen - originalText.length);
  const replacementTextPadded = replacementText + padChar.repeat(textMaxLen - replacementText.length);

  const originalTitle = "Ope Watson";
  const replacementTitle = "No Touch!";
  const titleMaxLen = Math.max(originalTitle.length, replacementTitle.length);
  const originalTitlePadded = originalTitle + padChar.repeat(titleMaxLen - originalTitle.length);
  const replacementTitlePadded = replacementTitle + padChar.repeat(titleMaxLen - replacementTitle.length);

  const originalPronunciation = "en. /'ohp 'wots-uhn/  jp. /opeオペ/";
  const replacementPronunciation = "pronounce it anyways!";
  const pronMaxLen = Math.max(originalPronunciation.length, replacementPronunciation.length);
  const originalPronPadded = originalPronunciation + padChar.repeat(pronMaxLen - originalPronunciation.length);
  const replacementPronPadded = replacementPronunciation + padChar.repeat(pronMaxLen - replacementPronunciation.length);

  // Set initial states
  useEffect(() => {
    setDisplayText(originalTextPadded);
    setDisplayTitle(originalTitlePadded);
    setDisplayPronunciation(originalPronPadded);
  }, []);

  // Force scroll to top on reload
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []); 

  // Set dynamic API username based on IP and device
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

  // Auto-activate intro after 2 seconds if not started
  useEffect(() => {
    if (!isIntroStarted) {
      const autoActivateTimer = setTimeout(() => {
        handleMaskClick();
      }, 2000);

      return () => clearTimeout(autoActivateTimer);
    }
  }, [isIntroStarted]);

  // Lock/unlock scroll and cursor
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;

    if (!isIntroStarted) {
      document.body.style.overflow = 'hidden';
      document.body.classList.remove('use-custom-cursor'); 
    } else {
      document.body.style.overflow = 'auto';
      document.body.classList.add('use-custom-cursor'); 
    }

    return () => {
      document.body.style.overflow = prevOverflow || 'auto';
      document.body.classList.remove('use-custom-cursor');
    };
  }, [isIntroStarted]);

  // Scramble text animation
  const scrambleText = (original, target, setDisplay, duration = 200) => {
    const chars = "iljtfrsciljtfr"; 
    let seed = 1234; 
    const m = 2147483647; 
    const a = 1103515245; 
    const c = 12345;      

    const pseudoRandom = () => {
      seed = (a * seed + c) % m;
      return seed / m;
    };

    let startTime = null;
    let frame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);

      if (progressRatio < 0.7) {
        const scrambled = original
          .split("")
          .map((char) => {
            if (char === " " || char === padChar) return char;
            return chars[Math.floor(pseudoRandom() * chars.length)];
          })
          .join("");
        setDisplay(scrambled);
        frame = requestAnimationFrame(animate);
      } else {
        const blendRatio = (progressRatio - 0.7) / 0.3;
        const currentText = original
          .split("")
          .map((char, i) => {
            if (char === " " || char === padChar) return char;
            return blendRatio < pseudoRandom() ? char : target[i] || char;
          })
          .join("");
        setDisplay(currentText);
        if (progressRatio < 1) {
          frame = requestAnimationFrame(animate);
        } else {
          setDisplay(target);
        }
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  };

  // Handle mouse enter for description
  const handleMouseEnterDescription = () => {
    if (!isStoryOpen) {
      scrambleText(originalTextPadded, replacementTextPadded, setDisplayText);
    }
  };

  // Handle mouse leave for description
  const handleMouseLeaveDescription = () => {
    if (!isStoryOpen) {
      scrambleText(replacementTextPadded, originalTextPadded, setDisplayText);
    }
  };

  // Handle mouse enter for title
  const handleMouseEnterTitle = () => {
    if (!isStoryOpen) {
      scrambleText(originalTitlePadded, replacementTitlePadded, setDisplayTitle);
    }
  };

  // Handle mouse leave for title
  const handleMouseLeaveTitle = () => {
    if (!isStoryOpen) {
      scrambleText(replacementTitlePadded, originalTitlePadded, setDisplayTitle);
    }
  };

  // Handle mouse enter for pronunciation
  const handleMouseEnterPronunciation = () => {
    if (!isStoryOpen) {
      scrambleText(originalPronPadded, replacementPronPadded, setDisplayPronunciation);
    }
  };

  // Handle mouse leave for pronunciation
  const handleMouseLeavePronunciation = () => {
    if (!isStoryOpen) {
      scrambleText(replacementPronPadded, originalPronPadded, setDisplayPronunciation);
    }
  };

  // Open modal function
  const openModal = () => setIsModalOpen(true);

  // Close modal function
  const closeModal = () => setIsModalOpen(false);

  // Scroll to next section (scroll down)
  const scrollToDown = () => {
    // Chọn .snap-y để tìm đúng container đang cuộn
    // Sau đó tìm con trực tiếp (:nth-child(2)) có class .snap-start
    const page2Container = document.querySelector('.snap-y > .snap-start:nth-child(2)');
    
   if (page2Container) {
      // Yêu cầu trình duyệt cuộn đến phần tử đó một cách mượt mà
      page2Container.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.error("Không tìm thấy container của Page 2!");
    }
  };

  // Toggle video play/pause
  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Initialize YouTube player
  useEffect(() => {
    if (isIntroStarted) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '0',
          width: '0',
          videoId: '8itIwVBu6os',
          playerVars: {
            autoplay: 1,
            loop: 1,
            playlist: '8itIwVBu6os,Vwnp-2T3VFg,09UOuVuFs08,yXQViqx6GMY,j_96mnmGxk0',
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event) => {
              event.target.setVolume(10);
              // ĐÃ XÓA: setVideoTitle(event.target.getVideoData().title);
              // Để onStateChange trigger animation ngay lần đầu
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                const newTitle = event.target.getVideoData().title;
                setVideoTitle(oldTitle => {
                  // Lần đầu tiên (oldTitle = '') nó sẽ chạy
                  // Những lần sau (bài mới) nó cũng sẽ chạy
                  if (oldTitle !== newTitle) { 
                    if (newSongTimerRef.current) {
                      clearTimeout(newSongTimerRef.current);
                    }
                    setAnimationClass('fly-cycle');
                    setAnimationKey(k => k + 1);
                    newSongTimerRef.current = setTimeout(() => {
                      setAnimationClass(''); 
                    }, 5500); // 5.5 giây
                  }
                  return newTitle; 
                });
              }
            },
          },
        });
      };
    }
  }, [isIntroStarted]);

  // Handle hover cho đĩa nhạc
  const handleDiskMouseEnter = () => {
    if (newSongTimerRef.current) {
      clearTimeout(newSongTimerRef.current);
      newSongTimerRef.current = null;
    }
    setAnimationClass('fly-out');
    setAnimationKey(k => k + 1);
  };

  const handleDiskMouseLeave = () => {
    if (newSongTimerRef.current) {
      clearTimeout(newSongTimerRef.current);
      newSongTimerRef.current = null;
    }
    setAnimationClass('fly-in');
    setAnimationKey(k => k + 1);
  };


  // Handle mask click
  const handleMaskClick = () => {
    setIsIntroStarted(true);
  };

  useEffect(() => {
    if (isIntroStarted) {
      setTimeout(() => setIsIntroDone(true), 100);
    }
  }, [isIntroStarted]);

  const handleStorySubmit = async () => {
    const message = "@dm " + storyText.trim();
    console.log("Submitted story:", storyText);
    try {
      const response = await fetch("https://rag-backend-zh2e.onrender.com/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: apiUsername, query: message }),
      });

      if (!response.ok) {
        throw new Error(`RAG Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Story response from RAG:", data.response);
    } catch (error) {
      console.error("Error sending story to RAG:", error);
    }
    setIsStoryOpen(false);
    setStoryText(DEFAULT_STORY_TEXT); // Reset dùng constant
  };

  const handleStoryCancel = () => {
    setIsStoryOpen(false);
    setStoryText(DEFAULT_STORY_TEXT); // Reset dùng constant
  };

  return (
    <section id="gallery" className="w-full min-h-screen bg-[var(--background)] snap-start font-[family-Fredericka_the_Great] box-border relative z-10 flex justify-center items-center">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap');
      `}</style>
      <style jsx>{`
        @keyframes glow {
          0% { filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3)); }
          100% { filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)); }
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* === ĐÃ SỬA: 150px -> 80px === */
        @keyframes flyOut {
          0% {
            opacity: 0;
            transform: translateY(-50%) translateX(0);
          }
          100% {
            opacity: 1;
            transform: translateY(-50%) translateX(40px); 
          }
        }
        
        @keyframes flyIn {
          0% {
            opacity: 1;
            transform: translateY(-50%) translateX(40px);
          }
          100% {
            opacity: 0;
            transform: translateY(-50%) translateX(0);
          }
        }

        @keyframes flyOutStayIn {
          0% {
            opacity: 0;
            transform: translateY(-50%) translateX(0);
          }
          9% { 
            opacity: 1;
            transform: translateY(-50%) translateX(40px);
          }
          91% {
            opacity: 1;
            transform: translateY(-50%) translateX(40px);
          }
          100% {
            opacity: 0;
            transform: translateY(-50%) translateX(0);
          }
        }
        
        .mask {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--background);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 50;
          transition: opacity 0.5s ease-out;
          cursor: default;
        }
        .mask.hidden { opacity: 0; pointer-events: none; }
        .magnifier { 
          width: 100px; 
          height: 100px; 
          cursor: default; 
          animation: glow 0.5s ease-in-out alternate infinite; /* Thêm glow mặc định */
        }
        .magnifier:hover { animation: glow 0.5s ease-in-out alternate infinite; }
        .disk {
          width: 60px;
          height: 60px;
          border: 2px solid var(--colorone);
          border-radius: 50%;
          background-image: url('/blackcat.jpg');
          background-size: cover;
          background-position: center;
          animation: rotate 10s linear infinite;
        }
        .disk.paused { animation-play-state: paused; }
        .disk-text {
          position: absolute;
          top: 0;
          left: 0;
          width: 60px;
          height: 60px;
          animation: rotate 10s linear infinite;
        }
        .disk-text.paused { animation-play-state: paused; }
        .disk-text svg { width: 100%; height: 100%; }
        .disk-text text {
          fill: var(--colorone);
          font-size: 7px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .disk-text textPath {
          fill: var(--colorone);
          paint-order: stroke;
          stroke: white; 
          stroke-width: 4px;
        }

        .title-fly-out {
          position: absolute;
          top: 50%;
          left: 50%; 
          transform: translateY(-50%);
          color: var(--colorone);
          font-size: 1.125rem; 
          font-weight: 600;
          font-style: italic;
          white-space: nowrap;
          opacity: 0; 
          pointer-events: none; 
        }
        
        .title-fly-out.fly-out {
          animation: flyOut 0.5s forwards;
        }
        .title-fly-out.fly-in {
          animation: flyIn 0.5s forwards;
        }
        .title-fly-out.fly-cycle {
          animation: flyOutStayIn 5.5s forwards;
        }

        .font-fredericka {
          font-family: 'Fredericka the Great', cursive;
        }
      `}</style>
      {!isIntroStarted && (
        <div className="mask">
          <img
            src="/cursor.png"
            alt="Magnifier"
            className="magnifier absolute left-1/2 top-1/2 transform -translate-y-1/2 -translate-x-[40%]"
            onClick={handleMaskClick}
          />
        </div>
      )}
      <div id="youtube-player" style={{ display: 'none' }}></div>
      <div className={`w-[80vw] h-[90vh] bg-[var(--colortwo)] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] text-gray-800 transition-opacity duration-1000 relative ${isIntroStarted ? 'opacity-100' : 'opacity-0'}`}>
        <svg className="absolute w-0 h-0 opacity-0 pointer-events-none" aria-hidden="true">
          <defs>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(236 72 153)" />
              <stop offset="100%" stopColor="rgb(234 179 8)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Upbar */}
        <div className="p-4 md:p-6 flex justify-between items-center pl-4 md:pl-10 relative z-40">
            {/* Disk on the left */}
            <div 
              className="relative cursor-pointer" 
              onClick={togglePlayPause}
              onMouseEnter={handleDiskMouseEnter}
              onMouseLeave={handleDiskMouseLeave}
            >
                <div className={`disk ${!isPlaying ? 'paused' : ''}`}></div>
                <div className={`disk-text ${!isPlaying ? 'paused' : ''}`}>
                    <svg viewBox="0 0 60 60">
                        <path
                        id="textPath"
                        d="M 30, 5 A 25, 25 0 0 1 30, 55 A 25, 25 0 0 1 30, 5"
                        fill="none"
                        />
                        <text>
                        </text>
                    </svg>
                </div>
                
                {videoTitle && (
                  <span 
                    key={animationKey} 
                    className={`title-fly-out ${animationClass} font-fredericka`}
                  >
                    {videoTitle}
                  </span>
                )}
            </div>

            {/* Titles on the right */}
            <div className="flex items-center justify-end gap-6 md:gap-10 text-3xl font-semibold pr-4 md:pr-10 text-[var(--colorone)] font-fredericka">
                <div 
                  className="hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text transition-all duration-300 hover:drop-shadow-lg cursor-pointer"
                  onClick={scrollToDown}
                >
                  Case Archives
                </div>
                <div 
                  className="hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text transition-all duration-300 hover:drop-shadow-lg cursor-pointer"
                  onClick={() => setIsStoryOpen(true)}
                >
                  Tell your story!
                </div>
            </div>
        </div>

        {/* Image - z-10 */}
        <div className="absolute bottom-0 left-0 h-1/2 z-10">
            <img
                src="/watsoncrop.png"
                alt="Portrait of Subject"
                className="h-full w-auto"
                style={{
                    transform: `scale(${imageScale})`,
                    transformOrigin: 'bottom left',
                    transition: 'transform 0.3s ease-in-out'
                }}
            />
        </div>

        {/* Introduction - z-0 default */}
        {!isStoryOpen && (
          <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-10 w-4/9 text-justify z-0 font-fredericka">
              <h2
                  className="block w-full text-right text-7xl md:text-8xl text-[var(--colorone)] font-bold mb-2 font-fredericka hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text transition-all duration-300"
                  ref={titleRef}
                  onMouseEnter={handleMouseEnterTitle}
                  onMouseLeave={handleMouseLeaveTitle}
              >
                  {displayTitle}
              </h2>
              <div>
                  <span
                      className="block w-full text-right text-base md:text-2xl text-[var(--colorone)] italic inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text transition-all duration-300 font-fredericka"
                      ref={pronunciationRef}
                      onMouseEnter={handleMouseEnterPronunciation}
                      onMouseLeave={handleMouseLeavePronunciation}
                  >
                      {displayPronunciation}
                  </span>
              </div>
              <div
                  className="text-base md:text-2xl leading-relaxed text-[var(--colorone)] mt-4"
                  ref={textRef}
                  onMouseEnter={handleMouseEnterDescription}
                  onMouseLeave={handleMouseLeaveDescription}
              >
                  <span className="inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text transition-all duration-300">
                      {displayText}
                  </span>
              </div>
          </div>
        )}

        {/* Story Overlay */}
        {isStoryOpen && (
          <div className="absolute top-[80px] rounded-2xl left-0 right-0 bottom-0 bg-[var(--colortwo)] z-[30] p-8 flex flex-col font-fredericka">
            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              className="flex-1 font-serif text-xl pt-5 leading-[1.6] text-gray-400 bg-transparent border-none outline-none resize-none overflow-y-auto no-scrollbar text-justify focus:text-[var(--colorone)]"
              placeholder={DEFAULT_STORY_TEXT} // Sử dụng constant ở đây
            />
            <div className="flex justify-end gap-4 mt-4">
              <button 
                onClick={handleStoryCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all duration-300 font-fredericka"
              >
                Cancel
              </button>
              <button 
                onClick={handleStorySubmit}
                className="px-4 py-2 bg-[var(--colorone)] text-white rounded hover:bg-pink-300 transition-all duration-300 font-fredericka"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Bottom Social Icons - z-20 */}
        {!isStoryOpen && (
          <div className="absolute bottom-10 right-10 flex gap-4 z-20">
            <a href="https://www.youtube.com/@opewatson" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <FaYoutube className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
            </a>
            <a href="https://www.instagram.com/opewatson/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
            </a>
            <a href="https://github.com/thienphucope" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <FaGithub className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
            </a>
            <a href="mailto:thienphucmain@gmail.com" target="_blank" rel="noopener noreferrer" aria-label="Email">
              <FaEnvelope className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
            </a>
            <a href="https://x.com/a" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
            </a>
          </div>
        )}

      </div>
    </section>
  );
}