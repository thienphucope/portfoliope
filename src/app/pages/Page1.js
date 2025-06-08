"use client";
import { useState, useEffect, useRef } from 'react';
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter, FaArrowRight, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

export default function Page1() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isIconHovered, setIsIconHovered] = useState(false);
  const audioRef = useRef(null);

  // Open modal function
  const openModal = () => setIsModalOpen(true);

  // Close modal function
  const closeModal = () => setIsModalOpen(false);

  // Scroll to next section (scroll right)
  const scrollToRight = () => {
    // Tìm phần tử cha có overflow-x (container chính)
    const container = document.querySelector('.snap-x');
    if (container) {
      // Cuộn sang phải bằng đúng chiều rộng của 1 section
      container.scrollBy({ left: container.offsetWidth, behavior: 'smooth' });
    }
  };

  // Toggle audio mute/unmute
  const toggleAudio = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Initialize audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5; // Set default volume
      audioRef.current.loop = true;  // Loop the audio
      audioRef.current.play().catch((error) => {
        console.log("Audio playback failed:", error);
      });
    }
  }, []);

  return (
    <section id="gallery" className="w-full h-screen bg-[var(--background)] snap-start font-serif box-border flex flex-col md:flex-row items-stretch relative z-10">
      {/* Audio element */}
      <audio ref={audioRef} src="/background-audio.mp3" />

      {/* Speaker icon: Centered on left side */}
      <div
        className="absolute left-0 top-10 transform -translate-y-1/2 pl-5 z-30 cursor-pointer group"
        onClick={toggleAudio}
      >
        {isMuted ? (
          <FaVolumeMute className="text-[var(--background)] text-4xl md:text-5xl hover:text-[var(--background)] hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 group-" />
        ) : (
          <FaVolumeUp className="text-[var(--background)] text-4xl md:text-5xl hover:text-[var(--background)] hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 group-" />
        )}
      </div>

      {/* Left Section: Image */}
      <div className="w-full md:w-3/5 flex justify-start bg-white items-center h-full">
        <img
          src="/watsoncrop.png"
          alt="Portrait of Subject"
          className="w-full h-full object-cover rounded"
        />
      </div>

      {/* Right Section: Text content, social links grid, and about button */}
      <div className="w-full md:w-2/5 hover:md:w-[45%] flex flex-col text-justify h-full text-[var(--foreground)] p-4 md:p-18 md:pr-18 bg-[var(--background)] relative transition-all duration-300">
        {/* Title and pronunciation */}
        <div className="flex-none relative z-20">
          <h2 className="text-5xl md:text-7xl text-[var(--colorone)] font-bold mb-1 md:mb-2 font-chomsky hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
            Ope Watson
          </h2>
          <div>
            <span className="text-base md:text-xl leading-relaxed text-[var(--colorone)] italic inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
              en. /&apos;oʊp &apos;wɑːtsən/  jp. /opeオペ/
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-none text-base md:text-xl leading-relaxed text-[var(--colortwo)] space-y-2 md:space-y-3 mt-6 relative z-20">
          <div>
            <span className="font-bold italic inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
              noun.
            </span>
            <br />
            <span className="inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
              1. relentless seeker of knowledge
            </span>
          </div>

          <div>
            <span className="font-bold italic inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
              adjective.
            </span>
            <br />
            <span className="inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
              1. describing a person or action marked by curiosity
            </span>
            <br />
            <span className="inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
              2. passionately immersed in learning and discovery
            </span>
            <br />
            <span className="text-sm md:text-base text-[var(--colorthree)] inline-block hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
              e.g. &quot;Oh gosh! He&apos;s so Ope Watson, innit!&quot;
            </span>
          </div>
        </div>

        {/* Social links grid: Fills available space */}
        <div className="flex-1 mt-8 w-full relative z-20 cursor-pointer">
          <div className="w-full h-full flex items-center justify-center cursor-pointer">
            <div className={`grid grid-cols-3 gap-4 p-6 border-0 cursor-pointer ${isIconHovered ? 'border-pink-300' : 'border-[var(--colorone)]'} rounded-md w-full transition-colors duration-300`}>
              <a
                href="https://youtu.be/dQw4w9WgXcQ?si=E7qNEqCYESugKUd2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center items-center"
                onMouseEnter={() => setIsIconHovered(true)}
                onMouseLeave={() => setIsIconHovered(false)}
              >
                <FaYoutube className="text-[var(--colorone)] text-6xl md:text-7xl hover:text-red-300 hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
              </a>
              <a
                href="https://www.instagram.com/opewatson"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center items-center"
                onMouseEnter={() => setIsIconHovered(true)}
                onMouseLeave={() => setIsIconHovered(false)}
              >
                <FaInstagram className="text-[var(--colorone)] text-6xl md:text-7xl hover:text-pink-300 hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
              </a>
              <a
                href="https://github.com/thienphucope"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center items-center"
                onMouseEnter={() => setIsIconHovered(true)}
                onMouseLeave={() => setIsIconHovered(false)}
              >
                <FaGithub className="text-[var(--colorone)] text-6xl md:text-7xl hover:text-black hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
              </a>
              <a
                href="mailto:thienphucmain1052004@gmail.com"
                className="flex justify-center items-center"
                onMouseEnter={() => setIsIconHovered(true)}
                onMouseLeave={() => setIsIconHovered(false)}
              >
                <FaEnvelope className="text-[var(--colorone)] text-6xl md:text-7xl hover:text-white hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
              </a>
              <a
                href="https://x.com/samekosaba"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center items-center"
                onMouseEnter={() => setIsIconHovered(true)}
                onMouseLeave={() => setIsIconHovered(false)}
              >
                <FaTwitter className="text-[var(--colorone)] text-6xl md:text-7xl hover:text-blue-300 hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal for displaying image */}
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

        {/* More clues button: Bottom-right, scrolls right with hover effect */}
        <div className="flex justify-end mt-8 items-center gap-2 pt-5 relative z-20">
          <div
            onClick={scrollToRight}
            className="absolute bottom-8 right-0 flex items-center gap-2 text-[var(--colortwo)] text-lg md:text-2xl font-medium hover:bg-gradient-to-r hover:from-pink-300 hover:to-yellow-300 hover:text-transparent hover:bg-clip-text hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer"
          >
            <span className="cursor-pointer"> what&apos;s new?</span>
            <FaArrowRight className="text-[var(--colortwo)] text-lg md:text-2xl hover:text-pink-300 hover:scale-110 hover:filter hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300 cursor-pointer" />
          </div>
        </div>
      </div>
    </section>
  );
}