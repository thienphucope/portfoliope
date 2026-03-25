"use client";
import Link from 'next/link';
import CaseArchivesButton from './CaseArchivesButton';

export default function HomeHeader({ 
  isPlaying, 
  videoTitle, 
  togglePlayPause, 
  handleDiskMouseEnter, 
  handleDiskMouseLeave, 
  animationKey, 
  animationClass 
}) {
  return (
    <>
      <style jsx global>{`
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes flyOut { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 100% { opacity: 1; transform: translateY(-50%) translateX(40px); } }
        @keyframes flyIn { 0% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        @keyframes flyOutStayIn { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 9% { opacity: 1; transform: translateY(-50%) translateX(40px); } 91% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        .disk { width: 60px; height: 60px; border: 2px solid var(--colorone); border-radius: 50%; background-image: url('/blackcat.jpg'); background-size: cover; background-position: center; animation: rotate 10s linear infinite; }
        .disk.paused { animation-play-state: paused; }
        .title-fly-out { position: absolute; top: 50%; left: 50%; transform: translateY(-50%); color: var(--colorone); font-size: 1.125rem; font-weight: 600; font-style: italic; white-space: nowrap; opacity: 0; pointer-events: none; }
        .title-fly-out.fly-out { animation: flyOut 0.5s forwards; }
        .title-fly-out.fly-in { animation: flyIn 0.5s forwards; }
        .title-fly-out.fly-cycle { animation: flyOutStayIn 5.5s forwards; }
      `}</style>
      <header className="absolute top-0 left-0 right-0 p-4 md:p-10 flex justify-between items-center z-[60] transition-opacity duration-1000 opacity-100">
        <div className="relative cursor-pointer" onClick={togglePlayPause} onMouseEnter={handleDiskMouseEnter} onMouseLeave={handleDiskMouseLeave}>
          <div className={`disk ${!isPlaying ? 'paused' : ''}`}></div>
          {videoTitle && <span key={animationKey} className={`title-fly-out ${animationClass} font-fredericka`}>{videoTitle}</span>}
        </div>
        <div className="flex items-center gap-4 md:gap-10 font-fredericka text-[var(--colorone)]">
          <CaseArchivesButton />
          <Link href="/privacy" className="text-xl md:text-3xl font-semibold hover:text-white transition-colors">
            Privacy
          </Link>
        </div>
      </header>
    </>
  );
}
