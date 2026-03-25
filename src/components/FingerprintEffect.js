"use client";
import { Fingerprint } from 'lucide-react';
import useFingerprints from '@/hooks/useFingerprints';

export default function FingerprintEffect({ color = 'var(--colorone)' }) {
  const fingerprints = useFingerprints();

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
