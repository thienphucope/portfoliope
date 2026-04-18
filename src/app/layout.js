import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-mono";
import "@fontsource/zen-kaku-gothic-new";
import "./globals.css";
import Chat from '../features/project/casearchives/components/Chat';
import { Analytics } from '@vercel/analytics/react';
import { CursorProvider } from '../features/project/home/context/CursorContext';

export const metadata = {
  title: "Ope Watson",
  description: "Ope Watson's Blog Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/blackcat.jpg" />
        {/* Thêm dòng này để cố định domain chuẩn không có www */}
        <link rel="canonical" href="https://opewatson.com" />
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