import Script from 'next/script';

export const metadata = {
  title: "Case Archives | Ope Watson",
  description: "Browse the detective case archives and stories.",
};

export default function CaseLayout({ children }) {
  return (
    <>
      <head>
        <meta name="google-adsense-account" content="ca-pub-3500852425052196" />
      </head>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3500852425052196"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
