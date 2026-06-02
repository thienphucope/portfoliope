import TextToSpeech from '@/features/texttospeech/TextToSpeech';

export const metadata = {
  title: 'Voice Synthesis',
  description: 'Speech synthesis using a fine-tuned GPT-SoVITS model of Moxxi\'s voice.',
};

export default function VoicePage() {
  return (
    <div className="voice-route">
      <div className="voice-route-inner">
        <TextToSpeech />
      </div>
    </div>
  );
}
