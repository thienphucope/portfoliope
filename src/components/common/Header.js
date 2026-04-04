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
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy' },
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
      <header className="absolute top-0 left-0 right-0 px-6 md:px-10 py-6 md:py-10 flex justify-between items-center z-[60] transition-opacity duration-1000 opacity-100">
        <div className="relative cursor-pointer" onClick={togglePlayPause} onMouseEnter={handleDiskMouseEnter} onMouseLeave={handleDiskMouseLeave}>
          <div className={`disk ${!isPlaying ? 'paused' : ''}`}></div>
          {videoTitle && <span key={animationKey} className={`title-fly-out ${animationClass} font-fredericka`} style={{ fontFamily: 'var(--font-display)' }}>{videoTitle}</span>}
        </div>
        
        <nav className="flex items-center gap-6 md:gap-10 text-[var(--colorone)]" style={{ fontFamily: 'var(--font-display)' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`text-xl md:text-3xl font-bold transition-colors duration-300 ${isActive ? 'line-through' : 'hover:text-white'}`}
                style={isActive ? { color: 'var(--colorone)', textDecorationThickness: '6px', textDecorationColor: 'white' } : {}}
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
