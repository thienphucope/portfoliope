import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';

export default function Home() {
  return (
    <div className="w-full min-h-screen flex flex-col snap-y snap-mandatory overflow-y-auto no-scrollbar box-border bg-[var(--background)]">
      {/* Gallery Section */}
      <div className="w-full min-h-screen flex-shrink-0 snap-start">
        <Page1 />
      </div>
      
      {/* Cover Section */}
      <div className="w-full min-h-screen flex-shrink-0 snap-start">
        <Page2 />
      </div>
      
      {/* Grid Section */}
      <div className="w-full min-h-screen flex-shrink-0 snap-start">
        <Page3 />
      </div>
    </div>
  );
}