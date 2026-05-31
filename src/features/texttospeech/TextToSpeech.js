'use client';
import { useCallback, useRef, useState } from 'react';
import { synthesizeSpeech } from './api/synthesizeSpeech';
import TextToSpeechStyles from './styles/TextToSpeechStyles';

export default function TextToSpeech() {
  const [ttsText, setTtsText] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [ttsError, setTtsError] = useState(null);
  const prevAudioUrlRef = useRef(null);

  const handleGenerate = useCallback(async () => {
    const text = ttsText.trim();
    if (!text || ttsLoading) return;
    setTtsLoading(true);
    setTtsError(null);
    if (prevAudioUrlRef.current) {
      URL.revokeObjectURL(prevAudioUrlRef.current);
      prevAudioUrlRef.current = null;
    }
    setAudioUrl(null);
    try {
      const blob = await synthesizeSpeech(text);
      const url = URL.createObjectURL(blob);
      prevAudioUrlRef.current = url;
      setAudioUrl(url);
    } catch (e) {
      setTtsError('Generation failed. The voice server may be cold — try again in a moment.');
    } finally {
      setTtsLoading(false);
    }
  }, [ttsText, ttsLoading]);

  return (
    <>
      <div className="nf-tts-section">
        <div className="nf-tts-header">
          <div className="nf-tts-label info-wrap">
            VOICE DEMO
            <span className="info-icon" data-tooltip="Speech synthesis using a fine-tuned GPT-SoVITS model of Moxxi's voice">i</span>
          </div>
          <button
            className={`nf-tts-btn${ttsLoading ? ' loading' : ''}`}
            onClick={handleGenerate}
            disabled={!ttsText.trim() || ttsLoading}
          >
            {ttsLoading ? '[ GENERATING... ]' : '[ GEN ]'}
          </button>
        </div>
        <textarea
          className="nf-tts-input"
          placeholder="Enter text to synthesize..."
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          rows={3}
          disabled={ttsLoading}
        />
        {ttsError && <p className="nf-tts-error">{ttsError}</p>}
        {audioUrl && (
          <audio className="nf-tts-audio" controls src={audioUrl} autoPlay />
        )}
      </div>
      <TextToSpeechStyles />
    </>
  );
}
