import TextToSpeech from '@/features/texttospeech/TextToSpeech';

export const metadata = {
  title: 'Voice Synthesis',
  description: 'Speech synthesis using a fine-tuned GPT-SoVITS model of Moxxi\'s voice.',
};

export default function VoicePage() {
  return (
    <div style={{ 
      padding: '40px 20px', 
      minHeight: '100dvh', 
      background: 'var(--feature-bg, #0a0a0c)',
      color: 'var(--md-colortext)',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(186, 145, 112, 0.05), transparent 40rem), repeating-linear-gradient(0deg, rgba(186, 145, 112, 0.02) 0, rgba(186, 145, 112, 0.02) 1px, transparent 1px, transparent 3px)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(0,0,0,0.3)', padding: '24px', border: '1px dashed rgba(186,145,112,0.2)' }}>
        <TextToSpeech />
      </div>
    </div>
  );
}
