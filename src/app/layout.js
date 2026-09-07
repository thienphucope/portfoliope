import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-mono";
import "@fontsource/zen-kaku-gothic-new";
import "./globals.css";
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import BootScreen from '@/components/layout/BootScreen';
import { MediaModalProvider } from '@/components/ui/MediaModal';

// Matches the home page's "Opening the study" loader (DeskLanding .loading).
const BOOT_SCREEN_CSS = `
  html, body { background-color: #1e2e2a !important; }
  .site-boot {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    gap: 14px;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #1e2e2a;
    color: #d1d6bb;
    font: italic 16px Georgia, serif;
    opacity: 1;
    visibility: visible;
    transition: opacity 480ms ease, visibility 480ms step-end;
  }
  .site-boot.is-leaving { opacity: 0; visibility: hidden; }
  .site-boot__dot { width: 6px; height: 6px; border-radius: 50%; background: #dfc486; box-shadow: 0 0 20px #e3c48366; }
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
        <MediaModalProvider>{children}</MediaModalProvider>
      </body>
      <Analytics />
    </html>
  );
}
