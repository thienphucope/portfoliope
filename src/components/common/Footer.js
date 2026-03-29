"use client";
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="absolute bottom-0 left-0 right-0 p-4 pb-10 md:p-10 flex flex-col lg:flex-row justify-center lg:justify-between items-center gap-4 lg:gap-0 z-[60] bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-1000 opacity-100">
      <div className="order-1 lg:order-1 text-[var(--colorone)] font-fredericka font-bold text-xs md:text-xl opacity-60">© 2026 Ope Watson</div>
      <div className="order-2 lg:order-2 flex gap-6 z-20">
        <a href="https://www.youtube.com/watch?v=zqcrDCynF8k" target="_blank" rel="noopener noreferrer"><FaYoutube className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
        <a href="https://www.instagram.com/t22felton/" target="_blank" rel="noopener noreferrer"><FaInstagram className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
        <a href="https://github.com/thienphucope" target="_blank" rel="noopener noreferrer"><FaGithub className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
        <a href="mailto:thienphucmain@gmail.com"><FaEnvelope className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
        <a href="https://x.com/a" target="_blank" rel="noopener noreferrer"><FaTwitter className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
      </div>
    </footer>
  );
}
