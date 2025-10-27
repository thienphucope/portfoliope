import Page1 from './pages/Page1';
import Page2 from '../../bin/Page2';


export default function Home() {
  return (
    <div className="w-full min-h-screen flex flex-col snap-y snap-mandatory overflow-y-auto no-scrollbar bg-[var(--background)]">
      {/* Gallery Section */}
      <div className="w-full min-h-screen flex-shrink-0 snap-start">
        <Page1 />
      </div>
      
      {/* Cover Section */}
      <div className="w-full min-h-screen flex-shrink-0 snap-start">
        <Page2 />
      </div>
    </div>
  );
}