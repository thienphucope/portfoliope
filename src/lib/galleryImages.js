import fs from 'node:fs';
import path from 'node:path';

const IMAGE_RE = /\.(jpe?g|png|gif|avif|webp|svg)$/i;

// The gallery is whatever lives in /public/polaroid — drop a file in and it
// shows up (server-side read, so it refreshes on each dev request / rebuild).
export async function getGalleryImages() {
  try {
    const dir = path.join(process.cwd(), 'public', 'polaroid');
    return fs.readdirSync(dir)
      .filter((f) => IMAGE_RE.test(f))
      .sort()
      .map((f) => ({ src: `/polaroid/${f}`, title: f.replace(IMAGE_RE, '') }));
  } catch {
    return [];
  }
}
