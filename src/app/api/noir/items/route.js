import { readdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const IMG_RE = /\.(png|jpe?g|webp|avif)$/i;

// The board is whatever lives in /public/polaroid — drop a file in and it
// renders. Name comes from the filename (minus extension); positions come from
// seedLayout (auto-arranged), so there's no boardData.json to maintain.
export async function GET() {
  try {
    const dir = join(process.cwd(), 'public', 'polaroid');
    let files = [];
    try {
      files = (await readdir(dir)).filter((f) => IMG_RE.test(f));
    } catch {
      files = [];
    }

    // No x/y/z/rotation here on purpose — ThreeBoard falls back to getItemLayout
    // for those (it only uses `it.x ?? layout.x`), so omitting them lets the auto
    // layout place each photo instead of stacking them all at one point.
    const items = files.map((fileName) => ({
      id: `po-polaroid-${fileName}`,
      type: 'polaroid',
      imageUrl: `/polaroid/${fileName}`,
      title: fileName.replace(IMG_RE, ''),
      scale: 1,
    }));

    return NextResponse.json({ items, config: {}, connections: [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
