"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header({ 
  isPlaying, 
  videoTitle, 
  togglePlayPause, 
  handleDiskMouseEnter, 
  handleDiskMouseLeave, 
  animationKey, 
  animationClass 
}) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/home', label: 'Home' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/about', label: 'About' },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes flyOut { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 100% { opacity: 1; transform: translateY(-50%) translateX(40px); } }
        @keyframes flyIn { 0% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        @keyframes flyOutStayIn { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 9% { opacity: 1; transform: translateY(-50%) translateX(40px); } 91% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        .disk { width: 60px; height: 60px; border: 2px solid var(--colorone); border-radius: 50%; background-image: url('/blackcat.jpg'); background-size: cover; background-position: center; animation: rotate 10s linear infinite; }
        .disk.paused { animation-play-state: paused; }
        .title-fly-out { position: absolute; top: 50%; left: 50%; transform: translateY(-50%); color: var(--colorone); font-size: 1.125rem; font-weight: bold; font-style: italic; white-space: nowrap; opacity: 0; pointer-events: none; }
        .title-fly-out.fly-out { animation: flyOut 0.5s forwards; }
        .title-fly-out.fly-in { animation: flyIn 0.5s forwards; }
        .title-fly-out.fly-cycle { animation: flyOutStayIn 5.5s forwards; }
      `}</style>
      <header className="absolute top-0 left-0 right-0 p-4 md:p-10 flex justify-between items-center z-[60] transition-opacity duration-1000 opacity-100">
        <div className="relative cursor-pointer" onClick={togglePlayPause} onMouseEnter={handleDiskMouseEnter} onMouseLeave={handleDiskMouseLeave}>
          <div className={`disk ${!isPlaying ? 'paused' : ''}`}></div>
          {videoTitle && <span key={animationKey} className={`title-fly-out ${animationClass} font-fredericka`}>{videoTitle}</span>}
        </div>
        
        <nav className="flex items-center gap-6 md:gap-10 font-fredericka text-[var(--colorone)]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`text-xl md:text-3xl font-bold transition-colors duration-300 ${isActive ? 'text-white underline underline-offset-8' : 'hover:text-white'}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
