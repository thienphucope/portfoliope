"use client";
import { useState, useEffect, useRef } from 'react';
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter, FaArrowDown, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

export default function Page1() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [displayText, setDisplayText] = useState("A curious explorer and eager sleuth, driven by a love for mysteries, and the thrill of uncovering what lies under the surface of everything.");
  const [displayTitle, setDisplayTitle] = useState("Ope Watson");
  const [displayPronunciation, setDisplayPronunciation] = useState("en. /'oʊp 'wɑːtsən/  jp. /opeオペ/");
  const [isIntroStarted, setIsIntroStarted] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const playerRef = useRef(null);
  const textRef = useRef(null);
  const titleRef = useRef(null);
  const pronunciationRef = useRef(null);

  const originalText = "A curious explorer and eager sleuth, driven by a love for mysteries, and the thrill of uncovering what lies under the surface of everything.";
  const replacementText = "An unmotivated sloth in human form, dedicated to avoiding effort, solving nothing, and uninterested in anything beyond the nearest snack or nap.";
  const originalTitle = "Ope Watson";
  const replacementTitle = "No Touch!";
  const originalPronunciation = "en. /'oʊp 'wɑːtsən/  jp. /opeオペ/";
  const replacementPronunciation = "pronounce it anyways!";

  // Scramble text animation
  const scrambleText = (original, target, setDisplay, duration = 200) => {
    const chars = "abcdehknguvxyz";
    let startTime = null;
    let frame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);

      if (progressRatio < 0.7) {
        const scrambled = original
          .split("")
          .map((char, i) => {
            if (char === " ") return char;
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
        setDisplay(scrambled);
        frame = requestAnimationFrame(animate);
      } else {
        const blendRatio = (progressRatio - 0.7) / 0.3;
        const currentText = original
          .split("")
          .map((char, i) => {
            if (char === " ") return char;
            return blendRatio < Math.random() ? char : target[i] || char;
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
    scrambleText(originalText, replacementText, setDisplayText);
  };

  // Handle mouse leave for description
  const handleMouseLeaveDescription = () => {
    scrambleText(replacementText, originalText, setDisplayText);
  };

  // Handle mouse enter for title
  const handleMouseEnterTitle = () => {
    scrambleText(originalTitle, replacementTitle, setDisplayTitle);
  };

  // Handle mouse leave for title
  const handleMouseLeaveTitle = () => {
    scrambleText(replacementTitle, originalTitle, setDisplayTitle);
  };

  // Handle mouse enter for pronunciation
  const handleMouseEnterPronunciation = () => {
    scrambleText(originalPronunciation, replacementPronunciation, setDisplayPronunciation);
  };

  // Handle mouse leave for pronunciation
  const handleMouseLeavePronunciation = () => {
    scrambleText(replacementPronunciation, originalPronunciation, setDisplayPronunciation);
  };

  // Open modal function
  const openModal = () => setIsModalOpen(true);

  // Close modal function
  const closeModal = () => setIsModalOpen(false);

  // Scroll to next section (scroll down)
  const scrollToDown = () => {
    const container = document.querySelector('.snap-y');
    if (container) {
      container.scrollBy({ top: container.offsetHeight, behavior: 'smooth' });
    }
  };

  // Toggle audio mute/unmute
  const toggleAudio = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.playVideo();
        setIsPlaying(true);
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
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
          videoId: 'pL35m337Qa4',
          playerVars: {
            autoplay: 1,
            loop: 1,
            playlist: 'pL35m337Qa4',
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            mute: 1,
          },
          events: {
            onReady: (event) => {
              event.target.setVolume(50);
            },
          },
        });
      };
    }
  }, [isIntroStarted]);

  // Handle mask click
  const handleMaskClick = () => {
    setIsIntroStarted(true);
  };

  useEffect(() => {
    if (isIntroStarted) {
      setTimeout(() => setIsIntroDone(true), 100);
    }
  }, [isIntroStarted]);

  return (
    <section id="gallery" className="w-full min-h-screen bg-[var(--background)] snap-start font-serif box-border relative z-10">
      <style jsx>{`
        @keyframes slideInFromBottom {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideInFromRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes glow {
          0% {
            filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
          }
          100% {
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
          }
        }
        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-text-1 {
          animation: slideInFromBottom 0.5s ease-out forwards;
          animation-delay: 1.5s;
        }
        .animate-text-2 {
          animation: slideInFromBottom 0.5s ease-out forwards;
          animation-delay: 1.7s;
        }
        .animate-text-3 {
          animation: slideInFromBottom 0.5s ease-out forwards;
          animation-delay: 1.9s;
        }
        .animate-icon-1 {
          animation: slideInFromRight 0.5s ease-out forwards;
          animation-delay: 2.1s;
        }
        .animate-icon-2 {
          animation: slideInFromRight 0.5s ease-out forwards;
          animation-delay: 2.3s;
        }
        .animate-icon-3 {
          animation: slideInFromRight 0.5s ease-out forwards;
          animation-delay: 2.5s;
        }
        .animate-icon-4 {
          animation: slideInFromRight 0.5s ease-out forwards;
          animation-delay: 2.7s;
        }
        .animate-icon-5 {
          animation: slideInFromRight 0.5s ease-out forwards;
          animation-delay: 2.9s;
        }
        .animate-whatsnew {
          animation: slideInFromRight 0.5s ease-out forwards;
          animation-delay: 3.1s;
        }
        .animate-disk {
          animation: slideInFromRight 0.5s ease-out forwards;
          animation-delay: 3.3s;
        }
        .initially-hidden {
          opacity: 0;
          transform: translateY(100%);
        }
        .initially-hidden-icon {
          opacity: 0;
          transform: translateX(100%);
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
        }
        .mask.hidden {
          opacity: 0;
          pointer-events: none;
        }
        .magnifier {
          width: 100px;
          height: 100px;
          cursor: pointer;
        }
        .magnifier:hover {
          animation: glow 0.5s ease-in-out alternate infinite;
        }
        .disk-container {
          position: absolute;
          left: -80px; /* Half of the disk width to center it on the border */
          top: 65%; /* Desktop position */
          transform: translateY(-50%);
          width: 160px;
          height: 160px;
          z-index: 30;
          cursor: pointer;
        }
        .disk {
          width: 160px;
          height: 160px;
          border: 5px solid var(--colorone);
          border-radius: 50%;
          background-image: url('/blackcat.jpg');
          background-size: cover;
          background-position: center;
          animation: rotate 10s linear infinite;
        }
        .disk-text {
          position: absolute;
          top: 0;
          left: 0;
          width: 160px;
          height: 160px;
          animation: rotate 10s linear infinite;
        }
        .disk-text svg {
          width: 100%;
          height: 100%;
        }
        .disk-text text {
          fill: var(--colorone);
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .disk-text textPath {
          fill: var(--colorone);
          paint-order: stroke;
          stroke: var(--background);
          stroke-width: 6px;
        }
        @media (max-width: 767px) {
          .disk-container {
            left: 40%; /* Center horizontally in right box */
            top: -40px; /* Half disk height to protrude upward */
            transform: translateX(-50%); /* Center horizontally */
            width: 80px; /* 2/3 of 120px */
            height: 80px;
          }
          .disk {
            width: 80px;
            height: 80px;
            border: 3px solid var(--colorone); /* Scaled border */
          }
          .disk-text {
            width: 80px;
            height: 80px;
          }
          .disk-text svg {
            width: 100%;
            height: 100%;
          }
          .disk-text text {
            font-size: 8px; /* Scaled for smaller disk */
          }
          .disk-text textPath {
            stroke-width: 4px; /* Scaled background effect */
          }
          .disk-text path {
            d: 'M 40, 10 A 30, 30 0 0 1 40, 70 A 30, 30 0 0 1 40, 10'; /* Scaled path radius */
          }
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
      <div className={`flex flex-col md:flex-row items-stretch w-full min-h-screen ${!isIntroStarted ? 'hidden' : ''}`}>
        <div id="youtube-player" style={{ display: 'none' }}></div>
        <div
          className="absolute left-0 top-10 transform -translate-y-1/2 pl-5 z-30 cursor-pointer group"
          onClick={toggleAudio}
        >
          {isMuted ? (
            <FaVolumeMute className="text-[var(--background)] text-4xl md:text-5xl hover:text-[var(--background)] hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300" />
          ) : (
            <FaVolumeUp className="text-[var(--background)] text-4xl md:text-5xl hover:text-[var(--background)] hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300" />
          )}
        </div>
        <div
          className={`w-full md:w-3/5 flex justify-start bg-white items-center h-full md:h-screen transition-all duration-1000 ease-in-out ${
            isIntroDone ? 'md:w-3/5' : 'md:w-0 opacity-0'
          }`}
        >
          <img
            src="/watsoncrop.png"
            alt="Portrait of Subject"
            className="w-full h-full object-cover rounded"
          />
        </div>
        <div
          className={`w-full md:w-2/5 flex flex-col text-justify min-h-[50vh] md:h-screen text-[var(--foreground)] p-4 md:p-18 bg-[var(--background)] relative transition-all duration-1000 ease-in-out ${
            isIntroDone ? 'md:w-2/5' : 'md:w-full'
          }`}
        >
          <div className={`disk-container initially-hidden-icon ${isIntroDone ? 'animate-disk' : ''}`} onClick={togglePlayPause}>
            <div className="disk"></div>
            <div className="disk-text">
              <svg viewBox="0 0 120 120">
                <path
                  id="textPath"
                  d="M 60, 15 A 45, 45 0 0 1 60, 105 A 45, 45 0 0 1 60, 15"
                  fill="none"
                />
                <text>
                  <textPath href="#textPath" startOffset="0%">
                    unmute to hear
                  </textPath>
                </text>
              </svg>
            </div>
          </div>
          <div className={`flex-none relative z-20 initially-hidden ${isIntroDone ? 'animate-text-1' : ''}`}>
            <h2
              className="text-5xl md:text-6xl text-[var(--colorone)] font-bold mt-8 md:mt-15 md:mb-2 font-chomsky hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300"
              ref={titleRef}
              onMouseEnter={handleMouseEnterTitle}
              onMouseLeave={handleMouseLeaveTitle}
            >
              {displayTitle}
            </h2>
            <div>
              <span
                className="text-base md:text-xl leading-relaxed text-[var(--colorone)] italic inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300"
                ref={pronunciationRef}
                onMouseEnter={handleMouseEnterPronunciation}
                onMouseLeave={handleMouseLeavePronunciation}
              >
                {displayPronunciation}
              </span>
            </div>
          </div>
          <div
            className={`flex-none text-lg md:text-2xl leading-relaxed text-[var(--colortwo)] space-y-2 md:space-y-3 mt-7 mr-5 relative z-20 initially-hidden ${isIntroDone ? 'animate-text-2' : ''}`}
            ref={textRef}
            onMouseEnter={handleMouseEnterDescription}
            onMouseLeave={handleMouseLeaveDescription}
            style={{
              lineHeight: '2.5rem',
              maxHeight: '10rem',
              overflow: 'hidden',
            }}
          >
            <div>
              <span className="inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
                {displayText}
              </span>
            </div>
          </div>
          <div className={`flex-1 mt-9 w-full relative z-20 cursor-pointer initially-hidden ${isIntroDone ? 'animate-text-3' : ''}`}>
            <div className="w-full h-full flex items-center justify-center cursor-pointer">
              <div className={`grid grid-cols-3 gap-4 p-6 border-0 cursor-pointer ${isIconHovered ? 'border-pink-300' : 'border-[var(--colorone)]'} rounded-md w-full transition-colors duration-300`}>
                <a
                  href="https://youtu.be/dQw4w9WgXcQ?si=E7qNEqCYESugKUd2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex justify-center items-center initially-hidden-icon ${isIntroDone ? 'animate-icon-1' : ''}`}
                  onMouseEnter={() => setIsIconHovered(true)}
                  onMouseLeave={() => setIsIconHovered(false)}
                >
                  <FaYoutube className="text-[var(--colorone)] text-6xl md:text-7xl hover:text-red-300 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
                </a>
                <a
                  href="https://www.instagram.com/opewatson"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex justify-center items-center initially-hidden-icon ${isIntroDone ? 'animate-icon-2' : ''}`}
                  onMouseEnter={() => setIsIconHovered(true)}
                  onMouseLeave={() => setIsIconHovered(false)}
                >
                  <FaInstagram className="text-[var(--colorone)] text-6xl md:text-7xl hover:text-pink-300 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
                </a>
                <a
                  href="https://github.com/thienphucope"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex justify-center items-center initially-hidden-icon ${isIntroDone ? 'animate-icon-3' : ''}`}
                  onMouseEnter={() => setIsIconHovered(true)}
                  onMouseLeave={() => setIsIconHovered(false)}
                >
                  <FaGithub className="text-[var,--colorone)] text-6xl md:text-7xl hover:text-black hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
                </a>
                <a
                  href="mailto:thienphucmain1052004@gmail.com"
                  className={`flex justify-center items-center initially-hidden-icon ${isIntroDone ? 'animate-icon-4' : ''}`}
                  onMouseEnter={() => setIsIconHovered(true)}
                  onMouseLeave={() => setIsIconHovered(false)}
                >
                  <FaEnvelope className="text-[var(--colorone)] text-6xl md:text-7xl hover:text-white hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
                </a>
                <a
                  href="https://x.com/samekosaba"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex justify-center items-center initially-hidden-icon ${isIntroDone ? 'animate-icon-5' : ''}`}
                  onMouseEnter={() => setIsIconHovered(true)}
                  onMouseLeave={() => setIsIconHovered(false)}
                >
                  <FaTwitter className="text-[var(--colorone)] text-6xl md:text-7xl hover:text-blue-300 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
                </a>
              </div>
            </div>
          </div>
          {isModalOpen && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
              onClick={closeModal}
            >
              <div className="relative w-[80vw] h-[90vh] max-w-4xl max-h-[90vh]">
                <img
                  src="/news.png"
                  alt="Newspaper"
                  className="w-full h-full object-contain rounded-md"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div className={`flex justify-end mt-8 items-center gap-2 pt-5 relative z-20 initially-hidden-icon ${isIntroDone ? 'animate-whatsnew' : ''}`}>
            <div
              onClick={scrollToDown}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-[var(--colortwo)] text-lg md:text-2xl font-medium hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer"
            >
              <span className="cursor-pointer"> whats new?</span>
              <FaArrowDown className="text-[var(--colortwo)] text-lg md:text-2xl hover:text-pink-300 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}