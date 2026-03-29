import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-mono";
import "@fontsource/zen-kaku-gothic-new";
import "./globals.css";
import Chat from '../features/case/components/Chat';
import { Analytics } from '@vercel/analytics/react';
import { CursorProvider } from '../features/home/context/CursorContext';

export const metadata = {
  title: "Ope Watson",
  description: "Ope Watson's Blog Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/ope.png" />
      </head>
      <body>
        <CursorProvider>
          {children}
          <Chat />
        </CursorProvider>
      </body>
      <Analytics />
    </html>
  );
}