import HomeClient from '@/components/sections/home/HomeClient';
import About from '@/components/sections/About';

export default async function Page() {
  return (
    <div className="min-h-[100dvh]">
      {/* SEO Hidden Content */}
      <div 
        style={{ display: 'none', visibility: 'hidden', height: 0, overflow: 'hidden' }} 
        aria-hidden="true"
      >
        <h1>Ope Watson - Professional Portfolio & Digital Case Archives</h1>
        <p>Interactive detective storytelling combined with modern web technologies.</p>
        {/* Render the component for SEO. React will de-duplicate the data fetch. */}
        <About />
      </div>

      {/* 
        Main Wrapper: 
        Không để background-color ở đây để thấy được video fixed phía sau.
      */}
      <div className="relative">
        <HomeClient />
        <About />
      </div>
    </div>
  );
}
