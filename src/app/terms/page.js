import fs from 'fs';
import path from 'path';
import TermsContent from '@/features/home/components/home/TermsClient';

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), 'content', 'Terms.md');
  let content = "";
  try {
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
    }
  } catch (e) {
    console.error("Error reading Terms.md", e);
  }

  return <TermsContent content={content} />;
}
