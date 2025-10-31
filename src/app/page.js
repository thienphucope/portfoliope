"use client";
import Page1 from './pages/Page1';
import Page2 from '../../bin/Page2';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'tablet', 'android', 'iphone', 'ipad', 'windows phone'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
        window.innerWidth < 768; // Additional check for small screens
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[var(--background)] text-white text-xl p-4 text-center">
        This site is not accessible on mobile devices. Please use a desktop browser.
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col snap-y snap-mandatory overflow-y-auto no-scrollbar bg-[var(--background)]">
      {/* Gallery Section */}
      <div className="w-full min-h-screen flex-shrink-0 snap-start">
        <Page1 />
      </div>
      
      {/* Cover Section */}
      <div className="w-full min-h-screen flex-shrink-0 snap-start">
        <Page2 />
      </div>
    </div>
  );
}