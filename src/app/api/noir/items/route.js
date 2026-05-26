import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const IMG_RE = /\.(png|jpe?g|webp|avif)$/i;

async function scanDir(dirPath) {
  try {
    const files = await readdir(dirPath);
    return files.filter(f => IMG_RE.test(f));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const publicDir = process.cwd();
    const displayDir = join(publicDir, 'public', 'display');
    const polaroidDir = join(publicDir, 'public', 'polaroid');
    const dataPath = join(publicDir, 'src', 'features', 'noirboard', 'utils', 'boardData.json');

    // 1. Scan both directories
    const [displayFiles, polaroidFiles] = await Promise.all([
      scanDir(displayDir),
      scanDir(polaroidDir),
    ]);

    // 2. Read saved data
    let boardData = { items: [], config: {} };
    try {
      const content = await readFile(dataPath, 'utf8');
      boardData = JSON.parse(content);
    } catch (e) {
      console.warn('Could not read boardData.json, using defaults');
    }

    // 3. Build items — display/ → photo (no frame), polaroid/ → polaroid (with frame)
    let idx = 0;
    const buildItems = (files, folder, type) =>
      files.map((fileName) => {
        idx++;
        const saved = boardData.items?.find(it => it.name === `${folder}/${fileName}`);
        return {
          id: `po-${folder}-${fileName}`,
          type,
          imageUrl: `/${folder}/${fileName}`,
          title: saved?.title || fileName.split('.')[0],
          scale: saved?.scale ?? 1.0,
          rotation: saved?.rotation ?? 0,
          x: saved?.x ?? 1250,
          y: saved?.y ?? 850,
          z: saved?.z ?? idx,
        };
      });

    const mergedItems = [
      ...buildItems(displayFiles, 'display', 'photo'),
      ...buildItems(polaroidFiles, 'polaroid', 'polaroid'),
    ];

    return NextResponse.json({
      items: mergedItems,
      config: boardData.config || {},
      connections: [],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
