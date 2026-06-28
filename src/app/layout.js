import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-mono";
import "@fontsource/zen-kaku-gothic-new";
import "./globals.css";
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';

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
      </head>
      <body suppressHydrationWarning>
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