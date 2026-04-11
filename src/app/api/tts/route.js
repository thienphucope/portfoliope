import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { text, voice = 'en-GB-SoniaNeural' } = await req.json();
    if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

    console.log(`[TTS API] Request: Voice=${voice}, TextLength=${text.length}`);

    const tts = new MsEdgeTTS();
    
    const generateBuffer = async (v) => {
      await tts.setMetadata(v, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(text);
      return new Promise((resolve, reject) => {
        const chunks = [];
        audioStream.on('data', chunk => chunks.push(chunk));
        audioStream.on('close', () => resolve(Buffer.concat(chunks)));
        audioStream.on('error', reject);
      });
    };

    let audioBuffer = await generateBuffer(voice);
    
    // Fallback logic for Vietnamese if buffer is empty
    if (audioBuffer.length < 100 && voice.startsWith('vi-VN')) {
      const fallbackVoice = voice === 'vi-VN-HoaiMyNeural' ? 'vi-VN-NamMinhNeural' : 'vi-VN-HoaiMyNeural';
      console.log(`[TTS API] Primary voice failed (size=${audioBuffer.length}). Trying fallback: ${fallbackVoice}`);
      audioBuffer = await generateBuffer(fallbackVoice);
    }

    console.log(`[TTS API] Success: BufferSize=${audioBuffer.length}`);

    if (audioBuffer.length < 100) {
      throw new Error(`TTS generated empty audio for voice ${voice}`);
    }

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS Server Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}