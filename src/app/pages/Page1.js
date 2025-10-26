"use client";
import { useState, useEffect, useRef } from 'react';
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter, FaArrowDown } from 'react-icons/fa';

export default function Page1() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDiscHovered, setIsDiscHovered] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [displayText, setDisplayText] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayPronunciation, setDisplayPronunciation] = useState("");
  const [isIntroStarted, setIsIntroStarted] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const playerRef = useRef(null);
  const textRef = useRef(null);
  const titleRef = useRef(null);
  const pronunciationRef = useRef(null);

  // You can change this value in the code to scale the image
  const imageScale = 1.8;

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

  const originalPronunciation = "en. /'oʊp 'wɑːtsən/  jp. /opeオペ/";
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
          .map((char) => {
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
    scrambleText(originalTextPadded, replacementTextPadded, setDisplayText);
  };

  // Handle mouse leave for description
  const handleMouseLeaveDescription = () => {
    scrambleText(replacementTextPadded, originalTextPadded, setDisplayText);
  };

  // Handle mouse enter for title
  const handleMouseEnterTitle = () => {
    scrambleText(originalTitlePadded, replacementTitlePadded, setDisplayTitle);
  };

  // Handle mouse leave for title
  const handleMouseLeaveTitle = () => {
    scrambleText(replacementTitlePadded, originalTitlePadded, setDisplayTitle);
  };

  // Handle mouse enter for pronunciation
  const handleMouseEnterPronunciation = () => {
    scrambleText(originalPronPadded, replacementPronPadded, setDisplayPronunciation);
  };

  // Handle mouse leave for pronunciation
  const handleMouseLeavePronunciation = () => {
    scrambleText(replacementPronPadded, originalPronPadded, setDisplayPronunciation);
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
          videoId: 'Vwnp-2T3VFg',
          playerVars: {
            autoplay: 0,
            loop: 1,
            playlist: 'Vwnp-2T3VFg,pL35m337Qa4',
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event) => {
              event.target.setVolume(50);
              setVideoTitle(event.target.getVideoData().title);
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setVideoTitle(event.target.getVideoData().title);
              }
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
    <section id="gallery" className="w-full min-h-screen bg-[var(--background)] snap-start font-serif box-border relative z-10 flex justify-center items-center">
      <style jsx>{`
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
        .disk.paused {
          animation-play-state: paused;
        }
        .disk-text {
          position: absolute;
          top: 0;
          left: 0;
          width: 60px;
          height: 60px;
          animation: rotate 10s linear infinite;
        }
        .disk-text.paused {
          animation-play-state: paused;
        }
        .disk-text svg {
          width: 100%;
          height: 100%;
        }
        .disk-text text {
          fill: var(--colorone);
          font-size: 7px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .disk-text textPath {
          fill: var(--colorone);
          paint-order: stroke;
          stroke: white; /* Assuming white container background */
          stroke-width: 4px;
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
      {/* New Layout Starts Here */}
      <div className={`w-[80vw] h-[90vh] bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] text-gray-800 transition-opacity duration-1000 relative ${isIntroStarted ? 'opacity-100' : 'opacity-0'}`}>
        {/* Hidden SVG for gradient definition */}
        <svg className="absolute w-0 h-0 opacity-0 pointer-events-none" aria-hidden="true">
          <defs>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(236 72 153)" />
              <stop offset="100%" stopColor="rgb(234 179 8)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Upbar */}
        <div className="p-4 md:p-6 flex justify-between items-center pl-4 md:pl-10">
            {/* Disk on the left */}
            <div 
              className="relative cursor-pointer" 
              onClick={togglePlayPause}
              onMouseEnter={() => setIsDiscHovered(true)}
              onMouseLeave={() => setIsDiscHovered(false)}
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
                        <textPath href="#textPath" startOffset="0%">
                            unmute to hear
                        </textPath>
                        </text>
                    </svg>
                </div>
                {isDiscHovered && videoTitle && (
                  <span className="absolute top-1/2 -translate-y-1/2 left-full ml-2 text-[var(--colorone)] text-sm italic bg-white px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {videoTitle}
                  </span>
                )}
            </div>

            {/* Titles on the right */}
            <div className="flex items-center justify-end gap-6 md:gap-10 text-xl font-semibold pr-4 md:pr-10 text-[var(--colorone)]">
                <a href="#" className="hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text transition-all duration-300 hover:drop-shadow-lg">Blogs</a>
                <a href="#" className="hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text transition-all duration-300 hover:drop-shadow-lg">Tell your story!</a>
            </div>
        </div>

        {/* Image */}
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

        {/* Introduction */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-10 w-4/9 text-justify">
            <h2
                className="text-5xl md:text-8xl text-[var(--colorone)] font-bold mb-2 font-chomsky hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text transition-all duration-300"
                ref={titleRef}
                onMouseEnter={handleMouseEnterTitle}
                onMouseLeave={handleMouseLeaveTitle}
            >
                {displayTitle}
            </h2>
            <div>
                <span
                    className="text-base md:text-2xl text-[var(--colorone)] italic inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text transition-all duration-300"
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

        {/* Bottom Social Icons */}
        <div className="absolute bottom-10 right-10 flex gap-4 z-20">
          <a href="https://www.youtube.com/watch?v=Vwnp-2T3VFg">
            <FaYoutube className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
          </a>
          <a href="https://www.instagram.com/opewatson/">
            <FaInstagram className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
          </a>
          <a href="https://github.com/thienphucope">
            <FaGithub className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
          </a>
          <a href="mailto:thienphucmain@gmail.com">
            <FaEnvelope className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
          </a>
          <a href="https://x.com/a">
            <FaTwitter className="text-[var(--colorone)] text-5xl hover:fill-[url(#iconGradient)] transition-all duration-300 hover:drop-shadow-lg" />
          </a>
        </div>

      </div>
    </section>
  );
}