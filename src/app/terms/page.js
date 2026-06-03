import fs from 'fs';
import path from 'path';
import TermsClient from './TermsClient';

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), 'public', 'content', 'Terms of Service.md');
  let content = "";
  try {
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
    }
  } catch (e) {
    console.error("Error reading Terms of Service.md", e);
  }

  const title = path.basename(filePath, '.md');

  return <TermsClient content={content} title={title} />;
}
