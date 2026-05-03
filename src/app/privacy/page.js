import fs from 'fs';
import path from 'path';
import PrivacyContent from '@/features/privacy/PrivacyClient';

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'public', 'content', 'Privacy.md');
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
