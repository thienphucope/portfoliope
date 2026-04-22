"use client";
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Fingerprint } from 'lucide-react';
import useFingerprints from '@/features/project/home/hooks/useFingerprints';

export default function RootPage() {
  const fingerprints = useFingerprints('white');
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
      if (isMobile) {
        router.push('/project/casearchives');
      } else {
        router.push('/me');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 bg-[var(--colorone)] flex flex-col justify-center items-center z-[100]">
      {fingerprints}
      <ChevronDown className="text-white w-8 h-8 animate-bounce mb-0" />
      <Link href="/project/casearchives" passHref>
        <Fingerprint className="text-white w-24 h-24 cursor-pointer animate-pulse" />
      </Link>
      <div className="text-white font-fredericka text-xs md:text-2xl opacity-90 mt-4">
        opewatson.org {"->"} opewatson.com
      </div>
    </div>
  );
}
