'use client';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useTTS } from '@/hooks/useTTS';
import TextToSpeechStyles from './styles/TextToSpeechStyles';

export default function TextToSpeech() {
  const [ttsText, setTtsText] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioHistory, setAudioHistory] = useState([]);
  const [ttsError, setTtsError] = useState(null);
  const { generateAudio } = useTTS();

  const historyRef = useRef(audioHistory);
  const historyAreaRef = useRef(null);
  const textareaRef = useRef(null);
  useEffect(() => {
    historyRef.current = audioHistory;
  }, [audioHistory]);

  useEffect(() => {
    const area = historyAreaRef.current;
    if (area) area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
  }, [audioHistory.length]);

  useEffect(() => {
    return () => {
      historyRef.current.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    const text = ttsText.trim();
    if (!text || ttsLoading) return;
    setTtsLoading(true);
    setTtsError(null);
    try {
      const blob = await generateAudio(text, { provider: 'modal' });
      const url = URL.createObjectURL(blob);
      setAudioHistory(prev => [...prev, { url, text }]);
      setTtsText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (e) {
      setTtsError('Generation failed. The voice server may be cold — try again in a moment.');
    } finally {
      setTtsLoading(false);
    }
  }, [ttsText, ttsLoading, generateAudio]);

  return (
    <>
      <div className="nf-tts-section">
        <div className="nf-tts-header">
          <div className="nf-tts-label info-wrap">
            Voice synthesis
            <span className="info-icon" data-tooltip="Speech synthesis using a fine-tuned GPT-SoVITS model of Moxxi's voice">i</span>
          </div>
        </div>
        <div className="nf-tts-history-area" ref={historyAreaRef}>
          {audioHistory.length > 0 ? (
            <div className="nf-tts-history">
              {audioHistory.map((item, i) => (
                <div key={i} className="nf-tts-history-item">
                  <p className="nf-tts-history-text">&quot;{item.text}&quot;</p>
                  <audio className="nf-tts-audio" controls src={item.url} autoPlay={i === audioHistory.length - 1} />
                </div>
              ))}
            </div>
          ) : (
            <div className="nf-tts-empty">No audio generated yet.</div>
          )}
        </div>
        <div className="nf-tts-composer">
          {ttsError && <p className="nf-tts-error">{ttsError}</p>}
          <div className="nf-tts-textarea-row">
            <textarea
              ref={textareaRef}
              className="nf-tts-input"
              placeholder="Speak..."
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              disabled={ttsLoading}
            />
            <button
              className="nf-tts-btn"
              onClick={handleGenerate}
              disabled={!ttsText.trim() || ttsLoading}
            >
              {ttsLoading ? '[ ... ]' : '[ GEN ]'}
            </button>
          </div>
        </div>
      </div>
      <TextToSpeechStyles />
    </>
  );
}
