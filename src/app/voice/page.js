import TextToSpeech from '@/features/texttospeech/TextToSpeech';
import theme from '@/features/caseArchive/styles/ArchiveTheme.module.css';

export const metadata = {
  title: 'Voice Synthesis',
  description: 'Speech synthesis using a fine-tuned GPT-SoVITS model of Moxxi\'s voice.',
};

export default function VoicePage() {
  return (
    <div className={`${theme.theme} voice-route`}>
      <div className="voice-route-inner">
        <TextToSpeech />
      </div>
    </div>
  );
}
