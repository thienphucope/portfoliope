import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { text, voice = 'en' } = await req.json();
    if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

    const voiceMap = {
      'en': 'en-GB-SoniaNeural',
      'zh': 'zh-CN-XiaoxiaoNeural',
      'vi': 'vi-google'
    };

    const targetVoice = voiceMap[voice] || voice;

    console.log(`[TTS API] Request: Input=${voice}, Target=${targetVoice}, TextLength=${text.length}`);

    // Use Google Translate TTS for Vietnamese
    if (voice === 'vi' || targetVoice === 'vi-google' || targetVoice.startsWith('vi-VN')) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob&ttsspeed=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (!response.ok) throw new Error('Google TTS failed');
      const buffer = Buffer.from(await response.arrayBuffer());
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const generateBuffer = async (v) => {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(v, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(text);
      return new Promise((resolve, reject) => {
        const chunks = [];
        audioStream.on('data', chunk => chunks.push(chunk));
        audioStream.on('close', () => resolve(Buffer.concat(chunks)));
        audioStream.on('error', reject);
      });
    };

    let audioBuffer = await generateBuffer(targetVoice);
    

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