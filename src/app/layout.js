import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-mono";
import "@fontsource/zen-kaku-gothic-new";
import "./globals.css";
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
        <link rel="icon" href="/blackcat.jpg" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
      <Analytics />
    </html>
  );
}