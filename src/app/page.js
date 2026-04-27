"use client";
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Fingerprint } from 'lucide-react';
import useFingerprints from '@/features/project/home/hooks/useFingerprints';

export default function RootPage() {
  const fingerprints = useFingerprints('var(--colorone)');
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/project/casearchives');
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] flex flex-col justify-center items-center z-[100]">
      {fingerprints}
      <ChevronDown className="text-[var(--colorone)] w-8 h-8 animate-bounce mb-0" />
      <Link href="/project/casearchives" passHref>
        <Fingerprint className="text-[var(--colorone)] w-24 h-24 cursor-pointer animate-pulse" />
      </Link>
      <div className="text-[var(--colorone)] font-fredericka text-xs md:text-2xl opacity-90 mt-4">
        opewatson.org {"->"} opewatson.com
      </div>
    </div>
  );
}
