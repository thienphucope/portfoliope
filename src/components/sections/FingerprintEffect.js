"use client";
import { useState, useEffect } from 'react';
import { Fingerprint } from 'lucide-react';

export default function FingerprintEffect({ color = 'var(--theme)' }) {
  const [fingerprints, setFingerprints] = useState([]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      const id = Date.now();
      const newFingerprint = { 
        id, 
        x: e.pageX, 
        y: e.pageY, 
        rotation: Math.random() * 360 
      };
      
      setFingerprints(prev => [...prev, newFingerprint]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setFingerprints(prev => prev.filter(fp => fp.id !== id));
      }, 5000);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <>
      {fingerprints.map(fp => (
        <div 
          key={fp.id} 
          className="fingerprint-effect" 
          style={{ 
            left: fp.x, 
            top: fp.y, 
            '--rot': `${fp.rotation}deg`, 
            color: color 
          }}
        >
          <Fingerprint className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32" />
        </div>
      ))}
    </>
  );
}
