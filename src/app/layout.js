import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-mono";
import "@fontsource/zen-kaku-gothic-new";
import "./globals.css";
import Chat from './case/[[...slug]]/components/Chat';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: "Ope Watson",
  description: "Ope Watson's Blog Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/ope.png" />
        {/* Nếu muốn dùng ảnh khác, đổi href thành đường dẫn ảnh, ví dụ /logo.png */}
      </head>
      <body>{children}<Chat /></body>
      <Analytics />
    </html>
  );
}