import { NextResponse } from 'next/server';
import { ttsService } from '@/services/ttsService';

export const runtime = 'nodejs';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'ping') {
    try {
      await ttsService.ping();
      return NextResponse.json({ status: 'ok' });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { action = 'generate', text, voice = 'en', speed = 1.0, provider = 'msedge' } = body;

    if (action === 'interrupt') {
      await ttsService.interrupt();
      return NextResponse.json({ status: 'interrupted' });
    }

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (action === 'stream') {
      const res = await ttsService.streamAudio(text, voice, speed);
      return res;
    }

    if (action === 'generate') {
      if (provider === 'modal') {
        const { buffer, contentType } = await ttsService.generateAudioModal(text, voice, speed);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
          }
        });
      }

      // Default: msedge
      const { buffer, contentType } = await ttsService.generateAudioMsEdge(text, voice);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('TTS Server Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}