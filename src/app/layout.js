import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-mono";
import "@fontsource/zen-kaku-gothic-new";
import "./globals.css";
import Pop from './pages/pop';

export const metadata = {
  title: "Ope Watson",
  description: "Ope Watson's Blog Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/watsoncrop.png" />
        {/* Nếu muốn dùng ảnh khác, đổi href thành đường dẫn ảnh, ví dụ /logo.png */}
      </head>
      <body>{children}<Pop /></body>
    </html>
  );
}