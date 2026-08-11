import { readdir } from 'fs/promises';
import path from 'path';

const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
const POLAROID_DIR = path.join(process.cwd(), 'public', 'polaroid');

function titleFromFileName(fileName) {
  return path.parse(fileName).name.replace(/[_-]+/g, ' ').trim();
}

export async function getGalleryImages() {
  const entries = await readdir(POLAROID_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => ({ src: `/polaroid/${entry.name}`, title: titleFromFileName(entry.name) }))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
}
