import fs from 'fs';
import path from 'path';
import HomeClient from './HomeClient';
import PageExtra from './components/PageExtra';

export default async function Page() {
  const aboutPath = path.join(process.cwd(), 'src', 'content', 'about.md');
  let aboutContent = "";
  try {
    if (fs.existsSync(aboutPath)) {
      aboutContent = fs.readFileSync(aboutPath, 'utf8');
    }
  } catch (e) {
    console.error("Could not read about.md", e);
  }

  return (
    <div className="min-h-screen">
      {/* SEO Hidden Content */}
      <div 
        style={{ display: 'none', visibility: 'hidden', height: 0, overflow: 'hidden' }} 
        aria-hidden="true"
      >
        <h1>Ope Watson - Professional Portfolio & Digital Case Archives</h1>
        <p>Interactive detective storytelling combined with modern web technologies.</p>
        <div>{aboutContent}</div>
      </div>

      {/* 
        Main Wrapper: 
        Không để background-color ở đây để thấy được video fixed phía sau.
      */}
      <div className="relative">
        <HomeClient />
        <PageExtra content={aboutContent} />
      </div>
    </div>
  );
}
