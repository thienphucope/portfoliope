import fs from 'fs';
import path from 'path';
import PrivacyClient from '@/components/sections/privacy/PrivacyClient';

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'src', 'content', 'privacy.md');
  const content = fs.readFileSync(filePath, 'utf8');

  return <PrivacyClient content={content} />;
}
