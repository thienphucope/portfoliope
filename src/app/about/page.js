import fs from 'fs';
import path from 'path';
import AboutClient from '@/features/about/AboutClient';
import Footer from '@/features/shared/components/Footer';

export default async function AboutPage() {
  const aboutPath = path.join(process.cwd(), 'public', 'content', 'about.md');
  let aboutContent = "";
  try {
    if (fs.existsSync(aboutPath)) {
      aboutContent = fs.readFileSync(aboutPath, 'utf8');
    }
  } catch (e) {
    console.error("Could not read about.md for About Page", e);
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <div className="relative flex-1">
        <AboutClient />
      </div>
      
      <Footer />
    </div>
  );
}
