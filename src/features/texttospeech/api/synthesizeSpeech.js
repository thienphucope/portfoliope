const TTS_URL = "https://thienphuc1052004--gpt-sovits-api-gptsovitsapi-tts.modal.run";

export async function synthesizeSpeech(text) {
  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_text: text, target_lang: 'en', speed: 1.0 }),
  });

  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  return res.blob();
}
