"use client";
import { useState, useEffect } from 'react';

export default function useFingerprints() {
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
      
      // Auto-remove after 5 seconds to match HomeClient.js
      setTimeout(() => {
        setFingerprints(prev => prev.filter(fp => fp.id !== id));
      }, 5000);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return fingerprints;
}
