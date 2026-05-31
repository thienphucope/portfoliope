import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const TTS_STREAM_URL = "https://thienphuc1052004--gpt-sovits-api-gptsovitsapi-tts-stream.modal.run";
const TTS_GENERATE_URL = "https://thienphuc1052004--gpt-sovits-api-gptsovitsapi-tts.modal.run";
const TTS_HEALTH_URL = "https://thienphuc1052004--gpt-sovits-api-gptsovitsapi-tts-ping.modal.run";
const TTS_INTERRUPT_URL = "https://thienphuc1052004--gpt-sovits-api-gptsovitsapi-tts-interrupt.modal.run";

export const ttsService = {
  ping: async () => {
    const res = await fetch(TTS_HEALTH_URL);
    if (!res.ok) throw new Error('TTS not ready');
    return true;
  },

  interrupt: async () => {
    await fetch(TTS_INTERRUPT_URL, { method: 'POST' }).catch(() => {});
    return true;
  },

  streamAudio: async (text, voice = 'en', speed = 1.0) => {
    const res = await fetch(TTS_STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_text: text, target_lang: voice, speed }),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error("Failed to start TTS stream");
    return res; // Returning the raw response to pipe the stream
  },

  generateAudioModal: async (text, voice = 'en', speed = 1.0) => {
    const res = await fetch(TTS_GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_text: text, target_lang: voice, speed })
    });
    if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
    
    const arrayBuffer = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: res.headers.get('content-type') || 'audio/wav'
    };
  },

  generateAudioMsEdge: async (text, voice = 'en') => {
    const voiceMap = {
      'en': 'en-IE-EmilyNeural', //en-GB-SoniaNeural
      'en-male': 'en-GB-RyanNeural',
      'zh': 'zh-CN-XiaoxiaoNeural',
      'vi': 'vi-google'
    };
    const targetVoice = voiceMap[voice] || voice;

    if (voice === 'vi' || targetVoice === 'vi-google' || targetVoice.startsWith('vi-VN')) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob&ttsspeed=1`;
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!response.ok) throw new Error('Google TTS failed');
      return {
        buffer: Buffer.from(await response.arrayBuffer()),
        contentType: 'audio/mpeg'
      };
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(targetVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);
    
    const buffer = await new Promise((resolve, reject) => {
      const chunks = [];
      audioStream.on('data', chunk => chunks.push(chunk));
      audioStream.on('close', () => resolve(Buffer.concat(chunks)));
      audioStream.on('error', reject);
    });

    if (buffer.length < 100) throw new Error(`TTS generated empty audio for voice ${voice}`);

    return {
      buffer,
      contentType: 'audio/mpeg'
    };
  }
};
