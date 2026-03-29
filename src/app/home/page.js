import fs from 'fs';
import path from 'path';
import HomeClient from '@/features/home/components/home/HomeClient';
import IntroProject from '@/features/home/components/home/IntroProject';

export default async function HomePage() {
  const introPath = path.join(process.cwd(), 'content', 'This Project.md');
  let introContent = "";
  try {
    if (fs.existsSync(introPath)) {
      introContent = fs.readFileSync(introPath, 'utf8');
    }
  } catch (e) {
    console.error("Could not read This Project.md", e);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <HomeClient />

      {/* IntroProject independent section */}
      <div className="relative z-[70]">
        <IntroProject content={introContent} />
      </div>
    </div>
  );
}
