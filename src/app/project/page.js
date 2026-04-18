import fs from 'fs';
import path from 'path';
import ProjectClient from '@/features/project/home/components/home/ProjectClient';

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
      <ProjectClient content={introContent} />
    </div>
  );
}
