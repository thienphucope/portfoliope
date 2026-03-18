import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-mono";
import "@fontsource/zen-kaku-gothic-new";
import "./globals.css";
import Chat from './case/[[...slug]]/components/Chat';

export const metadata = {
  title: "Ope Watson",
  description: "Ope Watson's Blog Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/ope.png" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3500852425052196"
          crossOrigin="anonymous"
        ></script>
        {/* Nếu muốn dùng ảnh khác, đổi href thành đường dẫn ảnh, ví dụ /logo.png */}
        <meta name="google-adsense-account" content="ca-pub-3500852425052196"></meta>
      </head>
      <body>{children}<Chat /></body>
    </html>
  );
}