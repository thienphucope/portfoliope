import fs from 'fs';
import path from 'path';
import PrivacyClient from './PrivacyClient';

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'public', 'content', 'Privacy Policy.md');
  let content = "";
  try {
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
    }
  } catch (e) {
    console.error("Error reading Privacy Policy.md", e);
  }

  const title = path.basename(filePath, '.md');

  return <PrivacyClient content={content} title={title} />;
}
