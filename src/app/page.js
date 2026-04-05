"use client";
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import useFingerprints from '@/features/home/hooks/useFingerprints';

export default function RootPage() {
  const fingerprints = useFingerprints('white');
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/home');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 bg-[var(--colorone)] flex flex-col justify-center items-center z-[100]">
      {fingerprints}
      <ChevronDown className="text-black w-8 h-8 animate-bounce mb-0" />
      <Link href="/home" passHref>
        <img src="/printer.png" alt="Start" className="w-24 h-24 cursor-pointer animate-pulse" />
      </Link>
      <div className="text-black font-fredericka text-xs md:text-2xl opacity-90 mt-4">
        opewatson.org {"->"} opewatson.com
      </div>
    </div>
  );
}
