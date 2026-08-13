import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-mono";
import "@fontsource/zen-kaku-gothic-new";
import "./globals.css";
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import BootScreen from '@/components/layout/BootScreen';

const BOOT_SCREEN_CSS = `
  html, body { background-color: #000 !important; }
  .site-boot {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: grid;
    place-items: center;
    overflow: hidden;
    color: #d8d1be;
    background:
      radial-gradient(ellipse 70% 34% at 50% 0%, rgba(243,208,152,.09), transparent 70%),
      repeating-linear-gradient(88deg, rgba(255,255,255,.009) 0 1px, transparent 1px 9px),
      #020403;
    opacity: 1;
    visibility: visible;
    transition: opacity 480ms ease, visibility 480ms step-end, filter 480ms ease;
    font-family: 'Courier New', Courier, monospace;
  }
  .site-boot.is-leaving { opacity: 0; visibility: hidden; filter: blur(3px); }
  .site-boot__tube {
    position: absolute;
    top: 0;
    left: 50%;
    width: min(720px, 72vw);
    height: 7px;
    transform: translateX(-50%);
    border: 1px solid rgba(198,205,194,.13);
    border-top: 0;
    border-radius: 0 0 4px 4px;
    background: linear-gradient(90deg, #161a17, #ede1bd 12%, #fff8de 50%, #ede1bd 88%, #161a17);
    box-shadow: 0 5px 12px rgba(243,208,152,.25), 0 22px 58px rgba(214,222,207,.08);
  }
  .site-boot__copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(330px, 76vw);
    text-align: center;
  }
  .site-boot__case { margin-bottom: 13px; color: rgba(216,209,190,.46); font-size: 9px; letter-spacing: .22em; }
  .site-boot__copy strong { color: #e5ddc8; font-family: Georgia, serif; font-size: clamp(25px, 4vw, 38px); font-weight: 400; letter-spacing: .08em; }
  .site-boot__progress { position: relative; width: 100%; height: 1px; margin: 22px 0 13px; overflow: hidden; background: rgba(216,209,190,.13); }
  .site-boot__progress i { position: absolute; inset: 0 auto 0 0; width: 38%; background: linear-gradient(90deg, transparent, rgba(243,208,152,.88), transparent); animation: site-boot-develop 1.25s ease-in-out infinite; }
  .site-boot__copy small { color: rgba(216,209,190,.38); font-size: 8px; letter-spacing: .18em; text-transform: uppercase; }
  @keyframes site-boot-develop { from { transform: translateX(-110%); } to { transform: translateX(285%); } }
  @media (max-width: 767px) { .site-boot__tube { left: 0; width: 100%; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .site-boot__progress i { animation: none; left: 31%; } }
`;

export const metadata = {
  metadataBase: new URL("https://opewatson.com"),
  title: "Ope Watson",
  description: "Ope Watson's Blog Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/ope-new.png" />
        <style dangerouslySetInnerHTML={{ __html: BOOT_SCREEN_CSS }} />
        <noscript><style>{'.site-boot{display:none!important}'}</style></noscript>
      </head>
      <body suppressHydrationWarning>
        <BootScreen />
        <Script
          id="adsense-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3500852425052196"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {children}
      </body>
      <Analytics />
    </html>
  );
}
