import fs from 'fs';
import path from 'path';
import ProjectClient from '@/features/project/home/components/home/ProjectClient';
import IntroProject from '@/features/project/home/components/home/IntroProject';

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
      <ProjectClient />

      {/* IntroProject independent section */}
      <div className="relative z-[10]">
        <IntroProject content={introContent} />
      </div>
    </div>
  );
}
