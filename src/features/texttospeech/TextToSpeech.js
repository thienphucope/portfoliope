'use client';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useTTS } from '@/hooks/useTTS';
import TextToSpeechStyles from './styles/TextToSpeechStyles';
import { AudioLines, ArrowUpRight, LoaderCircle } from 'lucide-react';

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
          <span className="nf-tts-label">The voice studio</span>
          <h1>Text to speech</h1>
          <p>Bring a passage to life in Moxxi’s voice.</p>
        </div>
        <div className="nf-tts-history-area" ref={historyAreaRef}>
          {audioHistory.length > 0 ? (
            <div className="nf-tts-history">
              {audioHistory.map((item, i) => (
                <div key={i} className="nf-tts-history-item">
                  <div className="nf-tts-take"><span>Take {String(i + 1).padStart(2, '0')}</span><span>Moxxi</span></div>
                  <p className="nf-tts-history-text">&quot;{item.text}&quot;</p>
                  <audio className="nf-tts-audio" aria-label={`Play take ${i + 1}`} controls src={item.url} autoPlay={i === audioHistory.length - 1} />
                </div>
              ))}
            </div>
          ) : (
            <div className="nf-tts-empty"><AudioLines size={40} strokeWidth={1} aria-hidden="true" /><p>Your words. A familiar voice.</p><span>Write a passage below. Your recordings will appear here.</span></div>
          )}
        </div>
        <div className="nf-tts-composer">
          {ttsError && <p className="nf-tts-error" role="alert">{ttsError}</p>}
          <div className="nf-tts-textarea-row">
            <label className="nf-tts-input-label" htmlFor="voice-text">Your text</label>
            <textarea
              id="voice-text"
              ref={textareaRef}
              className="nf-tts-input"
              placeholder="Write something worth hearing…"
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              rows={3}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              disabled={ttsLoading}
            />
            <div className="nf-tts-actions">
              <span className="nf-tts-count">{ttsText.length.toLocaleString()} characters</span>
              <button
                className="nf-tts-btn"
                onClick={handleGenerate}
                disabled={!ttsText.trim() || ttsLoading}
              >
                {ttsLoading ? <><LoaderCircle className="nf-tts-spinner" size={16} aria-hidden="true" />Generating…</> : <>Generate voice<ArrowUpRight size={16} strokeWidth={1.6} aria-hidden="true" /></>}
              </button>
            </div>
          </div>
          <div className="nf-tts-composer-note" role="status">{ttsLoading ? 'Preparing your recording…' : 'Enter to generate · Shift + Enter for a new line'}</div>
        </div>
      </div>
      <TextToSpeechStyles />
    </>
  );
}
