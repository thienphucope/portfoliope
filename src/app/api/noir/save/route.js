import { writeFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, config, type } = body;
    
    console.log(`API save request type: ${type}`);

    if (type === 'items' && items) {
      const itemsPath = join(process.cwd(), 'src', 'features', 'me', 'noirboard', 'utils', 'items.json');
      await writeFile(itemsPath, JSON.stringify(items, null, 2), 'utf8');
      console.log('Successfully wrote items.json');
      return NextResponse.json({ success: true, message: 'Items saved' });
    }

    if (type === 'pov' && config && config.pov) {
      const configPath = join(process.cwd(), 'src', 'features', 'me', 'noirboard', 'utils', 'boardConfig.json');
      await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
      console.log('Successfully wrote boardConfig.json');
      return NextResponse.json({ success: true, message: 'POV saved' });
    }
    
    // Fallback for old style full save
    if (items) {
      const itemsPath = join(process.cwd(), 'src', 'features', 'me', 'noirboard', 'utils', 'items.json');
      await writeFile(itemsPath, JSON.stringify(items, null, 2), 'utf8');
    }
    if (config && config.pov) {
      const configPath = join(process.cwd(), 'src', 'features', 'me', 'noirboard', 'utils', 'boardConfig.json');
      await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save error details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
