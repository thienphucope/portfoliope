import fs from 'fs';
import path from 'path';
import PrivacyContent from '@/features/home/components/home/PrivacyClient';

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'content', 'Privacy.md');
  let content = "";
  try {
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
    }
  } catch (e) {
    console.error("Error reading Privacy.md", e);
  }

  return <PrivacyContent content={content} />;
}
